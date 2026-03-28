"use client";

import { useState, useMemo } from "react";
import { useErp } from "@/context/ErpContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Shield, Clock } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  登入: "bg-green-100 text-green-700",
  登出: "bg-slate-100 text-slate-600",
  新增員工: "bg-blue-100 text-blue-700",
  修改員工: "bg-yellow-100 text-yellow-700",
  刪除員工: "bg-red-100 text-red-700",
  停用登入: "bg-orange-100 text-orange-700",
  啟用登入: "bg-teal-100 text-teal-700",
  新增部門: "bg-blue-100 text-blue-700",
  修改部門: "bg-yellow-100 text-yellow-700",
  刪除部門: "bg-red-100 text-red-700",
  加入部門: "bg-indigo-100 text-indigo-700",
  移出部門: "bg-orange-100 text-orange-700",
  新增專案: "bg-blue-100 text-blue-700",
  修改專案: "bg-yellow-100 text-yellow-700",
  刪除專案: "bg-red-100 text-red-700",
  新增日報: "bg-green-100 text-green-700",
  修改日報: "bg-yellow-100 text-yellow-700",
  刪除日報: "bg-red-100 text-red-700",
  修改系統設定: "bg-purple-100 text-purple-700",
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditPage() {
  const { auditLogs } = useErp();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const uniqueActions = useMemo(
    () => Array.from(new Set(auditLogs.map((l) => l.action))).sort(),
    [auditLogs],
  );

  const filtered = useMemo(
    () =>
      auditLogs.filter((log) => {
        const matchSearch =
          log.userName.includes(search) ||
          log.action.includes(search) ||
          log.target.includes(search) ||
          log.detail.includes(search);
        const matchAction = !filterAction || log.action === filterAction;
        return matchSearch && matchAction;
      }),
    [auditLogs, search, filterAction],
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">事件紀錄</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            系統所有操作變更紀錄（保留最近 500 筆）
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">總紀錄</p>
              <p className="text-xl font-bold text-slate-800">
                {auditLogs.length}
              </p>
            </div>
          </CardContent>
        </Card>
        {["新增", "修改", "刪除"].map((type) => (
          <Card key={type}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  type === "新增"
                    ? "bg-blue-50"
                    : type === "修改"
                      ? "bg-yellow-50"
                      : "bg-red-50"
                }`}
              >
                <Clock
                  className={`w-4 h-4 ${
                    type === "新增"
                      ? "text-blue-500"
                      : type === "修改"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">{type}操作</p>
                <p className="text-xl font-bold text-slate-800">
                  {auditLogs.filter((l) => l.action.startsWith(type)).length}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="搜尋使用者、動作、說明..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 min-w-32.5 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">所有動作</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>時間</TableHead>
              <TableHead>操作者</TableHead>
              <TableHead>動作</TableHead>
              <TableHead>模組</TableHead>
              <TableHead>詳細說明</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-slate-400"
                >
                  {search || filterAction
                    ? "沒有符合條件的記錄"
                    : "尚無事件紀錄"}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/50">
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {formatTimestamp(log.timestamp)}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {log.userName}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {log.action}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {log.target}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600 max-w-sm">
                  {log.detail}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
