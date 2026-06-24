namespace RouterTypes {
  export type RouteHandler = (
    req: Request,
    params: Record<string, string>,
  ) => Promise<Response>;

  export type Route = {
    method: string;
    path: string;
    handler: RouteHandler;
  };
}

export default RouterTypes;
