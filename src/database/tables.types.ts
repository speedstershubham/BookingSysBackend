import type Tables from '@/database/tables';

export type TableName = (typeof Tables)[keyof typeof Tables];
