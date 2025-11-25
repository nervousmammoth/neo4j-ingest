# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an S3 CSV Ingest & Management Suite - a Next.js application that enables migration and management of massive CSV datasets from local network shares to S3 Object Storage. The application has two distinct modes:

1. **Ingest Mode**: High-performance drag-and-drop interface for uploading files to S3
2. **Manager Mode**: File-explorer interface to view, organize, rename, and preview uploaded data

## Tech Stack (Current Versions)

- **Frontend**: Next.js 15.5, React 19.2, TypeScript, Tailwind CSS
- **UI Framework**: shadcn/ui (specifically sidebar-11 layout)
- **State Management**: TanStack Query v5 (formerly React Query) for caching S3 listings
- **Upload Engine**: Uppy.io v5 for multi-file uploads
- **Backend**: Next.js Server Actions / API Routes
- **Storage (Production)**: VMware Aria Automation S3 via `@aws-sdk/client-s3` v3
- **Storage (Development)**: MinIO (S3-compatible) via `@aws-sdk/client-s3` v3
- **Infrastructure**: Docker Container with Caddy Reverse Proxy

## Key Dependencies

- `@aws-sdk/client-s3` - All S3 bucket interactions (v3 SDK)
- `@uppy/core`, `@uppy/react`, `@uppy/aws-s3` - Upload engine (v5)
- `papaparse` - CSV parsing for preview functionality
- `lucide-react` - Icons
- `zod` - API input validation
- `@tanstack/react-query` - Server state management

## Architecture

### Data Flow
1. User drags files from OS/network share → Browser
2. Browser requests presigned upload URL → Next.js API
3. Next.js API generates secure temporary URL → Browser
4. Browser uploads directly → S3 (bypassing web server for performance)
5. S3 confirms storage

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/s3/list` | GET | Returns folders and files for tree/grid (query param: `prefix`) |
| `/api/s3/sign` | POST | Generates presigned PUT URL for Uppy uploads |
| `/api/s3/rename` | POST | Performs Copy+Delete (body: `{ sourceKey, destinationKey }`) |
| `/api/s3/delete` | POST | Deletes objects (body: `{ keys: [] }`) |
| `/api/s3/preview` | GET | Streams first N bytes for CSV preview (query param: `key`) |

## Development vs Production Environments

This project uses **MinIO** for local development and **VMware Aria Automation S3** for production. Both are S3-compatible, allowing the same code to work in both environments with only configuration changes.

### Why MinIO for Development?
- **S3 API Compatible**: Uses identical AWS SDK calls - zero code changes between environments
- **Lightweight**: Runs in Docker Compose on developer machines
- **No Production Dependencies**: Test without access to corporate infrastructure
- **Free & Open Source**: No licensing costs

### Environment Translation

| Aspect | Development (MinIO) | Production (VMware Aria S3) |
|--------|---------------------|----------------------------|
| **Endpoint** | `http://localhost:9000` or `http://minio:9000` | `https://s3.corp.local` (your endpoint) |
| **Access** | `minioadmin` (default) | Corporate IAM credentials |
| **Region** | `us-east-1` (any valid) | Your on-prem region |
| **Path Style** | Required (`S3_FORCE_PATH_STYLE=true`) | Not required (omit or false) |
| **SDK Code** | Identical | Identical |
| **Bucket Operations** | Same API calls | Same API calls |
| **Console UI** | http://localhost:9001 | VMware Aria Console |

### Key Configuration Difference

The S3 client in `lib/s3.ts` must conditionally set the endpoint:

```typescript
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  // Only set endpoint for MinIO (development)
  ...(process.env.AWS_ENDPOINT_URL && {
    endpoint: process.env.AWS_ENDPOINT_URL,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  }),
});
```

## Critical Implementation Details

### S3 Client Singleton
- Must be implemented in `lib/s3.ts`
- Singleton pattern to avoid hot-reload memory leaks in development
- Configure with credentials from environment variables

### Sidebar Tree Component
- Must support lazy loading of S3 prefixes (virtual folders)
- Only fetch sub-folders when parent is expanded
- Use S3 `ListObjectsV2` with `Delimiter` parameter for efficient folder queries
- Based on shadcn/ui Sidebar-11 layout

### Upload Constraints
- Must use S3 Multipart Uploads via presigned URLs to prevent web server timeouts
- Support selecting 10,000+ files simultaneously
- Support recursive folder upload (entire directory trees)
- Visual queue management (Pause, Resume, Retry)
- Global progress indicator (floating status bar)

### File Operations
Since S3 is immutable, all file operations require workarounds:
- **Rename**: `CopyObject` (new key) → `DeleteObject` (old key)
- **Move**: `CopyObject` (new prefix) → `DeleteObject` (old key)
- **Delete**: `DeleteObject` (recursive deletion for folders)

### CSV Preview
- Click CSV file → Sheet (slide-over) component opens
- Display first 50 rows in table format
- Use Papaparse to parse byte stream from partial S3 object fetch

## Environment Variables

### Development (MinIO)
Create a `.env.local` file:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT_URL=http://localhost:9000
S3_BUCKET_NAME=csv-ingest
S3_FORCE_PATH_STYLE=true
```

### Production (VMware Aria S3)
Set in Docker secrets or `.env.production`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<corporate-iam-access-key>
AWS_SECRET_ACCESS_KEY=<corporate-iam-secret-key>
AWS_ENDPOINT_URL=https://s3.corp.local
S3_BUCKET_NAME=<production-bucket-name>
# S3_FORCE_PATH_STYLE is not needed (omit or set to false)
```

