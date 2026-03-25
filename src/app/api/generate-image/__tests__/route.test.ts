/**
 * Tests for the generate-image API route.
 * Mocks OpenAI SDK and Next.js server imports.
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

// Mock OpenAI
const mockGenerate = jest.fn();

class MockAPIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

jest.mock('openai', () => {
  const MockOpenAI = jest.fn().mockImplementation(() => ({
    images: { generate: mockGenerate },
  }));
  (MockOpenAI as unknown as Record<string, unknown>).APIError = MockAPIError;
  return {
    __esModule: true,
    default: MockOpenAI,
  };
});

import { POST, _resetRateLimitMap } from '../route';

function createRequest(body: unknown) {
  return {
    json: async () => body,
    headers: { get: (_key: string) => null },
  } as unknown as import('next/server').NextRequest;
}

function createBadJsonRequest() {
  return {
    json: () => { throw new SyntaxError('Unexpected token'); },
    headers: { get: (_key: string) => null },
  } as unknown as import('next/server').NextRequest;
}

describe('POST /api/generate-image', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
    _resetRateLimitMap();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return 500 when API key is not set', async () => {
    delete process.env.OPENAI_API_KEY;

    const req = createRequest({ prompt: 'test' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when prompt is missing', async () => {
    const req = createRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('prompt');
  });

  it('should return 400 when prompt is empty string', async () => {
    const req = createRequest({ prompt: '   ' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('prompt');
  });

  it('should return 400 when prompt is too long', async () => {
    const req = createRequest({ prompt: 'a'.repeat(4001) });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('4000');
  });

  it('should return 400 when size is invalid', async () => {
    const req = createRequest({ prompt: 'test', size: '500x500' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('size');
  });

  it('should return image URL on success', async () => {
    mockGenerate.mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });

    const req = createRequest({ prompt: 'office space' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBe('https://example.com/image.png');
  });

  it('should use default size 1792x1024 when not specified', async () => {
    mockGenerate.mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });

    const req = createRequest({ prompt: 'test' });
    await POST(req);

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ size: '1792x1024' })
    );
  });

  it('should accept valid size parameter', async () => {
    mockGenerate.mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });

    const req = createRequest({ prompt: 'test', size: '1024x1024' });
    await POST(req);

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ size: '1024x1024' })
    );
  });

  it('should return 500 when API returns no image URL', async () => {
    mockGenerate.mockResolvedValue({ data: [{}] });

    const req = createRequest({ prompt: 'test' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain('No image URL');
  });

  it('should handle rate limit errors (429)', async () => {
    const err = new MockAPIError(429, 'Rate limit exceeded');
    mockGenerate.mockRejectedValue(err);

    const req = createRequest({ prompt: 'test' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBeDefined();
  });

  it('should handle generic API errors', async () => {
    const err = new MockAPIError(400, 'Bad request');
    mockGenerate.mockRejectedValue(err);

    const req = createRequest({ prompt: 'test' });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should handle unknown errors', async () => {
    mockGenerate.mockRejectedValue(new Error('Unknown error'));

    const req = createRequest({ prompt: 'test' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain('Failed to generate');
  });

  it('should return 400 when JSON body is invalid', async () => {
    const req = createBadJsonRequest();
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Invalid JSON');
  });

  it('should trim prompt whitespace', async () => {
    mockGenerate.mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });

    const req = createRequest({ prompt: '  office space  ' });
    await POST(req);

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'office space' })
    );
  });

  it('should use dall-e-3 model', async () => {
    mockGenerate.mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });

    const req = createRequest({ prompt: 'test' });
    await POST(req);

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'dall-e-3' })
    );
  });
});
