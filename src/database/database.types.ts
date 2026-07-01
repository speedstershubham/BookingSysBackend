import type { TableName } from '@/database/tables.types';

export type DbValue = string | number | boolean | Date | null;

export type DbRow = Record<string, DbValue>;

export type InsertData = DbRow;

export type InsertParams = {
  table: TableName;
  data: InsertData;
};

export type InsertResult = {
  id: string;
};

export type FindOneParams = {
  table: TableName;
  columns: string;
  where: DbRow;
};

export type FindManyParams = {
  table: TableName;
  columns: string;
  where?: DbRow;
  orderBy: string;
  limit: number;
  offset: number;
};

export type UpdateParams = {
  table: TableName;
  data: DbRow;
  where: DbRow;
  returning?: string;
};

export type DeleteParams = {
  table: TableName;
  where: DbRow;
};

export type CountParams = {
  table: TableName;
  where?: DbRow;
};
