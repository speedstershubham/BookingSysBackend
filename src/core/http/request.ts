const parseJsonBody = async <T>(req: Request): Promise<T> => {
  try {
    const data = await req.json();
    return data as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
};

export default { parseJsonBody };
