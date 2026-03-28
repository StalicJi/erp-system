"use client";

import { useState } from "react";
import { useErp } from "@/context/ErpContext";
import { Employee } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EmployeeDialog from "@/components/employees/EmployeeDialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

export default function EmployeesPage() {
  const {
    employees,
    departments,
    deleteEmployee,
    toggleEmployeeLogin,
    currentUser,
  } = useErp();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const filtered = employees
    .filter((e) => {
      const matchSearch =
        e.name.includes(search) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeNumber.includes(search) ||
        e.position.includes(search);
      const matchDept = !deptFilter || e.departmentIds.includes(deptFilter);
      return matchSearch && matchDept;
    })
    .sort((a, b) => {
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      return 0;
    });

  const getDeptNames = (deptIds: string[]) =>
    departments.filter((d) => deptIds.includes(d.id)).map((d) => d.name);

  const isSelf = (emp: Employee) => emp.id === currentUser?.id;

  const handleOpenAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditTarget(emp);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (isSelf(deleteTarget)) return;
    deleteEmployee(deleteTarget.id);
    toast.success(`已刪除員工：${deleteTarget.name}`);
    setDeleteTarget(null);
  };

  const handleToggleLogin = (emp: Employee) => {
    if (isSelf(emp)) return;
    toggleEmployeeLogin(emp.id);
    toast.success(
      `${emp.name} 登入權限已${emp.loginEnabled ? "關閉" : "開啟"}`,
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">員工管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            共 {employees.length} 名員工
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          新增員工
        </Button>
      </div>

      {/* Search + Dept Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="搜尋姓名、email、員工編號、職稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 min-w-36 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">所有部門</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>員工</TableHead>
              <TableHead>員工編號</TableHead>
              <TableHead>職稱</TableHead>
              <TableHead>所屬部門</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>允許登入</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-slate-400"
                >
                  {search || deptFilter
                    ? "沒有符合搜尋條件的員工"
                    : "尚無員工資料"}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((emp) => {
              const deptNames = getDeptNames(emp.departmentIds);
              const self = isSelf(emp);
              return (
                <TableRow key={emp.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm text-slate-800">
                            {emp.name}
                          </p>
                          {self && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0"
                            >
                              本人
                            </Badge>
                          )}
                          {emp.isManager && (
                            <Badge className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
                              主管
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {emp.employeeNumber || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {emp.position || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {deptNames.length === 0 ? (
                        <span className="text-xs text-slate-400">未分配</span>
                      ) : (
                        deptNames.map((n) => (
                          <Badge key={n} variant="outline" className="text-xs">
                            {n}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        emp.status === "active"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                      }
                    >
                      {emp.status === "active" ? "在職" : "離職"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div title={self ? "無法變更自己的登入權限" : undefined}>
                      <Switch
                        checked={emp.loginEnabled}
                        onCheckedChange={() => handleToggleLogin(emp)}
                        disabled={self}
                        aria-label="允許登入"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" />}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(emp)}>
                          <Pencil className="w-4 h-4 mr-2" /> 編輯
                        </DropdownMenuItem>
                        {!self && (
                          <DropdownMenuItem
                            onClick={() => handleToggleLogin(emp)}
                          >
                            {emp.loginEnabled ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" /> 停用登入
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" /> 啟用登入
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={
                            self
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-red-600 focus:text-red-600"
                          }
                          onClick={() => !self && setDeleteTarget(emp)}
                          disabled={self}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> 刪除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EmployeeDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        employee={editTarget}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除員工</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除員工「{deleteTarget?.name}
              」嗎？此操作無法還原，員工將從所有部門中移除。
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
