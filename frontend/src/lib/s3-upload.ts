import axios from "axios";
import { apiPost } from "@/lib/api";

interface PresignedUpload {
  s3_key: string;
  upload: { url: string; fields: Record<string, string> };
}

/**
 * Requests a presigned upload from our API, then PUTs the file straight to S3
 * (never through our backend). `presignPath` is the endpoint that returns the
 * presigned POST — e.g. `/v1/courses/1/outline` or `/v1/lessons/5/attachment`.
 */
export async function uploadFileViaPresignedPost(presignPath: string, file: File): Promise<void> {
  const presigned = await apiPost<PresignedUpload>(presignPath, { content_type: file.type || "application/pdf" });

  const formData = new FormData();
  for (const [key, value] of Object.entries(presigned.upload.fields)) {
    formData.append(key, value);
  }
  formData.append("file", file);

  // Plain axios (not our `api` instance) — this goes straight to S3, not our API,
  // so it must not carry the Authorization header our request interceptor adds.
  await axios.post(presigned.upload.url, formData);
}
