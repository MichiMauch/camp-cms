import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { handleCors, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json() as {
      refreshToken: string;
    };

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new access token
    const newToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    const response = NextResponse.json({
      token: newToken,
    });

    return addCorsHeaders(response);

  } catch (error) {
    console.error('Token refresh error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
    return addCorsHeaders(errorResponse);
  }
}