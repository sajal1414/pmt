import { useNavigate } from "react-router";
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
  Phone,
  ExternalLink,
} from "lucide-react";
import type { Instructor } from "@/lib/types";
import { StatusBadge, courseStatusTone, formatEnumLabel } from "@/components/shared/status-badge";

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
  const navigate = useNavigate();
  if (!instructor) return null;

  const handleCourseClick = (courseId: number) => {
    onOpenChange(false);
    navigate(`/courses/${courseId}`);
  };

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
                  {instructor.phone && (
                    <>
                      <span>·</span>
                      <Phone className="size-3 shrink-0 text-fg-3" />
                      <span className="font-mono">{instructor.phone}</span>
                    </>
                  )}
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
          {/* ── COURSES THEY OWN ── */}
          <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-2xs min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <BookOpen className="size-3.5 shrink-0" />
                Courses Owned by {instructor.name} ({instructor.courses_owned?.length ?? 0})
              </span>
            </div>

            {instructor.courses_owned && instructor.courses_owned.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {instructor.courses_owned.map((c, idx) => {
                  const isCatalog = c.in_repository !== false && c.id != null;
                  return (
                    <div
                      key={c.id ?? `ext-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface/60 p-2.5 text-xs shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        {isCatalog ? (
                          <>
                            <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                              Catalog
                            </span>
                            {c.nfolks_course_code && (
                              <span className="font-mono font-bold text-primary shrink-0">{c.nfolks_course_code}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => c.id && handleCourseClick(c.id)}
                              className="font-semibold text-fg-1 hover:text-primary hover:underline truncate inline-flex items-center gap-1 cursor-pointer text-left"
                              title="Go to course details in catalog"
                            >
                              <span className="truncate">{c.course_name}</span>
                              <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                              External / Non-Repository
                            </span>
                            <span className="font-medium text-fg-1 truncate">{c.course_name}</span>
                          </>
                        )}
                      </div>
                      {isCatalog && (
                        <StatusBadge label={formatEnumLabel(c.status)} tone={courseStatusTone(c.status)} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-secondary/50 p-3 rounded-xl">
                No courses currently registered as owned by this instructor.
              </p>
            )}
          </div>

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
