import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Paperclip,
  Eye,
  FileText,
  BookOpen,
  Save,
  Layers,
  Calendar,
  DollarSign,
  Award,
  ExternalLink,
  Copy,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TabStrip, type TabDef } from "@/components/shared/tab-strip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ContentViewerDialog } from "@/components/shared/content-viewer-dialog";
import { StatusBadge, courseStatusTone, formatEnumLabel } from "@/components/shared/status-badge";
import { useCourse, useLessons } from "@/hooks/use-courses";
import { useCreateLesson, useDeleteCourse, useDeleteLesson, useUpdateCourse } from "@/hooks/use-course-mutations";
import { apiGet, getErrorMessage } from "@/lib/api";
import { nullifyEmptyStrings } from "@/lib/utils";
import type { Lesson } from "@/lib/types";
import { LessonAttachmentDialog } from "./lesson-attachment-dialog";
import { CoursePreview } from "./course-preview";

const STATUS_OPTIONS = [
  "backlog",
  "pipeline",
  "draft",
  "in_progress",
  "for_review",
  "updated_version",
  "custom",
  "published",
  "lockheed",
  "retired",
];

const OUTLINE_STATUS_OPTIONS = [
  "missing",
  "not_yet_scoped",
  "draft",
  "partially_complete",
  "validated",
];

