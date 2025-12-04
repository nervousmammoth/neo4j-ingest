import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>S3 CSV Ingest</CardTitle>
          <CardDescription>
            High-performance CSV migration and management suite for S3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag and drop files to upload, or use the sidebar to browse your S3 bucket.
          </p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  )
}
