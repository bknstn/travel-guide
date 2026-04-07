import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function unauthorizedResponse() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="travel-guide-ops"',
    },
  });
}

export function middleware(request: NextRequest) {
  const user = process.env.OPS_BASIC_AUTH_USER;
  const password = process.env.OPS_BASIC_AUTH_PASSWORD;

  if (!user || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  try {
    const encoded = authHeader.slice('Basic '.length);
    const decoded = atob(encoded);
    const [candidateUser, candidatePassword] = decoded.split(':');

    if (candidateUser === user && candidatePassword === password) {
      return NextResponse.next();
    }
  } catch {
    return unauthorizedResponse();
  }

  return unauthorizedResponse();
}

export const config = {
  matcher: ['/ops/:path*'],
};
