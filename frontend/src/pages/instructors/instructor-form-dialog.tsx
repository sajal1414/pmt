import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateInstructor, useUpdateInstructor } from "@/hooks/use-instructors";
import { useCourses } from "@/hooks/use-courses";
import { getErrorMessage } from "@/lib/api";
import type { Instructor } from "@/lib/types";
import { StatusBadge, courseStatusTone, formatEnumLabel } from "@/components/shared/status-badge";
import { BookOpen, Plus, X, Search, ExternalLink } from "lucide-react";

const TRAVEL_OPTIONS = ["can_travel", "virtual_only", "in_person_only", "both"];
const FIELD_CLASS = "text-xs font-medium text-fg-2";
const CATALOG_COURSES_PARAMS = { limit: 300 };
const EMPTY = {
  name: "",
  email: "",
  phone: "",
  location: "",
  travel_preference: "",
  vendor: "",
  platform: "",
  portfolio: "",
  product: "",
  skills_products: "",
  courses_can_teach: "",
  comments: "",
};

export function InstructorFormDialog({
  open,
  onOpenChange,
  instructor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
}) {
  const navigate = useNavigate();
  const createInstructor = useCreateInstructor();
  const updateInstructor = useUpdateInstructor();
  const coursesQuery = useCourses(CATALOG_COURSES_PARAMS, { enabled: open });
  const allCourses = coursesQuery.data ?? [];

  const handleCourseClick = (courseId: number) => {
    onOpenChange(false);
    navigate(`/courses/${courseId}`);
  };

  const [form, setForm] = useState(EMPTY);
  const [ownedCourseIds, setOwnedCourseIds] = useState<number[]>([]);
  const [externalCourses, setExternalCourses] = useState<string[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [externalInput, setExternalInput] = useState("");
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (instructor) {
      setForm({
        name: instructor.name,
        email: instructor.email,
        phone: instructor.phone ?? "",
        location: instructor.location ?? "",
        travel_preference: instructor.travel_preference ?? "",
        vendor: instructor.vendor ?? "",
        platform: instructor.platform ?? "",
        portfolio: instructor.portfolio ?? "",
        product: instructor.product ?? "",
        skills_products: instructor.skills_products ?? "",
        courses_can_teach: instructor.courses_can_teach ?? "",
        comments: instructor.comments ?? "",
      });

      const initialCatalog = instructor.courses_owned
        ?.filter((c) => c.in_repository && c.id != null)
        .map((c) => c.id as number) ?? [];
      setOwnedCourseIds(initialCatalog);

      const extFromOwned = instructor.courses_owned
        ?.filter((c) => !c.in_repository)
        .map((c) => c.course_name) ?? [];
      const extFromField = instructor.external_courses_owned
        ? instructor.external_courses_owned.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
        : [];
      setExternalCourses(Array.from(new Set([...extFromOwned, ...extFromField])));
    } else {
      setForm(EMPTY);
      setOwnedCourseIds([]);
      setExternalCourses([]);
    }
    setCatalogSearch("");
    setShowCatalogPicker(false);
    setExternalInput("");
  }, [instructor, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(event.target as Node)) {
        setShowCatalogPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAddCatalogCourse = (courseId: number) => {
    if (!ownedCourseIds.includes(courseId)) {
      setOwnedCourseIds([...ownedCourseIds, courseId]);
    }
    setCatalogSearch("");
    setShowCatalogPicker(false);
  };

  const handleRemoveCatalogCourse = (courseId: number) => {
    setOwnedCourseIds(ownedCourseIds.filter((id) => id !== courseId));
  };

  const handleAddExternalCourse = () => {
    const trimmed = externalInput.trim();
    if (!trimmed) return;
    if (!externalCourses.includes(trimmed)) {
      setExternalCourses([...externalCourses, trimmed]);
    }
    setExternalInput("");
  };

  const handleRemoveExternalCourse = (courseName: string) => {
    setExternalCourses(externalCourses.filter((c) => c !== courseName));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    try {
      const payload = {
        ...form,
        phone: form.phone.trim() || null,
        owned_course_ids: ownedCourseIds,
        external_courses_owned: externalCourses.join("; "),
      };
      if (instructor) {
        await updateInstructor.mutateAsync({ id: instructor.id, body: payload as never });
        toast.success("Instructor updated");
      } else {
        await createInstructor.mutateAsync(payload as never);
        toast.success("Instructor created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const pending = createInstructor.isPending || updateInstructor.isPending;

  // Resolve full course objects for ownedCourseIds
  const ownedCatalogCourses = ownedCourseIds
    .map((id) => allCourses.find((c) => c.id === id) || instructor?.courses_owned?.find((c) => c.id === id))
    .filter(Boolean);

  const availableToAdd = allCourses.filter(
    (c) =>
      !ownedCourseIds.includes(c.id) &&
      (!catalogSearch.trim() ||
        c.course_name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (c.nfolks_course_code && c.nfolks_course_code.toLowerCase().includes(catalogSearch.toLowerCase())))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[88vh] overflow-y-auto overflow-x-hidden p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>{instructor ? "Edit instructor" : "New instructor"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-1">
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Name *</label>
            <Input value={form.name} onChange={set("name")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Email *</label>
            <Input value={form.email} onChange={set("email")} type="email" disabled={!!instructor} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Phone Number</label>
            <Input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Location</label>
            <Input value={form.location} onChange={set("location")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Travel preference</label>
            <Select value={form.travel_preference} onChange={set("travel_preference")}>
              <option value="">—</option>
              {TRAVEL_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatEnumLabel(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Vendor</label>
            <Input value={form.vendor} onChange={set("vendor")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Platform</label>
            <Input value={form.platform} onChange={set("platform")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Portfolio</label>
            <Input value={form.portfolio} onChange={set("portfolio")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Product</label>
            <Input value={form.product} onChange={set("product")} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Skills / products</label>
            <Input value={form.skills_products} onChange={set("skills_products")} placeholder="watsonx Orchestrate, DataStage, ..." />
            <p className="text-xs text-muted-foreground">Comma-separated — this is what the search box on the Instructors list matches against.</p>
          </div>

          {/* ── Courses Can Teach (Course Names, not codes) ── */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Courses Can Teach (Course Names)</label>
            <textarea
              className="min-h-16 w-full rounded-lg border border-input/60 bg-secondary px-2.5 py-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 leading-relaxed"
              value={form.courses_can_teach}
              onChange={set("courses_can_teach")}
              placeholder="e.g. IBM QRadar SOAR Foundations, IBM Maximo Manage Functional..."
            />
            <p className="text-[11px] text-muted-foreground">List of actual course names this instructor is authorized to deliver.</p>
          </div>

          {/* ── Courses They Own ── */}
          <div className="col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BookOpen className="size-3.5" /> Courses They Own ({ownedCatalogCourses.length + externalCourses.length})
              </label>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Owned items list */}
              {ownedCatalogCourses.length > 0 || externalCourses.length > 0 ? (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {/* 1. Catalog Courses (Clickable links to /courses/:id) */}
                  {ownedCatalogCourses.map((c: any) => (
                    <div
                      key={`cat-${c.id}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                          Catalog
                        </span>
                        <span className="font-mono font-semibold text-primary shrink-0">{c.nfolks_course_code}</span>
                        <button
                          type="button"
                          onClick={() => handleCourseClick(c.id)}
                          className="truncate text-fg-1 font-medium hover:text-primary hover:underline inline-flex items-center gap-1 cursor-pointer text-left"
                          title="Open course details"
                        >
                          <span className="truncate">{c.course_name}</span>
                          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge label={formatEnumLabel(c.status)} tone={courseStatusTone(c.status)} />
                        <button
                          type="button"
                          onClick={() => handleRemoveCatalogCourse(c.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Remove course from ownership"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 2. External / Non-repository Courses */}
                  {externalCourses.map((name, idx) => (
                    <div
                      key={`ext-${idx}-${name}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs shadow-2xs"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                          External / Non-Repository
                        </span>
                        <span className="truncate text-fg-1 font-medium">{name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveExternalCourse(name)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Remove external course"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card/60 p-3 text-center text-xs text-muted-foreground">
                  No courses currently owned. Assign from the catalog or add external courses below.
                </div>
              )}

              {/* ── Assign Course from Catalog (Compact, Searchable Picker) ── */}
              <div className="rounded-xl border border-border/80 bg-card p-2.5 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-fg-2 uppercase tracking-wide">
                  Assign Course from Catalog
                </span>
                <div className="relative" ref={pickerContainerRef}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => {
                        setCatalogSearch(e.target.value);
                        setShowCatalogPicker(true);
                      }}
                      onFocus={() => setShowCatalogPicker(true)}
                      placeholder="Type to search and assign from catalog (e.g. HAZ-AT-004)..."
                      className="pl-8 text-xs"
                    />
                  </div>

                  {showCatalogPicker && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg z-50 p-1 divide-y divide-border/30">
                      {availableToAdd.length > 0 ? (
                        availableToAdd.slice(0, 50).map((c) => (
                          <div
                            key={c.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddCatalogCourse(c.id);
                            }}
                            className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-xs transition-colors"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="font-mono font-semibold text-primary shrink-0">{c.nfolks_course_code}</span>
                              <span className="truncate text-fg-1">{c.course_name}</span>
                            </div>
                            <StatusBadge label={formatEnumLabel(c.status)} tone={courseStatusTone(c.status)} />
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          {catalogSearch ? "No matching courses found in catalog" : "All catalog courses already assigned"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Add External / Non-Repository Course ── */}
              <div className="rounded-xl border border-border/80 bg-card p-2.5 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-fg-2 uppercase tracking-wide">
                  Add Course Not in Repository (External / Custom)
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={externalInput}
                    onChange={(e) => setExternalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddExternalCourse();
                      }
                    }}
                    placeholder="Course name (e.g. Advanced Custom LLM Fine-Tuning)..."
                    className="text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddExternalCourse}
                    disabled={!externalInput.trim()}
                    className="gap-1 shrink-0"
                  >
                    <Plus className="size-3.5" /> Add External
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={FIELD_CLASS}>Comments</label>
            <textarea
              className="min-h-16 w-full rounded-lg border border-input/60 bg-secondary px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20"
              value={form.comments}
              onChange={set("comments")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Saving…" : instructor ? "Save changes" : "Create instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
