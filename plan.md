# Technical Design Document: S3 CSV Ingest & Management Suite

## 1. Executive Summary
We are building a unified web interface to facilitate the migration and management of massive datasets (CSV files) from local network shares to an S3 Object Storage bucket.

The solution consists of a single Next.js application with two distinct functional modes:
1.  **Ingest Mode:** A high-performance drag-and-drop interface for uploading files from local/network mounts to S3.
2.  **Manager Mode:** A file-explorer-style interface (based on *shadcn/ui Sidebar-11*) to view, organize, rename, and preview the uploaded data.

## 2. Architecture Overview

### 2.1 High-Level Stack
*   **Frontend:** Next.js 14+ (App Router), React, TypeScript.
*   **UI Framework:** Tailwind CSS, shadcn/ui (specifically `sidebar-11` layout).
*   **State Management:** React Query (TanStack Query) for caching S3 listings.
*   **Upload Engine:** Uppy.io (Client-side orchestration for multi-file uploads).
*   **Backend:** Next.js Server Actions / API Routes.
*   **Storage:** AWS S3 (or S3-compatible on-prem storage).
*   **Infrastructure:** Ubuntu VM (provisioned via VMware Aria Automation), Docker Container, Caddy Reverse Proxy.

### 2.2 Data Flow
1.  **User** drags files from OS File Explorer (Network Share) $\rightarrow$ **Browser**.
2.  **Browser** requests Presigned Upload URL $\rightarrow$ **Next.js API**.
3.  **Next.js API** generates secure temporary URL $\rightarrow$ **Browser**.
4.  **Browser** uploads file binary directly $\rightarrow$ **S3 Bucket** (Bypassing the VM web server).
5.  **S3** confirms storage.

---

## 3. Functional Requirements

### 3.1 App 1: The Ingest (Upload)
*   **Source:** User drags files/folders from a mapped network drive into the browser window.
*   **Capabilities:**
    *   Support for selecting 10,000+ files simultaneously.
    *   Support for dragging entire folder structures (recursive folder upload).
    *   Visual queue management (Pause, Resume, Retry).
    *   **Status Bar:** Global progress bar floating at the bottom or top right.
*   **Technical Constraint:** Uploads must utilize **S3 Multipart Uploads** via Presigned URLs to prevent timeouts on the web server.

### 3.2 App 2: The Manager (Explorer)
*   **Layout:** Based strictly on `shadcn/ui Sidebar-11`.
*   **Sidebar (Tree View):**
    *   Must render S3 `Prefixes` (virtual folders) as a collapsible directory tree.
    *   **Lazy Loading:** To handle huge file counts, the tree must only fetch sub-folders when a parent folder is expanded (using S3 `Delimiter` API).
*   **Main Content (Grid/List):**
    *   Display files within the selected folder.
    *   Columns: Name, Size, Last Modified, Type.
*   **Actions:**
    *   **Rename:** Since S3 is immutable, this triggers a backend `CopyObject` (new name) + `DeleteObject` (old name) sequence.
    *   **Move:** Drag-and-drop files between folders in the tree (triggers Copy + Delete).
    *   **Delete:** Remove files or folders (recursive delete for folders).
*   **Preview:**
    *   Clicking a CSV file opens a "Sheet" (Slide-over) showing the first 50 rows of the CSV in a table format.

---

## 4. Technical Specifications

### 4.1 API Routes (Next.js)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/s3/list` | Query params: `prefix`. Returns JSON of folders and files for the tree/grid. |
| `POST` | `/api/s3/sign` | Generates a Presigned PUT URL for Uppy.io uploads. |
| `POST` | `/api/s3/rename` | Body: `{ sourceKey, destinationKey }`. performs Copy+Delete. |
| `POST` | `/api/s3/delete` | Body: `{ keys: [] }`. Deletes one or multiple objects. |
| `GET` | `/api/s3/preview` | Query params: `key`. Streams the first $N$ bytes of a file to parse CSV head. |

