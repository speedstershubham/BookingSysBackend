import { SQL } from 'bun';

const UNIQUE_VIOLATION_CODE = '23505';

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof SQL.PostgresError &&
    String(error.errno) === UNIQUE_VIOLATION_CODE
  );
}
