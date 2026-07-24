import { describe, it, expect } from 'vitest';
import { buildQuery } from '../src/everhour-client.js';

describe('buildQuery', () => {
  it('returns an empty string when there are no params', () => {
    expect(buildQuery({})).toBe('');
  });

  it('skips undefined values', () => {
    expect(buildQuery({ from: undefined, to: undefined })).toBe('');
    expect(buildQuery({ from: '2024-01-01', to: undefined })).toBe(
      '?from=2024-01-01',
    );
  });

  it('keeps a leading "?" and joins multiple params', () => {
    expect(buildQuery({ from: '2024-01-01', to: '2024-01-31' })).toBe(
      '?from=2024-01-01&to=2024-01-31',
    );
  });

  it('coerces numbers and booleans to strings', () => {
    expect(buildQuery({ limit: 10, page: 2 })).toBe('?limit=10&page=2');
    expect(buildQuery({ searchInClosed: true })).toBe('?searchInClosed=true');
  });

  it('keeps falsy-but-defined values (0, false)', () => {
    expect(buildQuery({ page: 0 })).toBe('?page=0');
    expect(buildQuery({ flag: false })).toBe('?flag=false');
  });

  it('url-encodes special characters', () => {
    expect(buildQuery({ query: 'a b&c' })).toBe('?query=a+b%26c');
  });
});
