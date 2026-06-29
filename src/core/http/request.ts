import type { JsonBody } from '@/core/http/http.types';

const parseJsonBody = async (req: Request): Promise<JsonBody> => {
  try {
    return (await req.json()) as JsonBody;
  } catch {
    throw new Error('Invalid JSON body');
  }
};

export default { parseJsonBody };
