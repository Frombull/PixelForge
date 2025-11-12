import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'canvas-3d/index.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}