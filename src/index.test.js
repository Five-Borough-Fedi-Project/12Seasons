import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

// Mock the global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Weather CSS Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (url = 'https://example.com/') => {
    return new Request(url);
  };

  const mockEnv = {};
  const mockCtx = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };

  it('returns CSS content-type header', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0, snowfall: 0, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    
    expect(response.headers.get('content-type')).toBe('text/css; charset=utf-8');
  });

  it('returns CORS header', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0, snowfall: 0, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('returns cache-control header', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0, snowfall: 0, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    
    expect(response.headers.get('cache-control')).toBe('public, max-age=900');
  });

  it('returns clear weather CSS when no weather conditions', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0, snowfall: 0, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });

  it('returns snow CSS when snowfall is present', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0, snowfall: 0.5, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: SNOW');
    expect(css).toContain('@keyframes snow-fall');
  });

  it('returns rain CSS when rain is present', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0.5, showers: 0, snowfall: 0, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: RAIN');
    expect(css).toContain('@keyframes rain-fall');
  });

  it('returns rain CSS when showers are present', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0.5, snowfall: 0, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: RAIN');
  });

  it('returns wind CSS when gusts exceed 45 km/h', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0, snowfall: 0, wind_gusts_10m: 50 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: WIND');
    expect(css).toContain('@keyframes wind-shake');
    expect(css).toContain('@keyframes wind-blow');
  });

  it('snow takes priority over rain', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 1.0, showers: 0, snowfall: 0.5, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: SNOW');
    expect(css).not.toContain('WEATHER: RAIN');
  });

  it('rain takes priority over wind', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0.5, showers: 0, snowfall: 0, wind_gusts_10m: 50 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: RAIN');
    expect(css).not.toContain('WEATHER: WIND');
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('Error fetching weather');
    expect(css).toContain('Network error');
  });

  it('handles missing current data fields', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: {}
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });

  it('does not show wind when gusts are at threshold (45 km/h)', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0, showers: 0, snowfall: 0, wind_gusts_10m: 45 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });

  it('does not show rain when below threshold (0.1mm)', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        current: { rain: 0.05, showers: 0.04, snowfall: 0, wind_gusts_10m: 0 }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });
});
