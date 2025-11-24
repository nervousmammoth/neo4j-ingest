# Task 4.3: Implement CSV Preview Sheet

## Description
Implement a preview mechanism for CSV files using a slide-over sheet.

## Requirements
- Endpoint: `/api/s3/preview` (streams first N bytes).
- Frontend: Use `papaparse` to parse the chunk.
- Display first 50 rows in a table.

## Acceptance Criteria
- [ ] Clicking a CSV opens the sheet.
- [ ] Data is fetched and parsed correctly.
- [ ] Preview shows the first 50 rows.
