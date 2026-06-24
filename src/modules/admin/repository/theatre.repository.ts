import { sql } from '@/database/postgres';
import type {
  CreateTheatreInput,
  TheatreRecord,
  TheatreWithHalls,
  UpdateTheatreInput,
} from '@/modules/admin/types/admin.types';

type TheatreRow = {
  id: string;
  name: string;
  location: string;
  created_at: Date;
  updated_at: Date;
};

function mapTheatre(row: TheatreRow): TheatreRecord {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findTheatres(): Promise<TheatreRecord[]> {
  const rows = await sql<TheatreRow[]>`
    SELECT id, name, location, created_at, updated_at
    FROM theatres
    ORDER BY name ASC
  `;

  return rows.map(mapTheatre);
}

export async function findTheatreById(
  id: string,
): Promise<TheatreRecord | null> {
  const [row] = await sql<TheatreRow[]>`
    SELECT id, name, location, created_at, updated_at
    FROM theatres
    WHERE id = ${id}
    LIMIT 1
  `;

  return row ? mapTheatre(row) : null;
}

export async function findTheatreWithHalls(
  id: string,
): Promise<TheatreWithHalls | null> {
  const theatre = await findTheatreById(id);

  if (!theatre) {
    return null;
  }

  const halls = await sql<
    {
      id: string;
      theatre_id: string;
      theatre_name: string;
      name: string;
      capacity: number;
      seat_count: string;
      created_at: Date;
      updated_at: Date;
    }[]
  >`
    SELECT
      h.id,
      h.theatre_id,
      t.name AS theatre_name,
      h.name,
      h.capacity,
      COUNT(se.id)::text AS seat_count,
      h.created_at,
      h.updated_at
    FROM halls h
    JOIN theatres t ON t.id = h.theatre_id
    LEFT JOIN seats se ON se.hall_id = h.id
    WHERE h.theatre_id = ${id}
    GROUP BY h.id, t.name
    ORDER BY h.name ASC
  `;

  return {
    ...theatre,
    halls: halls.map((hall) => ({
      id: hall.id,
      theatreId: hall.theatre_id,
      theatreName: hall.theatre_name,
      name: hall.name,
      capacity: hall.capacity,
      seatCount: Number(hall.seat_count),
      createdAt: hall.created_at,
      updatedAt: hall.updated_at,
    })),
  };
}

export async function insertTheatre(
  input: CreateTheatreInput,
): Promise<TheatreRecord> {
  const now = new Date();
  const [row] = await sql<TheatreRow[]>`
    INSERT INTO theatres (name, location, created_at, updated_at)
    VALUES (${input.name}, ${input.location}, ${now}, ${now})
    RETURNING id, name, location, created_at, updated_at
  `;

  if (!row) {
    throw new Error('THEATRE_CREATE_FAILED');
  }

  return mapTheatre(row);
}

export async function updateTheatreById(
  id: string,
  input: UpdateTheatreInput,
): Promise<TheatreRecord | null> {
  const [existing] = await sql<TheatreRow[]>`
    SELECT id, name, location, created_at, updated_at
    FROM theatres
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!existing) {
    return null;
  }

  const [row] = await sql<TheatreRow[]>`
    UPDATE theatres
    SET
      name = ${input.name ?? existing.name},
      location = ${input.location ?? existing.location},
      updated_at = ${new Date()}
    WHERE id = ${id}
    RETURNING id, name, location, created_at, updated_at
  `;

  return row ? mapTheatre(row) : null;
}

export async function countTheatreHalls(theatreId: string): Promise<number> {
  const [row] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM halls
    WHERE theatre_id = ${theatreId}
  `;

  return Number(row?.count ?? 0);
}

export async function deleteTheatreById(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM theatres
    WHERE id = ${id}
  `;

  return result.count > 0;
}
