import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  section?: string;
}

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ success: true; data: { access_token: string; username: string; id: string } }> {
    const result = await this.authService.register(dto.username, dto.password, dto.section);
    return { success: true, data: result };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ success: true; data: { access_token: string; username: string; id: string } }> {
    const result = await this.authService.login(dto.username, dto.password);
    return { success: true, data: result };
  }
}
