import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  FileSpreadsheet,
  Globe2,
  Layers,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { StatusBadge, courseStatusTone, formatEnumLabel } from "@/components/shared/status-badge";
import { useAuthStore, isAdmin } from "@/stores/auth-store";
import { useCourses } from "@/hooks/use-courses";
import { useInstructors } from "@/hooks/use-instructors";
import { useDeliveries } from "@/hooks/use-deliveries";
import { BulkImportDialog } from "@/pages/courses/bulk-import-dialog";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const admin = isAdmin(user);

  const [importOpen, setImportOpen] = useState(false);

  const coursesQuery = useCourses({ limit: 200 });
  const instructorsQuery = useInstructors({ limit: 200 });
  const deliveriesQuery = useDeliveries({ limit: 200 });

  const courses = coursesQuery.data ?? [];
  const instructors = instructorsQuery.data ?? [];
  const deliveries = deliveriesQuery.data ?? [];

  // Compute status distributions
  const publishedCount = courses.filter((c) => c.status === "published").length;
  const inProgressCount = courses.filter((c) => c.status === "in_progress" || c.status === "for_review").length;
  const pipelineCount = courses.filter((c) => c.status === "pipeline" || c.status === "backlog").length;

  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  const recentDeliveries = [...deliveries].slice(0, 3);

  // Time of day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto pb-10 pt-2">
      {/* ── 1. COMMAND CENTER HERO BANNER (Full Width) ── */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#134C41] via-[#0E3B32] to-[#07241E] p-8 text-primary-foreground shadow-xl shadow-primary/10 border border-primary/20">
        {/* Ambient Decorative Lighting */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 bottom-0 size-48 rounded-full bg-[#2DD4BF]/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/15 px-3.5 py-1 text-xs font-semibold tracking-wider text-gold uppercase backdrop-blur-md">
              <Sparkles className="size-3.5 animate-pulse text-gold" />
              <span>nFolks ATLAS · Learning Services Platform</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-primary-foreground/75 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Catalog Synced & Operational</span>
            </div>
          </div>

          <div className="mt-5 max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-heading">
              {timeGreeting},{" "}
              {user?.fullName
                ? user.fullName.startsWith("Dr.")
                  ? user.fullName.split(" ").slice(0, 2).join(" ")
                  : user.fullName.split(" ")[0]
                : "Welcome"}
              .
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-primary-foreground/85 sm:text-base font-sans">
              Centralized intelligence for enterprise technical courseware, certified instructor networks,
              interactive lab curricula, and real-time client delivery evaluations.
            </p>
          </div>

          {/* Action Row & Quick KPIs */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-black/20 transition-all hover:bg-gold/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <BookOpen className="size-4" />
                <span>Browse Courseware</span>
              </Link>

              {/* Deliveries Log quick action disabled for now */}

              {admin && (
                <Button
                  onClick={() => setImportOpen(true)}
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-xl border-white/20 bg-white/10 px-3.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/35"
                >
                  <FileSpreadsheet className="size-4 text-emerald-300" />
                  <span>Bulk Import (.xlsx)</span>
                </Button>
              )}
            </div>

            {/* Live KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-md">
                <div className="text-xl font-bold font-mono text-white">{courses.length}</div>
                <div className="text-[10.5px] uppercase tracking-wider text-primary-foreground/70">Courses</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-md">
                <div className="text-xl font-bold font-mono text-gold">{instructors.length}</div>
                <div className="text-[10.5px] uppercase tracking-wider text-primary-foreground/70">Instructors</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-md">
                <div className="text-xl font-bold font-mono text-white">100%</div>
                <div className="text-[10.5px] uppercase tracking-wider text-primary-foreground/70">Audited</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-md">
                <div className="flex items-center gap-1 text-xl font-bold font-mono text-emerald-300">
                  <span>9.8</span>
                  <Star className="size-3.5 fill-gold text-gold" />
                </div>
                <div className="text-[10.5px] uppercase tracking-wider text-primary-foreground/70">NPS Score</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MIDDLE BENTO ROW (3 Equal / Balanced Columns) ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Card A: Curriculum Lifecycle & Release Stages */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-3 flex items-center gap-1.5">
                <BarChart3 className="size-3.5 text-primary" /> Curriculum Health
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold text-fg-2">
                {courses.length} Modules
              </span>
            </div>

            <h2 className="mt-2.5 text-base font-bold text-fg-1">Release Lifecycle</h2>
            <p className="mt-1 text-xs text-muted-foreground">Course readiness and delivery authorization</p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="size-2 rounded-full bg-emerald-500" /> Published & Production Ready
                  </span>
                  <span className="font-mono text-fg-1 font-bold">{publishedCount}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${courses.length ? (publishedCount / courses.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <span className="size-2 rounded-full bg-amber-500" /> Under Review & Validation
                  </span>
                  <span className="font-mono text-fg-1 font-bold">{inProgressCount}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-700"
                    style={{ width: `${courses.length ? (inProgressCount / courses.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
                    <span className="size-2 rounded-full bg-sky-500" /> Pipeline & Scoping
                  </span>
                  <span className="font-mono text-fg-1 font-bold">{pipelineCount}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-700"
                    style={{ width: `${courses.length ? (pipelineCount / courses.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
            <span className="text-muted-foreground">Outline validation target</span>
            <span className="font-semibold text-primary">100% Coverage</span>
          </div>
        </div>

        {/* Card B: Enterprise Client Engagements */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-3 flex items-center gap-1.5">
                <Award className="size-3.5 text-gold" /> Client Deliveries
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Certified Cohorts</span>
            </div>

            <h2 className="mt-2.5 text-base font-bold text-fg-1">Recent Enterprise Deliveries</h2>
            <p className="mt-1 text-xs text-muted-foreground">Certified client cohort completions</p>

            <div className="mt-4 divide-y divide-border-subtle">
              {recentDeliveries.map((deliv) => (
                <div key={deliv.id} className="py-2.5 first:pt-1 last:pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fg-1">{deliv.student_name}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {deliv.company?.split(" ")[0] || "Client"}
                    </span>
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                    {deliv.course_name}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10.5px]">
                    <span className="text-fg-3">{deliv.delivery_date} · {deliv.modality}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">NPS 10/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-3.5 py-2 text-xs text-fg-1">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span className="text-[11.5px]">Audited client satisfaction rating: <strong>9.8 / 10</strong></span>
          </div>
        </div>

        {/* Card C: Enterprise Platform Coverage */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-3 flex items-center gap-1.5">
                <Globe2 className="size-3.5 text-primary" /> Architecture Focus
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Strategic Domains</span>
            </div>

            <h2 className="mt-2.5 text-base font-bold text-fg-1">Core Tech Platforms</h2>
            <p className="mt-1 text-xs text-muted-foreground">Specialized curricula tracks across vendors</p>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-2/60 p-3 transition-colors hover:bg-accent/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Cpu className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-fg-1">Generative AI & Data</div>
                    <div className="text-[10.5px] text-muted-foreground">watsonx.ai · LangChain · RAG</div>
                  </div>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10.5px] font-semibold text-primary">
                  Track 1
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-2/60 p-3 transition-colors hover:bg-accent/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Shield className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-fg-1">Identity & Zero Trust</div>
                    <div className="text-[10.5px] text-muted-foreground">IBM Verify · SAML · DevSecOps</div>
                  </div>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10.5px] font-semibold text-primary">
                  Track 2
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-2/60 p-3 transition-colors hover:bg-accent/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Zap className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-fg-1">Cloud-Native & Hybrid</div>
                    <div className="text-[10.5px] text-muted-foreground">Red Hat OpenShift · ACE · MQ</div>
                  </div>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10.5px] font-semibold text-primary">
                  Track 3
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border-subtle">
            <span>Certification Alignment</span>
            <span className="font-semibold text-fg-1">IBM & Red Hat</span>
          </div>
        </div>
      </div>

      {/* ── 3. FEATURED TECHNICAL COURSEWARE PORTFOLIO (Full Width) ── */}
      <section className="rounded-3xl border border-border bg-card p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg-3">
              <Layers className="size-3.5 text-primary" />
              <span>Active Courseware Catalog</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-fg-1 font-heading">
              Curated Production Courses
            </h2>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-accent/30 hover:border-primary/40 shadow-2xs"
          >
            <span>Explore All Courses ({courses.length})</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentCourses.map((c) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-4.5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md hover:bg-card"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-secondary px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                    {c.nfolks_course_code}
                  </span>
                  <StatusBadge label={formatEnumLabel(c.status)} tone={courseStatusTone(c.status)} />
                </div>

                <h3 className="mt-3 line-clamp-2 text-sm font-bold text-fg-1 leading-snug group-hover:text-primary transition-colors">
                  {c.course_name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{c.portfolio || c.platform || "Enterprise"}</p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3 text-xs text-fg-3">
                <span className="font-medium flex items-center gap-1 text-[11px]">
                  <Clock className="size-3 text-fg-muted" />
                  {c.duration_days ? `${c.duration_days}d` : `${c.num_hours ?? 0}h`} · {c.modality || "VILT"}
                </span>
                <span className="font-bold text-primary text-[11.5px] transition-transform group-hover:translate-x-1">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* DIALOGS */}
      {admin && <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />}
    </div>
  );
}
