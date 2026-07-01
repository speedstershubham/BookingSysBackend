import bcrypt from 'bcrypt';
import database from '@/database/database';
import Tables from '@/database/tables';
import userColumns from '@/modules/users/repository/user.columns';
import type {
  CreateUserInput,
  UserAuthRecord,
  UserAuthRow,
  UserPublicRecord,
} from '@/modules/users/types/user.types';

const mapPublicRecord = ({
  id,
  name,
  email,
  createdAt,
  updatedAt,
}: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): UserPublicRecord => ({
  id,
  name,
  email,
  createdAt,
  updatedAt,
});

const mapAuthRow = (row: UserAuthRow): UserAuthRecord => ({
  ...mapPublicRecord({
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }),
  password: row.password,
});

const createUserRecord = async (
  input: CreateUserInput,
): Promise<UserPublicRecord> => {
  const now = new Date();
  const name = input.name.trim();
  const email = input.email.toLowerCase();
  const password = await bcrypt.hash(input.password, 10);

  const { id } = await database.insert({
    table: Tables.USERS,
    data: {
      name,
      email,
      password,
      created_at: now,
      updated_at: now,
    },
  });

  return mapPublicRecord({
    id,
    name,
    email,
    createdAt: now,
    updatedAt: now,
  });
};

const findUserRecordByEmail = async (
  email: string,
): Promise<UserAuthRecord | null> => {
  const user = await database.findOne<UserAuthRow>({
    table: Tables.USERS,
    columns: userColumns.USER_AUTH_COLUMNS,
    where: { email: email.toLowerCase() },
  });

  return user ? mapAuthRow(user) : null;
};

export default { createUserRecord, findUserRecordByEmail };
