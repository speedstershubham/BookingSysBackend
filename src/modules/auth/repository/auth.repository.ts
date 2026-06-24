import userRepository from '@/modules/users/repository/user.repository';
import type UserTypes from '@/modules/users/types/user.types';

const createUserRecord = (
  payload: UserTypes.InsertUserPayload,
): Promise<UserTypes.UserPublicRecord> => userRepository.insertUser(payload);

const findUserRecordByEmail = (
  email: string,
): Promise<UserTypes.UserAuthRecord | null> =>
  userRepository.findUserByEmailForAuth(email.toLowerCase());

export default { createUserRecord, findUserRecordByEmail };
