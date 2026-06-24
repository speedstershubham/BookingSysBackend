namespace AuthTypes {
  export type JwtPayload = {
    userId: string;
    email: string;
  };

  export type AuthenticatedHandler = (
    req: Request,
    params: Record<string, string>,
    auth: JwtPayload,
  ) => Promise<Response>;
}

export default AuthTypes;
