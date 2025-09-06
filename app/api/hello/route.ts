import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from JobX API!' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ 
    message: 'Data received successfully',
    data: body 
  });
}
