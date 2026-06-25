import userRepository from '@/modules/users/repository/user.repository';
import type {
  CreateUserInput,
  UserAuthRecord,
  UserPublicRecord,
} from '@/modules/users/types/user.types';

const createUserRecord = (
  input: CreateUserInput,
): Promise<UserPublicRecord> => userRepository.createUser(input);

const findUserRecordByEmail = (
  email: string,
): Promise<UserAuthRecord | null> =>
  userRepository.findUserByEmailForAuth(email);

export default { createUserRecord, findUserRecordByEmail };
