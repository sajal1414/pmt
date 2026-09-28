import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Paperclip,
  Eye,
  FileText,
  BookOpen,
  AlignLeft,
  Video,
  PenLine,
  Save,
} from "lucide-react";
import { SurfaceHeader } from "@/components/shared/surface-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TabStrip, type TabDef } from "@/components/shared/tab-strip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ContentViewerDialog } from "@/components/shared/content-viewer-dialog";
import { StatusBadge, courseStatusTone, formatEnumLabel } from "@/components/shared/status-badge";
import { useCourse, useLessons } from "@/hooks/use-courses";
import { useCreateLesson, useDeleteCourse, useDeleteLesson, useUpdateCourse } from "@/hooks/use-course-mutations";
import { apiGet, getErrorMessage } from "@/lib/api";
import { cn, nullifyEmptyStrings } from "@/lib/utils";
import type { Lesson } from "@/lib/types";
import { LessonAttachmentDialog } from "./lesson-attachment-dialog";
import { CoursePreview } from "./course-preview";

const STATUS_OPTIONS = ["backlog", "pipeline", "draft", "in_progress", "for_review", "updated_version", "custom", "published"];
const LAB_LOCATION_OPTIONS = ["ITZ", "nFolks", "instructor_owned", "na"];
const SKILL_LEVEL_OPTIONS = ["foundational", "intermediate", "advanced"];
const FIELD_CLASS = "text-xs font-medium text-fg-2";

type DetailTab = "details" | "lessons" | "preview";

