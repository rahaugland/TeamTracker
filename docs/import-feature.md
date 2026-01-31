# CSV Import Feature Documentation

## Overview

The CSV Import feature allows coaches to import attendance data from Spond (or other team management systems) into TeamTracker. This is particularly useful for migrating historical attendance data when transitioning from Spond to TeamTracker.

## User Flow

The import process consists of 5 steps:

1. **Upload**: Select team and upload CSV file
2. **Map Columns**: Map CSV columns to TeamTracker fields
3. **Preview**: Review import summary and configure options
4. **Import**: Watch real-time progress as data is imported
5. **Complete**: Review results and optionally import another file

## Features

### Step 1: Upload
- Team selection dropdown
- Drag-and-drop file upload
- File size validation
- CSV format validation
- Guidance on exporting from Spond

### Step 2: Map Columns
- Auto-detection of common Spond column names
- Manual column mapping with dropdowns
- Required vs optional field indicators
- Live preview of first 5-10 rows
- Support for multiple languages (Norwegian/English patterns)

### Step 3: Preview & Review
- Summary statistics:
  - Total records
  - Unique players
  - Unique events/dates
  - Attendance status breakdown
- Validation warnings and errors
- Import options:
  - Create missing players automatically
  - Create missing events automatically

### Step 4: Import Progress
- Real-time progress bar
- Success/failure counters
- Detailed error/warning logs
- Summary of created records:
  - Players created
  - Events created
  - Attendance records created

### Step 5: Complete
- Final summary
- Option to import another file
- Link to view schedule

## Supported CSV Fields

### Required Fields
- **Player Name**: Name of the player
- **Date**: Event date
- **Status**: Attendance status (present/absent/late/excused)

### Optional Fields
- **Email**: Player email address
- **Event Title**: Name of the event
- **Event Type**: Type of event (practice/game/tournament/meeting)
- **Location**: Event location

## Status Mapping

The import service automatically maps Spond statuses to TeamTracker statuses:

| Spond Status | TeamTracker Status |
|--------------|-------------------|
| "Attending", "Kommer", "Yes", "Ja" | Present |
| "Not attending", "Kommer ikke", "No", "Nei" | Absent |
| "Maybe", "Kanskje", "Uncertain" | Excused |
| "Late", "Sen" | Late |

## Date Format Support

The import service supports multiple date formats:
- ISO format: `2024-01-15T10:00:00`
- Norwegian format: `15.01.2024` or `15/01/2024`
- US format: `01/15/2024`
- Standard formats recognized by JavaScript Date parser

## Event Type Detection

If event type is not explicitly provided, it's auto-detected from the event title:
- Keywords "kamp", "game", "match" → Game
- Keywords "turnering", "tournament", "cup" → Tournament
- Keywords "møte", "meeting" → Meeting
- Keywords "trening", "practice", "training" → Practice
- Default → Other

## Error Handling

The import process handles various error scenarios:
- Invalid CSV format
- Missing required columns
- Invalid date formats
- Duplicate records (updates existing)
- Missing players (creates if option enabled)
- Missing events (creates if option enabled)

All errors and warnings are logged and displayed to the user.

## Files Created

### Services
- `src/services/import.service.ts` - Core import logic

### Components
- `src/components/import/FileUploader.tsx` - File upload component
- `src/components/import/ColumnMapper.tsx` - Column mapping interface
- `src/components/import/ImportPreview.tsx` - Review and options
- `src/components/import/ImportProgress.tsx` - Progress tracking

### Pages
- `src/pages/ImportPage.tsx` - Main import wizard

### UI Components
- `src/components/ui/progress.tsx` - Progress bar component

### Translations
- Added `import.*` keys to both English and Norwegian translation files
- Added `navigation.import` to both languages

## Installation

The feature requires the `papaparse` library for CSV parsing:

```bash
npm install papaparse @types/papaparse
```

Or with pnpm:

```bash
pnpm install papaparse @types/papaparse
```

## Usage

1. Navigate to `/import` (available in coach navigation menu)
2. Select the team to import data for
3. Upload a CSV file from Spond
4. Review and adjust column mappings
5. Configure import options
6. Start the import
7. Review results

## API Integration

The import service uses existing TeamTracker services:
- `players.service.ts` - Creating/searching players
- `events.service.ts` - Creating/fetching events
- `attendance.service.ts` - Creating attendance records

All imports are associated with the authenticated user and selected team.

## Permissions

The import feature is only available to coaches (head_coach and assistant_coach roles). The navigation item is conditionally rendered based on the user's role.

## Future Enhancements

Potential improvements:
- Export functionality (reverse operation)
- Scheduled imports
- Import templates
- Bulk player updates
- Custom field mapping presets
- Import history/audit log
