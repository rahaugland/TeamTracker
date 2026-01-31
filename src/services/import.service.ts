import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import type { AttendanceStatus, EventType } from '@/types/database.types';
import { createPlayer, searchPlayers, addPlayerToTeam, getTeamMembership } from './players.service';
import { createEvent, getEventsByTeam } from './events.service';
import { markAttendance } from './attendance.service';

/**
 * Import service
 * Handles CSV parsing and importing of attendance data from Spond
 */

export interface CSVRow {
  [key: string]: string;
}

export interface ColumnMapping {
  playerName?: string;
  email?: string;
  date?: string;
  eventTitle?: string;
  eventType?: string;
  status?: string;
  location?: string;
}

export interface ParseResult {
  data: CSVRow[];
  columns: string[];
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  stats: {
    totalRows: number;
    uniquePlayers: Set<string>;
    uniqueDates: Set<string>;
    statusCounts: Record<string, number>;
  };
}

export interface ImportOptions {
  teamId: string;
  columnMapping: ColumnMapping;
  createMissingPlayers: boolean;
  createMissingEvents: boolean;
  userId: string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  warnings: string[];
  errors: string[];
}

export interface ImportResult extends ImportProgress {
  completed: boolean;
  playersCreated: number;
  eventsCreated: number;
  attendanceRecordsCreated: number;
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<CSVRow>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const columns = results.meta.fields || [];
        resolve({
          data: results.data,
          columns,
          error: results.errors.length > 0 ? results.errors[0].message : undefined,
        });
      },
      error: (error: any) => {
        resolve({
          data: [],
          columns: [],
          error: error.message,
        });
      },
    });
  });
}

/**
 * Convert Excel serial date to ISO string
 */
function excelDateToISO(excelDate: number): string {
  // Excel serial date: days since 1900-01-01 (with 1900 leap year bug)
  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
  return jsDate.toISOString();
}

/**
 * Parse Excel (.xlsx) file content
 * Supports matrix-style attendance sheets where:
 * - Row 0: Headers (Navn, stats, then dates as Excel serial numbers)
 * - Row 1: Empty/stats columns, then event titles
 * - Subsequent rows: Player names and attendance (1 = attended, empty = not attended)
 */
export async function parseXLSX(fileBuffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    if (workbook.worksheets.length === 0) {
      return { data: [], columns: [], error: 'No sheets found in Excel file' };
    }

    const worksheet = workbook.worksheets[0];

    // Read all rows as arrays of values
    const rawData: any[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      rawData.push(row.values as any[]);
    });

    if (rawData.length < 3) {
      return {
        data: [],
        columns: [],
        error: 'Excel file must have at least 3 rows (headers, event titles, and data)',
      };
    }

    // ExcelJS row.values is 1-indexed (index 0 is undefined), so shift
    const toArray = (row: any[]) => row.slice(1);
    const headerRow = toArray(rawData[0]);
    const eventTitleRow = toArray(rawData[1]);
    const dataRows = rawData.slice(2).map(toArray);

    // Find where the event columns start (after summary stats)
    // Typically column 7, but we'll detect it by finding the first numeric date
    let eventStartColumn = 7;
    for (let i = 1; i < headerRow.length; i++) {
      const val = headerRow[i];
      if (typeof val === 'number' && val > 40000) {
        eventStartColumn = i;
        break;
      }
      if (typeof val === 'string' && !isNaN(parseFloat(val)) && parseFloat(val) > 40000) {
        eventStartColumn = i;
        break;
      }
    }

    // Transform matrix format into row-per-attendance format
    const transformedData: CSVRow[] = [];
    const columns = ['playerName', 'date', 'eventTitle', 'status'];

    dataRows.forEach((row) => {
      const playerName = String(row[0] || '').trim();
      if (!playerName) return;

      for (let i = eventStartColumn; i < headerRow.length; i++) {
        const rawDate = headerRow[i];
        const eventTitle = String(eventTitleRow[i] || '').trim();
        const attendanceValue = String(row[i] || '').trim();

        if (!rawDate || !eventTitle) continue;

        // Convert Excel serial date or Date object to ISO format
        let parsedDate: string;
        try {
          if (rawDate instanceof Date) {
            parsedDate = rawDate.toISOString();
          } else {
            const excelDate = typeof rawDate === 'number' ? rawDate : parseFloat(String(rawDate));
            if (isNaN(excelDate)) continue;
            parsedDate = excelDateToISO(excelDate);
          }
        } catch {
          continue;
        }

        const status = attendanceValue === '1' ? 'present' : 'absent';

        transformedData.push({
          playerName,
          date: parsedDate,
          eventTitle,
          status,
        });
      }
    });

    return { data: transformedData, columns };
  } catch (error) {
    return {
      data: [],
      columns: [],
      error: error instanceof Error ? error.message : 'Unknown error parsing Excel file',
    };
  }
}

