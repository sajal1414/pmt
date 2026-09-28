import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bold,
  BookOpen,
  CheckCircle2,
  Code,
  Columns2,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  PenLine,
  Quote,
  Sparkles,
  SquarePlay,
  Strikethrough,
  Table,
  Trash2,
  Upload,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContentViewerDialog } from "@/components/shared/content-viewer-dialog";
import { MarkdownArticle } from "@/components/shared/markdown-article";
import { resolveViewerKind } from "@/components/shared/media-viewer";
import { useUpdateLesson } from "@/hooks/use-course-mutations";
import { apiGet, getErrorMessage } from "@/lib/api";
import { uploadFileViaPresignedPost } from "@/lib/s3-upload";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

type Mode = "link" | "upload" | "article";
type ArticleView = "write" | "split" | "preview";

const UPLOAD_ACCEPT = "application/pdf,video/mp4,video/webm,video/quicktime,video/ogg";

const ARTICLE_TEMPLATES = [
  {
    id: "tech_lesson",
    title: "Enterprise Technical Lesson",
    desc: "Objectives, architecture blueprint, code snippet, verification checklist, and summary.",
    content: `# Enterprise Architecture & Implementation Guide

> **Core Objective**: Master enterprise system design patterns, resilient error handling, and production deployment protocols.

---

## 1. Learning Goals & Prerequisites
By completing this lesson, engineers will be able to:
- Design fault-tolerant distributed pipelines adhering to zero-data-loss SLAs.
- Implement idempotency keys and exponential backoff retry policies.
- Audit end-to-end telemetry across microservices.

**Prerequisites**: Familiarity with containerized infrastructure and relational schema modeling.

---

## 2. Architecture & Component Interaction
The system coordinates ingestion, transformation, and ledger persistence across decoupled boundaries:

| Tier | Component | Core Responsibility | Resilience Policy |
|---|---|---|---|
| **Edge** | Ingestion Gateway | Auth token validation & stream buffering | Rate-limiting + dead-letter queue |
| **Worker** | Transformation Engine | Enrichment, schema mapping & normalization | At-least-once distributed processing |
| **Catalog** | Ledger Database | ACID transaction persistence & audit trails | Multi-region replica failover |

---

## 3. Hands-on Implementation
The snippet below illustrates production client execution with telemetry validation:

\`\`\`python
import time
import logging

logger = logging.getLogger("enterprise.pipeline")

def execute_pipeline_task(task_id: str, payload: dict) -> dict:
    """Executes validated batch processing with structured telemetry."""
    logger.info("Executing task %s with schema version %s", task_id, payload.get("version", "v1"))
    start_time = time.perf_counter()
    
    # Process records
    items = payload.get("items", [])
    valid_count = sum(1 for item in items if item.get("status") == "verified")
    
    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info("Task %s completed: %d valid items in %.2f ms", task_id, valid_count, duration_ms)
    return {
        "task_id": task_id,
        "processed": len(items),
        "valid": valid_count,
        "duration_ms": round(duration_ms, 2),
    }
\`\`\`

---

## 4. Production Verification Checklist
Before promoting code through the delivery pipeline:
- [ ] Ensure all environment secrets are mapped to the KMS vault.
- [ ] Verify database migration dry-runs pass on staging.
- [ ] Confirm p99 latency SLA satisfies < 120ms requirement.
- [ ] Review access policy audits in the compliance log.

---

## 5. Key Takeaways & Best Practices
1. **Decouple Ingestion**: Never combine synchronous API gateways with compute-heavy pipelines.
2. **Defensive Processing**: Always enforce idempotency keys on mutating endpoints.
3. **Observability First**: Emit structured logs and metrics at every trust boundary.
`,
  },
  {
    id: "lab_exercise",
    title: "Hands-on Lab Exercise",
    desc: "Guided step-by-step practical lab with commands, configs, and validation checkpoints.",
    content: `# Hands-on Lab: Enterprise Pipeline Deployment

> **Estimated Time**: 35 minutes  
> **Environment**: Sandbox Cluster v2.4

---

### Phase 1: Environment Provisioning
Initialize your isolated tenant workspace using the platform CLI:

\`\`\`bash
# Authenticate and set workspace context
atlas auth login --tenant enterprise-sandbox
atlas workspace switch --env dev-staging

# Verify system health
atlas status --verbose
\`\`\`

---

### Phase 2: Configuration Setup
Create \`pipeline-config.yaml\` in your workspace directory:

\`\`\`yaml
version: "2.1"
service:
  name: "data-enrichment-worker"
  replicas: 2
  resources:
    limits:
      cpu: "2000m"
      memory: "4Gi"
telemetry:
  metrics_port: 9090
  tracing_sample_rate: 0.1
\`\`\`

---

### Phase 3: Execution & Verification
Deploy the configuration manifest and monitor pod bootstrap:

\`\`\`bash
atlas apply -f pipeline-config.yaml
atlas pods list --watch
\`\`\`

#### Verification Checkpoints
- [ ] Service status transitions to \`Running\`
- [ ] Health check endpoint \`/healthz\` returns HTTP 200
- [ ] Real-time telemetry metrics appear in the Grafana dashboard

---

### Common Troubleshooting Steps
- **CrashLoopBackOff**: Check IAM role bindings for the worker service account.
- **Port Conflict**: Verify no legacy background processes are holding port 9090.
`,
  },
  {
    id: "concept_deepdive",
    title: "Deep-Dive Concept Brief",
    desc: "Theoretical foundations, trade-off matrix, and architectural best practices.",
    content: `# Deep-Dive: Distributed Consensus & State Consistency

## Executive Summary
In distributed enterprise architectures, maintaining consistent state across independent nodes requires balancing throughput against network partition tolerance (CAP theorem). This brief analyzes operational trade-offs of Raft consensus vs. eventual consistency models.

---

## Trade-off Analysis Matrix

| Metric / Dimension | Strong Consistency (Raft) | Eventual Consistency (CRDT) |
|---|---|---|
| **Write Latency** | Higher (Requires Quorum ACK) | Sub-millisecond (Local Write) |
| **Partition Tolerance** | Read-only during majority partition | High availability throughout |
| **Operational Complexity** | Medium (Leader election protocol) | High (Conflict resolution logic) |
| **Best Used For** | Financial balances, metadata catalogs | Social feeds, caching, metrics |

---

## Key Principles & Best Practices
1. **Quorum Sizing**: Always deploy odd node counts (3 or 5) to avoid split-brain deadlock.
2. **Heartbeat Tuning**: Set election timeouts to at least 3x the round-trip network latency.
3. **Snapshotting**: Truncate log files at scheduled intervals to prevent disk exhaustion.
`,
  },
];

