import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const payload = verifyToken(token);
    return payload;

  } catch (error) {
    throw new Error('Unauthorized');
  }
}

export function requireAuth(handler: (request: NextRequest, user: any) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const user = getAuthUser(request);
      return await handler(request, user);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}