### 4.2 Dependencies & Libraries
*   `aws-sdk/client-s3`: For all bucket interactions.
*   `@uppy/core`, `@uppy/react`, `@uppy/aws-s3`: For the upload engine.
*   `papaparse`: For parsing the CSV preview on the client side.
*   `lucide-react`: Icons for file types and UI elements.
*   `zod`: For API input validation.

---

## 5. Infrastructure & Deployment Plan

### 5.1 Environment
*   **Platform:** VMware Aria Automation.
*   **OS:** Ubuntu 22.04 LTS.
*   **Compute:** Minimum 2 vCPU, 4GB RAM (Node.js build process requires RAM).

### 5.2 Docker Configuration
We will use a multi-stage Dockerfile to keep the image small.

```dockerfile
# Conceptual Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
CMD ["node", "server.js"]
```

### 5.3 Caddy Proxy Configuration
Caddy will serve as the entry point, handling SSL termination and forwarding to the Docker container.

**Caddyfile:**
```text
csv-manager.corp.local {
    reverse_proxy localhost:3000
    
    # Optional: Increase timeouts for long-running API calls (though uploads bypass this)
    transport http {
        read_timeout 300s
    }
}
```

---

## 6. UI Design & Theme
*   **Theme:** Dark Mode (Default).
*   **Sidebar Component:**
    *   **Top:** "Upload" and "Browse" toggle buttons.
    *   **Middle:** Collapsible File Tree (The S3 Bucket structure).
    *   **Bottom:** User Profile / Settings (if auth is required).
*   **Feedback:**
    *   Use `sonner` or `toast` for notifications (e.g., "File Renamed Successfully", "Upload Complete").

---

## 7. Implementation Roadmap (Issue Creation Guide)

Use this list to create your Jira tickets or GitHub Issues.

### Phase 1: Project Skeleton & Infra
- [ ] **Task 1.1:** Initialize Next.js project with TypeScript & Tailwind.
- [ ] **Task 1.2:** Install `shadcn/ui` and add `sidebar`, `button`, `card`, `table`, `sheet`.
- [ ] **Task 1.3:** Create Dockerfile and docker-compose.yml.
- [ ] **Task 1.4:** Setup basic Caddyfile for local testing.

### Phase 2: The Read Layer (Browser)
- [ ] **Task 2.1:** Implement AWS S3 Client Singleton.
- [ ] **Task 2.2:** Create `/api/s3/list` endpoint with support for `Delimiter` (folders).
- [ ] **Task 2.3:** Build the Recursive Sidebar Tree component (Lazy loading data).
- [ ] **Task 2.4:** Build the File Grid component (Display contents of selected folder).

### Phase 3: The Write Layer (Upload)
- [ ] **Task 3.1:** Setup Uppy.io instance in a dedicated Upload View.
- [ ] **Task 3.2:** Create `/api/s3/sign` endpoint for Presigned URLs.
- [ ] **Task 3.3:** Integrate drag-and-drop zone.
- [ ] **Task 3.4:** Test uploading 1GB+ of data (simulating network share source).

### Phase 4: Management & Manipulation
- [ ] **Task 4.1:** Implement `/api/s3/rename` (Copy + Delete logic).
- [ ] **Task 4.2:** UI: Add "Right Click" Context Menu to files (Rename, Delete).
- [ ] **Task 4.3:** Implement CSV Preview Sheet (using Papaparse on a byte stream).

### Phase 5: Production Deployment
- [ ] **Task 5.1:** Create VMware Aria Blueprint (Cloud-init scripts for Docker/Caddy).
- [ ] **Task 5.2:** Configure persistent Environment Variables (AWS_ACCESS_KEY, BUCKET_NAME).
- [ ] **Task 5.3:** Perform Load Test (10k files list view performance).

---

## 8. Security Considerations
1.  **CORS:** The S3 Bucket must be configured to allow `PUT` and `POST` requests from the domain `csv-manager.corp.local`.
2.  **Credentials:** AWS Credentials must **never** be exposed to the client. Only the server signs the URLs.
3.  **Sanitization:** File names must be sanitized before upload to prevent S3 key encoding issues (e.g., removing special characters or emojis).