export function LessonAttachmentDialog({
  lesson,
  courseId,
  open,
  onOpenChange,
}: {
  lesson: Lesson | null;
  courseId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateLesson = useUpdateLesson(courseId);
  const [mode, setMode] = useState<Mode>("link");
  const [articleView, setArticleView] = useState<ArticleView>("split");
  const [linkValue, setLinkValue] = useState(lesson?.attachment_url ?? "");
  const [articleValue, setArticleValue] = useState(lesson?.description ?? "");
  const [clearAttachmentOnArticle, setClearAttachmentOnArticle] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<{ url: string | null; contentType: string | null; article?: string | null } | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when lesson or open state changes
  useEffect(() => {
    if (lesson && open) {
      setLinkValue(lesson.attachment_url ?? "");
      setArticleValue(lesson.description ?? "");
      setFile(null);

      // Smart default tab selection
      if (lesson.description?.trim() && !lesson.attachment_url && !lesson.attachment_s3_key) {
        setMode("article");
      } else if (lesson.attachment_s3_key) {
        setMode("upload");
      } else if (lesson.attachment_url) {
        setMode("link");
      } else {
        // Default new lesson without attachment to article writer
        setMode("article");
      }
    }
  }, [lesson, open]);

  if (!lesson) return null;

  // Insert markdown helpers
  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setArticleValue((prev) => prev + before + placeholder + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = articleValue.substring(start, end);
    const content = selected || placeholder;
    const nextVal = articleValue.substring(0, start) + before + content + after + articleValue.substring(end);

    setArticleValue(nextVal);

    setTimeout(() => {
      textarea.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + content.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = articleValue.substring(start, end);

    if (selected.includes("\n")) {
      const lines = selected.split("\n").map((line) => `${prefix}${line}`).join("\n");
      const nextVal = articleValue.substring(0, start) + lines + articleValue.substring(end);
      setArticleValue(nextVal);
    } else {
      insertText(`\n${prefix}`, "", "Item text");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertText("**", "**", "bold text");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertText("*", "*", "italic text");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertText("[", "](https://example.com)", "link title");
    } else if (e.key === "Tab") {
      e.preventDefault();
      insertText("  ");
    }
  };

  const applyTemplate = (templateContent: string) => {
    if (articleValue.trim() && !window.confirm("Replace current editor content with this template?")) {
      return;
    }
    setArticleValue(templateContent);
    toast.success("Template inserted into article editor");
  };

  const handleSaveLink = async () => {
    try {
      await updateLesson.mutateAsync({ id: lesson.id, body: { attachment_url: linkValue } });
      toast.success("Attachment link saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSaveArticle = async () => {
    try {
      const body: Record<string, unknown> = {
        description: articleValue,
      };
      if (clearAttachmentOnArticle && (lesson.attachment_url || lesson.attachment_s3_key)) {
        body.attachment_url = null;
      }

      await updateLesson.mutateAsync({ id: lesson.id, body: body as never });
      toast.success("Article saved successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a file first");
      return;
    }
    setUploading(true);
    try {
      await uploadFileViaPresignedPost(`/v1/lessons/${lesson.id}/attachment`, file);
      toast.success("File uploaded successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(`Upload failed: ${getErrorMessage(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleViewCurrent = async () => {
    if (lesson.attachment_url) {
      setViewer({ url: lesson.attachment_url, contentType: null, article: lesson.description });
      return;
    }
    if (lesson.attachment_s3_key) {
      try {
        const { playback_url, content_type } = await apiGet<{ playback_url: string; content_type: string | null }>(
          `/v1/lessons/${lesson.id}/attachment`,
        );
        setViewer({ url: playback_url, contentType: content_type, article: lesson.description });
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
      return;
    }
    if (lesson.description) {
      setViewer({ url: null, contentType: null, article: lesson.description });
    }
  };

  // Article metrics
  const wordCount = articleValue.trim() ? articleValue.trim().split(/\s+/).length : 0;
  const charCount = articleValue.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-5xl w-[95vw] h-[86vh] max-h-[860px] min-h-[580px] flex flex-col p-0 overflow-hidden gap-0 border-border bg-card shadow-2xl"
        >
          {/* Header Bar - Fixed height, never shifts position */}
          <div className="shrink-0 border-b border-border/80 px-6 py-3.5 bg-secondary/30">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {lesson.sequence_order}
                    </span>
                    <DialogTitle className="text-base font-bold text-fg-1 truncate max-w-lg">
                      Lesson Content — {lesson.title}
                    </DialogTitle>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {mode === "article" && "Write rich technical articles, lab walkthroughs, code guides, and curriculum notes."}
                    {mode === "link" && "Attach online video streams, YouTube links, or external documentation to this lesson."}
                    {mode === "upload" && "Upload PDF courseware, slide decks, or video recordings directly to secure storage."}
                  </p>
                </div>

                {/* Mode Selector Tabs - Pinned firmly in top right */}
                <div className="flex shrink-0 items-center rounded-lg border border-border/60 bg-surface-2 p-1 mr-7">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                      mode === "article"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setMode("article")}
                  >
                    <PenLine className="size-3.5" />
                    <span>Write Article</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                      mode === "link"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setMode("link")}
                  >
                    <Link2 className="size-3.5" />
                    <span>Web Link</span>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                      mode === "upload"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setMode("upload")}
                  >
                    <Upload className="size-3.5" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Current Active Attachment Indicator Bar */}
            {(lesson.attachment_url || lesson.attachment_s3_key || lesson.description) && (
              <div className="mt-2.5 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2/80 px-3 py-1.5 text-xs">
                <span className="flex items-center gap-2 truncate text-fg-2 min-w-0">
                  <FileText className="size-3.5 shrink-0 text-primary" />
                  <span className="font-medium text-fg-3 shrink-0">Current Content:</span>
                  {lesson.attachment_url ? (
                    <span className="truncate font-mono text-[11px] text-fg-1 max-w-xl">{lesson.attachment_url}</span>
                  ) : lesson.attachment_s3_key ? (
                    <span className="font-medium text-fg-1">
                      {lesson.attachment_content_type?.startsWith("video/") ? "Uploaded Video Recording" : "Uploaded PDF Document"}
                    </span>
                  ) : (
                    <span className="font-medium text-fg-1">Markdown Article ({lesson.description?.length} chars)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleViewCurrent}
                  className="flex items-center gap-1 font-medium text-primary hover:underline ml-3 shrink-0 cursor-pointer"
                  title="Preview current content"
                >
                  <Eye className="size-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            )}
          </div>

          {/* Body Canvas - Fixed size, fills flex-1 min-h-0 */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background/40">
            {/* Mode 1: Link View (Web & Video Studio) */}
            {mode === "link" && (() => {
              const viewerInfo = resolveViewerKind(linkValue || null, null);
              return (
                <div className="flex flex-1 flex-col h-full overflow-hidden p-6 gap-4">
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <label className="text-xs font-semibold text-fg-2 flex items-center justify-between">
                      <span>Attachment URL / Streaming Resource</span>
                      {linkValue && (
                        <button
                          type="button"
                          onClick={() => setLinkValue("")}
                          className="text-[11px] font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <Link2 className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        value={linkValue}
                        onChange={(e) => setLinkValue(e.target.value)}
                        placeholder="https://… (e.g. YouTube video, Vimeo, AWS S3, or external PDF link)"
                        className="pl-9 pr-4 py-2 font-mono text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                      <span>Supported: YouTube, Vimeo, AWS S3 / CloudFront, MP4, WebM, and PDF links.</span>
                      <span className="font-medium text-primary">Live Embed Enabled</span>
                    </div>
                  </div>

                  {/* Interactive Live Preview Canvas */}
                  <div className="flex-1 min-h-0 rounded-xl border border-border/80 bg-surface flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border/50 bg-secondary/30 px-3 py-1.5 text-[11px] font-mono text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Eye className="size-3 text-primary" />
                        <span>LIVE RESOURCE PREVIEW</span>
                      </span>
                      {viewerInfo.kind !== "empty" && (
                        <a
                          href={linkValue}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-foreground text-[10.5px]"
                        >
                          <span>Test in new tab</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex-1 min-h-0 flex items-center justify-center p-4 bg-muted/10 overflow-hidden">
                      {viewerInfo.kind === "youtube" ? (
                        <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-border shadow-xl bg-black">
                          <iframe
                            src={viewerInfo.embedUrl}
                            title="YouTube preview"
                            className="size-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : viewerInfo.kind === "video" ? (
                        <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-border shadow-xl bg-black flex items-center justify-center">
                          <video src={viewerInfo.embedUrl} controls className="size-full object-contain" />
                        </div>
                      ) : viewerInfo.kind === "pdf" || viewerInfo.kind === "generic" ? (
                        <div className="max-w-md w-full rounded-xl border border-border-subtle bg-card p-6 text-center flex flex-col items-center gap-3 shadow-sm">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FileText className="size-6" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-fg-1">External Resource Link</div>
                            <div className="mt-1 font-mono text-xs text-muted-foreground break-all max-w-xs">{linkValue}</div>
                          </div>
                          <a
                            href={linkValue}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-fg-1 hover:bg-accent transition-colors"
                          >
                            <ExternalLink className="size-3.5" />
                            <span>Verify External Link</span>
                          </a>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground flex flex-col items-center gap-2 max-w-sm">
                          <div className="flex size-12 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground">
                            <SquarePlay className="size-6 opacity-60" />
                          </div>
                          <p className="text-sm font-medium text-fg-2">No attachment URL entered yet</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Paste a YouTube link or direct video stream above to preview playback before attaching it to the lesson.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Mode 2: Upload View */}
            {mode === "upload" && (
              <div className="flex flex-1 flex-col h-full overflow-hidden p-6 gap-4">
                <div className="flex flex-col gap-1 shrink-0">
                  <label className="text-xs font-semibold text-fg-2">Upload Course File</label>
                  <p className="text-xs text-muted-foreground">
                    Upload official PDF outlines, student guides, or MP4 video recordings directly to lesson cloud storage.
                  </p>
                </div>

                <div className="flex-1 min-h-0 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-surface flex flex-col items-center justify-center p-8 text-center transition-colors">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <Upload className="size-7" />
                  </div>
                  <h3 className="text-sm font-bold text-fg-1">Select file to upload</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Supported formats: <strong>PDF, MP4, WebM, QuickTime, OGG</strong> (up to 500MB).
                  </p>

                  <label className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer transition-all">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      accept={UPLOAD_ACCEPT}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>

                  {file && (
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-fg-1">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium font-mono">{file.name}</span>
                      <span className="text-muted-foreground">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  )}

                  {!file && lesson.attachment_s3_key && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
                      <FileText className="size-3.5 text-primary" />
                      <span>Currently stored: <span className="font-mono text-fg-1">{lesson.attachment_content_type || "file"}</span></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Article Studio */}
            {mode === "article" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Studio Toolbar & View Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-2 text-xs shrink-0">
                  {/* Formatting Tools */}
                  <div className="flex flex-wrap items-center gap-1">
                    {/* Headings */}
                    <button
                      type="button"
                      onClick={() => insertText("\n# ", "\n", "Heading 1")}
                      title="Heading 1"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Heading1 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("\n## ", "\n", "Heading 2")}
                      title="Heading 2"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Heading2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("\n### ", "\n", "Heading 3")}
                      title="Heading 3"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Heading3 className="size-3.5" />
                    </button>

                    <div className="mx-1 h-4 w-px bg-border" />

                    {/* Inline Styles */}
                    <button
                      type="button"
                      onClick={() => insertText("**", "**", "bold text")}
                      title="Bold (Ctrl+B)"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Bold className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("*", "*", "italic text")}
                      title="Italic (Ctrl+I)"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Italic className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("~~", "~~", "strikethrough")}
                      title="Strikethrough"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Strikethrough className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("`", "`", "code")}
                      title="Inline Code"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Code className="size-3.5" />
                    </button>

                    <div className="mx-1 h-4 w-px bg-border" />

                    {/* Structure */}
                    <button
                      type="button"
                      onClick={() => insertLinePrefix("- ")}
                      title="Bullet List"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <List className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertLinePrefix("1. ")}
                      title="Numbered List"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <ListOrdered className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertLinePrefix("- [ ] ")}
                      title="Task Checklist"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <ListTodo className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertLinePrefix("> ")}
                      title="Blockquote"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Quote className="size-3.5" />
                    </button>

                    <div className="mx-1 h-4 w-px bg-border" />

                    {/* Inserts */}
                    <button
                      type="button"
                      onClick={() => insertText("\n```python\n", "\n```\n", "# Your code snippet here")}
                      title="Code Block"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <FileCode2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertText(
                          "\n| Header 1 | Header 2 | Header 3 |\n|---|---|---|\n| Cell 1 | Cell 2 | Cell 3 |\n",
                        )
                      }
                      title="Markdown Table"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Table className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("[", "](https://example.com)", "link title")}
                      title="Hyperlink (Ctrl+K)"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Link2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("\n---\n")}
                      title="Horizontal Divider"
                      className="flex size-7 items-center justify-center rounded border border-border/50 bg-surface hover:bg-accent text-fg-2 hover:text-foreground cursor-pointer"
                    >
                      <Minus className="size-3.5" />
                    </button>
                  </div>

                  {/* Right Side: Templates & View Switcher */}
                  <div className="flex items-center gap-2">
                    {/* Outline Templates Dropdown */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <Sparkles className="size-3.5 text-primary" />
                        <span>Article Templates</span>
                      </button>
                      <div className="absolute right-0 top-full mt-1 hidden w-64 rounded-xl border border-border bg-popover p-1.5 shadow-xl group-hover:block z-20">
                        <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          Starter Outlines
                        </div>
                        {ARTICLE_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => applyTemplate(tmpl.content)}
                            className="flex w-full flex-col rounded-lg p-2 text-left hover:bg-accent transition-colors cursor-pointer"
                          >
                            <span className="font-semibold text-xs text-fg-1">{tmpl.title}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">{tmpl.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Button */}
                    {articleValue.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Clear all text from editor?")) {
                            setArticleValue("");
                          }
                        }}
                        title="Clear Article Text"
                        className="flex size-7 items-center justify-center rounded border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}

                    {/* View Switcher Tabs */}
                    <div className="flex items-center rounded-md border border-border/70 bg-surface p-0.5">
                      <button
                        type="button"
                        onClick={() => setArticleView("write")}
                        title="Editor Only"
                        className={cn(
                          "flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                          articleView === "write"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <PenLine className="size-3" />
                        <span>Write</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setArticleView("split")}
                        title="Split Screen (Editor + Live Preview)"
                        className={cn(
                          "flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                          articleView === "split"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Columns2 className="size-3" />
                        <span>Split</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setArticleView("preview")}
                        title="Live Rendered Preview"
                        className={cn(
                          "flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                          articleView === "preview"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Eye className="size-3" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Workspace (Editor + Live Preview) */}
                <div className="flex flex-1 min-h-0 divide-x divide-border overflow-hidden bg-background">
                  {/* Left: Editor */}
                  {(articleView === "write" || articleView === "split") && (
                    <div className="flex flex-1 flex-col h-full overflow-hidden bg-card/60">
                      <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-3 py-1 text-[10.5px] font-mono text-muted-foreground shrink-0">
                        <span>MARKDOWN SOURCE</span>
                        <span>Ctrl+B bold · Ctrl+I italic · Tab indent</span>
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={articleValue}
                        onChange={(e) => setArticleValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Start writing the technical article or choose a template above...&#10;&#10;# Lesson Title&#10;&#10;Use standard markdown: **bold**, *italics*, - lists, `code`, and ```python code blocks```."
                        className="flex-1 w-full resize-none p-4 font-mono text-[13px] leading-relaxed outline-none bg-transparent text-fg-1 placeholder:text-fg-3/50 overflow-y-auto"
                        spellCheck="false"
                      />
                    </div>
                  )}

                  {/* Right: Live Rendered Article Preview */}
                  {(articleView === "preview" || articleView === "split") && (
                    <div className="flex flex-1 flex-col h-full overflow-hidden bg-surface">
                      <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-3 py-1 text-[10.5px] font-mono text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Eye className="size-3 text-primary" />
                          <span>LIVE ARTICLE PREVIEW</span>
                        </span>
                        <span>Rendered with ReactMarkdown & GFM</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6">
                        {articleValue.trim() ? (
                          <div className="max-w-prose mx-auto">
                            <MarkdownArticle text={articleValue} />
                          </div>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                            <BookOpen className="size-8 text-fg-3 mb-2 opacity-60" />
                            <p className="text-sm font-medium">No article text written yet</p>
                            <p className="text-xs text-fg-3 mt-1 max-w-xs">
                              Type in the editor or click "Article Templates" above to insert a structured lesson guide.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Unified Pinned Bottom Footer - Never shifts between modes */}
          <div className="shrink-0 border-t border-border bg-secondary/30 px-6 py-3 text-xs flex items-center justify-between">
            {/* Left side context */}
            <div>
              {mode === "article" && (
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2.5 font-mono text-[11px]">
                    <span className="font-semibold text-fg-1">{wordCount}</span> words
                    <span className="text-border">|</span>
                    <span className="font-semibold text-fg-1">{charCount}</span> chars
                    <span className="text-border">|</span>
                    <span>~{readTime} min read</span>
                  </div>
                  {(lesson.attachment_url || lesson.attachment_s3_key) && (
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-fg-2">
                      <input
                        type="checkbox"
                        checked={clearAttachmentOnArticle}
                        onChange={(e) => setClearAttachmentOnArticle(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary size-3.5"
                      />
                      <span>Make article primary</span>
                    </label>
                  )}
                </div>
              )}
              {mode === "link" && (
                <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                  <SquarePlay className="size-3.5 text-primary" />
                  YouTube, Vimeo & video streams will embed automatically in student player.
                </span>
              )}
              {mode === "upload" && (
                <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                  <Upload className="size-3.5 text-primary" />
                  Files are stored securely in private cloud object storage.
                </span>
              )}
            </div>

            {/* Right side buttons - Fixed, rock solid */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {mode === "article" && (
                <Button
                  size="sm"
                  onClick={handleSaveArticle}
                  disabled={updateLesson.isPending}
                  className="gap-1.5 font-semibold"
                >
                  <PenLine className="size-3.5" />
                  <span>{updateLesson.isPending ? "Saving…" : "Save Article"}</span>
                </Button>
              )}
              {mode === "link" && (
                <Button
                  size="sm"
                  onClick={handleSaveLink}
                  disabled={updateLesson.isPending}
                  className="gap-1.5 font-semibold"
                >
                  <Link2 className="size-3.5" />
                  <span>{updateLesson.isPending ? "Saving…" : "Save Link"}</span>
                </Button>
              )}
              {mode === "upload" && (
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="gap-1.5 font-semibold"
                >
                  <Upload className="size-3.5" />
                  <span>{uploading ? "Uploading…" : "Upload File"}</span>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ContentViewerDialog
        open={!!viewer}
        onOpenChange={(o) => !o && setViewer(null)}
        title={lesson.title}
        url={viewer?.url ?? null}
        contentType={viewer?.contentType ?? null}
        article={viewer?.article ?? null}
      />
    </>
  );
}
