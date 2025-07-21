import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API 正常工作',
    timestamp: new Date().toISOString(),
    env: {
      hasNotionKey: !!process.env.NOTION_API_KEY,
      hasNotionDb: !!process.env.NOTION_DATABASE_ID,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
