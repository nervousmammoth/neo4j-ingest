# Task 3.3: Integrate drag-and-drop zone

## Description
Connect the Uppy instance with the S3 signing endpoint and finalize the drag-and-drop UI.

## Requirements
- Configure Uppy to use the `/api/s3/sign` endpoint.
- Enable multipart uploads if necessary (or standard PUT for smaller files, but plan mentions multipart for reliability).
- Support recursive folder uploads if possible (browser limitations apply, but Uppy handles some).

## Acceptance Criteria
- [ ] Dragging a file initiates upload to S3.
- [ ] Progress bar works.
- [ ] File appears in S3 after upload.
