import userRepository from '@/modules/users/repository/user.repository';
import type {
  InsertUserPayload,
  UserAuthRecord,
  UserPublicRecord,
} from '@/modules/users/types/user.types';

const createUserRecord = async (
  payload: InsertUserPayload,
): Promise<UserPublicRecord> => userRepository.insertUser(payload);

const findUserRecordByEmail = async (
  email: string,
): Promise<UserAuthRecord | null> =>
  userRepository.findUserByEmailForAuth(email.toLowerCase());

export default { createUserRecord, findUserRecordByEmail };
