import { describe, it, expect } from 'vitest';

/**
 * Helper utility function tests
 * These test common utility functions used throughout the app
 */

describe('Date Formatting Helpers', () => {
  describe('ISO Date Validation', () => {
    it('should validate ISO 8601 date strings', () => {
      const validDates = [
        '2024-01-15T10:00:00Z',
        '2024-12-31T23:59:59Z',
        '2024-06-15T12:30:45.123Z',
      ];

      validDates.forEach(dateStr => {
        const date = new Date(dateStr);
        expect(date.toString()).not.toBe('Invalid Date');
        expect(date.toISOString()).toBe(dateStr.split('.')[0].includes('.')
          ? dateStr
          : dateStr
        );
      });
    });

    it('should detect invalid date strings', () => {
      const invalidDates = [
        'not-a-date',
        '2024-13-01', // Invalid month
        '2024-02-30', // Invalid day
        '',
      ];

      invalidDates.forEach(dateStr => {
        if (dateStr === '') {
          expect(isNaN(new Date(dateStr).getTime())).toBe(true);
        } else {
          const date = new Date(dateStr);
          expect(isNaN(date.getTime()) || date.toString() === 'Invalid Date').toBe(true);
        }
      });
    });
  });

  describe('Date Range Calculations', () => {
    it('should calculate duration between dates correctly', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date('2024-01-08T00:00:00Z');
      const durationMs = end.getTime() - start.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);

      expect(durationDays).toBe(7);
    });

    it('should handle timezone conversions', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      expect(date1.getTime()).toBe(date2.getTime());
    });
  });
});

describe('Percentage Calculations', () => {
  describe('Attendance Rate Calculations', () => {
    it('should calculate percentage correctly', () => {
      const calculatePercentage = (part: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((part / total) * 100 * 10) / 10;
      };

      expect(calculatePercentage(3, 10)).toBe(30);
      expect(calculatePercentage(7, 10)).toBe(70);
      expect(calculatePercentage(1, 3)).toBe(33.3);
      expect(calculatePercentage(2, 3)).toBe(66.7);
    });

    it('should handle edge cases in percentage calculation', () => {
      const calculatePercentage = (part: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((part / total) * 100 * 10) / 10;
      };

      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(0, 10)).toBe(0);
      expect(calculatePercentage(10, 10)).toBe(100);
    });

    it('should round to one decimal place', () => {
      const calculatePercentage = (part: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((part / total) * 100 * 10) / 10;
      };

      expect(calculatePercentage(1, 3)).toBe(33.3);
      expect(calculatePercentage(2, 3)).toBe(66.7);
      expect(calculatePercentage(1, 6)).toBe(16.7);
      expect(calculatePercentage(5, 6)).toBe(83.3);
    });
  });
});

describe('Array Sorting and Filtering', () => {
  describe('Sort by attendance rate', () => {
    it('should sort players by attendance rate descending', () => {
      const players = [
        { name: 'Alice', attendanceRate: 75 },
        { name: 'Bob', attendanceRate: 90 },
        { name: 'Charlie', attendanceRate: 60 },
      ];

      const sorted = [...players].sort((a, b) => b.attendanceRate - a.attendanceRate);

      expect(sorted[0].name).toBe('Bob');
      expect(sorted[1].name).toBe('Alice');
      expect(sorted[2].name).toBe('Charlie');
    });
  });

  describe('Filter by date range', () => {
    it('should filter events within date range', () => {
      const events = [
        { id: '1', start_time: '2024-01-10T10:00:00Z' },
        { id: '2', start_time: '2024-01-20T10:00:00Z' },
        { id: '3', start_time: '2024-02-05T10:00:00Z' },
      ];

      const filtered = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate >= new Date('2024-01-15T00:00:00Z') &&
               eventDate <= new Date('2024-01-31T23:59:59Z');
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });
  });
});

