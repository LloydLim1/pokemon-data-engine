import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

export interface JwtPayload {
  sub: string;   // user id
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    username: string,
    password: string,
    section?: string,
  ): Promise<{ access_token: string; username: string; id: string }> {
    const existing = await this.db.findUserByUsername(username);
    if (existing) throw new ConflictException('Username already taken');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.db.createUser(username, hash, username, section);

    const token = this.jwt.sign({ sub: user.id, username: user.username } satisfies JwtPayload);
    return { access_token: token, username: user.username, id: user.id };
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string; username: string; id: string }> {
    const user = await this.db.findUserByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid username or password');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid username or password');

    const token = this.jwt.sign({ sub: user.id, username: user.username } satisfies JwtPayload);
    return { access_token: token, username: user.username, id: user.id };
  }
}
