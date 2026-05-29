"""
Engine 2 — Counter-Pick Engine
================================
Selects the best 6 Pokémon from the assigned pool to counter a given opponent team.

Scoring formula (per candidate C vs opponent team O):
  TCS  = Type Coverage Score   (0.40 weight)
  SAS  = Stat Advantage Score  (0.20 weight, normalised)
  RS   = Resistance Score      (implicit in TCS, logged separately)
  KNN_S = K-NN strong-counter probability (0.25 weight)
  DT_S  = Decision Tree strong-counter probability (0.15 weight)

  Final = 0.40*TCS + 0.25*KNN_S + 0.20*SAS_norm + 0.15*DT_S

Stateless — all training happens per-request on the provided assigned_pool.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

from ml.constants import TYPE_CHART, TYPES

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _get_type_effectiveness(atk_type: Optional[str], def_type: Optional[str]) -> float:
    """Lookup TYPE_CHART[atk][def]. Returns 1.0 for unknown/None types."""
    if not atk_type or not def_type:
        return 1.0
    return TYPE_CHART.get(atk_type.lower(), {}).get(def_type.lower(), 1.0)


def _type_coverage_score(candidate: dict, opponent_team: list[dict]) -> float:
    """
    Compute TCS for one candidate against the full opponent team.

    For each opponent O:
        score += TYPE_CHART[C.type_1][O.type_1]
        if O.type_2: score += TYPE_CHART[C.type_1][O.type_2] * 0.5
        if C.type_2: score += TYPE_CHART[C.type_2][O.type_1] * 0.5

    TCS = score / 6
    """
    c_t1 = (candidate.get("type_1") or "").lower()
    c_t2 = (candidate.get("type_2") or "").lower() or None

    total = 0.0
    for opp in opponent_team:
        o_t1 = (opp.get("type_1") or "").lower()
        o_t2 = (opp.get("type_2") or "").lower() or None

        total += _get_type_effectiveness(c_t1, o_t1)
        if o_t2:
            total += _get_type_effectiveness(c_t1, o_t2) * 0.5
        if c_t2:
            total += _get_type_effectiveness(c_t2, o_t1) * 0.5

    return total / max(len(opponent_team), 1)


def _stat_advantage_score(candidate: dict, opponent_team: list[dict]) -> float:
    """
    SAS = (C.total_base_stats - mean(opponent total_base_stats)) / 600
    Clamped to [-1.0, 1.0]
    """
    c_total = _safe_float(candidate.get("total_base_stats", candidate.get("total", 0)))
    if not opponent_team:
        return 0.0
    opp_totals = [
        _safe_float(o.get("total_base_stats", o.get("total", 0)))
        for o in opponent_team
    ]
    opp_mean = float(np.mean(opp_totals))
    sas = (c_total - opp_mean) / 600.0
    return _clamp(sas, -1.0, 1.0)


def _resistance_score(candidate: dict, opponent_team: list[dict]) -> float:
    """
    RS = count(O where C is resistant to O.type_1) / 6
    Resistant means the incoming multiplier < 1.0 (C takes reduced damage).
    """
    c_t1 = (candidate.get("type_1") or "").lower()
    c_t2 = (candidate.get("type_2") or "").lower() or None
    resistant_count = 0

    for opp in opponent_team:
        o_t1 = (opp.get("type_1") or "").lower()
        # Defensive multiplier: TYPE_CHART[attacking_type][defending_type]
        mult1 = _get_type_effectiveness(o_t1, c_t1)
        mult2 = _get_type_effectiveness(o_t1, c_t2) if c_t2 else 1.0
        combined = mult1 * mult2
        if combined < 1.0:
            resistant_count += 1

    return resistant_count / max(len(opponent_team), 1)


def _build_feature_vector(pokemon: dict) -> np.ndarray:
    """Return a 10-feature vector used for KNN and DT scoring."""
    stat_cols = ["hp", "attack", "defense", "sp_atk", "sp_def", "speed"]
    stats = np.array([_safe_float(pokemon.get(c, 0)) for c in stat_cols])
    total = _safe_float(pokemon.get("total_base_stats", pokemon.get("total", 0)))
    # Normalise stats to [0, 1] using common max values
    stat_maxes = np.array([255, 190, 230, 194, 230, 200], dtype=float)
    norm_stats = stats / stat_maxes
    return np.append(norm_stats, [total / 700.0, 0.0, 0.0, 0.0])  # padded to 10


def _train_ml_models(
    assigned_pool: list[dict],
    opponent_team: list[dict],
) -> tuple[KNeighborsClassifier, DecisionTreeClassifier, np.ndarray]:
    """
    Train KNN and DT on the assigned pool.
    Target: is_strong_counter = 1 if TCS > 1.2 else 0.

    Returns trained KNN, DT, and the feature matrix X.
    """
    X = np.array([_build_feature_vector(p) for p in assigned_pool])
    y = np.array([
        1 if _type_coverage_score(p, opponent_team) > 1.2 else 0
        for p in assigned_pool
    ])

    n_pos = int(y.sum())
    n_neg = len(y) - n_pos

    # Need at least 2 classes and at least k samples for KNN
    if n_pos == 0 or n_neg == 0:
        # Force balanced distribution: label top half as strong counters
        sorted_scores = sorted(
            range(len(assigned_pool)),
            key=lambda i: _type_coverage_score(assigned_pool[i], opponent_team),
            reverse=True,
        )
        y = np.zeros(len(assigned_pool), dtype=int)
        for idx in sorted_scores[: len(sorted_scores) // 2]:
            y[idx] = 1

    k_neighbors = min(5, max(1, len(assigned_pool) - 1))
    knn = KNeighborsClassifier(n_neighbors=k_neighbors)
    knn.fit(X, y)

    dt = DecisionTreeClassifier(max_depth=4, random_state=42)
    dt.fit(X, y)

    return knn, dt, X


# ---------------------------------------------------------------------------
# Main matchup label helper
# ---------------------------------------------------------------------------

def _matchup_label(multiplier: float) -> str:
    if multiplier >= 2.0:
        return "super effective"
    elif multiplier <= 0.5 and multiplier > 0.0:
        return "not very effective"
    elif multiplier == 0.0:
        return "immune"
    else:
        return "neutral"


def _build_reason(
    candidate: dict,
    opponent_team: list[dict],
    tcs: float,
    sas: float,
    knn_s: float,
    dt_s: float,
) -> str:
    name = candidate.get("name", "unknown").title()
    t1 = candidate.get("type_1", "")
    t2 = candidate.get("type_2", "")
    type_str = f"{t1}/{t2}" if t2 else t1

    # Find which opponents are hit super-effectively
    super_eff_vs = []
    for opp in opponent_team:
        o_t1 = (opp.get("type_1") or "").lower()
        o_t2 = (opp.get("type_2") or "").lower() or None
        c_t1 = (candidate.get("type_1") or "").lower()
        c_t2 = (candidate.get("type_2") or "").lower() or None

        best_mult = max(
            _get_type_effectiveness(c_t1, o_t1) * (_get_type_effectiveness(c_t1, o_t2) if o_t2 else 1.0),
            (_get_type_effectiveness(c_t2, o_t1) * (_get_type_effectiveness(c_t2, o_t2) if o_t2 else 1.0)) if c_t2 else 0.0,
        )
        if best_mult >= 2.0:
            super_eff_vs.append(opp.get("name", "?").title())

    reason = f"{name} ({type_str}) counter score {tcs:.2f} TCS."
    if super_eff_vs:
        reason += f" Super-effective vs: {', '.join(super_eff_vs[:3])}."
    if sas > 0.2:
        reason += f" Stat advantage (SAS {sas:.2f})."
    if knn_s > 0.6:
        reason += " KNN classifies as strong counter."
    return reason


# ---------------------------------------------------------------------------
# Main engine function
# ---------------------------------------------------------------------------

def generate_counter_team(
    opponent_team_names: list[str],
    opponent_data: list[dict],
    assigned_pool: list[dict],
) -> dict:
    """
    Core logic for Engine 2.

    Parameters
    ----------
    opponent_team_names : list of 6 opponent Pokémon names
    opponent_data       : full dicts for each opponent Pokémon
    assigned_pool       : dicts for each assigned (is_assigned=1) Pokémon

    Returns
    -------
    dict matching Engine2Response schema
    """
    if not assigned_pool:
        raise ValueError("No assigned Pokémon pool loaded")
    if not opponent_data:
        raise ValueError("No opponent team data provided")

    # ------------------------------------------------------------------
    # Step 1 — Train ML models on assigned pool
    # ------------------------------------------------------------------
    knn, dt, X_pool = _train_ml_models(assigned_pool, opponent_data)

    # ------------------------------------------------------------------
    # Step 2 — Score each candidate in assigned_pool
    # ------------------------------------------------------------------
    scored_candidates = []
    for i, candidate in enumerate(assigned_pool):
        tcs = _type_coverage_score(candidate, opponent_data)
        sas_raw = _stat_advantage_score(candidate, opponent_data)
        rs = _resistance_score(candidate, opponent_data)

        fv = X_pool[i].reshape(1, -1)

        # KNN and DT probabilities — need 2-class model
        classes = list(knn.classes_)
        knn_proba_all = knn.predict_proba(fv)[0]
        dt_proba_all = dt.predict_proba(fv)[0]

        if 1 in classes:
            strong_idx = classes.index(1)
            knn_s = float(knn_proba_all[strong_idx])
            dt_s = float(dt_proba_all[strong_idx])
        else:
            knn_s = 0.0
            dt_s = 0.0

        # Normalise SAS from [-1,1] to [0,1]
        sas_norm = (sas_raw + 1.0) / 2.0

        final_score = (
            0.40 * tcs
            + 0.25 * knn_s
            + 0.20 * sas_norm
            + 0.15 * dt_s
        )

        scored_candidates.append({
            "pokemon": candidate,
            "counter_score": final_score,
            "score_breakdown": {
                "tcs": round(tcs, 4),
                "sas": round(sas_raw, 4),
                "rs": round(rs, 4),
                "knn": round(knn_s, 4),
                "dt": round(dt_s, 4),
            },
            "reason": _build_reason(candidate, opponent_data, tcs, sas_raw, knn_s, dt_s),
        })

    # ------------------------------------------------------------------
    # Step 3 — Sort by final score, pick top 6
    # ------------------------------------------------------------------
    scored_candidates.sort(key=lambda x: x["counter_score"], reverse=True)
    top_6 = scored_candidates[:6]

    recommended_team = []
    for rank, entry in enumerate(top_6, start=1):
        p = entry["pokemon"]
        recommended_team.append({
            "rank": rank,
            "name": p.get("name", "unknown"),
            "counter_score": round(entry["counter_score"], 4),
            "score_breakdown": entry["score_breakdown"],
            "type_1": p.get("type_1"),
            "type_2": p.get("type_2"),
            "total_base_stats": int(_safe_float(p.get("total_base_stats", p.get("total", 0)))),
            "reason": entry["reason"],
        })

    # ------------------------------------------------------------------
    # Step 4 — Build matchup table
    # ------------------------------------------------------------------
    matchup_table: dict[str, dict] = {}
    for entry in top_6[:3]:  # limit table to top 3 picks for brevity
        c_name = entry["pokemon"].get("name", "?")
        c_t1 = (entry["pokemon"].get("type_1") or "").lower()
        c_t2 = (entry["pokemon"].get("type_2") or "").lower() or None

        for opp in opponent_data:
            o_name = opp.get("name", "?")
            o_t1 = (opp.get("type_1") or "").lower()
            o_t2 = (opp.get("type_2") or "").lower() or None

            key = f"{c_name}_vs_{o_name}"

            # Best offensive multiplier C can use vs O
            mult_c_t1 = _get_type_effectiveness(c_t1, o_t1) * (
                _get_type_effectiveness(c_t1, o_t2) if o_t2 else 1.0
            )
            mult_c_t2 = (
                _get_type_effectiveness(c_t2, o_t1) * (
                    _get_type_effectiveness(c_t2, o_t2) if o_t2 else 1.0
                )
                if c_t2 else 0.0
            )
            best_mult = max(mult_c_t1, mult_c_t2) if mult_c_t1 > 0 or mult_c_t2 > 0 else mult_c_t1

            matchup_table[key] = {
                "advantage": _matchup_label(best_mult),
                "multiplier": best_mult,
            }

    return {
        "opponent_team": opponent_team_names,
        "recommended_team": recommended_team,
        "model_used": "tcs+knn+dt+gower",
        "matchup_table": matchup_table,
    }