### Required Variables
- `AWS_ACCESS_KEY_ID` - S3 access key
- `AWS_SECRET_ACCESS_KEY` - S3 secret key
- `AWS_REGION` - S3 region (e.g., `us-east-1`)
- `S3_BUCKET_NAME` - Target bucket name
- `AWS_ENDPOINT_URL` - S3 endpoint (for MinIO or VMware Aria S3)
- `S3_FORCE_PATH_STYLE` - Set to `true` for MinIO, `false` or omit for production

## Docker Configuration

### Multi-stage Dockerfile
1. **Builder stage**: Node.js 18+ alpine, `npm ci` + `npm run build`
2. **Runner stage**: Copy `.next/standalone`, run with `node server.js`

### Docker Compose for Development
Use `docker-compose.yml` with MinIO for local development:

```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"  # S3 API
      - "9001:9001"  # Web Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  app:
    build: .
    container_name: csv-ingest-app
    ports:
      - "3000:3000"
    environment:
      AWS_REGION: us-east-1
      AWS_ACCESS_KEY_ID: minioadmin
      AWS_SECRET_ACCESS_KEY: minioadmin
      AWS_ENDPOINT_URL: http://minio:9000
      S3_BUCKET_NAME: csv-ingest
      S3_FORCE_PATH_STYLE: "true"
    depends_on:
      - minio

volumes:
  minio_data:
```

### Next.js Configuration
Must enable standalone output mode in `next.config.js`:
```js
module.exports = {
  output: 'standalone',
}
```

## Security Requirements

1. **CORS**: S3 bucket must allow `PUT` and `POST` from application domain
2. **Credential Safety**: AWS credentials never exposed to client - server-side presigned URL generation only
3. **Input Sanitization**: File names must be sanitized before upload (remove special characters/emojis to prevent S3 key encoding issues)

## Development Workflow

The project follows a phased implementation approach documented in `/issues/`:
- **Phase 1**: Project skeleton & infrastructure (Next.js setup, shadcn/ui, Docker)
- **Phase 2**: Read layer (S3 client, list endpoint, sidebar tree, file grid)
- **Phase 3**: Write layer (Uppy setup, presigned URLs, drag-and-drop)
- **Phase 4**: Management & manipulation (rename, delete, CSV preview)
- **Phase 5**: Production deployment (VMware Aria, environment variables, load testing)

## UI/UX Requirements

- **Theme**: Dark mode by default
- **Notifications**: Use `sonner` or `toast` for user feedback
- **Sidebar Layout** (shadcn/ui Sidebar-11):
  - Top: "Upload" and "Browse" toggle buttons
  - Middle: Collapsible file tree (S3 bucket structure with lazy loading)
  - Bottom: User profile/settings (if auth required)
- **Performance**: Must handle displaying 10,000+ files efficiently
  - Use virtualization for large lists
  - Implement pagination or infinite scroll
  - Lazy load folder contents

## Common Commands

### Local Development (Next.js only)
- `npm run dev` - Start development server (requires MinIO running separately)
- `npm run build` - Build for production
- `npm run start` - Start production server

### Docker Compose (Next.js + MinIO)
- `docker-compose up -d` - Start all services in background
- `docker-compose up` - Start all services with logs
- `docker-compose down` - Stop all services
- `docker-compose down -v` - Stop services and remove volumes (deletes MinIO data)
- `docker-compose logs -f app` - Follow application logs
- `docker-compose logs -f minio` - Follow MinIO logs
- `docker-compose restart app` - Restart application only

### MinIO Management
- **Web Console**: http://localhost:9001 (user: `minioadmin`, password: `minioadmin`)
- **Create Bucket**: Use MinIO Console or AWS CLI:
  ```bash
  aws --endpoint-url http://localhost:9000 s3 mb s3://csv-ingest
  ```
- **List Objects**:
  ```bash
  aws --endpoint-url http://localhost:9000 s3 ls s3://csv-ingest
  ```

### Docker Build
- `docker build -t s3-csv-ingest .` - Build Docker image
- `docker run -p 3000:3000 s3-csv-ingest` - Run container

## Deployment

- **Platform**: VMware Aria Automation (Ubuntu 22.04 LTS)
- **Compute**: Minimum 2 vCPU, 4GB RAM (Node.js build requires RAM)
- **Reverse Proxy**: Caddy with SSL termination
- **Domain**: `csv-manager.corp.local` (internal corporate domain)

### Caddy Configuration
```caddyfile
csv-manager.corp.local {
    reverse_proxy localhost:3000

    transport http {
        read_timeout 300s
    }
}
```

## Performance Considerations

1. **S3 List Operations**: Use `Delimiter` and `Prefix` parameters to avoid fetching entire bucket contents
2. **React Query Caching**: Cache S3 listings aggressively with appropriate stale times
3. **Upload Parallelization**: Uppy.io handles concurrent uploads - configure reasonable limits
4. **Presigned URL Expiration**: Balance between security (short expiry) and UX (long enough for large uploads)

## Sources

- [Next.js 15.5 Release](https://nextjs.org/blog/next-15-5)
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2)
- [Uppy 5.0 Announcement](https://uppy.io/blog/uppy-5.0/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
