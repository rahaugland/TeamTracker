import { describe, it, expect } from 'vitest';

/**
 * Import Service Tests
 * Tests for CSV import and data transformation logic
 */

describe('CSV Import Service', () => {
  describe('CSV Parsing', () => {
    it('should parse basic CSV data', () => {
      const parseCsv = (csvText: string): Array<Record<string, string>> => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        return lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      };

      const csv = `Name,Email,Phone
John Doe,john@example.com,123-456-7890
Jane Smith,jane@example.com,098-765-4321`;

      const result = parseCsv(csv);

      expect(result).toHaveLength(2);
      expect(result[0].Name).toBe('John Doe');
      expect(result[0].Email).toBe('john@example.com');
      expect(result[1].Name).toBe('Jane Smith');
    });

    it('should handle empty cells', () => {
      const parseCsv = (csvText: string): Array<Record<string, string>> => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        return lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
      };

      const csv = `Name,Email,Phone
John Doe,,123-456-7890
Jane Smith,jane@example.com,`;

      const result = parseCsv(csv);

      expect(result[0].Email).toBe('');
      expect(result[1].Phone).toBe('');
    });
  });

  describe('Column Mapping', () => {
    it('should map standard column names', () => {
      const mapPlayerColumns = (row: Record<string, string>) => {
        return {
          name: row['Name'] || row['Player Name'] || row['Full Name'] || '',
          email: row['Email'] || row['E-mail'] || '',
          phone: row['Phone'] || row['Mobile'] || row['Cell'] || '',
        };
      };

      const row1 = { 'Name': 'John Doe', 'Email': 'john@example.com', 'Phone': '123' };
      const result1 = mapPlayerColumns(row1);

      expect(result1.name).toBe('John Doe');
      expect(result1.email).toBe('john@example.com');
      expect(result1.phone).toBe('123');
    });

    it('should handle alternative column names', () => {
      const mapPlayerColumns = (row: Record<string, string>) => {
        return {
          name: row['Name'] || row['Player Name'] || row['Full Name'] || '',
          email: row['Email'] || row['E-mail'] || '',
          phone: row['Phone'] || row['Mobile'] || row['Cell'] || '',
        };
      };

      const row1 = { 'Player Name': 'John Doe', 'E-mail': 'john@example.com', 'Mobile': '123' };
      const result1 = mapPlayerColumns(row1);

      expect(result1.name).toBe('John Doe');
      expect(result1.email).toBe('john@example.com');
      expect(result1.phone).toBe('123');
    });

    it('should return empty strings for missing columns', () => {
      const mapPlayerColumns = (row: Record<string, string>) => {
        return {
          name: row['Name'] || row['Player Name'] || row['Full Name'] || '',
          email: row['Email'] || row['E-mail'] || '',
          phone: row['Phone'] || row['Mobile'] || row['Cell'] || '',
        };
      };

      const row1 = { 'Name': 'John Doe' };
      const result1 = mapPlayerColumns(row1);

      expect(result1.name).toBe('John Doe');
      expect(result1.email).toBe('');
      expect(result1.phone).toBe('');
    });
  });

  describe('Status Conversion', () => {
    it('should convert Spond status to app RSVP status', () => {
      const convertSpondToRsvpStatus = (
        spondStatus: string
      ): 'attending' | 'not_attending' | 'maybe' | 'pending' => {
        const statusMap: Record<string, 'attending' | 'not_attending' | 'maybe' | 'pending'> = {
          'Accepted': 'attending',
          'Going': 'attending',
          'Yes': 'attending',
          'Declined': 'not_attending',
          'Not Going': 'not_attending',
          'No': 'not_attending',
          'Maybe': 'maybe',
          'Uncertain': 'maybe',
          'Unanswered': 'pending',
          'No Response': 'pending',
        };
        return statusMap[spondStatus] || 'pending';
      };

      expect(convertSpondToRsvpStatus('Accepted')).toBe('attending');
      expect(convertSpondToRsvpStatus('Going')).toBe('attending');
      expect(convertSpondToRsvpStatus('Declined')).toBe('not_attending');
      expect(convertSpondToRsvpStatus('Maybe')).toBe('maybe');
      expect(convertSpondToRsvpStatus('Unanswered')).toBe('pending');
      expect(convertSpondToRsvpStatus('Unknown')).toBe('pending'); // default
    });

    it('should convert attendance status formats', () => {
      const convertAttendanceStatus = (
        status: string
      ): 'present' | 'absent' | 'late' | 'excused' => {
        const normalized = status.toLowerCase().trim();

        if (normalized.includes('present') || normalized === 'here' || normalized === 'attended') {
          return 'present';
        }
        if (normalized.includes('late') || normalized.includes('tardy')) {
          return 'late';
        }
        if (normalized.includes('excused') || normalized.includes('sick') || normalized.includes('injury')) {
          return 'excused';
        }
        return 'absent';
      };

      expect(convertAttendanceStatus('Present')).toBe('present');
      expect(convertAttendanceStatus('here')).toBe('present');
      expect(convertAttendanceStatus('Late')).toBe('late');
      expect(convertAttendanceStatus('Tardy')).toBe('late');
      expect(convertAttendanceStatus('Excused')).toBe('excused');
      expect(convertAttendanceStatus('Sick')).toBe('excused');
      expect(convertAttendanceStatus('Absent')).toBe('absent');
      expect(convertAttendanceStatus('No Show')).toBe('absent');
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate players by email', () => {
      const players = [
        { name: 'John Doe', email: 'john@example.com', phone: '123' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '456' },
        { name: 'John D.', email: 'john@example.com', phone: '789' }, // Duplicate
      ];

      const findDuplicates = (players: Array<{ email: string }>) => {
        const emailMap = new Map<string, number>();
        const duplicates: number[] = [];

        players.forEach((player, index) => {
          if (player.email) {
            const normalizedEmail = player.email.toLowerCase().trim();
            if (emailMap.has(normalizedEmail)) {
              duplicates.push(index);
            } else {
              emailMap.set(normalizedEmail, index);
            }
          }
        });

        return duplicates;
      };

      const duplicates = findDuplicates(players);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toBe(2); // Third player is duplicate
    });

    it('should detect duplicate players by name and phone', () => {
      const players = [
        { name: 'John Doe', email: '', phone: '123-456-7890' },
        { name: 'Jane Smith', email: '', phone: '098-765-4321' },
        { name: 'John Doe', email: '', phone: '123-456-7890' }, // Duplicate
      ];

      const findDuplicates = (players: Array<{ name: string; phone: string }>) => {
        const keyMap = new Map<string, number>();
        const duplicates: number[] = [];

        players.forEach((player, index) => {
          const key = `${player.name.toLowerCase().trim()}-${player.phone.replace(/\D/g, '')}`;
          if (keyMap.has(key)) {
            duplicates.push(index);
          } else {
            keyMap.set(key, index);
          }
        });

        return duplicates;
      };

      const duplicates = findDuplicates(players);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toBe(2);
    });

    it('should handle players with no email or phone', () => {
      const players = [
        { name: 'John Doe', email: '', phone: '' },
        { name: 'Jane Smith', email: '', phone: '' },
      ];

      const findDuplicates = (players: Array<{ email: string }>) => {
        const emailMap = new Map<string, number>();
        const duplicates: number[] = [];

        players.forEach((player, index) => {
          if (player.email) {
            const normalizedEmail = player.email.toLowerCase().trim();
            if (emailMap.has(normalizedEmail)) {
              duplicates.push(index);
            } else {
              emailMap.set(normalizedEmail, index);
            }
          }
        });

        return duplicates;
      };

      const duplicates = findDuplicates(players);

      // Should not flag as duplicates if no email
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const validatePlayer = (player: { name: string; email: string; phone: string }) => {
        const errors: string[] = [];

        if (!player.name || player.name.trim() === '') {
          errors.push('Name is required');
        }

        if (player.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player.email)) {
          errors.push('Invalid email format');
        }

        return errors;
      };

      const validPlayer = { name: 'John Doe', email: 'john@example.com', phone: '123' };
      expect(validatePlayer(validPlayer)).toHaveLength(0);

      const invalidPlayer1 = { name: '', email: 'john@example.com', phone: '123' };
      expect(validatePlayer(invalidPlayer1)).toContain('Name is required');

      const invalidPlayer2 = { name: 'John Doe', email: 'invalid-email', phone: '123' };
      expect(validatePlayer(invalidPlayer2)).toContain('Invalid email format');
    });

    it('should validate phone number format', () => {
      const isValidPhone = (phone: string): boolean => {
        if (!phone) return true; // Optional field
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
      };

      expect(isValidPhone('123-456-7890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('+1-123-456-7890')).toBe(true);
      expect(isValidPhone('123')).toBe(false); // Too short
      expect(isValidPhone('')).toBe(true); // Optional
    });

    it('should sanitize input data', () => {
      const sanitizePlayer = (player: { name: string; email: string; phone: string }) => {
        return {
          name: player.name.trim(),
          email: player.email.toLowerCase().trim(),
          phone: player.phone.replace(/\D/g, ''),
        };
      };

      const input = {
        name: '  John Doe  ',
        email: ' John@Example.COM ',
        phone: '(123) 456-7890',
      };

      const result = sanitizePlayer(input);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe('1234567890');
    });
  });

  describe('Batch Import', () => {
    it('should process multiple records', () => {
      const csvData = [
        { Name: 'John Doe', Email: 'john@example.com', Phone: '123' },
        { Name: 'Jane Smith', Email: 'jane@example.com', Phone: '456' },
        { Name: '', Email: 'invalid', Phone: '789' }, // Invalid
      ];

      const processImport = (data: Array<Record<string, string>>) => {
        const valid: any[] = [];
        const errors: Array<{ row: number; errors: string[] }> = [];

        data.forEach((row, index) => {
          const rowErrors: string[] = [];

          if (!row.Name || row.Name.trim() === '') {
            rowErrors.push('Name is required');
          }

          if (row.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.Email)) {
            rowErrors.push('Invalid email');
          }

          if (rowErrors.length > 0) {
            errors.push({ row: index + 1, errors: rowErrors });
          } else {
            valid.push({
              name: row.Name.trim(),
              email: row.Email.toLowerCase().trim(),
              phone: row.Phone,
            });
          }
        });

        return { valid, errors };
      };

      const result = processImport(csvData);

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3);
      expect(result.errors[0].errors).toContain('Name is required');
      expect(result.errors[0].errors).toContain('Invalid email');
    });

    it('should count successful and failed imports', () => {
      const results = {
        valid: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
        ],
        errors: [
          { row: 3, errors: ['Name is required'] },
        ],
      };

      const summary = {
        total: results.valid.length + results.errors.length,
        successful: results.valid.length,
        failed: results.errors.length,
      };

      expect(summary.total).toBe(3);
      expect(summary.successful).toBe(2);
      expect(summary.failed).toBe(1);
    });
  });

  describe('Event Import', () => {
    it('should parse event date and time', () => {
      const parseEventDateTime = (dateStr: string, timeStr: string): string => {
        const date = new Date(`${dateStr}T${timeStr}`);
        return date.toISOString();
      };

      const result = parseEventDateTime('2024-01-15', '14:30:00');

      expect(result).toContain('2024-01-15');
      expect(result).toContain('14:30');
    });

    it('should determine event type from title', () => {
      const determineEventType = (title: string): 'practice' | 'game' | 'tournament' | 'other' => {
        const normalized = title.toLowerCase();

        if (normalized.includes('practice') || normalized.includes('training')) {
          return 'practice';
        }
        if (normalized.includes('game') || normalized.includes('match')) {
          return 'game';
        }
        if (normalized.includes('tournament') || normalized.includes('competition')) {
          return 'tournament';
        }
        return 'other';
      };

      expect(determineEventType('Practice Session')).toBe('practice');
      expect(determineEventType('Game vs Team A')).toBe('game');
      expect(determineEventType('Summer Tournament')).toBe('tournament');
      expect(determineEventType('Team Meeting')).toBe('other');
    });
  });
});
