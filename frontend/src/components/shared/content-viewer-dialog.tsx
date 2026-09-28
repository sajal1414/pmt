import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaViewer, resolveViewerKind } from "@/components/shared/media-viewer";

/**
 * Modal quick-preview used from the lesson editor ("what did I just upload?").
 * The learner-facing Preview tab does NOT use this — it embeds MediaViewer
 * directly in a proper watch area instead of a popup.
 */
export function ContentViewerDialog({
  open,
  onOpenChange,
  title,
  url,
  contentType,
  article,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string | null;
  contentType?: string | null;
  article?: string | null;
}) {
  if (!url && !article) return null;
  const { kind } = resolveViewerKind(url ?? null, contentType ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={article && kind === "empty" ? "max-w-4xl" : "max-w-3xl"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <MediaViewer
          url={url ?? null}
          contentType={contentType ?? null}
          article={article}
          className={
            article && kind === "empty"
              ? "max-h-[75vh] w-full rounded-lg overflow-y-auto"
              : kind === "youtube"
                ? "aspect-video w-full rounded-lg"
                : kind === "video"
                  ? "max-h-[70vh] w-full rounded-lg"
                  : "h-[70vh] w-full rounded-lg"
          }
        />
      </DialogContent>
    </Dialog>
  );
}
