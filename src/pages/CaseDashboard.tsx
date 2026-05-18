import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isValid,
  parseISO,
  startOfToday,
} from "date-fns";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileText,
  Gavel,
  NotebookPen,
  Phone,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { casesAPI, type CaseItem, type Priority, type Stage } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";

const STAGES: Stage[] = ["Filed", "Investigation", "Hearing", "Arguments", "Judgment", "Closed"];
const PRIORITY_STYLES: Record<Priority, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

const hearingSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  court: z.string().optional(),
  hearing_type: z.string().min(1, "Hearing type is required"),
  notes: z.string().optional(),
});

const noteSchema = z.object({
  note_type: z.enum(["internal", "client_call", "document", "meeting"]),
  content: z.string().min(2, "Note content is required"),
});

const updateSchema = z.object({
  summary: z.string().min(2, "Daily summary is required"),
  research_notes: z.string().optional(),
  hours_logged: z.coerce.number().min(0, "Hours must be 0 or more").max(24, "Hours must be <= 24").optional(),
});

const caseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Case summary is required"),
  lawyer_email: z.string().min(1, "Lawyer assignment is required"),
  client_name: z.string().optional(),
  client_number: z.string().optional(),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  case_type: z.string().optional(),
  court: z.string().optional(),
  deadline: z.string().optional(),
});

type HearingForm = z.infer<typeof hearingSchema>;
type NoteForm = z.infer<typeof noteSchema>;
type UpdateForm = z.infer<typeof updateSchema>;
type CaseForm = z.infer<typeof caseSchema>;

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function daysUntil(date?: string) {
  const parsed = parseDate(date);
  if (!parsed) return null;
  return differenceInCalendarDays(parsed, startOfToday());
}

