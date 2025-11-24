# Task 2.1: Implement AWS S3 Client Singleton

## Description
Create a singleton instance of the AWS S3 Client to be used across API routes.

## Requirements
- Use `aws-sdk/client-s3`.
- Configure with region and credentials (from env vars).
- Ensure only one instance is created in development (to avoid hot-reload memory leaks).

## Acceptance Criteria
- [ ] S3 Client is exported from a shared utility file (e.g., `lib/s3.ts`).
- [ ] Basic connectivity test (can list buckets or similar) passes.
