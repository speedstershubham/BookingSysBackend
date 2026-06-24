import { SQL } from 'bun';

const UNIQUE_VIOLATION_CODE = '23505';

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof SQL.PostgresError &&
  String(error.errno) === UNIQUE_VIOLATION_CODE;

export default { isUniqueViolation };
