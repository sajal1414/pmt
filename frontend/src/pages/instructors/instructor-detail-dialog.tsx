import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Mail,
  MapPin,
  Globe,
  Layers,
  BookOpen,
  Briefcase,
  Star,
  Plane,
} from "lucide-react";
import type { Instructor } from "@/lib/types";

interface InstructorDetailDialogProps {
  instructor: Instructor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (instructor: Instructor) => void;
}

export function InstructorDetailDialog({
  instructor,
  open,
  onOpenChange,
}: InstructorDetailDialogProps) {
  if (!instructor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-5 sm:p-6">
        <DialogHeader className="border-b border-border-subtle pb-4">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base sm:text-lg">
                {instructor.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-bold text-fg-1 leading-tight truncate">
                  {instructor.name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground break-all">
                  <Mail className="size-3 shrink-0 text-fg-3" />
                  <span className="truncate">{instructor.email}</span>
                  {instructor.location && (
                    <>
                      <span>·</span>
                      <MapPin className="size-3 shrink-0 text-fg-3" />
                      <span>{instructor.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogDescription className="sr-only">Instructor profile details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-w-0">
          {/* ── PLATFORM & PRODUCTS CAN TEACH (Client Directive) ── */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Layers className="size-3.5 shrink-0" />
              <span>Platform & Products Teaching Authorization</span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
              <div className="rounded-xl border border-border bg-card p-3 shadow-2xs min-w-0">
                <span className="text-[10.5px] font-semibold uppercase text-muted-foreground block">
                  Primary Platform
                </span>
                <span className="text-sm font-bold text-fg-1 mt-0.5 block break-words">
                  {instructor.platform || "Not assigned"}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 shadow-2xs min-w-0">
                <span className="text-[10.5px] font-semibold uppercase text-muted-foreground block">
                  Primary Product
                </span>
                <span className="text-sm font-bold text-fg-1 mt-0.5 block break-words">
                  {instructor.product || "Not assigned"}
                </span>
              </div>
            </div>

            {instructor.portfolio && (
              <div className="mt-3 text-xs text-fg-2 break-words">
                <strong className="text-fg-1">Portfolio:</strong> {instructor.portfolio}
              </div>
            )}

            {instructor.skills_products && (
              <div className="mt-3 border-t border-primary/15 pt-3 min-w-0">
                <span className="text-xs font-semibold text-fg-1 block mb-2">
                  Skills & Products Breakdown:
                </span>
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {instructor.skills_products.split(",").map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary break-all"
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {instructor.courses_can_teach && (
              <div className="mt-3 border-t border-primary/15 pt-3 min-w-0">
                <span className="text-xs font-semibold text-fg-1 block mb-1 flex items-center gap-1.5">
                  <BookOpen className="size-3.5 shrink-0 text-primary" /> Specific Courses Authorized to Teach:
                </span>
                <p className="text-xs leading-relaxed text-fg-2 break-words whitespace-pre-line bg-card/60 p-2.5 rounded-xl border border-border">
                  {instructor.courses_can_teach}
                </p>
              </div>
            )}
          </div>

          {/* ── LOGISTICS & ENGAGEMENT METRICS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-0">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="size-3.5 shrink-0 text-primary" /> Vendor Alignment
              </div>
              <div className="text-sm font-bold text-fg-1 mt-1 truncate">
                {instructor.vendor || "nFolks"}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Plane className="size-3.5 shrink-0 text-primary" /> Travel Preference
              </div>
              <div className="text-sm font-bold text-fg-1 mt-1 capitalize truncate">
                {instructor.travel_preference ? instructor.travel_preference.replace("_", " ") : "Flexible"}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="size-3.5 shrink-0 text-gold fill-gold" /> Client Feedback
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {instructor.feedback_score ? `${instructor.feedback_score} / 10` : "Unrated"}
              </div>
            </div>
          </div>

          {instructor.languages && (
            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs text-xs min-w-0">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Globe className="size-3.5 shrink-0 text-primary" /> Delivery Languages
              </div>
              <span className="font-medium text-fg-1 break-words">{instructor.languages}</span>
            </div>
          )}

          {instructor.comments && (
            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs text-xs min-w-0">
              <div className="font-semibold text-fg-1 mb-1">Notes & Faculty Comments:</div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line break-words">
                {instructor.comments}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
