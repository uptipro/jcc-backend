import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { DatabaseService } from '../database/database.service';

const scrypt = promisify(scryptCallback);

const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export interface AdminRecord {
  id: string;
  email: string;
  name: string | null;
}

interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly db: DatabaseService) {}

  private get jwtSecret(): string {
    return process.env.JWT_SECRET ?? 'change-me-in-production';
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.seedDefaultAdmin();
    } catch (err) {
      this.logger.error('Failed to seed default admin', err as Error);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt.toString('hex')}:${derived.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    stored: string,
  ): Promise<boolean> {
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = (await scrypt(password, salt, expected.length)) as Buffer;
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }

  /**
   * Creates a default administrator from environment variables the first time
   * the application boots. Subsequent boots are a no-op once an admin exists.
   */
  private async seedDefaultAdmin(): Promise<void> {
    const pool = this.db.getPool();
    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM admins',
    );
    if (Number(rows[0]?.count ?? 0) > 0) {
      return;
    }

    const email = process.env.ADMIN_EMAIL ?? 'admin@experiencejubilee.org';
    const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
    const name = process.env.ADMIN_NAME ?? 'Administrator';
    const passwordHash = await this.hashPassword(password);

    await pool.query(
      `INSERT INTO admins (id, email, email_lower, name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email_lower) DO NOTHING`,
      [randomBytes(12).toString('hex'), email, email.toLowerCase(), name, passwordHash],
    );

    this.logger.log(`Seeded default admin account: ${email}`);
  }

  async validateAdmin(email: string, password: string): Promise<AdminRecord> {
    const normalized = String(email ?? '').trim().toLowerCase();
    if (!normalized || !password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { rows } = await this.db.getPool().query<{
      id: string;
      email: string;
      name: string | null;
      password_hash: string;
    }>(
      `SELECT id, email, name, password_hash
       FROM admins WHERE email_lower = $1`,
      [normalized],
    );

    const admin = rows[0];
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await this.verifyPassword(password, admin.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { id: admin.id, email: admin.email, name: admin.name };
  }

  signToken(admin: AdminRecord): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: TokenPayload = {
      sub: admin.id,
      email: admin.email,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyToken(token: string): TokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token');
    }
    const [encodedHeader, encodedPayload, signature] = parts;
    const expected = this.sign(`${encodedHeader}.${encodedPayload}`);

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Invalid token');
    }

    let payload: TokenPayload;
    try {
      payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }

  async getAdminById(id: string): Promise<AdminRecord | null> {
    const { rows } = await this.db.getPool().query<{
      id: string;
      email: string;
      name: string | null;
    }>('SELECT id, email, name FROM admins WHERE id = $1', [id]);
    const admin = rows[0];
    return admin ? { id: admin.id, email: admin.email, name: admin.name } : null;
  }

  private sign(data: string): string {
    return createHmac('sha256', this.jwtSecret).update(data).digest('base64url');
  }
}
