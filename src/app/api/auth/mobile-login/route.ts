import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/turso';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { handleCors, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user in database
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
      args: [email],
    });

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password.toString()
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const payload = {
      userId: user.id?.toString() ?? '',
      email: user.email?.toString() ?? '',
    };

    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Return user data and tokens
    const response = NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id?.toString() ?? '',
        name: user.name?.toString() ?? '',
        email: user.email?.toString() ?? '',
      },
    });

    return addCorsHeaders(response);

  } catch (error) {
    console.error('Mobile login error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}