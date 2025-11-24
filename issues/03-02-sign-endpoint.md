# Task 3.2: Create /api/s3/sign endpoint

## Description
Implement the backend endpoint to generate presigned URLs for Uppy.

## Requirements
- Endpoint: `POST /api/s3/sign`.
- Use `aws-sdk/client-s3` `createPresignedPost` or `getSignedUrl` (PutObject).
- Secure the endpoint (validate input).

## Acceptance Criteria
- [ ] Endpoint returns a valid presigned URL/fields.
- [ ] Uppy can successfully request a signature.
