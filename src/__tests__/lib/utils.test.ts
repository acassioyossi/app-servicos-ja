import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  validateEmail,
  validatePassword,
  generateId,
  debounce,
  throttle,
  sanitizeInput,
  parseQueryParams,
  buildApiUrl,
  handleApiError,
  isValidUrl,
  truncateText,
  capitalizeFirst,
  slugify
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('merges Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with default options', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats currency with custom currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('formats currency with custom locale', () => {
      expect(formatCurrency(1234.56, 'USD', 'de-DE')).toBe('1.234,56 $');
    });

    it('handles zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-100.50)).toBe('-$100.50');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('formats date with default format', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('formats date with custom format', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });

    it('handles string dates', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date('2024-01-15T12:00:00Z');

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('formats recent times', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('formats hours ago', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });

    it('formats days ago', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('formats future times', () => {
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      expect(formatRelativeTime(inOneHour)).toBe('in 1 hour');
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MySecure@Pass1')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false); // Too short
      expect(validatePassword('onlylowercase')).toBe(false); // No uppercase/numbers/symbols
      expect(validatePassword('ONLYUPPERCASE')).toBe(false); // No lowercase/numbers/symbols
      expect(validatePassword('NoNumbers!')).toBe(false); // No numbers
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with custom length', () => {
      const shortId = generateId(8);
      const longId = generateId(32);
      
      expect(shortId).toHaveLength(8);
      expect(longId).toHaveLength(32);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('limits function execution rate', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('sanitizeInput', () => {
    it('removes HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>Hello'))
        .toBe('Hello');
    });

    it('trims whitespace', () => {
      expect(sanitizeInput('  Hello World  '))
        .toBe('Hello World');
    });

    it('handles empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('parseQueryParams', () => {
    it('parses URL search params', () => {
      const params = parseQueryParams('?name=John&age=30&active=true');
      
      expect(params).toEqual({
        name: 'John',
        age: '30',
        active: 'true'
      });
    });

    it('handles empty query string', () => {
      expect(parseQueryParams('')).toEqual({});
      expect(parseQueryParams('?')).toEqual({});
    });

    it('handles duplicate keys', () => {
      const params = parseQueryParams('?tag=red&tag=blue');
      expect(params.tag).toBe('blue'); // Last value wins
    });
  });

  describe('buildApiUrl', () => {
    it('builds URL with base path', () => {
      expect(buildApiUrl('/users')).toBe('/api/users');
    });

    it('builds URL with query params', () => {
      const url = buildApiUrl('/users', { page: 1, limit: 10 });
      expect(url).toBe('/api/users?page=1&limit=10');
    });

    it('handles empty params', () => {
      expect(buildApiUrl('/users', {})).toBe('/api/users');
    });
  });

  describe('handleApiError', () => {
    it('handles fetch errors', () => {
      const error = new Error('Network error');
      const result = handleApiError(error);
      
      expect(result.message).toBe('Network error occurred');
      expect(result.status).toBe(500);
    });

    it('handles API response errors', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' }
        }
      };
      
      const result = handleApiError(error);
      expect(result.message).toBe('Not found');
      expect(result.status).toBe(404);
    });
  });

  describe('isValidUrl', () => {
    it('validates correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    it('keeps short text unchanged', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('handles custom suffix', () => {
      const text = 'Long text here';
      expect(truncateText(text, 8, ' [more]')).toBe('Long tex [more]');
    });
  });

  describe('capitalizeFirst', () => {
    it('capitalizes first letter', () => {
      expect(capitalizeFirst('hello world')).toBe('Hello world');
    });

    it('handles empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('handles single character', () => {
      expect(capitalizeFirst('a')).toBe('A');
    });
  });

  describe('slugify', () => {
    it('creates URL-friendly slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('Special Characters @#$%')).toBe('special-characters');
    });

    it('handles multiple spaces', () => {
      expect(slugify('Multiple   Spaces   Here')).toBe('multiple-spaces-here');
    });

    it('handles accented characters', () => {
      expect(slugify('Café & Résumé')).toBe('cafe-resume');
    });
  });
});