"use client";

import { useState, useMemo } from "react";
import { useErp } from "@/context/ErpContext";
import { Announcement, CalendarEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Megaphone,
  X,
  CheckSquare,
  Briefcase,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const EVENT_TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  work: "bg-blue-500",
  todo: "bg-orange-400",
  meeting: "bg-purple-500",
};

const EVENT_TYPE_LABELS: Record<CalendarEvent["type"], string> = {
  work: "工作",
  todo: "待辦",
  meeting: "會議",
};

type AnnForm = { title: string; content: string; pinned: boolean };
type EventForm = {
  title: string;
  type: CalendarEvent["type"];
  description: string;
  projectId: string;
  assignedToId: string;
};

const EMPTY_ANN: AnnForm = { title: "", content: "", pinned: false };
const EMPTY_EVT: EventForm = {
  title: "",
  type: "work",
  description: "",
  projectId: "",
  assignedToId: "",
};

export default function HomePage() {
  const {
    currentUser,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementPin,
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
    updateCalendarEvent,
    dailyReports,
    projects,
    employees,
  } = useErp();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [annDialogOpen, setAnnDialogOpen] = useState(false);
  const [evtDialogOpen, setEvtDialogOpen] = useState(false);
  const [annForm, setAnnForm] = useState<AnnForm>(EMPTY_ANN);
  const [evtForm, setEvtForm] = useState<EventForm>(EMPTY_EVT);
  const [deleteAnnTarget, setDeleteAnnTarget] = useState<Announcement | null>(null);
  const [deleteEvtTarget, setDeleteEvtTarget] = useState<CalendarEvent | null>(null);

  const canPublish =
    currentUser?.isManager ||
    currentUser?.permissions.includes("admin.write");

  // Calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const todayStr = today.toISOString().split("T")[0];

  // Events indexed by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    calendarEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [calendarEvents]);

  const reportDateSet = useMemo(() => {
    const set = new Set<string>();
    if (!currentUser) return set;
    dailyReports
      .filter((r) => r.employeeId === currentUser.id)
      .forEach((r) => set.add(r.date));
    return set;
  }, [dailyReports, currentUser]);

  const navMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setViewMonth(m);
    setViewYear(y);
  };

  const padDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // Sorted announcements: pinned first, then by date desc
  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [announcements]
  );

  // Events for selected date
  const selectedEvents = selectedDate
    ? (eventsByDate[selectedDate] ?? [])
    : [];

  const myProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.permissions.includes("admin.read")) return projects.filter(p => p.status === "active");
    return projects.filter(
      (p) => p.status === "active" && currentUser.departmentIds.includes(p.departmentId)
    );
  }, [projects, currentUser]);

  // For todo assignment: employees in same dept (for managers)
  const assignableEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.permissions.includes("admin.read")) return employees.filter(e => e.status === "active");
    return employees.filter(
      (e) => e.status === "active" && e.departmentIds.some((d) => currentUser.departmentIds.includes(d))
    );
  }, [employees, currentUser]);

  const handleSaveAnnouncement = () => {
    if (!currentUser || !annForm.title || !annForm.content) {
      toast.error("請填寫標題與內容");
      return;
    }
    addAnnouncement({
      title: annForm.title,
      content: annForm.content,
      pinned: annForm.pinned,
      authorId: currentUser.id,
      authorName: currentUser.name,
    });
    toast.success("公告已發佈");
    setAnnForm(EMPTY_ANN);
    setAnnDialogOpen(false);
  };

  const handleSaveEvent = () => {
    if (!currentUser || !evtForm.title || !selectedDate) {
      toast.error("請填寫標題");
      return;
    }
    addCalendarEvent({
      title: evtForm.title,
      date: selectedDate,
      type: evtForm.type,
      description: evtForm.description,
      projectId: evtForm.projectId || undefined,
      assignedToId: evtForm.assignedToId || undefined,
      createdById: currentUser.id,
      completed: false,
    });
    toast.success("已新增行事曆事項");
    setEvtForm(EMPTY_EVT);
    setEvtDialogOpen(false);
  };

  const handleToggleComplete = (evt: CalendarEvent) => {
    updateCalendarEvent(evt.id, { completed: !evt.completed });
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">首頁</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          公司公告與行事曆
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Left: Calendar ─────────────────────────────── */}
        <div className="space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {viewYear} 年 {viewMonth + 1} 月
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => navMonth(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                }}
              >
                今天
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navMonth(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="border rounded-xl border-border bg-card overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`py-2 text-center text-xs font-medium ${
                    i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: totalCells }).map((_, idx) => {
                const dayNum = idx - firstDayOfWeek + 1;
                const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                const dateStr = isCurrentMonth
                  ? padDate(viewYear, viewMonth, dayNum)
                  : null;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayEvents = dateStr ? (eventsByDate[dateStr] ?? []) : [];
                const hasReport = dateStr ? reportDateSet.has(dateStr) : false;
                const dow = idx % 7;

                return (
                  <div
                    key={idx}
                    onClick={() => dateStr && setSelectedDate(isSelected ? null : dateStr)}
                    className={`min-h-16 p-1.5 border-b border-r border-border last:border-r-0 transition-colors cursor-pointer ${
                      !isCurrentMonth ? "bg-muted/20" : ""
                    } ${isSelected ? "bg-primary/10" : isCurrentMonth ? "hover:bg-muted/50" : ""}`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <span
                        className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : !isCurrentMonth
                            ? "text-muted-foreground/40"
                            : dow === 0
                            ? "text-red-500"
                            : dow === 6
                            ? "text-blue-500"
                            : "text-foreground"
                        }`}
                      >
                        {isCurrentMonth ? dayNum : ""}
                      </span>
                    </div>
                    {isCurrentMonth && (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {hasReport && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="日報" />
                        )}
                        {dayEvents.slice(0, 4).map((e) => (
                          <span
                            key={e.id}
                            className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPE_COLORS[e.type]}`}
                            title={e.title}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />日報</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />工作</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />待辦</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />會議</span>
          </div>

          {/* Selected date panel */}
          {selectedDate && (
            <div className="border rounded-xl border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">
                  {formatDateLabel(selectedDate)} 的事項
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEvtForm(EMPTY_EVT);
                      setEvtDialogOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    新增
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedDate(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  此日尚無事項
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((evt) => {
                    const canDelete =
                      evt.createdById === currentUser?.id ||
                      currentUser?.permissions.includes("admin.write");
                    const assignedEmp = evt.assignedToId
                      ? employees.find((e) => e.id === evt.assignedToId)
                      : null;
                    return (
                      <div
                        key={evt.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border ${
                          evt.completed ? "opacity-60 bg-muted/30" : "bg-background"
                        } border-border`}
                      >
                        {evt.type === "todo" ? (
                          <button
                            onClick={() => handleToggleComplete(evt)}
                            className="mt-0.5 shrink-0"
                          >
                            <CheckSquare
                              className={`w-4 h-4 ${
                                evt.completed ? "text-green-500" : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ) : (
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${EVENT_TYPE_COLORS[evt.type]}`}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-sm font-medium ${
                                evt.completed ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {evt.title}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {EVENT_TYPE_LABELS[evt.type]}
                            </Badge>
                          </div>
                          {evt.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {evt.description}
                            </p>
                          )}
                          {assignedEmp && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              指派給：{assignedEmp.name}
                            </p>
                          )}
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteEvtTarget(evt)}
                            className="text-muted-foreground hover:text-red-500 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right: Announcements ────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              公司公告
            </h2>
            {canPublish && (
              <Button
                size="sm"
                onClick={() => {
                  setAnnForm(EMPTY_ANN);
                  setAnnDialogOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                發佈公告
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {sortedAnnouncements.length === 0 && (
              <div className="border rounded-xl border-border bg-card p-8 text-center text-muted-foreground text-sm">
                尚無公告
              </div>
            )}
            {sortedAnnouncements.map((ann) => {
              const canManage =
                ann.authorId === currentUser?.id ||
                currentUser?.permissions.includes("admin.write");
              const dateLabel = new Date(ann.createdAt).toLocaleDateString("zh-TW", {
                month: "numeric",
                day: "numeric",
              });
              return (
                <div
                  key={ann.id}
                  className={`border rounded-xl p-4 bg-card ${
                    ann.pinned ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.pinned && (
                          <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                        <h3 className="font-semibold text-sm text-foreground">
                          {ann.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                        {ann.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{ann.authorName}</span>
                        <span>·</span>
                        <span>{dateLabel}</span>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleAnnouncementPin(ann.id)}
                          className="text-muted-foreground hover:text-primary p-1 rounded"
                          title={ann.pinned ? "取消置頂" : "置頂"}
                        >
                          {ann.pinned ? (
                            <PinOff className="w-3.5 h-3.5" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteAnnTarget(ann)}
                          className="text-muted-foreground hover:text-red-500 p-1 rounded"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Announcement Dialog */}
      <Dialog open={annDialogOpen} onOpenChange={(v) => !v && setAnnDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>發佈公告</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>標題 *</Label>
              <Input
                value={annForm.title}
                onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="公告標題"
              />
            </div>
            <div className="space-y-1.5">
              <Label>內容 *</Label>
              <textarea
                className="flex min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="公告內容..."
                value={annForm.content}
                onChange={(e) => setAnnForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={annForm.pinned}
                onChange={(e) => setAnnForm((f) => ({ ...f, pinned: e.target.checked }))}
                className="accent-primary"
              />
              <span className="text-sm">置頂此公告</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveAnnouncement}>發佈</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Event Dialog */}
      <Dialog open={evtDialogOpen} onOpenChange={(v) => !v && setEvtDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              新增事項 {selectedDate ? `— ${formatDateLabel(selectedDate)}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>標題 *</Label>
              <Input
                value={evtForm.title}
                onChange={(e) => setEvtForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="事項名稱"
              />
            </div>
            <div className="space-y-1.5">
              <Label>類型</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={evtForm.type}
                onChange={(e) =>
                  setEvtForm((f) => ({ ...f, type: e.target.value as CalendarEvent["type"] }))
                }
              >
                <option value="work">工作</option>
                <option value="todo">待辦</option>
                <option value="meeting">會議</option>
              </select>
            </div>
            {evtForm.type === "todo" && (
              <div className="space-y-1.5">
                <Label>指派給</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={evtForm.assignedToId}
                  onChange={(e) =>
                    setEvtForm((f) => ({ ...f, assignedToId: e.target.value }))
                  }
                >
                  <option value="">不指派（自己）</option>
                  {assignableEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.position}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>所屬專案</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={evtForm.projectId}
                onChange={(e) =>
                  setEvtForm((f) => ({ ...f, projectId: e.target.value }))
                }
              >
                <option value="">無</option>
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>說明</Label>
              <Input
                value={evtForm.description}
                onChange={(e) =>
                  setEvtForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="備註說明..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvtDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEvent}>新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Announcement */}
      <AlertDialog
        open={!!deleteAnnTarget}
        onOpenChange={(v) => !v && setDeleteAnnTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除公告</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除公告「{deleteAnnTarget?.title}」嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteAnnTarget) {
                  deleteAnnouncement(deleteAnnTarget.id);
                  toast.success("公告已刪除");
                  setDeleteAnnTarget(null);
                }
              }}
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Event */}
      <AlertDialog
        open={!!deleteEvtTarget}
        onOpenChange={(v) => !v && setDeleteEvtTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除事項</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{deleteEvtTarget?.title}」嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteEvtTarget) {
                  deleteCalendarEvent(deleteEvtTarget.id);
                  toast.success("事項已刪除");
                  setDeleteEvtTarget(null);
                }
              }}
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
