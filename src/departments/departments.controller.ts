import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { formatId, nextCounter } from '../database/ids';

interface DepartmentRow {
  id: string;
  name: string;
  created_at: Date;
}

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list() {
    const { rows } = await this.db.getPool().query<DepartmentRow>(
      `SELECT id, name, created_at FROM departments ORDER BY created_at ASC`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.created_at,
    }));
  }

  @Post()
  async create(@Body('name') rawName: string) {
    const name = String(rawName ?? '').trim();
    if (!name) {
      throw new HttpException(
        'Department name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const pool = this.db.getPool();
    const seq = await nextCounter(pool, 'dept');
    const id = formatId('JCC-DEPT-', seq);

    try {
      const { rows } = await pool.query<DepartmentRow>(
        `INSERT INTO departments (id, name, name_lower)
         VALUES ($1, $2, $3)
         RETURNING id, name, created_at`,
        [id, name, name.toLowerCase()],
      );
      const d = rows[0];
      return { id: d.id, name: d.name, createdAt: d.created_at };
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') {
        throw new HttpException(
          'Department already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body('name') rawName: string) {
    const name = String(rawName ?? '').trim();
    if (!name) {
      throw new HttpException(
        'Department name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const { rowCount } = await this.db.getPool().query(
        `UPDATE departments SET name = $1, name_lower = $2 WHERE id = $3`,
        [name, name.toLowerCase(), id],
      );
      if (rowCount === 0) {
        throw new HttpException(
          'Department not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return { ok: true };
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') {
        throw new HttpException(
          'Department already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const { rowCount } = await this.db
      .getPool()
      .query(`DELETE FROM departments WHERE id = $1`, [id]);
    if (rowCount === 0) {
      throw new HttpException('Department not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }
}
