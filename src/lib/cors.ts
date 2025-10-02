import { NextResponse } from 'next/server';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // In Produktion spezifische Origins verwenden
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 Stunden
  };
}

export function handleCors(request: Request) {
  // Handle preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export function addCorsHeaders(response: NextResponse) {
  const corsHeadersObj = corsHeaders();
  Object.entries(corsHeadersObj).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}