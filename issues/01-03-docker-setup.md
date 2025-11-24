# Task 1.3: Create Dockerfile and docker-compose.yml

## Description
Create a multi-stage Dockerfile for the Next.js application and a `docker-compose.yml` for local orchestration.

## Requirements
- Multi-stage Dockerfile (builder vs runner) to optimize image size.
- `docker-compose.yml` to run the container.
- Ensure it works with the planned Caddy proxy (next task).

## Acceptance Criteria
- [ ] Docker build succeeds.
- [ ] Docker container runs and serves the application.
- [ ] Image size is optimized (using standalone output).
