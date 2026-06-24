import response from '@/core/http/response';
import AppError from '@/core/errors/app-error';
import type RouterTypes from '@/core/router/router.types';

const matchRoute = (
  pattern: string,
  pathname: string,
): Record<string, string> | null => {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const segment = patternParts[i];
    const value = pathParts[i];

    if (!segment || !value) {
      return null;
    }

    if (segment.startsWith(':')) {
      params[segment.slice(1)] = value;
      continue;
    }

    if (segment !== value) {
      return null;
    }
  }

  return params;
};

const createRouter = (routes: RouterTypes.Route[]) => {
  return async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url);

    for (const route of routes) {
      if (route.method !== req.method) {
        continue;
      }

      const params = matchRoute(route.path, url.pathname);

      if (!params) {
        continue;
      }

      try {
        return await route.handler(req, params);
      } catch (error) {
        if (error instanceof Error && error.message === 'Invalid JSON body') {
          return response.errorResponse(new AppError(400, 'Invalid JSON body'));
        }

        return response.errorResponse(error);
      }
    }

    return null;
  };
};

export default createRouter;
