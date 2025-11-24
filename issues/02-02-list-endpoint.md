# Task 2.2: Create /api/s3/list endpoint

## Description
Develop the API route to list objects in the S3 bucket.

## Requirements
- Endpoint: `GET /api/s3/list`.
- Query Params: `prefix` (for folder navigation).
- Use `Delimiter` to support folder structure (virtual folders).
- Return JSON structure compatible with the frontend tree/grid.

## Acceptance Criteria
- [ ] API returns list of files and "folders" (prefixes) for a given prefix.
- [ ] Handles empty buckets gracefully.
- [ ] Error handling for S3 connectivity issues.
