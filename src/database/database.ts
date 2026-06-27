import getDB from '@/database/postgres';
import type {
  CountParams,
  DeleteParams,
  FindManyParams,
  FindOneParams,
  InsertParams,
  InsertResult,
  UpdateParams,
} from '@/database/database.types';
import generateId from '@/core/utils/uuid';

const insert = async ({
  table,
  data,
}: InsertParams): Promise<InsertResult> => {
  const db = await getDB();
  const id = generateId();
  data.id = id;
  await db`
    INSERT INTO ${db(table)} ${db(data)}
  `;

  return { id: data.id };
};

const findOne = async <TRow>({
  table,
  columns,
  where,
}: FindOneParams): Promise<TRow | null> => {
  const db = await getDB();
  const [[column, value]] = Object.entries(where);

  const [row] = await db<TRow[]>`
    SELECT ${db.unsafe(columns)}
    FROM ${db(table)}
    WHERE ${db.unsafe(column)} = ${value}
    LIMIT 1
  `;

  return row ?? null;
};

const findMany = async <TRow>({
  table,
  columns,
  where,
  orderBy,
  limit,
  offset,
}: FindManyParams): Promise<TRow[]> => {
  const db = await getDB();

  if (where) {
    const [[column, value]] = Object.entries(where);

    if (orderBy && limit !== undefined && offset !== undefined) {
      return db<TRow[]>`
        SELECT ${db.unsafe(columns)}
        FROM ${db(table)}
        WHERE ${db.unsafe(column)} = ${value}
        ORDER BY ${db.unsafe(orderBy)}
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    if (orderBy && limit !== undefined) {
      return db<TRow[]>`
        SELECT ${db.unsafe(columns)}
        FROM ${db(table)}
        WHERE ${db.unsafe(column)} = ${value}
        ORDER BY ${db.unsafe(orderBy)}
        LIMIT ${limit}
      `;
    }

    return db<TRow[]>`
      SELECT ${db.unsafe(columns)}
      FROM ${db(table)}
      WHERE ${db.unsafe(column)} = ${value}
    `;
  }

  if (orderBy && limit !== undefined && offset !== undefined) {
    return db<TRow[]>`
      SELECT ${db.unsafe(columns)}
      FROM ${db(table)}
      ORDER BY ${db.unsafe(orderBy)}
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  if (orderBy && limit !== undefined) {
    return db<TRow[]>`
      SELECT ${db.unsafe(columns)}
      FROM ${db(table)}
      ORDER BY ${db.unsafe(orderBy)}
      LIMIT ${limit}
    `;
  }

  return db<TRow[]>`
    SELECT ${db.unsafe(columns)}
    FROM ${db(table)}
  `;
};

const update = async <TRow>({
  table,
  data,
  where,
  returning,
}: UpdateParams): Promise<TRow | null> => {
  const db = await getDB();
  const [[column, value]] = Object.entries(where);

  if (returning) {
    const [row] = await db<TRow[]>`
      UPDATE ${db(table)}
      SET ${db(data)}
      WHERE ${db.unsafe(column)} = ${value}
      RETURNING ${db.unsafe(returning)}
    `;

    return row ?? null;
  }

  await db`
    UPDATE ${db(table)}
    SET ${db(data)}
    WHERE ${db.unsafe(column)} = ${value}
  `;

  return null;
};

const remove = async ({ table, where }: DeleteParams): Promise<void> => {
  const db = await getDB();
  const [[column, value]] = Object.entries(where);

  await db`
    DELETE FROM ${db(table)}
    WHERE ${db.unsafe(column)} = ${value}
  `;
};

const count = async ({ table, where }: CountParams): Promise<number> => {
  const db = await getDB();

  if (where) {
    const [[column, value]] = Object.entries(where);
    const [row] = await db<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM ${db(table)}
      WHERE ${db.unsafe(column)} = ${value}
    `;

    return row.count ?? 0;
  }

  const [row] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM ${db(table)}
  `;

  return row?.count ?? 0;
};

export default { insert, findOne, findMany, update, delete: remove, count };
