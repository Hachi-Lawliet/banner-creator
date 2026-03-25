import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// In-memory rate limiter: 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Exposed for testing only — resets the in-memory rate limit state. */
export function _resetRateLimitMap(): void {
  rateLimitMap.clear();
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Image generation is not available' },
      { status: 500 }
    );
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { prompt } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: 'prompt is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: 'prompt must be 4000 characters or less' },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-002' });

    // @ts-ignore generateImages is available on imagen models
    const result = await model.generateImages({
      prompt: prompt.trim(),
      number_of_images: 1,
      aspect_ratio: '16:9',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageBytes = (result as any)?.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      return NextResponse.json(
        { error: 'No image returned from Gemini API' },
        { status: 500 }
      );
    }

    const base64 = Buffer.from(imageBytes).toString('base64');
    const imageUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    const apiErr = err as { status?: number; message?: string };
    if (typeof apiErr.status === 'number') {
      if (apiErr.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      if (apiErr.status >= 400 && apiErr.status < 500) {
        return NextResponse.json(
          { error: 'Invalid request to Gemini image generation API' },
          { status: apiErr.status }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