/**
 * Auto-detect column mappings based on common Spond column names
 * Now supports both CSV format and transformed Excel format
 */
export function autoDetectColumns(columns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  const lowerColumns = columns.map((c) => c.toLowerCase());

  // Player name detection
  const namePatterns = ['name', 'player', 'spiller', 'navn', 'full name', 'fullname', 'playername'];
  const nameIndex = lowerColumns.findIndex((col) =>
    namePatterns.some((pattern) => col.includes(pattern))
  );
  if (nameIndex >= 0) mapping.playerName = columns[nameIndex];

  // Email detection
  const emailPatterns = ['email', 'e-mail', 'epost', 'e-post'];
  const emailIndex = lowerColumns.findIndex((col) =>
    emailPatterns.some((pattern) => col.includes(pattern))
  );
  if (emailIndex >= 0) mapping.email = columns[emailIndex];

  // Date detection
  const datePatterns = ['date', 'dato', 'when', 'time', 'tid'];
  const dateIndex = lowerColumns.findIndex((col) =>
    datePatterns.some((pattern) => col.includes(pattern))
  );
  if (dateIndex >= 0) mapping.date = columns[dateIndex];

  // Event title detection
  const eventPatterns = ['event', 'title', 'hendelse', 'arrangement', 'activity', 'aktivitet', 'eventtitle'];
  const eventIndex = lowerColumns.findIndex((col) =>
    eventPatterns.some((pattern) => col.includes(pattern))
  );
  if (eventIndex >= 0) mapping.eventTitle = columns[eventIndex];

  // Status detection
  const statusPatterns = ['status', 'attendance', 'oppmøte', 'attending', 'response'];
  const statusIndex = lowerColumns.findIndex((col) =>
    statusPatterns.some((pattern) => col.includes(pattern))
  );
  if (statusIndex >= 0) mapping.status = columns[statusIndex];

  // Location detection
  const locationPatterns = ['location', 'place', 'sted', 'venue'];
  const locationIndex = lowerColumns.findIndex((col) =>
    locationPatterns.some((pattern) => col.includes(pattern))
  );
  if (locationIndex >= 0) mapping.location = columns[locationIndex];

  // Event type detection
  const typePatterns = ['type', 'event type', 'category'];
  const typeIndex = lowerColumns.findIndex((col) =>
    typePatterns.some((pattern) => col.includes(pattern))
  );
  if (typeIndex >= 0) mapping.eventType = columns[typeIndex];

  return mapping;
}

/**
 * Map Spond attendance status to our attendance status
 */
