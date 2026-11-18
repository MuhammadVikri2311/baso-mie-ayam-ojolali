import { NextResponse } from 'next/server';

export async function GET() {
  const envKeys = Object.keys(process.env).filter(key => key.includes('NOUS'));
  return NextResponse.json({
    hasNousApiKey: Boolean(process.env.NOUS_API_KEY),
    hasNousKeyId: Boolean(process.env.NOUS_KEY_ID),
    keysFound: envKeys
  });
}
