import userRepository from '@/modules/users/repository/user.repository';
import type UserTypes from '@/modules/users/types/user.types';

const createUserRecord = (
  input: UserTypes.CreateUserInput,
): Promise<UserTypes.UserPublicRecord> => userRepository.createUser(input);

const findUserRecordByEmail = (
  email: string,
): Promise<UserTypes.UserAuthRecord | null> =>
  userRepository.findUserByEmailForAuth(email);

export default { createUserRecord, findUserRecordByEmail };
