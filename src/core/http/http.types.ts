export type JsonValue =
  | string
  | number
  | boolean
  | null
  | Date
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonBody = { [key: string]: JsonValue };

export type SuccessPayload = Record<string, JsonValue> | JsonValue[];
