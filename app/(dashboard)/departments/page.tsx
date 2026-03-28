"use client";

import { useState } from "react";
import { useErp } from "@/context/ErpContext";
import { Department } from "@/types";
import { PERMISSION_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import DepartmentDialog from "@/components/departments/DepartmentDialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const {
    departments,
    employees,
    deleteDepartment,
    addEmployeeToDepartment,
    removeEmployeeFromDepartment,
  } = useErp();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [membersDept, setMembersDept] = useState<Department | null>(null);

  const filtered = departments.filter(
    (d) => d.name.includes(search) || d.description.includes(search),
  );

  const getMembers = (dept: Department) =>
    employees.filter((e) => dept.memberIds.includes(e.id));

  const getNonMembers = (dept: Department) =>
    employees.filter((e) => !dept.memberIds.includes(e.id));

  const handleOpenAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditTarget(dept);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDepartment(deleteTarget.id);
    toast.success(`已刪除部門：${deleteTarget.name}`);
    setDeleteTarget(null);
  };

  const handleAddMember = (deptId: string, empId: string) => {
    addEmployeeToDepartment(deptId, empId);
    const emp = employees.find((e) => e.id === empId);
    toast.success(`已將 ${emp?.name} 加入部門`);
  };

  const handleRemoveMember = (deptId: string, empId: string) => {
    removeEmployeeFromDepartment(deptId, empId);
    const emp = employees.find((e) => e.id === empId);
    toast.success(`已將 ${emp?.name} 從部門移除`);
  };

  // Find current dept in real-time (after add/remove changes)
  const currentMembersDept = membersDept
    ? departments.find((d) => d.id === membersDept.id) || null
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">部門管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            共 {departments.length} 個部門
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          新增部門
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="搜尋部門名稱或描述..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>部門名稱</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>部門權限</TableHead>
              <TableHead>成員</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-slate-400"
                >
                  {search ? "沒有符合搜尋條件的部門" : "尚無部門資料"}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((dept) => {
              const members = getMembers(dept);
              return (
                <TableRow key={dept.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-medium text-sm text-slate-800">
                      {dept.name}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {dept.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {dept.permissions.length === 0 ? (
                        <span className="text-xs text-slate-400">無權限</span>
                      ) : (
                        dept.permissions.slice(0, 3).map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {PERMISSION_LABELS[p]}
                          </Badge>
                        ))
                      )}
                      {dept.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{dept.permissions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                      onClick={() => setMembersDept(dept)}
                    >
                      <div className="flex -space-x-1.5">
                        {members.slice(0, 3).map((m) => (
                          <Avatar
                            key={m.id}
                            className="w-6 h-6 border-2 border-white"
                          >
                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                              {m.name.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span>{members.length} 人</span>
                      <Users className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" />}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(dept)}>
                          <Pencil className="w-4 h-4 mr-2" /> 編輯部門
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMembersDept(dept)}>
                          <Users className="w-4 h-4 mr-2" /> 管理成員
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteTarget(dept)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> 刪除部門
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

      {/* Department Dialog */}
      <DepartmentDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        department={editTarget}
      />

      {/* Members Management Dialog */}
      {currentMembersDept && (
        <Dialog
          open={!!membersDept}
          onOpenChange={(v) => !v && setMembersDept(null)}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>管理成員 — {currentMembersDept.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Current Members */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  目前成員（{getMembers(currentMembersDept).length} 人）
                </p>
                <ScrollArea className="h-48 border rounded-lg">
                  {getMembers(currentMembersDept).length === 0 && (
                    <p className="text-sm text-slate-400 p-4 text-center">
                      此部門尚無成員
                    </p>
                  )}
                  {getMembers(currentMembersDept).map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {emp.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-slate-400">
                            {emp.position}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                        onClick={() =>
                          handleRemoveMember(currentMembersDept.id, emp.id)
                        }
                      >
                        <UserMinus className="w-3.5 h-3.5 mr-1" /> 移除
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <Separator />

              {/* Add Members */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  新增成員
                </p>
                <ScrollArea className="h-48 border rounded-lg">
                  {getNonMembers(currentMembersDept).length === 0 && (
                    <p className="text-sm text-slate-400 p-4 text-center">
                      所有員工都已在此部門
                    </p>
                  )}
                  {getNonMembers(currentMembersDept).map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                            {emp.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-slate-400">
                            {emp.position}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                        onClick={() =>
                          handleAddMember(currentMembersDept.id, emp.id)
                        }
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> 加入
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除部門</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除部門「{deleteTarget?.name}
              」嗎？此操作無法還原，部門成員將從此部門中移除。
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
