import type { SQL } from 'bun';

import { db } from '@/database/postgres';
import type {
  CreateHallInput,
  HallAdminRecord,
  ListHallsFilters,
  UpdateHallInput,
} from '@/modules/admin/types/admin.types';

type HallRow = {
  id: string;
  theatre_id: string;
  theatre_name: string;
  name: string;
  capacity: number;
  seat_count: number;
  created_at: Date;
  updated_at: Date;
};

function mapHall(row: HallRow): HallAdminRecord {
  return {
    id: row.id,
    theatreId: row.theatre_id,
    theatreName: row.theatre_name,
    name: row.name,
    capacity: row.capacity,
    seatCount: row.seat_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findHalls(
  filters: ListHallsFilters,
): Promise<{ halls: HallAdminRecord[]; total: number }> {
  const offset = (filters.page - 1) * filters.limit;

  const [countRow] = filters.theatreId
    ? await db<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM halls
        WHERE theatre_id = ${filters.theatreId}
      `
    : await db<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM halls
      `;

  const total = countRow!.count;

  const rows = filters.theatreId
    ? await db<HallRow[]>`
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
        WHERE h.theatre_id = ${filters.theatreId}
        GROUP BY h.id, t.name
        ORDER BY h.name ASC
        LIMIT ${filters.limit}
        OFFSET ${offset}
      `
    : await db<HallRow[]>`
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
        GROUP BY h.id, t.name
        ORDER BY h.name ASC
        LIMIT ${filters.limit}
        OFFSET ${offset}
      `;

  return {
    halls: rows.map(mapHall),
    total,
  };
}

export async function findHallAdminById(
  id: string,
): Promise<HallAdminRecord | null> {
  const [row] = await db<HallRow[]>`
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
    WHERE h.id = ${id}
    GROUP BY h.id, t.name
    LIMIT 1
  `;

  return row ? mapHall(row) : null;
}

async function generateSeatsForHall(
  tx: SQL,
  hallId: string,
  capacity: number,
): Promise<void> {
  await tx`
    INSERT INTO seats (hall_id, seat_number)
    SELECT ${hallId}, gs.seat_number
    FROM generate_series(1, ${capacity}) AS gs(seat_number)
    ON CONFLICT (hall_id, seat_number) DO NOTHING
  `;
}

export async function insertHall(input: CreateHallInput): Promise<HallAdminRecord> {
  const hallId = await db.begin(async (tx) => {
    const now = new Date();
    const [hall] = await tx<{ id: string }[]>`
      INSERT INTO halls (theatre_id, name, capacity, created_at, updated_at)
      VALUES (${input.theatreId}, ${input.name}, ${input.capacity}, ${now}, ${now})
      RETURNING id
    `;

    if (!hall) {
      throw new Error('HALL_CREATE_FAILED');
    }

    await generateSeatsForHall(tx, hall.id, input.capacity);

    return hall.id;
  });

  const created = await findHallAdminById(hallId);

  if (!created) {
    throw new Error('HALL_CREATE_FAILED');
  }

  return created;
}

export async function updateHallById(
  id: string,
  input: UpdateHallInput,
): Promise<HallAdminRecord> {
  await db.begin(async (tx) => {
    const [existing] = await tx<
      { id: string; name: string; capacity: number }[]
    >`
      SELECT id, name, capacity
      FROM halls
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!existing) {
      throw new Error('HALL_NOT_FOUND');
    }

    const newCapacity = input.capacity ?? existing.capacity;
    const newName = input.name ?? existing.name;

    if (newCapacity < existing.capacity) {
      const blocked = await tx<{ seat_number: number }[]>`
        SELECT se.seat_number
        FROM seats se
        WHERE se.hall_id = ${id}
          AND se.seat_number > ${newCapacity}
          AND EXISTS (
            SELECT 1
            FROM movie_booking_seats mbs
            JOIN showtimes st ON st.id = mbs.showtime_id
            WHERE mbs.seat_id = se.id
              AND st.hall_id = ${id}
          )
        LIMIT 1
      `;

      if (blocked.length > 0) {
        throw new Error('SEATS_IN_USE');
      }

      await tx`
        DELETE FROM seats
        WHERE hall_id = ${id}
          AND seat_number > ${newCapacity}
      `;
    } else if (newCapacity > existing.capacity) {
      await tx`
        INSERT INTO seats (hall_id, seat_number)
        SELECT ${id}, gs.seat_number
        FROM generate_series(${existing.capacity + 1}, ${newCapacity}) AS gs(seat_number)
        ON CONFLICT (hall_id, seat_number) DO NOTHING
      `;
    }

    await tx`
      UPDATE halls
      SET
        name = ${newName},
        capacity = ${newCapacity},
        updated_at = ${new Date()}
      WHERE id = ${id}
    `;
  });

  const updated = await findHallAdminById(id);

  if (!updated) {
    throw new Error('HALL_NOT_FOUND');
  }

  return updated;
}

export async function regenerateHallSeats(
  hallId: string,
  capacity?: number,
): Promise<HallAdminRecord> {
  await db.begin(async (tx) => {
    const [hall] = await tx<{ capacity: number }[]>`
      SELECT capacity
      FROM halls
      WHERE id = ${hallId}
      LIMIT 1
    `;

    if (!hall) {
      throw new Error('HALL_NOT_FOUND');
    }

    const targetCapacity = capacity ?? hall.capacity;

    const booked = await tx<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM movie_booking_seats mbs
      JOIN showtimes st ON st.id = mbs.showtime_id
      JOIN seats se ON se.id = mbs.seat_id
      WHERE st.hall_id = ${hallId}
        AND se.seat_number > ${targetCapacity}
    `;

    if (booked[0]!.count > 0) {
      throw new Error('SEATS_IN_USE');
    }

    await tx`
      DELETE FROM seats
      WHERE hall_id = ${hallId}
        AND seat_number > ${targetCapacity}
    `;

    await tx`
      INSERT INTO seats (hall_id, seat_number)
      SELECT ${hallId}, gs.seat_number
      FROM generate_series(1, ${targetCapacity}) AS gs(seat_number)
      ON CONFLICT (hall_id, seat_number) DO NOTHING
    `;

    await tx`
      UPDATE halls
      SET capacity = ${targetCapacity}, updated_at = ${new Date()}
      WHERE id = ${hallId}
    `;
  });

  const updated = await findHallAdminById(hallId);

  if (!updated) {
    throw new Error('HALL_NOT_FOUND');
  }

  return updated;
}

export async function countHallShowtimeBookings(
  hallId: string,
): Promise<number> {
  const [row] = await db<{ count: number }[]>`
    SELECT COUNT(DISTINCT mb.id)::int AS count
    FROM movie_bookings mb
    JOIN showtimes st ON st.id = mb.showtime_id
    WHERE st.hall_id = ${hallId}
  `;

  return row!.count;
}

export async function countHallShowtimes(hallId: string): Promise<number> {
  const [row] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM showtimes
    WHERE hall_id = ${hallId}
  `;

  return row!.count;
}

export async function deleteHallById(id: string): Promise<boolean> {
  const result = await db`
    DELETE FROM halls
    WHERE id = ${id}
  `;

  return result.count > 0;
}
