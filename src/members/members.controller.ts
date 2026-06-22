import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { formatId, nextCounter } from '../database/ids';

interface MemberRow {
  id: string;
  personal_details: Record<string, unknown>;
  church_details: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

interface MemberBody {
  id?: string | number;
  personalDetails?: Record<string, unknown>;
  churchDetails?: Record<string, unknown> & { memberType?: string };
}

function prefixForType(memberType: string): string {
  if (memberType === 'Worker') return 'WRK';
  if (memberType === 'Volunteer') return 'VOL';
  return 'MBR';
}

@Controller('members')
export class MembersController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list() {
    const { rows } = await this.db.getPool().query<MemberRow>(
      `SELECT id, personal_details, church_details, created_at, updated_at
       FROM members ORDER BY created_at DESC`,
    );
    return rows.map((m) => ({
      id: m.id,
      personalDetails: m.personal_details,
      churchDetails: m.church_details,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  }

  @Post()
  async upsert(@Body() body: MemberBody) {
    const personalDetails = body?.personalDetails;
    const churchDetails = body?.churchDetails;
    const id = body?.id ? String(body.id) : null;

    if (!personalDetails || !churchDetails) {
      throw new HttpException(
        'personalDetails and churchDetails are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const pool = this.db.getPool();

    // UPDATE existing member
    if (id) {
      const { rowCount } = await pool.query(
        `UPDATE members
         SET personal_details = $1, church_details = $2, updated_at = NOW()
         WHERE id = $3`,
        [personalDetails, churchDetails, id],
      );
      if (rowCount === 0) {
        throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
      }
      return { ok: true };
    }

    // INSERT new member
    const memberType = String(churchDetails.memberType ?? 'Worker');
    const prefix = prefixForType(memberType);
    const seq = await nextCounter(pool, `member:${prefix}`);
    const memberId = formatId(`JCC-${prefix}-`, seq);

    await pool.query(
      `INSERT INTO members (id, personal_details, church_details)
       VALUES ($1, $2, $3)`,
      [memberId, personalDetails, churchDetails],
    );
    return { id: memberId };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const { rowCount } = await this.db
      .getPool()
      .query(`DELETE FROM members WHERE id = $1`, [id]);
    if (rowCount === 0) {
      throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }
}
