import {
  findUserByEmailForAuth,
  insertUser,
} from '@/modules/users/repository/user.repository';
import type {
  InsertUserPayload,
  UserAuthRecord,
  UserPublicRecord,
} from '@/modules/users/types/user.types';

export async function createUserRecord(
  payload: InsertUserPayload,
): Promise<UserPublicRecord> {
  return insertUser(payload);
}

export async function findUserRecordByEmail(
  email: string,
): Promise<UserAuthRecord | null> {
  return findUserByEmailForAuth(email.toLowerCase());
}
