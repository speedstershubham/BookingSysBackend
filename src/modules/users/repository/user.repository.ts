import { ObjectId } from 'mongodb';
import { getDB } from '@/database/mongodb';
import { Collections } from '@/database/collections';
import type {
  InsertUserPayload,
  UserDocument,
} from '@/modules/users/types/user.types';

export async function insertUser(
  payload: InsertUserPayload,
): Promise<UserDocument> {
  const result = await getDB()
    .collection<UserDocument>(Collections.USERS)
    .insertOne({
      _id: new ObjectId(),
      ...payload,
    });

  const user = await getDB()
    .collection<UserDocument>(Collections.USERS)
    .findOne({ _id: result.insertedId });

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

export async function findUserByEmail(
  email: string,
): Promise<UserDocument | null> {
  return getDB()
    .collection<UserDocument>(Collections.USERS)
    .findOne({ email });
}

export async function findUserById(
  id: string,
): Promise<UserDocument | null> {
  return getDB()
    .collection<UserDocument>(Collections.USERS)
    .findOne({ _id: new ObjectId(id) });
}

export async function findAllUsers(): Promise<UserDocument[]> {
  return getDB()
    .collection<UserDocument>(Collections.USERS)
    .find()
    .sort({ createdAt: -1 })
    .toArray();
}
