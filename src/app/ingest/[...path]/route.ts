/**
 * PostHog Reverse Proxy
 * Prevents ad blockers from blocking analytics
 * Proxies requests from /ingest/* to PostHog
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join('/');

  const posthogHost = 'https://us.i.posthog.com';
  const url = `${posthogHost}/${path}`;

  try {
    const body = await request.text();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.text();
    return new NextResponse(data, { status: response.status });
  } catch (error) {
    console.error('PostHog proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path.join('/');

  const posthogHost = 'https://us.i.posthog.com';
  const url = `${posthogHost}/${path}`;

  try {
    const response = await fetch(url);
    const data = await response.text();
    return new NextResponse(data, { status: response.status });
  } catch (error) {
    console.error('PostHog proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
