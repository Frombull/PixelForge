// app/seu-endpoint/route.js (App Router)
// ou pages/api/seu-endpoint.js (Pages Router)

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'a-star/index.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}