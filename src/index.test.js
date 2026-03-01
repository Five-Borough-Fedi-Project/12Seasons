import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from './index.js';

// Mock the global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper: build an hourly response with 3 time slots (past hour, current, next hour)
function makeHourlyResponse({ rain = [0,0,0], showers = [0,0,0], snowfall = [0,0,0], wind_speed_80m = [0,0,0], wind_speed_120m = [0,0,0], wind_speed_180m = [0,0,0] } = {}) {
  return {
    json: () => Promise.resolve({
      hourly: {
        time: ['2026-03-01T11:00', '2026-03-01T12:00', '2026-03-01T13:00'],
        rain,
        showers,
        snowfall,
        wind_speed_80m,
        wind_speed_120m,
        wind_speed_180m,
      }
    })
  };
}

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
    mockFetch.mockResolvedValueOnce(makeHourlyResponse());

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    
    expect(response.headers.get('content-type')).toBe('text/css; charset=utf-8');
  });

  it('returns CORS header', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse());

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('returns cache-control header', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse());

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    
    expect(response.headers.get('cache-control')).toBe('public, max-age=900');
  });

  it('returns clear weather CSS when no weather conditions', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse());

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });

  it('returns snow CSS when snowfall is present in any hour', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ snowfall: [0, 0.5, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: SNOW');
    expect(css).toContain('@keyframes snow-fall');
  });

  it('returns snow CSS when snowfall was in the past hour', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ snowfall: [0.3, 0, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: SNOW');
  });

  it('returns snow CSS when snowfall is forecast for next hour', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ snowfall: [0, 0, 0.2] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: SNOW');
  });

  it('returns rain CSS when rain is present', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ rain: [0, 0.5, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: RAIN');
    expect(css).toContain('@keyframes rain-drop');
  });

  it('returns rain CSS when showers are present', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ showers: [0.5, 0, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: RAIN');
  });

  it('returns rain CSS when a brief shower was in the past hour', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ showers: [0.3, 0, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: RAIN');
  });

  it('returns wind CSS when high-altitude wind exceeds 45 km/h', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ wind_speed_80m: [0, 50, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: WIND');
    expect(css).toContain('wisp-drift');
  });

  it('returns wind CSS when wind_speed_120m exceeds threshold', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ wind_speed_120m: [0, 0, 50] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: WIND');
  });

  it('returns wind CSS when wind_speed_180m exceeds threshold', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ wind_speed_180m: [50, 0, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: WIND');
  });

  it('snow takes priority over rain', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ rain: [1.0, 0, 0], snowfall: [0, 0.5, 0] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toContain('WEATHER: SNOW');
    expect(css).not.toContain('WEATHER: RAIN');
  });

  it('rain takes priority over wind', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ rain: [0, 0.5, 0], wind_speed_80m: [50, 50, 50] }));

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

  it('handles missing hourly data fields', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        hourly: { time: ['2026-03-01T12:00'] }
      })
    });

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });

  it('does not show wind when speed is at threshold (45 km/h)', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ wind_speed_80m: [45, 45, 45] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });

  it('does not show rain when below threshold (0.1mm)', async () => {
    mockFetch.mockResolvedValueOnce(makeHourlyResponse({ rain: [0.05, 0.03, 0], showers: [0, 0.04, 0.02] }));

    const response = await worker.fetch(createRequest(), mockEnv, mockCtx);
    const css = await response.text();
    
    expect(css).toBe('/* Weather: Clear */');
  });
});
