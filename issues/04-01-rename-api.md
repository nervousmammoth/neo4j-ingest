# Task 4.1: Implement /api/s3/rename

## Description
Create the backend logic for renaming files (Copy + Delete).

## Requirements
- Endpoint: `POST /api/s3/rename`.
- Body: `{ sourceKey, destinationKey }`.
- Execute `CopyObject` then `DeleteObject`.
- Handle errors (e.g., if copy fails, don't delete).

## Acceptance Criteria
- [ ] Renaming a file in the API results in the new key existing and old key removed.
- [ ] Metadata is preserved (if possible/required).
