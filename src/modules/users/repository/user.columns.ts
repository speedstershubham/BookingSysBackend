const USER_PUBLIC_COLUMNS =
  'id, name, email, role, is_banned, banned_at, created_at, updated_at' as const;

const USER_AUTH_COLUMNS =
  'id, name, email, password, role, is_banned, banned_at, created_at, updated_at' as const;

export default { USER_PUBLIC_COLUMNS, USER_AUTH_COLUMNS };
