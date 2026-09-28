import { AlignLeft, FileQuestion, FileText, Link2, SquarePlay, Video } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { MarkdownArticle } from "@/components/shared/markdown-article";

export type ViewerKind = "video" | "youtube" | "pdf" | "generic" | "article" | "empty";

const YOUTUBE_PATTERN = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;

export function resolveViewerKind(
  url: string | null,
  contentType: string | null,
): { kind: ViewerKind; embedUrl: string } {
  if (!url) return { kind: "empty", embedUrl: "" };
  if (contentType?.startsWith("video/")) return { kind: "video", embedUrl: url };
  if (contentType === "application/pdf") return { kind: "pdf", embedUrl: url };

  // No content type — this is a pasted link, not an uploaded file. Guess from the URL itself.
  const youtubeMatch = url.match(YOUTUBE_PATTERN);
  if (youtubeMatch) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}` };
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

/**
 * Renders lesson/course content — video player, YouTube embed, PDF, a generic
 * iframe, or a plain-text "article" — filling whatever box the caller gives
 * it. No Dialog/modal wrapper here: callers that want a popup wrap this in
 * one (see ContentViewerDialog); callers that want an inline watch area (the
 * course Preview tab) render it directly in the page.
 */
export function MediaViewer({
  url,
  contentType,
  article,
  className = "",
}: {
  url: string | null;
  contentType: string | null;
  /** Plain-text lesson description, shown when there's no video/PDF attachment. */
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
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        key={embedUrl}
        controls
        autoPlay
        playsInline
        preload="auto"
        className={`bg-black ${className}`}
        src={embedUrl}
      />
    );
  }

  if (kind === "youtube") {
    return (
      <div className={`overflow-hidden ${className}`}>
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="h-full w-full"
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
      <a href={url ?? undefined} target="_blank" rel="noopener noreferrer" className="self-start text-xs text-primary hover:underline">
        Not displaying correctly? Open in a new tab ↗
      </a>
    </div>
  );
}
