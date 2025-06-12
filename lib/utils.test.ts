import { describe, it, expect } from 'vitest';
import { cn, countWords, getErrorMessage, extractJsonFromString } from './utils';

describe('Utility Functions', () => {
  describe('cn (Classname utility)', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4', 'm-2')).toBe('p-4 m-2');
      expect(cn('p-4', 'p-2')).toBe('p-2'); // twMerge handles conflicts
    });
  });

  describe('countWords', () => {
    it('should return 0 for null or empty strings', () => {
      expect(countWords(null)).toBe(0);
      expect(countWords(undefined)).toBe(0);
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });

    it('should correctly count words in a string', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('This is a test.')).toBe(4);
      expect(countWords('  Extra   spaces  ')).toBe(2);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from an Error object', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('should return a string if the error is a string', () => {
      expect(getErrorMessage('A string error')).toBe('A string error');
    });

    it('should return a generic message for unknown types', () => {
      expect(getErrorMessage(123)).toBe('An unknown error occurred');
      expect(getErrorMessage({})).toBe('An unknown error occurred');
    });
  });

  describe('extractJsonFromString', () => {
    it('should extract JSON from a string', () => {
      const jsonString = 'Some text {"key": "value"} more text';
      expect(extractJsonFromString(jsonString)).toEqual({ key: 'value' });
    });

    it('should return null if no JSON found', () => {
      expect(extractJsonFromString('No JSON here')).toBeNull();
    });
  });
});