function getStats(cases: CaseItem[]) {
  const active = cases.filter((c) => c.stage !== "Closed").length;
  const today = startOfToday();
  let upcomingHearings = 0;
  let overdue = 0;

  cases.forEach((c) => {
    if (c.deadline) {
      const d = parseDate(c.deadline);
      if (d && isBefore(d, today) && c.stage !== "Closed") overdue += 1;
    }
    (c.hearings || []).forEach((h) => {
      const hd = parseDate(h.date);
      if (hd && !isBefore(hd, today) && !isBefore(addDays(today, 7), hd)) upcomingHearings += 1;
    });
  });

  return { active, upcomingHearings, overdue, total: cases.length };
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-background p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-muted" aria-label={`Close ${title}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-opacity duration-500">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function CaseDashboard() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"hearings" | "notes" | "updates" | "activity">("hearings");
  const [showHearingModal, setShowHearingModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const lawyersQuery = useQuery({
    queryKey: ["lawyers-directory", user?.email],
    queryFn: async () => {
      const { lawyersAPI } = await import("@/lib/api");
      const { data } = await lawyersAPI.directory();
      return data.lawyers || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CaseForm) => casesAPI.create(payload),
    onSuccess: () => {
      setShowCreateModal(false);
      caseForm.reset();
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setToast("Case created successfully");
    },
  });

  const casesQuery = useQuery({
    queryKey: ["cases", user?.email, debouncedSearch, stageFilter],
    queryFn: async () => {
      const { data } = await casesAPI.list({
        search: debouncedSearch || undefined,
        stage: stageFilter === "all" ? undefined : stageFilter,
      });
      return data.cases || [];
    },
  });

  const statsQuery = useQuery({
    queryKey: ["cases-stats", user?.email],
    queryFn: async () => (await casesAPI.stats()).data,
  });

  const cases = casesQuery.data || [];
  const selectedCase = useMemo(() => cases.find((c) => c.id === selectedId) || null, [cases, selectedId]);
  const computedStats = useMemo(() => getStats(cases), [cases]);
  const stats = statsQuery.data || computedStats;

  useEffect(() => {
    if (!selectedId && cases.length > 0) setSelectedId(cases[0].id);
    if (selectedId && !cases.some((c) => c.id === selectedId)) setSelectedId(cases[0]?.id ?? null);
  }, [cases, selectedId]);

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: Stage }) => casesAPI.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setToast("Stage updated");
    },
  });

  const hearingMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: HearingForm }) => casesAPI.addHearing(id, payload),
    onSuccess: () => {
      setShowHearingModal(false);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setToast("Hearing added");
    },
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NoteForm }) => casesAPI.addNote(id, payload),
    onSuccess: () => {
      setShowNoteModal(false);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setToast("Note added");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateForm }) => casesAPI.dailyUpdate(id, payload),
    onSuccess: () => {
      updateForm.reset({ summary: "", research_notes: "", hours_logged: 0 });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setToast("Daily update submitted");
    },
  });

  const remindMutation = useMutation({
    mutationFn: ({ caseId, hearingId }: { caseId: number; hearingId: number }) => casesAPI.remindClient(caseId, hearingId),
    onSuccess: () => setToast("Client reminder sent"),
  });

  const hearingForm = useForm<HearingForm>({
    resolver: zodResolver(hearingSchema),
    defaultValues: { date: "", time: "10:00", court: "", hearing_type: "Regular Hearing", notes: "" },
  });
  const noteForm = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note_type: "internal", content: "" },
  });
  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { summary: "", research_notes: "", hours_logged: 0 },
  });
  const caseForm = useForm<CaseForm>({
    resolver: zodResolver(caseSchema),
    defaultValues: { title: "", description: "", lawyer_email: "", client_name: "", client_number: "", client_email: "", case_type: "Civil", court: "", deadline: "" },
  });

  const hearingItems = [...(selectedCase?.hearings || [])].sort((a, b) => a.date.localeCompare(b.date));
  const notesItems = [...(selectedCase?.notes_log || [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const updatesItems = [...(selectedCase?.daily_updates || [])].sort((a, b) => b.date.localeCompare(a.date));
  const activityItems = [...(selectedCase?.activity_log || [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-24 text-foreground md:px-6">
      <section className="mx-auto mb-6 max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Legal Case Dashboard</h1>
          <div className="flex items-center gap-3">
            {isAdmin() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add Case
              </button>
            )}
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {user?.name?.[0] || "U"}
              </div>
              <span className="max-w-[160px] truncate">{user?.firm_name || user?.name || (isAdmin() ? "Firm Admin" : "Counsel")}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Active Cases" value={stats.active} />
          <StatCard label="Upcoming Hearings" value={stats.upcomingHearings} />
          <StatCard label="Overdue" value={stats.overdue} />
          <StatCard label="Total" value={stats.total} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-3 flex gap-2">
            <label htmlFor="case-search" className="sr-only">Search cases</label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="case-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-primary"
              />
            </div>
            <label htmlFor="stage-filter" className="sr-only">Filter by stage</label>
            <select
              id="stage-filter"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as Stage | "all")}
              className="rounded-lg border border-input bg-background px-2 py-2 text-sm"
            >
              <option value="all">All</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {casesQuery.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border p-3">
                  <div className="mb-2 h-3 w-20 rounded bg-muted" />
                  <div className="mb-2 h-4 w-11/12 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}

            {!casesQuery.isLoading && cases.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No cases found</p>
                <button
                  className="mt-3 rounded-lg border border-input px-3 py-2 text-sm"
                  onClick={() => {
                    setSearch("");
                    setStageFilter("all");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}

            {cases.map((c) => {
              const d = daysUntil(c.deadline);
              const deadlineTone = d === null ? "text-muted-foreground" : d < 0 ? "text-red-500" : d <= 7 ? "text-amber-500" : "text-muted-foreground";
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    c.id === selectedId ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  }`}
                >
                  <p className="font-mono text-[11px] text-muted-foreground">{c.case_no || "—"}</p>
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">{c.lawyer_name || "Unassigned"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[c.priority || "medium"]}`}>
                      {c.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className={deadlineTone}>
                      {d === null ? "No deadline" : d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5">{c.stage}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-card p-4">
          {!selectedCase ? (
            <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">Select a case to view details.</div>
          ) : (
            <>
              <header className="mb-4 border-b border-border pb-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{selectedCase.case_no}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{selectedCase.case_type || "Civil"}</span>
                </div>
                <h2 className="text-xl font-semibold">{selectedCase.title}</h2>
                <p className="line-clamp-2 text-sm text-muted-foreground">{selectedCase.description || "No description provided."}</p>
              </header>

              <div className="mb-4 overflow-x-auto">
                <div className="flex min-w-max gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => stageMutation.mutate({ id: selectedCase.id, stage: s })}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        selectedCase.stage === s ? "border-primary bg-primary/10 text-primary" : "border-border"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border p-3 text-sm"><span className="text-xs text-muted-foreground">Counsel</span><p>{selectedCase.lawyer_name || "—"}</p></div>
                <div className="rounded-lg border border-border p-3 text-sm"><span className="text-xs text-muted-foreground">Client</span><p>{selectedCase.client_name || "—"}</p><p className="text-xs text-muted-foreground">{selectedCase.client_number || "No phone"}</p></div>
                <div className="rounded-lg border border-border p-3 text-sm"><span className="text-xs text-muted-foreground">Court</span><p>{selectedCase.court || "—"}</p></div>
                <div className="rounded-lg border border-border p-3 text-sm"><span className="text-xs text-muted-foreground">Deadline</span><p>{parseDate(selectedCase.deadline) ? format(parseDate(selectedCase.deadline) as Date, "PPP") : "—"}</p></div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
                {[
                  ["hearings", "Hearings"],
                  ["notes", "Notes"],
                  ["updates", "Updates"],
                  ["activity", "Activity"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as typeof activeTab)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${activeTab === key ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "hearings" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Hearings</h3>
                    <button className="rounded-lg border border-input px-3 py-1.5 text-sm" onClick={() => setShowHearingModal(true)}>
                      <Plus className="mr-1 inline h-4 w-4" /> Add Hearing
                    </button>
                  </div>
                  {hearingItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hearings scheduled</p>
                  ) : (
                    hearingItems.map((h) => {
                      const d = daysUntil(h.date);
                      const imminent = d !== null && d >= 0 && d <= 2;
                      return (
                        <div key={h.id} className={`rounded-lg border p-3 ${imminent ? "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10" : "border-border"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{h.hearing_type || "Hearing"}</p>
                              <p className="text-xs text-muted-foreground">{parseDate(h.date) ? format(parseDate(h.date) as Date, "PPP") : h.date} {h.time ? `• ${h.time}` : ""}</p>
                              <p className="text-xs text-muted-foreground">{h.court || selectedCase.court || "Court not specified"}</p>
                              {h.notes ? <p className="mt-1 text-sm">{h.notes}</p> : null}
                            </div>
                            {imminent && (
                              <button
                                className="rounded-lg border border-amber-300 px-2 py-1 text-xs"
                                onClick={() => remindMutation.mutate({ caseId: selectedCase.id, hearingId: h.id })}
                              >
                                Remind Client
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Notes</h3>
                    <button className="rounded-lg border border-input px-3 py-1.5 text-sm" onClick={() => setShowNoteModal(true)}>
                      <Plus className="mr-1 inline h-4 w-4" /> Add Note
                    </button>
                  </div>
                  {notesItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  ) : (
                    notesItems.map((n) => (
                      <article key={n.id} className="rounded-lg border border-border p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {n.note_type === "client_call" && <Phone className="h-3.5 w-3.5" />}
                          {n.note_type === "document" && <FileText className="h-3.5 w-3.5" />}
                          {n.note_type === "meeting" && <Calendar className="h-3.5 w-3.5" />}
                          {n.note_type === "internal" && <NotebookPen className="h-3.5 w-3.5" />}
                          <span>{n.note_type.replace("_", " ")}</span>
                          <span>•</span>
                          <span>{parseDate(n.created_at) ? format(parseDate(n.created_at) as Date, "PPp") : n.created_at}</span>
                        </div>
                        <p className="text-sm">{n.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{n.author}</p>
                      </article>
                    ))
                  )}
                </div>
              )}

              {activeTab === "updates" && (
                <div className="space-y-3">
                  {selectedCase.stage !== "Closed" && !isAdmin() && (
                    <form
                      className="space-y-2 rounded-lg border border-border p-3"
                      onSubmit={updateForm.handleSubmit((payload) => updateMutation.mutate({ id: selectedCase.id, payload }))}
                    >
                      <label className="block text-sm font-medium">Daily summary *</label>
                      <textarea className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...updateForm.register("summary")} />
                      {updateForm.formState.errors.summary ? <p className="text-xs text-red-500">{updateForm.formState.errors.summary.message}</p> : null}
                      <label className="block text-sm font-medium">Research notes</label>
                      <textarea className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...updateForm.register("research_notes")} />
                      <label className="block text-sm font-medium">Hours logged</label>
                      <input type="number" step="0.25" className="w-28 rounded-lg border border-input bg-background p-2 text-sm" {...updateForm.register("hours_logged")} />
                      <button disabled={updateMutation.isPending} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60">
                        {updateMutation.isPending ? "Saving..." : "Submit update"}
                      </button>
                    </form>
                  )}
                  {updatesItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No updates logged</p>
                  ) : (
                    updatesItems.map((u, idx) => (
                      <article key={`${u.date}-${idx}`} className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground">{parseDate(u.date) ? format(parseDate(u.date) as Date, "PPp") : u.date} • {u.author}</p>
                        <p className="mt-1 text-sm">{u.summary}</p>
                        {u.research_notes ? <p className="mt-2 rounded-md bg-muted p-2 text-sm">{u.research_notes}</p> : null}
                        {u.hours_logged ? <p className="mt-1 text-xs text-muted-foreground">{u.hours_logged}h logged</p> : null}
                      </article>
                    ))
                  )}
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-3">
                  {activityItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity recorded</p>
                  ) : (
                    activityItems.map((a) => (
                      <article key={a.id} className="rounded-lg border border-border p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {a.action === "case_created" && <Plus className="h-3.5 w-3.5" />}
                          {a.action === "hearing_added" && <Gavel className="h-3.5 w-3.5" />}
                          {a.action === "daily_update" && <NotebookPen className="h-3.5 w-3.5" />}
                          {a.action === "reminder_sent" && <AlertTriangle className="h-3.5 w-3.5" />}
                          {!["case_created", "hearing_added", "daily_update", "reminder_sent"].includes(a.action) && <Activity className="h-3.5 w-3.5" />}
                          <span>{a.actor}</span>
                          <span>•</span>
                          <span>{parseDate(a.timestamp) ? format(parseDate(a.timestamp) as Date, "PPp") : a.timestamp}</span>
                        </div>
                        <p className="text-sm">{a.details}</p>
                      </article>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </section>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Case">
        <form
          className="space-y-3"
          onSubmit={caseForm.handleSubmit((payload) => createMutation.mutate(payload))}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium">Case Title *</label>
              <input className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("title")} />
              {caseForm.formState.errors.title ? <p className="text-[11px] text-red-500">{caseForm.formState.errors.title.message}</p> : null}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium">Case Summary *</label>
              <textarea rows={3} className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("description")} placeholder="Enter key facts and objective..." />
              {caseForm.formState.errors.description ? <p className="text-[11px] text-red-500">{caseForm.formState.errors.description.message}</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium">Client Name</label>
              <input className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("client_name")} />
            </div>

            <div>
              <label className="block text-sm font-medium">Client Email</label>
              <input type="email" className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("client_email")} />
              {caseForm.formState.errors.client_email ? <p className="text-[11px] text-red-500">{caseForm.formState.errors.client_email.message}</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium">Client Phone</label>
              <input className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("client_number")} />
            </div>

            <div>
              <label className="block text-sm font-medium">Case Type</label>
              <input className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("case_type")} />
            </div>

            <div>
              <label className="block text-sm font-medium">Court</label>
              <input className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("court")} />
            </div>

            <div>
              <label className="block text-sm font-medium">Assign Lawyer *</label>
              <select className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...caseForm.register("lawyer_email")}>
                <option value="">Select lawyer...</option>
                {lawyersQuery.data?.map((l: any) => (
                  <option key={l.email} value={l.email}>{l.name} ({l.active_cases} cases)</option>
                ))}
              </select>
              {caseForm.formState.errors.lawyer_email ? <p className="text-[11px] text-red-500">{caseForm.formState.errors.lawyer_email.message}</p> : null}
            </div>
          </div>

          <button disabled={createMutation.isPending} className="w-full mt-4 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60">
            {createMutation.isPending ? "Creating..." : "Create Case & Assign Lawyer"}
          </button>
        </form>
      </Modal>

      <Modal open={showHearingModal} onClose={() => setShowHearingModal(false)} title="Add Hearing">
        <form
          className="space-y-3"
          onSubmit={hearingForm.handleSubmit((payload) => {
            if (!selectedCase) return;
            hearingMutation.mutate({ id: selectedCase.id, payload });
          })}
        >
          <label className="block text-sm font-medium">Date *</label>
          <input type="date" className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...hearingForm.register("date")} />
          {hearingForm.formState.errors.date ? <p className="text-xs text-red-500">{hearingForm.formState.errors.date.message}</p> : null}

          <label className="block text-sm font-medium">Time</label>
          <input type="time" className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...hearingForm.register("time")} />

          <label className="block text-sm font-medium">Court</label>
          <input className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...hearingForm.register("court")} />

          <label className="block text-sm font-medium">Hearing type *</label>
          <select className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...hearingForm.register("hearing_type")}>
            <option value="Regular Hearing">Regular Hearing</option>
            <option value="Final Arguments">Final Arguments</option>
            <option value="Evidence">Evidence</option>
            <option value="Bail Hearing">Bail Hearing</option>
            <option value="Mediation">Mediation</option>
          </select>

          <label className="block text-sm font-medium">Notes</label>
          <textarea className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...hearingForm.register("notes")} />

          <button disabled={hearingMutation.isPending} className="w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60">
            {hearingMutation.isPending ? "Saving..." : "Add hearing"}
          </button>
        </form>
      </Modal>

      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note">
        <form
          className="space-y-3"
          onSubmit={noteForm.handleSubmit((payload) => {
            if (!selectedCase) return;
            noteMutation.mutate({ id: selectedCase.id, payload });
          })}
        >
          <label className="block text-sm font-medium">Type *</label>
          <select className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...noteForm.register("note_type")}>
            <option value="internal">Internal</option>
            <option value="client_call">Client call</option>
            <option value="document">Document</option>
            <option value="meeting">Meeting</option>
          </select>

          <label className="block text-sm font-medium">Content *</label>
          <textarea className="w-full rounded-lg border border-input bg-background p-2 text-sm" {...noteForm.register("content")} />
          {noteForm.formState.errors.content ? <p className="text-xs text-red-500">{noteForm.formState.errors.content.message}</p> : null}

          <button disabled={noteMutation.isPending} className="w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60">
            {noteMutation.isPending ? "Saving..." : "Add note"}
          </button>
        </form>
      </Modal>

      {toast && (
        <div className="fixed bottom-4 right-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200">
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          {toast}
        </div>
      )}
    </main>
  );
}