interface ViewerState {
  title: string;
  url: string | null;
  contentType: string | null;
  article?: string | null;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const courseId = Number(id);
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: lessons } = useLessons(courseId);
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const createLesson = useCreateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);

  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [form, setForm] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [attachmentLesson, setAttachmentLesson] = useState<Lesson | null>(null);
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  const openViewer = async (lesson: Lesson) => {
    if (lesson.attachment_s3_key) {
      try {
        const { playback_url, content_type } = await apiGet<{ playback_url: string; content_type: string | null }>(
          `/v1/lessons/${lesson.id}/attachment`,
        );
        setViewer({ title: lesson.title, url: playback_url, contentType: content_type, article: lesson.description });
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    } else if (lesson.attachment_url) {
      setViewer({
        title: lesson.title,
        url: lesson.attachment_url,
        contentType: lesson.attachment_content_type,
        article: lesson.description,
      });
    } else if (lesson.description?.trim()) {
      setViewer({ title: lesson.title, url: null, contentType: null, article: lesson.description });
    }
  };

  useEffect(() => {
    if (course) {
      setForm({
        course_name: course.course_name,
        status: course.status,
        vendor: course.vendor ?? "",
        platform: course.platform ?? "",
        portfolio: course.portfolio ?? "",
        product: course.product ?? "",
        modality: course.modality ?? "",
        duration_days: course.duration_days ?? "",
        num_hours: course.num_hours ?? "",
        skill_level: course.skill_level ?? "",
        lab_location: course.lab_location ?? "",
        retire_date: course.retire_date ?? "",
        course_author_email: course.course_author_email ?? "",
        course_description: course.course_description ?? "",
      });
    }
  }, [course]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateCourse.mutateAsync({ id: courseId, body: nullifyEmptyStrings(form) as never });
      toast.success("Course saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return;
    try {
      await createLesson.mutateAsync({ title: newLessonTitle.trim(), sequence_order: (lessons?.length ?? 0) + 1 });
      setNewLessonTitle("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading || !course) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto">
      <SurfaceHeader
        eyebrow={course.nfolks_course_code}
        title={course.course_name}
        meta={<StatusBadge label={formatEnumLabel(course.status)} tone={courseStatusTone(course.status)} />}
      />

      <TabStrip
        tabs={
          [
            { id: "details", label: "Details", icon: FileText },
            { id: "lessons", label: `Lessons${lessons && lessons.length > 0 ? ` (${lessons.length})` : ""}`, icon: BookOpen },
            { id: "preview", label: "Preview", icon: Eye },
          ] satisfies TabDef<DetailTab>[]
        }
        active={activeTab}
        onChange={setActiveTab}
        ariaLabel="Course sections"
      />

      <div className="flex-1">
        {activeTab === "details" && (
          <Card>
            <CardContent className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
              <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-3">
                <label className={FIELD_CLASS}>Course name</label>
                <Input value={form.course_name ?? ""} onChange={set("course_name")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Status</label>
                <Select value={form.status ?? ""} onChange={set("status")}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {formatEnumLabel(s)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Vendor</label>
                <Input value={form.vendor ?? ""} onChange={set("vendor")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Platform</label>
                <Input value={form.platform ?? ""} onChange={set("platform")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Portfolio</label>
                <Input value={form.portfolio ?? ""} onChange={set("portfolio")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Product</label>
                <Input value={form.product ?? ""} onChange={set("product")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Modality</label>
                <Input value={form.modality ?? ""} onChange={set("modality")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Duration (days)</label>
                <Input value={form.duration_days ?? ""} onChange={set("duration_days")} type="number" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Number of hours</label>
                <Input value={form.num_hours ?? ""} onChange={set("num_hours")} type="number" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Skill level</label>
                <Select value={form.skill_level ?? ""} onChange={set("skill_level")}>
                  <option value="">—</option>
                  {SKILL_LEVEL_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {formatEnumLabel(s)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Lab location</label>
                <Select value={form.lab_location ?? ""} onChange={set("lab_location")}>
                  <option value="">—</option>
                  {LAB_LOCATION_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {formatEnumLabel(s)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Retire date</label>
                <Input value={form.retire_date ?? ""} onChange={set("retire_date")} type="date" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={FIELD_CLASS}>Course author email</label>
                <Input value={form.course_author_email ?? ""} onChange={set("course_author_email")} type="email" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-3">
                <label className={FIELD_CLASS}>Description</label>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-input/60 bg-secondary px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20"
                  value={form.course_description ?? ""}
                  onChange={set("course_description")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "lessons" && (
          <Card>
            <CardContent className="flex flex-col gap-3">
              {(lessons ?? []).map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  onDelete={() => deleteLesson.mutate(lesson.id)}
                  onEditAttachment={() => setAttachmentLesson(lesson)}
                  onViewAttachment={() => openViewer(lesson)}
                />
              ))}
              {(lessons ?? []).length === 0 && <p className="text-sm text-muted-foreground">No lessons yet.</p>}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="New lesson title"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
                />
                <Button size="sm" variant="outline" onClick={handleAddLesson} disabled={createLesson.isPending}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "preview" && <CoursePreview courseName={course.course_name} lessons={lessons ?? []} />}
      </div>

      <div className="flex items-center gap-2.5 pt-2 pb-6">
        <Button onClick={handleSave} disabled={updateCourse.isPending} className="gap-1.5">
          <Save className="size-4" />
          <span>{updateCourse.isPending ? "Saving…" : "Save changes"}</span>
        </Button>
        <Button variant="outline" onClick={() => navigate("/courses")} className="gap-1.5">
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="gap-1.5">
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this course?"
        description="This permanently deletes the course and all of its lessons."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteCourse.mutateAsync(courseId);
          navigate("/courses");
        }}
      />

      <LessonAttachmentDialog
        lesson={attachmentLesson}
        courseId={courseId}
        open={!!attachmentLesson}
        onOpenChange={(open) => !open && setAttachmentLesson(null)}
      />

      <ContentViewerDialog
        open={!!viewer}
        onOpenChange={(open) => !open && setViewer(null)}
        title={viewer?.title ?? ""}
        url={viewer?.url ?? null}
        contentType={viewer?.contentType ?? null}
        article={viewer?.article ?? null}
      />
    </div>
  );
}

function LessonRow({
  lesson,
  onDelete,
  onEditAttachment,
  onViewAttachment,
}: {
  lesson: Lesson;
  onDelete: () => void;
  onEditAttachment: () => void;
  onViewAttachment: () => void;
}) {
  const hasAttachment = !!(lesson.attachment_url || lesson.attachment_s3_key);
  const hasArticle = !!lesson.description?.trim();
  const hasAnyContent = hasAttachment || hasArticle;
  const isVideo =
    lesson.attachment_content_type?.startsWith("video/") ||
    (lesson.attachment_url && /(?:youtube\.com|youtu\.be|\.mp4|\.webm)/i.test(lesson.attachment_url));
  const isPdf =
    lesson.attachment_content_type === "application/pdf" ||
    (lesson.attachment_url && /\.pdf/i.test(lesson.attachment_url));

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-2 px-3.5 py-2.5 transition-colors hover:border-border">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {lesson.sequence_order}
        </span>
        <span className="truncate text-sm font-medium text-fg-1">{lesson.title}</span>
        {lesson.duration_minutes && (
          <span className="shrink-0 text-xs text-muted-foreground">{lesson.duration_minutes} min</span>
        )}

        {/* Content Badges */}
        {hasArticle && !hasAttachment && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/20">
            <AlignLeft className="size-3" /> Article
          </span>
        )}
        {isVideo && (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-300 border border-sky-500/20">
            <Video className="size-3" /> Video
          </span>
        )}
        {isPdf && (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:text-rose-300 border border-rose-500/20">
            <FileText className="size-3" /> PDF
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasAnyContent && (
          <button
            type="button"
            onClick={onViewAttachment}
            className="rounded-md p-1.5 text-fg-3 hover:bg-accent hover:text-primary transition-colors cursor-pointer"
            aria-label="Preview lesson content"
            title="Preview content"
          >
            <Eye className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onEditAttachment}
          className={cn(
            "rounded-md p-1.5 transition-colors cursor-pointer flex items-center gap-1",
            hasArticle
              ? "text-amber-800 dark:text-amber-400 hover:bg-amber-500/15"
              : hasAttachment
                ? "text-primary hover:bg-accent"
                : "text-fg-3 hover:bg-accent hover:text-fg-1",
          )}
          aria-label="Edit lesson content"
          title={hasArticle ? "Open Article Studio" : hasAttachment ? "Edit attachment" : "Add content / article"}
        >
          {hasArticle ? <PenLine className="size-4" /> : <Paperclip className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1.5 text-fg-3 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          aria-label="Delete lesson"
          title="Delete lesson"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
