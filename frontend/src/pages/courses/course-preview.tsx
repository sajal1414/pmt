import { useMemo, useState } from "react";
import { ListVideo } from "lucide-react";
import { MediaViewer, ViewerKindIcon, lessonContentKind } from "@/components/shared/media-viewer";
import { useLessonAttachment } from "@/hooks/use-courses";
import type { Lesson } from "@/lib/types";

function fmtDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Learner-facing "watch" layout for a course, styled after a YouTube/Udemy
 * playlist page: a large player + description on the left, a scrollable
 * lesson queue on the right. Nothing here opens a popup — switching lessons
 * swaps the content in the same player area.
 */
export function CoursePreview({ courseName, lessons }: { courseName: string; lessons: Lesson[] }) {
  const ordered = useMemo(() => [...lessons].sort((a, b) => a.sequence_order - b.sequence_order), [lessons]);
  const [activeId, setActiveId] = useState<number | null>(ordered[0]?.id ?? null);
  const active = ordered.find((l) => l.id === activeId) ?? ordered[0] ?? null;

  const totalMinutes = ordered.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);
  const totalLabel = fmtDuration(totalMinutes);

  const needsFetch = !!active?.attachment_s3_key;
  const { data: playback, isLoading: loadingPlayback } = useLessonAttachment(active?.id, needsFetch);

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface py-16 text-center">
        <ListVideo className="size-8 text-fg-3" />
        <p className="text-sm text-muted-foreground">No lessons yet — add some in the Lessons tab.</p>
      </div>
    );
  }

  const activeUrl = needsFetch ? (playback?.playback_url ?? null) : (active?.attachment_url ?? null);
  const activeContentType = needsFetch ? (playback?.content_type ?? null) : (active?.attachment_content_type ?? null);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Player + description */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
          {active && (needsFetch ? !loadingPlayback : true) ? (
            <MediaViewer
              key={`${active.id}-${activeUrl ?? "empty"}`}
              url={activeUrl}
              contentType={activeContentType}
              article={active.description}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-fg-muted">Loading…</div>
          )}
        </div>

        {active && (
          <div className="rounded-xl border border-border bg-surface px-4 py-3.5">
            <h2 className="text-base font-semibold text-fg-1">{active.title}</h2>
            <div className="mt-1 text-xs text-muted-foreground">
              Lesson {active.sequence_order} of {ordered.length}
              {fmtDuration(active.duration_minutes) ? ` · ${fmtDuration(active.duration_minutes)}` : ""}
            </div>
            {active.description && lessonContentKind(active) !== "article" && (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-fg-2">{active.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Playlist */}
      <div className="w-full shrink-0 lg:w-[340px]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border-subtle px-3.5 py-2.5">
            <div className="truncate text-sm font-semibold text-fg-1">{courseName}</div>
            <div className="text-xs text-muted-foreground">
              {ordered.length} lesson{ordered.length === 1 ? "" : "s"}
              {totalLabel ? ` · ${totalLabel} total` : ""}
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {ordered.map((lesson) => (
              <PlaylistRow key={lesson.id} lesson={lesson} active={lesson.id === active?.id} onClick={() => setActiveId(lesson.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaylistRow({ lesson, active, onClick }: { lesson: Lesson; active: boolean; onClick: () => void }) {
  const kind = lessonContentKind(lesson);
  const duration = fmtDuration(lesson.duration_minutes);

  return (
    <button
      onClick={onClick}
      aria-current={active}
      className={`flex w-full items-start gap-2.5 border-t border-border-subtle px-3 py-2.5 text-left first:border-t-0 hover:bg-accent/40 ${
        active ? "bg-accent/60" : ""
      }`}
    >
      <span
        className={`relative flex h-11 w-[72px] shrink-0 items-center justify-center rounded-md ${
          active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        <span className="absolute top-1 left-1 text-[9px] font-bold opacity-70">{lesson.sequence_order}</span>
        <ViewerKindIcon kind={kind} className="size-4" />
        {duration && (
          <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[9px] font-medium text-white">{duration}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`line-clamp-2 text-sm ${active ? "font-semibold text-primary" : "font-medium text-fg-1"}`}>{lesson.title}</span>
      </span>
    </button>
  );
}
