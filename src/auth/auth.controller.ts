import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

interface LoginBody {
  email?: string;
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginBody) {
    if (!body?.email || !body?.password) {
      throw new HttpException(
        'email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const admin = await this.authService.validateAdmin(
      body.email,
      body.password,
    );
    const token = this.authService.signToken(admin);

    return {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    const ctx = (req as Request & { admin?: { id: string } }).admin;
    const admin = ctx ? await this.authService.getAdminById(ctx.id) : null;
    if (!admin) {
      throw new HttpException('Admin not found', HttpStatus.UNAUTHORIZED);
    }
    return { admin };
  }
}
