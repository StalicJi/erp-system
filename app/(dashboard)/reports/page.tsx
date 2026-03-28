"use client";

import { useState, useMemo } from "react";
import { useErp } from "@/context/ErpContext";
import { DailyReport } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Clock,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const ACTION_OPTIONS = [
  "需求分析",
  "系統設計",
  "程式開發",
  "測試驗證",
  "文件撰寫",
  "客戶拜訪",
  "提案簡報",
  "電話溝通",
  "報價作業",
  "合約簽訂",
  "招募面試",
  "員工培訓",
  "薪資作業",
  "績效評核",
  "行政庶務",
  "問題排除",
  "系統維護",
  "會議討論",
  "其他",
];

const REGULAR_LIMIT = 8;

type ReportForm = {
  date: string;
  projectId: string;
  action: string;
  customAction: string;
  description: string;
  hours: number;
};

const today = new Date().toISOString().split("T")[0];

const EMPTY_FORM: ReportForm = {
  date: today,
  projectId: "",
  action: "",
  customAction: "",
  description: "",
  hours: 1,
};

export default function ReportsPage() {
  const {
    currentUser,
    dailyReports,
    projects,
    addDailyReport,
    updateDailyReport,
    deleteDailyReport,
    employees,
  } = useErp();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyReport | null>(null);
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM);

  const isManagerView =
    currentUser?.isManager || currentUser?.permissions.includes("admin.read");

  // Reports visible to current user
  const myReports = useMemo(() => {
    if (!currentUser) return [];
    if (isManagerView) {
      const myDeptEmpIds = employees
        .filter((e) =>
          e.departmentIds.some((d) => currentUser.departmentIds.includes(d))
        )
        .map((e) => e.id);
      return dailyReports.filter((r) => myDeptEmpIds.includes(r.employeeId));
    }
    return dailyReports.filter((r) => r.employeeId === currentUser.id);
  }, [dailyReports, currentUser, employees, isManagerView]);

  const filtered = myReports
    .filter((r) => {
      const proj = projects.find((p) => p.id === r.projectId);
      return (
        r.date.includes(search) ||
        r.action.toLowerCase().includes(search.toLowerCase()) ||
        r.description.includes(search) ||
        proj?.name.includes(search) ||
        employees.find((e) => e.id === r.employeeId)?.name.includes(search)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Group by (employeeId, date) for overtime calculation
  // For display, group by date (and by employee if manager view)
  const groupedByDate = useMemo(() => {
    const map: Record<string, DailyReport[]> = {};
    filtered.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // Per (employeeId, date) hour totals for overtime calculation
  const hoursPerEmployeeDate = useMemo(() => {
    const map: Record<string, number> = {};
    myReports.forEach((r) => {
      const key = `${r.employeeId}::${r.date}`;
      map[key] = (map[key] ?? 0) + (r.hours || 0);
    });
    return map;
  }, [myReports]);

  // Overall stats
  const totalRegular = useMemo(() => {
    // Sum regular hours per (employeeId, date)
    const seen = new Set<string>();
    let total = 0;
    Object.entries(hoursPerEmployeeDate).forEach(([key, hours]) => {
      if (!seen.has(key)) {
        seen.add(key);
        total += Math.min(hours, REGULAR_LIMIT);
      }
    });
    return total;
  }, [hoursPerEmployeeDate]);

  const totalOvertime = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    Object.entries(hoursPerEmployeeDate).forEach(([key, hours]) => {
      if (!seen.has(key)) {
        seen.add(key);
        total += Math.max(hours - REGULAR_LIMIT, 0);
      }
    });
    return total;
  }, [hoursPerEmployeeDate]);

  const myProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.permissions.includes("admin.read"))
      return projects.filter((p) => p.status === "active");
    return projects.filter(
      (p) =>
        p.status === "active" &&
        currentUser.departmentIds.includes(p.departmentId)
    );
  }, [projects, currentUser]);

  const getEmployeeName = (id: string) =>
    employees.find((e) => e.id === id)?.name ?? id;

  const set = (k: keyof ReportForm, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Hours already recorded for selected date (current user only)
  const existingHoursForDate = useMemo(() => {
    if (!currentUser || !form.date) return 0;
    const key = `${currentUser.id}::${form.date}`;
    const total = hoursPerEmployeeDate[key] ?? 0;
    // If editing, subtract the existing entry's hours
    if (editTarget && editTarget.employeeId === currentUser.id && editTarget.date === form.date) {
      return Math.max(0, total - editTarget.hours);
    }
    return total;
  }, [currentUser, form.date, hoursPerEmployeeDate, editTarget]);

  const remainingRegular = Math.max(0, REGULAR_LIMIT - existingHoursForDate);
  const willOvertime = !editTarget && existingHoursForDate + form.hours > REGULAR_LIMIT;

  const handleOpenAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleEdit = (report: DailyReport) => {
    setEditTarget(report);
    const isCustom = !ACTION_OPTIONS.slice(0, -1).includes(report.action);
    setForm({
      date: report.date,
      projectId: report.projectId,
      action: isCustom ? "其他" : report.action,
      customAction: isCustom ? report.action : "",
      description: report.description,
      hours: report.hours,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!currentUser) return;
    if (!form.date || !form.projectId || !form.action || !form.description) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    const finalAction =
      form.action === "其他" ? form.customAction || "其他" : form.action;
    const payload = {
      employeeId: currentUser.id,
      date: form.date,
      projectId: form.projectId,
      action: finalAction,
      description: form.description,
      hours: form.hours,
    };
    if (editTarget) {
      updateDailyReport(editTarget.id, payload);
      toast.success("日報已更新");
    } else {
      addDailyReport(payload);
      toast.success("日報已新增");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDailyReport(deleteTarget.id);
    toast.success("日報已刪除");
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工作日報</h1>
          <p className="text-sm text-slate-500 mt-0.5">以天為單位記錄每日工作，超過 8h 計入加班</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          新增日報
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">日報天數</p>
              <p className="text-xl font-bold text-slate-800">
                {new Set(filtered.map((r) => `${r.employeeId}::${r.date}`)).size}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">日報筆數</p>
              <p className="text-xl font-bold text-slate-800">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">正常工時</p>
              <p className="text-xl font-bold text-green-700">{totalRegular}h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">加班工時</p>
              <p className="text-xl font-bold text-orange-600">{totalOvertime}h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="搜尋日期、動作、說明、專案、員工..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grouped by date */}
      {filtered.length === 0 ? (
        <div className="border rounded-lg border-border bg-card py-10 text-center text-slate-400 text-sm">
          {search ? "沒有符合條件的日報" : "尚無日報記錄，點擊「新增日報」開始填寫"}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, reports]) => {
            // Calculate per-employee totals for this date
            const empHoursOnDate: Record<string, number> = {};
            reports.forEach((r) => {
              empHoursOnDate[r.employeeId] = (empHoursOnDate[r.employeeId] ?? 0) + r.hours;
            });

            // Date-level summary
            const uniqueEmps = Object.keys(empHoursOnDate);
            const dateRegular = uniqueEmps.reduce(
              (s, eid) => s + Math.min(empHoursOnDate[eid], REGULAR_LIMIT),
              0
            );
            const dateOvertime = uniqueEmps.reduce(
              (s, eid) => s + Math.max(empHoursOnDate[eid] - REGULAR_LIMIT, 0),
              0
            );

            return (
              <div key={date} className="border rounded-lg border-border bg-card overflow-hidden">
                {/* Date header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-foreground">{date}</span>
                    <span className="text-xs text-green-700 font-medium">
                      正常 {dateRegular}h
                    </span>
                    {dateOvertime > 0 && (
                      <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        加班 {dateOvertime}h
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{reports.length} 筆</span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      {isManagerView && <TableHead className="text-xs">員工</TableHead>}
                      <TableHead className="text-xs">專案</TableHead>
                      <TableHead className="text-xs">動作類別</TableHead>
                      <TableHead className="text-xs">工作說明</TableHead>
                      <TableHead className="text-xs text-right">工時</TableHead>
                      <TableHead className="text-xs text-right">狀態</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => {
                      const proj = projects.find((p) => p.id === report.projectId);
                      const canEdit =
                        report.employeeId === currentUser?.id ||
                        currentUser?.permissions.includes("admin.write");
                      const empTotal = empHoursOnDate[report.employeeId] ?? 0;
                      const isOvertime = empTotal > REGULAR_LIMIT;

                      return (
                        <TableRow key={report.id} className="hover:bg-muted/50">
                          {isManagerView && (
                            <TableCell className="text-sm">
                              {getEmployeeName(report.employeeId)}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {proj?.name ?? "未知專案"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {report.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                            {report.description}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {report.hours}h
                          </TableCell>
                          <TableCell className="text-right">
                            {isOvertime ? (
                              <Badge className="text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-100">
                                含加班
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">
                                正常
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {canEdit && (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={<Button variant="ghost" size="icon" />}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(report)}>
                                    <Pencil className="w-4 h-4 mr-2" /> 編輯
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => setDeleteTarget(report)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> 刪除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "編輯日報" : "新增工作日報"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>日期 *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>工時（小時）*</Label>
                <Input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={form.hours}
                  onChange={(e) => set("hours", parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Hours info for selected date */}
            {form.date && !editTarget && (
              <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                willOvertime
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-muted/50 text-muted-foreground"
              }`}>
                {willOvertime ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>
                  {form.date} 已記錄 {existingHoursForDate}h，
                  尚餘正常工時 {remainingRegular}h。
                  {willOvertime && ` 此次新增後將超出 8h，超出部分計為加班。`}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>所屬專案 *</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.projectId}
                onChange={(e) => set("projectId", e.target.value)}
              >
                <option value="">請選擇專案</option>
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>執行動作 *</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.action}
                onChange={(e) => set("action", e.target.value)}
              >
                <option value="">請選擇動作類別</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {form.action === "其他" && (
              <div className="space-y-1.5">
                <Label>自訂動作說明</Label>
                <Input
                  value={form.customAction}
                  onChange={(e) => set("customAction", e.target.value)}
                  placeholder="請輸入動作名稱"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>工作說明 *</Label>
              <textarea
                className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="詳細描述今日工作內容..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editTarget ? "儲存修改" : "新增日報"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除日報</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此筆日報紀錄嗎？此操作無法還原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
