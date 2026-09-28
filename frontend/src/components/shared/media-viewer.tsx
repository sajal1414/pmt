import { AlignLeft, FileQuestion, FileText, Link2, SquarePlay, Video } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { MarkdownArticle } from "@/components/shared/markdown-article";

export type ViewerKind = "video" | "youtube" | "vimeo" | "loom" | "pdf" | "generic" | "article" | "empty";

export function extractYouTubeId(urlStr: string): string | null {
  if (!urlStr) return null;
  try {
    const raw = urlStr.trim();
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.has("v")) return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") {
        return parts[1] || null;
      }
    }
    if (url.hostname === "youtu.be" || url.hostname.endsWith(".youtu.be")) {
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[0] || null;
    }
  } catch {
    // fallback
  }
  const match = urlStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?.*?v=|shorts\/|live\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export function resolveViewerKind(
  url: string | null,
  contentType: string | null,
): { kind: ViewerKind; embedUrl: string } {
  if (!url) return { kind: "empty", embedUrl: "" };
  if (contentType?.startsWith("video/")) return { kind: "video", embedUrl: url };
  if (contentType === "application/pdf") return { kind: "pdf", embedUrl: url };

  // Guess from URL
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0` };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)/);
  if (vimeoMatch) {
    return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return { kind: "loom", embedUrl: `https://www.loom.com/embed/${loomMatch[1]}` };
  }

  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { kind: "video", embedUrl: url };
  return { kind: "generic", embedUrl: url };
}

/** Same classification, without needing a resolved playback URL — used for playlist icons. */
export function lessonContentKind(lesson: Pick<Lesson, "attachment_url" | "attachment_s3_key" | "attachment_content_type" | "description">): ViewerKind {
  if (lesson.attachment_s3_key || lesson.attachment_url) {
    const { kind } = resolveViewerKind(lesson.attachment_url ?? "uploaded-file", lesson.attachment_content_type);
    return kind;
  }
  if (lesson.description?.trim()) return "article";
  return "empty";
}

export function ViewerKindIcon({ kind, className }: { kind: ViewerKind; className?: string }) {
  switch (kind) {
    case "video":
      return <Video className={className} />;
    case "youtube":
    case "vimeo":
    case "loom":
      return <SquarePlay className={className} />;
    case "pdf":
      return <FileText className={className} />;
    case "article":
      return <AlignLeft className={className} />;
    case "generic":
      return <Link2 className={className} />;
    default:
      return <FileQuestion className={className} />;
  }
}

export function MediaViewer({
  url,
  contentType,
  article,
  className = "",
}: {
  url: string | null;
  contentType: string | null;
  article?: string | null;
  className?: string;
}) {
  const { kind, embedUrl } = resolveViewerKind(url, contentType);

  if (kind === "empty") {
    if (article) {
      return (
        <article className={`overflow-y-auto bg-surface-2 px-6 py-5 ${className}`}>
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-fg-3 uppercase">
            <AlignLeft className="size-3.5" /> Article
          </div>
          <div className="max-w-prose">
            <MarkdownArticle text={article} />
          </div>
        </article>
      );
    }
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-surface-2 text-fg-3 ${className}`}>
        <FileQuestion className="size-8" />
        <span className="text-sm">No content for this lesson yet</span>
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className={`relative overflow-hidden bg-black flex items-center justify-center rounded-xl ${className}`}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          key={embedUrl}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
          src={embedUrl}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (kind === "youtube" || kind === "vimeo" || kind === "loom") {
    return (
      <div className={`relative overflow-hidden aspect-video bg-black flex items-center justify-center rounded-xl shadow-lg ${className}`}>
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }

  // pdf | generic
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <iframe src={embedUrl} className="h-full w-full flex-1 rounded-lg border border-border" title="Lesson attachment" />
    </div>
  );
}
