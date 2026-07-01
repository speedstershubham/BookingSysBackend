import type { JsonBody } from '@/core/http/http.types';

const parseJsonBody = async (req: Request): Promise<JsonBody> => {
  try {
    const body = await req.json();
    return body as JsonBody;
  } catch {
    throw new Error('Invalid JSON body');
  }
};

export default { parseJsonBody };
