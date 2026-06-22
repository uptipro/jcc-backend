import { Pool } from 'pg';

export function formatId(prefix: string, seq: number): string {
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export async function nextCounter(pool: Pool, key: string): Promise<number> {
  const res = await pool.query<{ seq: number }>(
    `INSERT INTO counters (key, seq)
     VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE SET seq = counters.seq + 1
     RETURNING seq`,
    [key],
  );
  const seq = Number(res.rows[0]?.seq);
  if (!Number.isFinite(seq)) throw new Error('Failed to generate counter');
  return seq;
}