export function mapSpondStatus(spondStatus: string): AttendanceStatus {
  const status = spondStatus.toLowerCase().trim();

  if (status.includes('attending') || status.includes('kommer') || status === 'yes' || status === 'ja') {
    return 'present';
  }
  if (status.includes('not attending') || status.includes('kommer ikke') || status === 'no' || status === 'nei') {
    return 'absent';
  }
  if (status.includes('maybe') || status.includes('kanskje') || status.includes('uncertain')) {
    return 'excused';
  }
  if (status.includes('late') || status.includes('sen')) {
    return 'late';
  }

  // Default to absent if unknown
  return 'absent';
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  try {
    // Try parsing common date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Try Norwegian format (dd.mm.yyyy or dd/mm/yyyy)
    const norwegianMatch = dateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (norwegianMatch) {
      const [, day, month, year] = norwegianMatch;
      const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Determine event type from title or type field
 */
export function detectEventType(title: string, typeField?: string): EventType {
  const text = `${title} ${typeField || ''}`.toLowerCase();

  if (text.includes('kamp') || text.includes('game') || text.includes('match')) {
    return 'game';
  }
  if (text.includes('turnering') || text.includes('tournament') || text.includes('cup')) {
    return 'tournament';
  }
  if (text.includes('møte') || text.includes('meeting')) {
    return 'meeting';
  }
  if (text.includes('trening') || text.includes('practice') || text.includes('training')) {
    return 'practice';
  }

  return 'other';
}

/**
 * Validate import data
 */
export function validateImport(
  data: CSVRow[],
  mapping: ColumnMapping
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const uniquePlayers = new Set<string>();
  const uniqueDates = new Set<string>();
  const statusCounts: Record<string, number> = {};

  // Check required mappings
  if (!mapping.playerName) {
    errors.push('Player name column is required');
  }
  if (!mapping.date) {
    errors.push('Date column is required');
  }
  if (!mapping.status) {
    errors.push('Attendance status column is required');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      warnings,
      errors,
      stats: { totalRows: data.length, uniquePlayers, uniqueDates, statusCounts },
    };
  }

  // Validate each row
  data.forEach((row, index) => {
    const playerName = mapping.playerName ? row[mapping.playerName]?.trim() : '';
    const dateStr = mapping.date ? row[mapping.date]?.trim() : '';
    const status = mapping.status ? row[mapping.status]?.trim() : '';

    if (!playerName) {
      warnings.push(`Row ${index + 1}: Missing player name`);
    } else {
      uniquePlayers.add(playerName);
    }

    if (!dateStr) {
      warnings.push(`Row ${index + 1}: Missing date`);
    } else {
      const parsedDate = parseDate(dateStr);
      if (!parsedDate) {
        warnings.push(`Row ${index + 1}: Invalid date format: ${dateStr}`);
      } else {
        uniqueDates.add(parsedDate.split('T')[0]);
      }
    }

    if (!status) {
      warnings.push(`Row ${index + 1}: Missing status`);
    } else {
      const mappedStatus = mapSpondStatus(status);
      statusCounts[mappedStatus] = (statusCounts[mappedStatus] || 0) + 1;
    }
  });

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    stats: {
      totalRows: data.length,
      uniquePlayers,
      uniqueDates,
      statusCounts,
    },
  };
}

/**
 * Perform the import
 */
export async function performImport(
  data: CSVRow[],
  options: ImportOptions,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    total: data.length,
    processed: 0,
    successful: 0,
    failed: 0,
    warnings: [],
    errors: [],
    completed: false,
    playersCreated: 0,
    eventsCreated: 0,
    attendanceRecordsCreated: 0,
  };

  const { teamId, columnMapping, createMissingPlayers, createMissingEvents, userId } = options;

  // Cache for players and events to avoid duplicate queries
  const playerCache = new Map<string, string>(); // name -> id
  const eventCache = new Map<string, string>(); // date+title -> id

  // Get existing events for this team
  const existingEvents = await getEventsByTeam(teamId);
  existingEvents.forEach((event) => {
    const key = `${event.start_time.split('T')[0]}_${event.title}`;
    eventCache.set(key, event.id);
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    try {
      // Extract data from row
      const playerName = columnMapping.playerName ? row[columnMapping.playerName]?.trim() : '';
      const dateStr = columnMapping.date ? row[columnMapping.date]?.trim() : '';
      const statusStr = columnMapping.status ? row[columnMapping.status]?.trim() : '';
      const eventTitle = columnMapping.eventTitle ? row[columnMapping.eventTitle]?.trim() : 'Imported Event';
      const eventTypeStr = columnMapping.eventType ? row[columnMapping.eventType]?.trim() : '';
      const location = columnMapping.location ? row[columnMapping.location]?.trim() : '';

      if (!playerName || !dateStr || !statusStr) {
        result.warnings.push(`Row ${i + 1}: Skipped due to missing required data`);
        result.processed++;
        continue;
      }

      // Parse date
      const parsedDate = parseDate(dateStr);
      if (!parsedDate) {
        result.warnings.push(`Row ${i + 1}: Invalid date format: ${dateStr}`);
        result.processed++;
        continue;
      }

      // Get or create player
      let playerId = playerCache.get(playerName);
      let isNewPlayer = false;
      if (!playerId) {
        const existingPlayers = await searchPlayers(playerName);
        const exactMatch = existingPlayers.find(
          (p) => p.name.toLowerCase() === playerName.toLowerCase()
        );

        if (exactMatch) {
          playerId = exactMatch.id;
          playerCache.set(playerName, playerId);
        } else if (createMissingPlayers) {
          const newPlayer = await createPlayer({
            name: playerName,
            email: columnMapping.email ? row[columnMapping.email]?.trim() : undefined,
            created_by: userId,
          });
          playerId = newPlayer.id;
          playerCache.set(playerName, playerId);
          isNewPlayer = true;
          result.playersCreated++;
        } else {
          result.warnings.push(`Row ${i + 1}: Player "${playerName}" not found, skipping`);
          result.processed++;
          continue;
        }
      }

      // Ensure player is added to team (for both new and existing players without membership)
      try {
        const existingMembership = await getTeamMembership(playerId, teamId);
        if (!existingMembership) {
          await addPlayerToTeam({
            player_id: playerId,
            team_id: teamId,
            role: 'player',
          });
          if (!isNewPlayer) {
            result.warnings.push(`Row ${i + 1}: Added existing player "${playerName}" to team`);
          }
        }
      } catch (error) {
        // Log error but continue - attendance can still be recorded
        console.error(`Error adding player ${playerName} to team:`, error);
      }

      // Get or create event
      const eventDate = parsedDate.split('T')[0];
      const eventKey = `${eventDate}_${eventTitle}`;
      let eventId = eventCache.get(eventKey);

      if (!eventId) {
        if (createMissingEvents) {
          const eventType = detectEventType(eventTitle, eventTypeStr);
          const startTime = `${eventDate}T18:00:00.000Z`; // Default to 6 PM
          const endTime = `${eventDate}T20:00:00.000Z`; // Default 2-hour duration

          const newEvent = await createEvent({
            team_id: teamId,
            type: eventType,
            title: eventTitle,
            start_time: startTime,
            end_time: endTime,
            location: location || undefined,
            created_by: userId,
          });
          eventId = newEvent.id;
          eventCache.set(eventKey, eventId);
          result.eventsCreated++;
        } else {
          result.warnings.push(
            `Row ${i + 1}: Event "${eventTitle}" on ${eventDate} not found, skipping`
          );
          result.processed++;
          continue;
        }
      }

      // Create attendance record
      const attendanceStatus = mapSpondStatus(statusStr);
      await markAttendance({
        event_id: eventId,
        player_id: playerId,
        status: attendanceStatus,
        recorded_by: userId,
      });

      result.attendanceRecordsCreated++;
      result.successful++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Row ${i + 1}: ${errorMsg}`);
      result.failed++;
    }

    result.processed++;

    // Report progress
    if (onProgress) {
      onProgress({ ...result });
    }
  }

  result.completed = true;
  return result;
}
