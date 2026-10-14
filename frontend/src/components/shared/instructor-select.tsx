import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Search, UserCheck, X, Sparkles, Briefcase, GraduationCap } from "lucide-react";
import { useInstructors } from "@/hooks/use-instructors";

interface InstructorSelectProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function InstructorSelect({
  selectedIds,
  onChange,
  disabled = false,
  placeholder = "Search and select instructors…",
  className = "",
}: InstructorSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "name" | "skill" | "product">("all");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch all instructors for selection
  const { data: instructors = [], isLoading } = useInstructors();

  // Position calculation for portal floating overlay
  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < 320 && rect.top > 320;

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      placeAbove,
    });
  };

  useEffect(() => {
    if (open) {
      updateCoords();
      const handleReposition = () => updateCoords();
      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, true);
      return () => {
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition, true);
      };
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Focus search input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [open]);

  // Filter instructors based on search and active filter tab
  const filteredInstructors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return instructors;

    return instructors.filter((inst) => {
      const matchName = inst.name?.toLowerCase().includes(q) || inst.email?.toLowerCase().includes(q);
      const matchProduct = inst.product?.toLowerCase().includes(q) || inst.platform?.toLowerCase().includes(q);
      const matchSkill =
        inst.skills_products?.toLowerCase().includes(q) || inst.courses_can_teach?.toLowerCase().includes(q);

      if (filterType === "name") return matchName;
      if (filterType === "product") return matchProduct;
      if (filterType === "skill") return matchSkill;
      return matchName || matchProduct || matchSkill;
    });
  }, [instructors, search, filterType]);

  const selectedInstructors = useMemo(() => {
    return instructors.filter((inst) => selectedIds.includes(inst.id));
  }, [instructors, selectedIds]);

  const toggleInstructor = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeInstructor = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== id));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Box */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            updateCoords();
            setOpen((prev) => !prev);
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            updateCoords();
            setOpen((prev) => !prev);
          }
        }}
        className={`min-h-9 w-full rounded-lg border border-input/60 bg-secondary px-2.5 py-1.5 text-sm transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20 cursor-pointer flex items-center justify-between gap-2 ${
          disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : "hover:border-input"
        } ${open ? "border-ring ring-1 ring-ring/20" : ""}`}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {selectedInstructors.length > 0 ? (
            selectedInstructors.map((inst) => (
              <span
                key={inst.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-fg-1 shadow-2xs group"
              >
                <span className="font-semibold text-primary">{inst.name}</span>
                {inst.product && (
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1 rounded">
                    {inst.product}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => removeInstructor(inst.id, e)}
                  className="text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-xs p-0.5 transition-colors cursor-pointer"
                  title={`Remove ${inst.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-fg-1 px-1 py-0.5 rounded hover:bg-secondary/80 mr-1"
              title="Clear all selected"
            >
              Clear
            </button>
          )}
          <ChevronsUpDown className="size-4 opacity-70" />
        </div>
      </div>

      {/* Floating Dropdown via Portal to avoid any overflow-hidden clipping */}
      {open && coords && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: coords.placeAbove ? undefined : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            minWidth: "340px",
            maxWidth: "calc(100vw - 32px)",
            zIndex: 9999,
          }}
          className="rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-md overflow-hidden text-popover-foreground transition-all animate-in fade-in-0 zoom-in-95"
        >
          {/* Header & Search */}
          <div className="p-2.5 border-b border-border bg-secondary/40 flex flex-col gap-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type name, skill, or product to filter…"
                className="w-full rounded-lg border border-input/60 bg-secondary pl-8 pr-7 py-1.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/20 text-fg-1 placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-muted-foreground hover:text-fg-1"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Criteria Pills */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider mr-1">Match:</span>
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-2 py-0.5 rounded-md transition-colors font-medium cursor-pointer ${
                  filterType === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary text-muted-foreground hover:text-fg-1 hover:bg-secondary/80"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType("name")}
                className={`px-2 py-0.5 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer ${
                  filterType === "name"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary text-muted-foreground hover:text-fg-1 hover:bg-secondary/80"
                }`}
              >
                <UserCheck className="size-3" /> Name
              </button>
              <button
                type="button"
                onClick={() => setFilterType("skill")}
                className={`px-2 py-0.5 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer ${
                  filterType === "skill"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary text-muted-foreground hover:text-fg-1 hover:bg-secondary/80"
                }`}
              >
                <Sparkles className="size-3" /> Skill
              </button>
              <button
                type="button"
                onClick={() => setFilterType("product")}
                className={`px-2 py-0.5 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer ${
                  filterType === "product"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary text-muted-foreground hover:text-fg-1 hover:bg-secondary/80"
                }`}
              >
                <Briefcase className="size-3" /> Product
              </button>
            </div>
          </div>

          {/* Instructor List */}
          <div className="max-h-72 overflow-y-auto p-1.5 divide-y divide-border/30">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading instructors…</div>
            ) : filteredInstructors.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <GraduationCap className="size-6 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-fg-2">No matching instructors found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Try adjusting your search query or switching the filter tab.
                </p>
              </div>
            ) : (
              filteredInstructors.map((inst) => {
                const isSelected = selectedIds.includes(inst.id);
                // Parse comma-separated skills
                const skills = inst.skills_products
                  ? inst.skills_products
                      .split(/[,;\n]/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                  : [];

                return (
                  <div
                    key={inst.id}
                    onClick={() => toggleInstructor(inst.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? "bg-primary/10 hover:bg-primary/15"
                        : "hover:bg-secondary/70"
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={`size-4 mt-0.5 rounded flex items-center justify-center shrink-0 transition-colors border ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-secondary"
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>

                    {/* Instructor Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <span className="font-semibold text-fg-1 truncate text-xs">
                          {inst.name}
                        </span>
                        {inst.product && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-secondary border border-border text-fg-2 truncate shrink-0">
                            {inst.product}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-muted-foreground truncate mb-1">
                        {inst.email}
                        {inst.location && ` • ${inst.location}`}
                      </div>

                      {/* Skills & tags */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded bg-secondary/80 border border-border/50 px-1.5 py-0.2 text-[10px] font-medium text-fg-2"
                            >
                              {skill}
                            </span>
                          ))}
                          {inst.skills_products && inst.skills_products.split(",").length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{inst.skills_products.split(",").length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border bg-secondary/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {selectedIds.length} instructor{selectedIds.length === 1 ? "" : "s"} selected
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-medium text-primary hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
