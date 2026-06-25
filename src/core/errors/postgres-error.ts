import { SQL } from 'bun';

const UNIQUE_VIOLATION_CODE = '23505';

const isUniqueViolation = (error: Error): boolean =>
  error instanceof SQL.PostgresError &&
  String(error.errno) === UNIQUE_VIOLATION_CODE;

export default { isUniqueViolation };
