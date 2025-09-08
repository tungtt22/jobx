import { NextResponse } from 'next/server';

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data, status }, { status });
}

export function errorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({ error, status }, { status });
}

export async function handleApiError(error: unknown): Promise<NextResponse> {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }
  
  return errorResponse('An unexpected error occurred', 500);
}
