import type { ObjectId } from 'mongodb';

export type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertUserPayload = {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};