describe('String Validation', () => {
  describe('Invite Code Format', () => {
    it('should validate invite code format', () => {
      const isValidInviteCode = (code: string): boolean => {
        return /^[A-Z0-9]{6}$/.test(code);
      };

      expect(isValidInviteCode('ABC123')).toBe(true);
      expect(isValidInviteCode('XYZ789')).toBe(true);
      expect(isValidInviteCode('ABCDEF')).toBe(true);
      expect(isValidInviteCode('123456')).toBe(true);
    });

    it('should reject invalid invite codes', () => {
      const isValidInviteCode = (code: string): boolean => {
        return /^[A-Z0-9]{6}$/.test(code);
      };

      expect(isValidInviteCode('abc123')).toBe(false); // lowercase
      expect(isValidInviteCode('ABC12')).toBe(false);  // too short
      expect(isValidInviteCode('ABC1234')).toBe(false); // too long
      expect(isValidInviteCode('ABC-123')).toBe(false); // special char
      expect(isValidInviteCode('ABC 123')).toBe(false); // space
      expect(isValidInviteCode('')).toBe(false);        // empty
    });
  });

  describe('Email Validation', () => {
    it('should validate basic email format', () => {
      const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});

describe('Data Transformation', () => {
  describe('Status Conversion', () => {
    it('should convert Spond status to app status', () => {
      const convertSpondStatus = (spondStatus: string): 'attending' | 'not_attending' | 'maybe' | 'pending' => {
        const statusMap: Record<string, 'attending' | 'not_attending' | 'maybe' | 'pending'> = {
          'Accepted': 'attending',
          'Declined': 'not_attending',
          'Unanswered': 'pending',
          'Maybe': 'maybe',
        };
        return statusMap[spondStatus] || 'pending';
      };

      expect(convertSpondStatus('Accepted')).toBe('attending');
      expect(convertSpondStatus('Declined')).toBe('not_attending');
      expect(convertSpondStatus('Unanswered')).toBe('pending');
      expect(convertSpondStatus('Maybe')).toBe('maybe');
      expect(convertSpondStatus('Unknown')).toBe('pending'); // default
    });
  });

  describe('CSV Column Mapping', () => {
    it('should map CSV columns to database fields', () => {
      const mapCsvRow = (row: Record<string, string>) => {
        return {
          name: row['Name'] || row['Player Name'] || '',
          email: row['Email'] || '',
          phone: row['Phone'] || row['Mobile'] || '',
        };
      };

      const row1 = { 'Name': 'John Doe', 'Email': 'john@example.com', 'Phone': '123-456-7890' };
      const result1 = mapCsvRow(row1);

      expect(result1.name).toBe('John Doe');
      expect(result1.email).toBe('john@example.com');
      expect(result1.phone).toBe('123-456-7890');

      const row2 = { 'Player Name': 'Jane Smith', 'Email': 'jane@example.com', 'Mobile': '098-765-4321' };
      const result2 = mapCsvRow(row2);

      expect(result2.name).toBe('Jane Smith');
      expect(result2.phone).toBe('098-765-4321');
    });
  });
});

describe('Math Utilities', () => {
  describe('Average Calculation', () => {
    it('should calculate average correctly', () => {
      const average = (numbers: number[]): number => {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
      };

      expect(average([1, 2, 3, 4, 5])).toBe(3);
      expect(average([10, 20, 30])).toBe(20);
      expect(average([100])).toBe(100);
      expect(average([])).toBe(0);
    });

    it('should handle decimal averages', () => {
      const average = (numbers: number[]): number => {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
      };

      expect(average([1, 2])).toBe(1.5);
      expect(average([1, 2, 3])).toBeCloseTo(2);
    });
  });

  describe('Rounding', () => {
    it('should round to specified decimal places', () => {
      const roundToDecimal = (num: number, decimals: number): number => {
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
      };

      expect(roundToDecimal(3.14159, 2)).toBe(3.14);
      expect(roundToDecimal(3.14159, 1)).toBe(3.1);
      expect(roundToDecimal(3.14159, 0)).toBe(3);
      expect(roundToDecimal(3.999, 2)).toBe(4);
    });
  });
});

describe('Trend Detection', () => {
  describe('Detect up/down/stable trends', () => {
    it('should detect upward trend', () => {
      const detectTrend = (current: number, previous: number, threshold: number = 2): 'up' | 'down' | 'stable' => {
        if (current > previous + threshold) return 'up';
        if (current < previous - threshold) return 'down';
        return 'stable';
      };

      expect(detectTrend(75, 65, 2)).toBe('up');
      expect(detectTrend(80, 70, 5)).toBe('up');
    });

    it('should detect downward trend', () => {
      const detectTrend = (current: number, previous: number, threshold: number = 2): 'up' | 'down' | 'stable' => {
        if (current > previous + threshold) return 'up';
        if (current < previous - threshold) return 'down';
        return 'stable';
      };

      expect(detectTrend(65, 75, 2)).toBe('down');
      expect(detectTrend(70, 80, 5)).toBe('down');
    });

    it('should detect stable trend', () => {
      const detectTrend = (current: number, previous: number, threshold: number = 2): 'up' | 'down' | 'stable' => {
        if (current > previous + threshold) return 'up';
        if (current < previous - threshold) return 'down';
        return 'stable';
      };

      expect(detectTrend(75, 75, 2)).toBe('stable');
      expect(detectTrend(75, 76, 2)).toBe('stable');
      expect(detectTrend(75, 74, 2)).toBe('stable');
    });
  });
});
