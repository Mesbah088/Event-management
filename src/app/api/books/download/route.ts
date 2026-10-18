import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Direct high-speed download from Google Drive
  const driveDownloadUrl = 'https://drive.google.com/uc?export=download&id=1UC0Mn3Xc6ESH5h-qCMEhlHZfcVLlVmIb';
  return NextResponse.redirect(driveDownloadUrl, 307);
}
