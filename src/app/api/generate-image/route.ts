import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const VALID_SIZES = ['1024x1024', '1024x1792', '1792x1024'] as const;
type ValidSize = (typeof VALID_SIZES)[number];

function isValidSize(size: string): size is ValidSize {
  return VALID_SIZES.includes(size as ValidSize);
}

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
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Image generation is not available' },
      { status: 500 }
    );
  }

  let body: { prompt?: string; size?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { prompt, size = '1792x1024' } = body;

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

  if (!isValidSize(size)) {
    return NextResponse.json(
      { error: `size must be one of: ${VALID_SIZES.join(', ')}` },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size,
      quality: 'standard',
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL returned from API' },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    const apiErr = err as { status?: number; name?: string };
    if (apiErr.name === 'APIError' && typeof apiErr.status === 'number') {
      if (apiErr.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      if (apiErr.status >= 400 && apiErr.status < 500) {
        return NextResponse.json(
          { error: 'Invalid request to image generation API' },
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