const LAB_LOCATION_OPTIONS = ["ITZ", "nFolks", "instructor_owned", "na"];
const IP_OWNER_OPTIONS = ["nFolks", "SubK"];
const SKILL_LEVEL_OPTIONS = ["foundational", "intermediate", "advanced"];
const FIELD_CLASS = "text-xs font-semibold text-fg-2 uppercase tracking-wider";

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
  const [newLessonDuration, setNewLessonDuration] = useState("");
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
        // Core Identification (Cols 1-8)
        vendor: course.vendor ?? "",
        platform: course.platform ?? "",
        portfolio: course.portfolio ?? "",
        product: course.product ?? "",
        nfolks_course_code: course.nfolks_course_code ?? "",
        ibm_course_codes: course.ibm_course_codes ?? "",
        status: course.status ?? "backlog",
        course_name: course.course_name ?? "",

        // Modality, Duration & Course Outline (Cols 9-13, 22)
        course_outline_status: course.course_outline_status ?? "",
        modality: course.modality ?? "",
        duration_days: course.duration_days ? String(course.duration_days) : "",
        num_hours: course.num_hours ? String(course.num_hours) : "",
        on_ibm_pmt: course.on_ibm_pmt ?? "",
        link_to_course_outline: course.link_to_course_outline ?? "",

        // Operations, Schedule & Ownership (Cols 14-20)
        lab_location: course.lab_location ?? "",
        ibm_retirement_date: course.ibm_retirement_date ?? "",
        ip_owner: course.ip_owner ?? "",
        course_author_email: course.course_author_email ?? "",
        planned_completion_date: course.planned_completion_date ?? "",
        release_date: course.release_date ?? "",
        retire_date: course.retire_date ?? "",

        // Curriculum, Audience & Lab Specifications (Cols 21, 23-28)
        course_description: course.course_description ?? "",
        skill_level: course.skill_level ?? "",
        max_students: course.max_students ? String(course.max_students) : "",
        pre_reqs: course.pre_reqs ?? "",
        persona_audience_type: course.persona_audience_type ?? "",
        lab_configuration: course.lab_configuration ?? "",
        delivery_instruction_notes: course.delivery_instruction_notes ?? "",

        // Financials, Credentials & Metadata (Cols 29-36)
        instructor_daily_rate: course.instructor_daily_rate ? String(course.instructor_daily_rate) : "",
        materials_cost: course.materials_cost ? String(course.materials_cost) : "",
        lab_cost: course.lab_cost ? String(course.lab_cost) : "",
        learning_path: course.learning_path ?? "",
        badge: course.badge ?? "",
        certification: course.certification ?? "",
        notes: course.notes ?? "",
        record_source: course.record_source ?? "",
      });
    }
  }, [course]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateCourse.mutateAsync({ id: courseId, body: nullifyEmptyStrings(form) as never });
      toast.success("Course changes saved successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return;
    try {
      await createLesson.mutateAsync({
        title: newLessonTitle.trim(),
        duration_minutes: newLessonDuration ? Number(newLessonDuration) : undefined,
        sequence_order: (lessons?.length ?? 0) + 1,
      });
      setNewLessonTitle("");
      setNewLessonDuration("");
      toast.success("Lesson added successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading || !course) {
    return <div className="p-6 text-sm text-muted-foreground">Loading course details…</div>;
  }

  return (
    <div className="relative flex flex-col gap-4 pb-12">
      {/* ── STICKY TOP HEADER WITH FIXED TOP RIGHT CONTROLS ── */}
      <div className="sticky -top-4 z-30 -mt-4 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-md border-b border-border shadow-xs flex items-center justify-between gap-3">
        {/* Left: Back button + Code, Course Title, and Badges */}
        <div className="min-w-0 flex-1 flex items-center gap-2.5 overflow-hidden">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate("/courses")}
            className="h-8 px-2.5 gap-1.5 text-xs font-semibold text-fg-2 hover:text-fg-1 hover:bg-secondary cursor-pointer shrink-0 border border-border/70 shadow-2xs"
            title="Back to courses list"
          >
            <ArrowLeft className="size-3.5" />
            <span>Courses</span>
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          <span className="text-[11px] font-bold text-primary uppercase tracking-wider shrink-0 font-mono">
            {course.nfolks_course_code}
          </span>
          <h1
            className="text-base font-bold text-fg-1 truncate tracking-tight min-w-0"
            title={course.course_name}
          >
            {course.course_name}
          </h1>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <StatusBadge label={formatEnumLabel(course.status)} tone={courseStatusTone(course.status)} />
            {course.platform && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-fg-2">
                {course.platform}
              </span>
            )}
            {course.product && (
              <span className="rounded-md bg-accent/70 px-2 py-0.5 text-xs font-medium text-fg-2">
                {course.product}
              </span>
            )}
          </div>
        </div>

        {/* Right: Permanently fixed at extreme top right corner */}
        <div className="shrink-0 flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateCourse.isPending}
            className="h-8 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer shrink-0"
            title="Save changes to course"
          >
            <Save className="size-3.5" />
            <span>Save changes</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer shrink-0"
            title="Delete course"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <TabStrip
        tabs={
          [
            { id: "details", label: "Course Details & All Fields", icon: FileText },
            { id: "lessons", label: `Curriculum & Lessons${lessons && lessons.length > 0 ? ` (${lessons.length})` : ""}`, icon: BookOpen },
            { id: "preview", label: "Syllabus Preview", icon: Eye },
          ] satisfies TabDef<DetailTab>[]
        }
        active={activeTab}
        onChange={setActiveTab}
        ariaLabel="Course sections"
      />

      <div className="flex-1">
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* ── SECTION 1: CORE IDENTIFICATION & TAXONOMY (Cols 1-8) ── */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-2.5">
                  <Layers className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-fg-1">Core Identification & Hierarchy</h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Course Name</label>
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
                    <label className={FIELD_CLASS}>Course Code</label>
                    <Input value={form.nfolks_course_code ?? ""} onChange={set("nfolks_course_code")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>IBM Course Codes</label>
                    <Input placeholder="e.g. 6X101G, W701G" value={form.ibm_course_codes ?? ""} onChange={set("ibm_course_codes")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>on IBM PMT</label>
                    <Input placeholder="e.g. Yes / No / Planned" value={form.on_ibm_pmt ?? ""} onChange={set("on_ibm_pmt")} />
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
                </div>
              </CardContent>
            </Card>

            {/* ── SECTION 2: MODALITY, DURATION & OUTLINE (Cols 9-13, 22) ── */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-2.5">
                  <Calendar className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-fg-1">Modality, Duration & Outline Tracking</h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Modality</label>
                    <Input placeholder="e.g. ILT, VILT, Blended" value={form.modality ?? ""} onChange={set("modality")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Duration (days)</label>
                    <Input type="number" step="0.5" value={form.duration_days ?? ""} onChange={set("duration_days")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Number of Hours</label>
                    <Input type="number" step="1" value={form.num_hours ?? ""} onChange={set("num_hours")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Course Outline Status</label>
                    <Select value={form.course_outline_status ?? ""} onChange={set("course_outline_status")}>
                      <option value="">— Unspecified —</option>
                      {OUTLINE_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {formatEnumLabel(s)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="col-span-1 sm:col-span-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className={FIELD_CLASS}>Link to Course Outline</label>
                      {form.link_to_course_outline && (
                        <a
                          href={form.link_to_course_outline}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <span>Open</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://... or shared document link"
                        value={form.link_to_course_outline ?? ""}
                        onChange={set("link_to_course_outline")}
                        className="flex-1 font-mono text-xs"
                      />
                      {form.link_to_course_outline && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(form.link_to_course_outline ?? "");
                            toast.success("Course outline link copied to clipboard");
                          }}
                          className="h-9 px-3 text-xs font-semibold gap-1.5 shrink-0 border-border hover:bg-secondary cursor-pointer"
                          title="Copy outline link to clipboard"
                        >
                          <Copy className="size-3.5" />
                          <span>Copy</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* ── SECTION 3: CURRICULUM, AUDIENCE & LAB SETUP (Cols 21, 23-28) ── */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-2.5">
                  <Award className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-fg-1">Curriculum, Audience & Lab Specifications</h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  <div className="col-span-1 sm:col-span-3 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Course Description</label>
                    <Textarea rows={3} value={form.course_description ?? ""} onChange={set("course_description")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Skill Level</label>
                    <Select value={form.skill_level ?? ""} onChange={set("skill_level")}>
                      <option value="">— Unspecified —</option>
                      {SKILL_LEVEL_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {formatEnumLabel(s)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Max students</label>
                    <Input type="number" placeholder="e.g. 15" value={form.max_students ?? ""} onChange={set("max_students")} />
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Pre Reqs</label>
                    <Textarea rows={3} placeholder="e.g. Linux fundamentals, Python basics" value={form.pre_reqs ?? ""} onChange={set("pre_reqs")} />
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Persona</label>
                    <Textarea rows={3} placeholder="e.g. Solutions Architects, SecOps Engineers, Data Analysts" value={form.persona_audience_type ?? ""} onChange={set("persona_audience_type")} />
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Lab Configuration</label>
                    <Input placeholder="Cluster size, VM specs, cloud accounts" value={form.lab_configuration ?? ""} onChange={set("lab_configuration")} />
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Delivery Instruction Notes</label>
                    <Input placeholder="Instructor setup instructions, materials prep" value={form.delivery_instruction_notes ?? ""} onChange={set("delivery_instruction_notes")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── SECTION 4: OPERATIONS, SCHEDULE & OWNERSHIP (Cols 14-20) ── */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-2.5">
                  <Calendar className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-fg-1">Operations, Schedule & Ownership</h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Lab Location (ITZ , nFolks, Instructor owned, N/A)</label>
                    <Select value={form.lab_location ?? ""} onChange={set("lab_location")}>
                      <option value="">— Unspecified —</option>
                      {LAB_LOCATION_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>IP Owner (nFolks, SubK)</label>
                    <Select value={form.ip_owner ?? ""} onChange={set("ip_owner")}>
                      <option value="">— Unspecified —</option>
                      {IP_OWNER_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Course Author Email</label>
                    <Input type="email" placeholder="author@nfolks.com" value={form.course_author_email ?? ""} onChange={set("course_author_email")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Planned Completion Date</label>
                    <Input type="date" value={form.planned_completion_date ?? ""} onChange={set("planned_completion_date")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Release Date</label>
                    <Input type="date" value={form.release_date ?? ""} onChange={set("release_date")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Retire Date</label>
                    <Input type="date" value={form.retire_date ?? ""} onChange={set("retire_date")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>IBM retirement date</label>
                    <Input type="date" value={form.ibm_retirement_date ?? ""} onChange={set("ibm_retirement_date")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── SECTION 5: FINANCIALS, CREDENTIALS & METADATA (Cols 29-36) ── */}
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-2.5">
                  <DollarSign className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-fg-1">Financials, Credentials & Metadata</h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Instructor Daily rate</label>
                    <Input placeholder="e.g. 1500.00" value={form.instructor_daily_rate ?? ""} onChange={set("instructor_daily_rate")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Materials Cost</label>
                    <Input placeholder="e.g. 120.00" value={form.materials_cost ?? ""} onChange={set("materials_cost")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Lab Cost</label>
                    <Input placeholder="e.g. 250.00" value={form.lab_cost ?? ""} onChange={set("lab_cost")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Learning Path</label>
                    <Input placeholder="e.g. Security Specialist Track" value={form.learning_path ?? ""} onChange={set("learning_path")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Badge</label>
                    <Input placeholder="e.g. IBM Certified Specialist" value={form.badge ?? ""} onChange={set("badge")} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Certification</label>
                    <Input placeholder="e.g. C1000-058" value={form.certification ?? ""} onChange={set("certification")} />
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Record Source</label>
                    <Input value={form.record_source ?? ""} onChange={set("record_source")} />
                  </div>

                  <div className="col-span-1 sm:col-span-4 flex flex-col gap-1.5">
                    <label className={FIELD_CLASS}>Notes</label>
                    <Textarea rows={2} value={form.notes ?? ""} onChange={set("notes")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "lessons" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5 bg-card/60 p-3 rounded-xl border border-border">
              <div className="flex-1 min-w-[240px]">
                <Input
                  placeholder="New lesson / class title…"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
                />
              </div>
              <div className="w-44">
                <Input
                  type="number"
                  min="1"
                  placeholder="Timeline (mins)"
                  value={newLessonDuration}
                  onChange={(e) => setNewLessonDuration(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
                />
              </div>
              <Button size="sm" onClick={handleAddLesson} disabled={createLesson.isPending}>
                <Plus className="size-4 mr-1" /> Add lesson
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {(lessons ?? []).map((l, index) => (
                <Card key={l.id}>
                  <CardContent className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-fg-3 w-6">{index + 1}.</span>
                      <div>
                        <div className="text-sm font-medium">{l.title}</div>
                        <div className="flex items-center gap-2 text-xs text-fg-3 mt-0.5">
                          {l.duration_minutes && <span>{l.duration_minutes} mins</span>}
                          {l.attachment_content_type && (
                            <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] uppercase font-bold text-fg-2">
                              {l.attachment_content_type}
                            </span>
                          )}
                          {l.attachment_url && <span className="truncate max-w-xs">{l.attachment_url}</span>}
                          {l.attachment_s3_key && <span className="text-primary font-medium">Uploaded file in S3</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(l.attachment_url || l.attachment_s3_key || l.description?.trim()) && (
                        <Button size="sm" variant="ghost" onClick={() => openViewer(l)} className="h-8 text-xs">
                          <Eye className="size-3.5 mr-1" /> Preview
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setAttachmentLesson(l)} className="h-8 text-xs">
                        <Paperclip className="size-3.5 mr-1" /> Edit content
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLesson.mutateAsync(l.id)}
                        className="h-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!lessons || lessons.length === 0) && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  No lessons defined for this course yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <CoursePreview
            course={course}
            lessons={lessons ?? []}
            onOpenAttachment={(lesson) => openViewer(lesson)}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete course"
        description="Are you sure you want to permanently delete this course? All lessons will also be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteCourse.mutateAsync(courseId);
          navigate("/courses");
        }}
      />

      {attachmentLesson && (
        <LessonAttachmentDialog
          lesson={attachmentLesson}
          open={Boolean(attachmentLesson)}
          onOpenChange={(open) => !open && setAttachmentLesson(null)}
          courseId={courseId}
        />
      )}

      {viewer && (
        <ContentViewerDialog
          open={Boolean(viewer)}
          onOpenChange={(open) => !open && setViewer(null)}
          title={viewer.title}
          url={viewer.url}
          contentType={viewer.contentType}
          article={viewer.article}
        />
      )}
    </div>
  );
}
