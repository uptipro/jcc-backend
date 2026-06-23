import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = this.authService.verifyToken(token);

    (request as Request & { admin?: unknown }).admin = {
      id: payload.sub,
      email: payload.email,
    };

    return true;
  }
}
