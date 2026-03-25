/**
 * Tests for the generate-image-gemini API route.
 * Mocks @google/generative-ai and Next.js server imports.
 */

// Mock next/server before any imports
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}));

// Mock @google/generative-ai
const mockGenerateImages = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateImages: mockGenerateImages,
    }),
  })),
}));

import { POST, _resetRateLimitMap } from '../route';

function createRequest(body: unknown) {
  return {
    json: async () => body,
    headers: { get: (_key: string) => null },
  } as unknown as import('next/server').NextRequest;
}

function createBadJsonRequest() {
  return {
    json: async () => { throw new SyntaxError('bad json'); },
    headers: { get: (_key: string) => null },
  } as unknown as import('next/server').NextRequest;
}

beforeEach(() => {
  _resetRateLimitMap();
  mockGenerateImages.mockReset();
});

describe('POST /api/generate-image-gemini', () => {
  describe('input validation', () => {
    it('returns 500 when GOOGLE_AI_API_KEY is not set', async () => {
      const original = process.env.GOOGLE_AI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      const req = createRequest({ prompt: 'test' });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Image generation is not available');

      process.env.GOOGLE_AI_API_KEY = original;
    });

    it('returns 400 for invalid JSON body', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';
      const req = createBadJsonRequest();
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid JSON body');
    });

    it('returns 400 when prompt is missing', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';
      const req = createRequest({});
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/prompt is required/);
    });

    it('returns 400 when prompt is empty string', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';
      const req = createRequest({ prompt: '   ' });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when prompt exceeds 4000 characters', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';
      const req = createRequest({ prompt: 'a'.repeat(4001) });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/4000 characters/);
    });
  });

  describe('successful image generation', () => {
    beforeEach(() => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';
    });

    it('returns imageUrl as data URL on success', async () => {
      const fakeBytes = Buffer.from('fake-image-bytes');
      mockGenerateImages.mockResolvedValue({
        generatedImages: [{ image: { imageBytes: fakeBytes } }],
      });

      const req = createRequest({ prompt: 'beautiful office' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.imageUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('returns 500 when generatedImages is empty', async () => {
      mockGenerateImages.mockResolvedValue({ generatedImages: [] });

      const req = createRequest({ prompt: 'beautiful office' });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('No image returned from Gemini API');
    });

    it('returns 500 when result is null', async () => {
      mockGenerateImages.mockResolvedValue(null);

      const req = createRequest({ prompt: 'beautiful office' });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';
    });

    it('returns 429 when API returns 429 status', async () => {
      const err = new Error('rate limit') as Error & { status: number };
      err.status = 429;
      mockGenerateImages.mockRejectedValue(err);

      const req = createRequest({ prompt: 'test' });
      const res = await POST(req);
      expect(res.status).toBe(429);
    });

    it('returns 500 for unexpected errors', async () => {
      mockGenerateImages.mockRejectedValue(new Error('unexpected'));

      const req = createRequest({ prompt: 'test' });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Failed to generate image');
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      process.env.GOOGLE_AI_API_KEY = 'test-key';
      const fakeBytes = Buffer.from('bytes');
      mockGenerateImages.mockResolvedValue({
        generatedImages: [{ image: { imageBytes: fakeBytes } }],
      });
    });

    it('allows up to 5 requests per minute', async () => {
      for (let i = 0; i < 5; i++) {
        const req = createRequest({ prompt: 'test' });
        const res = await POST(req);
        expect(res.status).toBe(200);
      }
    });

    it('rejects the 6th request with 429', async () => {
      for (let i = 0; i < 5; i++) {
        const req = createRequest({ prompt: 'test' });
        await POST(req);
      }
      const req = createRequest({ prompt: 'test' });
      const res = await POST(req);
      expect(res.status).toBe(429);
    });
  });
});
