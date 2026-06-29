import { db } from '@/database/postgres';
import type {
  CountParams,
  DbRow,
  DbValue,
  DeleteParams,
  FindManyParams,
  FindOneParams,
  InsertParams,
  InsertResult,
  UpdateParams,
} from '@/database/database.types';
import generateId from '@/core/utils/uuid';

const getWhereEntry = (where: DbRow): [string, DbValue] => {
  const [entry] = Object.entries(where);
  return entry!;
};

const insert = async ({ table, data }: InsertParams): Promise<InsertResult> => {
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
  const [column, value] = getWhereEntry(where);

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
  if (where) {
    const [column, value] = getWhereEntry(where);

    return db<TRow[]>`
      SELECT ${db.unsafe(columns)}
      FROM ${db(table)}
      WHERE ${db.unsafe(column)} = ${value}
      ORDER BY ${db.unsafe(orderBy)}
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  return db<TRow[]>`
    SELECT ${db.unsafe(columns)}
    FROM ${db(table)}
    ORDER BY ${db.unsafe(orderBy)}
    LIMIT ${limit}
    OFFSET ${offset}
  `;
};

const update = async <TRow>({
  table,
  data,
  where,
  returning,
}: UpdateParams): Promise<TRow | null> => {
  const [column, value] = getWhereEntry(where);

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
  const [column, value] = getWhereEntry(where);

  await db`
    DELETE FROM ${db(table)}
    WHERE ${db.unsafe(column)} = ${value}
  `;
};

const count = async ({ table, where }: CountParams): Promise<number> => {
  if (where) {
    const [column, value] = getWhereEntry(where);
    const [row] = await db<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM ${db(table)}
      WHERE ${db.unsafe(column)} = ${value}
    `;

    return row!.count;
  }

  const [row] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM ${db(table)}
  `;

  return row!.count;
};

export default { insert, findOne, findMany, update, delete: remove, count };
