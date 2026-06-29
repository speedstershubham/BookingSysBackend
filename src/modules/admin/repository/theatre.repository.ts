import getDB from '@/database/postgres';
import type {
  CreateTheatreInput,
  TheatreRecord,
  TheatreWithHalls,
  UpdateTheatreInput,
} from '@/modules/admin/types/admin.types';

const db = await getDB();

type TheatreRow = {
  id: string;
  name: string;
  location: string;
  created_at: Date;
  updated_at: Date;
};

const mapTheatre = (row: TheatreRow): TheatreRecord => ({
  id: row.id,
  name: row.name,
  location: row.location,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findTheatres = async (): Promise<TheatreRecord[]> => {
  const rows = await db<TheatreRow[]>`
    SELECT id, name, location, created_at, updated_at
    FROM theatres
    ORDER BY name ASC
  `;

  return rows.map(mapTheatre);
};

const findTheatreById = async (id: string): Promise<TheatreRecord | null> => {
  const [row] = await db<TheatreRow[]>`
    SELECT id, name, location, created_at, updated_at
    FROM theatres
    WHERE id = ${id}
    LIMIT 1
  `;

  return row ? mapTheatre(row) : null;
};

const findTheatreWithHalls = async (
  id: string,
): Promise<TheatreWithHalls | null> => {
  const theatre = await findTheatreById(id);

  if (!theatre) {
    return null;
  }

  const halls = await db<
    {
      id: string;
      theatre_id: string;
      theatre_name: string;
      name: string;
      capacity: number;
      seat_count: number;
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
      COUNT(se.id)::int AS seat_count,
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
      seatCount: hall.seat_count,
      createdAt: hall.created_at,
      updatedAt: hall.updated_at,
    })),
  };
};

const insertTheatre = async (
  input: CreateTheatreInput,
): Promise<TheatreRecord> => {
  const now = new Date();
  const [row] = await db<TheatreRow[]>`
    INSERT INTO theatres (name, location, created_at, updated_at)
    VALUES (${input.name}, ${input.location}, ${now}, ${now})
    RETURNING id, name, location, created_at, updated_at
  `;

  if (!row) {
    throw new Error('THEATRE_CREATE_FAILED');
  }

  return mapTheatre(row);
};

const updateTheatreById = async (
  id: string,
  input: UpdateTheatreInput,
): Promise<TheatreRecord | null> => {
  const [existing] = await db<TheatreRow[]>`
    SELECT id, name, location, created_at, updated_at
    FROM theatres
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!existing) {
    return null;
  }

  const [row] = await db<TheatreRow[]>`
    UPDATE theatres
    SET
      name = ${input.name ?? existing.name},
      location = ${input.location ?? existing.location},
      updated_at = ${new Date()}
    WHERE id = ${id}
    RETURNING id, name, location, created_at, updated_at
  `;

  return row ? mapTheatre(row) : null;
};

const countTheatreHalls = async (theatreId: string): Promise<number> => {
  const [row] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM halls
    WHERE theatre_id = ${theatreId}
  `;

  return row!.count;
};

const deleteTheatreById = async (id: string): Promise<boolean> => {
  const result = await db`
    DELETE FROM theatres
    WHERE id = ${id}
  `;

  return result.count > 0;
};

export default {
  findTheatres,
  findTheatreById,
  findTheatreWithHalls,
  insertTheatre,
  updateTheatreById,
  countTheatreHalls,
  deleteTheatreById,
};
