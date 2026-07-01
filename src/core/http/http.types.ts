export type JsonPrimitive = string | number | boolean | null;

export type JsonObject = { [key: string]: JsonValue };

export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export type JsonBody = JsonObject;

export type SuccessPayload =
  | JsonPrimitive
  | Date
  | SuccessPayload[]
  | { readonly [key: string]: SuccessPayload };
