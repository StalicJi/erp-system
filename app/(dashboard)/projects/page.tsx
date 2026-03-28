"use client";

import { useState, useMemo } from "react";
import { useErp } from "@/context/ErpContext";
import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  FileText,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";

type ProjectForm = {
  name: string;
  description: string;
  departmentId: string;
  managerId: string;
  status: Project["status"];
};

const EMPTY_FORM: ProjectForm = {
  name: "",
  description: "",
  departmentId: "",
  managerId: "",
  status: "active",
};

const STATUS_MAP: Record<
  Project["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  active: { label: "進行中", variant: "default" },
  completed: { label: "已完成", variant: "secondary" },
  paused: { label: "暫停", variant: "outline" },
};

export default function ProjectsPage() {
  const {
    currentUser,
    projects,
    departments,
    dailyReports,
    employees,
    addProject,
    updateProject,
    deleteProject,
  } = useErp();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);

  const isAdmin = currentUser?.permissions.includes("admin.read") ?? false;
  const canWrite = currentUser?.permissions.includes("projects.write") ?? false;

  // Projects visible to this user
  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return projects;
    return projects.filter((p) =>
      currentUser.departmentIds.includes(p.departmentId),
    );
  }, [projects, currentUser, isAdmin]);

  // Employees visible to this user (same department logic)
  const visibleEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return employees;
    return employees.filter((e) =>
      e.departmentIds.some((d) => currentUser.departmentIds.includes(d)),
    );
  }, [employees, currentUser, isAdmin]);

  // Reports visible to this user
  const visibleReports = useMemo(() => {
    const empIds = visibleEmployees.map((e) => e.id);
    return dailyReports.filter((r) => empIds.includes(r.employeeId));
  }, [dailyReports, visibleEmployees]);

  // KPI per employee
  const kpiByEmployee = useMemo(() => {
    const map: Record<
      string,
      { reports: number; hours: number; projects: Set<string> }
    > = {};
    visibleReports.forEach((r) => {
      if (!map[r.employeeId])
        map[r.employeeId] = { reports: 0, hours: 0, projects: new Set() };
      map[r.employeeId].reports++;
      map[r.employeeId].hours += r.hours || 0;
      map[r.employeeId].projects.add(r.projectId);
    });
    return map;
  }, [visibleReports]);

  // KPI per project
  const kpiByProject = useMemo(() => {
    const map: Record<
      string,
      { reports: number; hours: number; contributors: Set<string> }
    > = {};
    visibleReports.forEach((r) => {
      if (!map[r.projectId])
        map[r.projectId] = { reports: 0, hours: 0, contributors: new Set() };
      map[r.projectId].reports++;
      map[r.projectId].hours += r.hours || 0;
      map[r.projectId].contributors.add(r.employeeId);
    });
    return map;
  }, [visibleReports]);

  const set = (k: keyof ProjectForm, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleOpenAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleEdit = (proj: Project) => {
    setEditTarget(proj);
    setForm({
      name: proj.name,
      description: proj.description,
      departmentId: proj.departmentId,
      managerId: proj.managerId ?? "",
      status: proj.status,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.departmentId) {
      toast.error("請填寫專案名稱與所屬部門");
      return;
    }
    const payload = {
      ...form,
      managerId: form.managerId || undefined,
    };
    if (editTarget) {
      updateProject(editTarget.id, payload);
      toast.success("專案已更新");
    } else {
      addProject(payload);
      toast.success("專案已新增");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    toast.success(`已刪除專案：${deleteTarget.name}`);
    setDeleteTarget(null);
  };

  const availableDepts = isAdmin
    ? departments
    : departments.filter((d) => currentUser?.departmentIds.includes(d.id));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">專案管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin ? "所有部門專案概覽" : "我的部門專案與工作 KPI"}
          </p>
        </div>
        {canWrite && (
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新增專案
          </Button>
        )}
      </div>

      <Tabs defaultValue="kpi">
        <TabsList className="mb-4">
          <TabsTrigger value="kpi">KPI 總覽</TabsTrigger>
          <TabsTrigger value="projects">專案列表</TabsTrigger>
          <TabsTrigger value="reports">日報記錄</TabsTrigger>
        </TabsList>

        {/* ─── KPI Tab ─────────────────────────────────── */}
        <TabsContent value="kpi">
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-1">可見專案</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {visibleProjects.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-1">日報筆數</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {visibleReports.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-1">總工時</p>
                  <p className="text-2xl font-bold text-green-600">
                    {visibleReports.reduce((s, r) => s + (r.hours || 0), 0)}h
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-1">參與員工</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(visibleReports.map((r) => r.employeeId)).size}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Employee KPI */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">員工工作 KPI</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>員工</TableHead>
                      <TableHead>部門</TableHead>
                      <TableHead className="text-right">日報筆數</TableHead>
                      <TableHead className="text-right">總工時</TableHead>
                      <TableHead className="text-right">參與專案</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleEmployees
                      .filter((e) => e.status === "active")
                      .map((emp) => {
                        const kpi = kpiByEmployee[emp.id] || {
                          reports: 0,
                          hours: 0,
                          projects: new Set(),
                        };
                        const deptNames = departments
                          .filter((d) => emp.departmentIds.includes(d.id))
                          .map((d) => d.name);
                        return (
                          <TableRow key={emp.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                    {emp.name.slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {emp.name}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {emp.position}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {deptNames.map((n) => (
                                  <Badge
                                    key={n}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {n}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  kpi.reports === 0
                                    ? "text-slate-300"
                                    : "font-medium text-blue-600"
                                }
                              >
                                {kpi.reports}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  kpi.hours === 0
                                    ? "text-slate-300"
                                    : "font-medium text-green-600"
                                }
                              >
                                {kpi.hours}h
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  kpi.projects.size === 0
                                    ? "text-slate-300"
                                    : "font-medium"
                                }
                              >
                                {kpi.projects.size}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {visibleEmployees.filter((e) => e.status === "active")
                      .length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-slate-400"
                        >
                          無員工資料
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Projects Tab ─────────────────────────────── */}
        <TabsContent value="projects">
          <div className="border rounded-lg border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>專案名稱</TableHead>
                  <TableHead>所屬部門</TableHead>
                  <TableHead>專案經理</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">日報筆數</TableHead>
                  <TableHead className="text-right">累計工時</TableHead>
                  <TableHead className="text-right">參與人數</TableHead>
                  {canWrite && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProjects.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-slate-400"
                    >
                      尚無專案
                    </TableCell>
                  </TableRow>
                )}
                {visibleProjects.map((proj) => {
                  const kpi = kpiByProject[proj.id] || {
                    reports: 0,
                    hours: 0,
                    contributors: new Set(),
                  };
                  const dept = departments.find(
                    (d) => d.id === proj.departmentId,
                  );
                  const st = STATUS_MAP[proj.status];
                  return (
                    <TableRow key={proj.id} className="hover:bg-muted/50">
                      <TableCell>
                        <p className="font-medium text-sm">{proj.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">
                          {proj.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {dept?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {proj.managerId
                          ? employees.find((e) => e.id === proj.managerId)?.name ?? "—"
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="text-xs">
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-blue-600">
                        {kpi.reports}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-green-600">
                        {kpi.hours}h
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {kpi.contributors.size}
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button variant="ghost" size="icon" />}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(proj)}
                              >
                                <Pencil className="w-4 h-4 mr-2" /> 編輯
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteTarget(proj)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> 刪除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ─── Reports Tab ──────────────────────────────── */}
        <TabsContent value="reports">
          <div className="border rounded-lg border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>日期</TableHead>
                  <TableHead>員工</TableHead>
                  <TableHead>專案</TableHead>
                  <TableHead>動作類別</TableHead>
                  <TableHead>工作說明</TableHead>
                  <TableHead className="text-right">工時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReports.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-slate-400"
                    >
                      尚無日報記錄
                    </TableCell>
                  </TableRow>
                )}
                {[...visibleReports]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((report) => {
                    const emp = employees.find(
                      (e) => e.id === report.employeeId,
                    );
                    const proj = projects.find(
                      (p) => p.id === report.projectId,
                    );
                    return (
                      <TableRow key={report.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm">{report.date}</TableCell>
                        <TableCell className="text-sm">
                          {emp?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {proj?.name ?? "—"}
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
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Project Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => !v && setDialogOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "編輯專案" : "新增專案"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>專案名稱 *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ERP 系統開發"
              />
            </div>
            <div className="space-y-1.5">
              <Label>專案描述</Label>
              <Input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="專案說明..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>所屬部門 *</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}
              >
                <option value="">請選擇部門</option>
                {availableDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>專案經理</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.managerId}
                onChange={(e) => set("managerId", e.target.value)}
              >
                <option value="">無</option>
                {employees
                  .filter(
                    (e) =>
                      e.status === "active" &&
                      (form.departmentId
                        ? e.departmentIds.includes(form.departmentId)
                        : true)
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.position}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>專案狀態</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.status}
                onChange={(e) =>
                  set("status", e.target.value as Project["status"])
                }
              >
                <option value="active">進行中</option>
                <option value="paused">暫停</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editTarget ? "儲存修改" : "新增專案"}
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
            <AlertDialogTitle>確認刪除專案</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除專案「{deleteTarget?.name}
              」嗎？相關日報記錄不會一併刪除。
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
