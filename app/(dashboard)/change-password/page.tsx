"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useErp } from "@/context/ErpContext";
import { validatePassword } from "@/lib/password";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const { currentUser, changePassword } = useErp();
  const router = useRouter();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const validation = newPwd ? validatePassword(newPwd) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!validation?.valid) {
      toast.error("新密碼不符合規範");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("兩次輸入的密碼不一致");
      return;
    }
    setLoading(true);
    const ok = changePassword(currentUser.id, currentPwd, newPwd);
    setLoading(false);
    if (ok) {
      toast.success("密碼已更新，請重新登入");
      router.replace("/employees");
    } else {
      toast.error("目前密碼錯誤");
    }
  };

  const rules = [
    { label: "長度 6-12 個字元", ok: newPwd.length >= 6 && newPwd.length <= 12 },
    { label: "包含大寫英文字母", ok: /[A-Z]/.test(newPwd) },
    { label: "包含小寫英文字母", ok: /[a-z]/.test(newPwd) },
    { label: "包含數字", ok: /[0-9]/.test(newPwd) },
    { label: "包含特殊符號", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPwd) },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <CardTitle>首次登入 — 請修改密碼</CardTitle>
            </div>
            <CardDescription>
              基於安全考量，您必須設定新密碼才能繼續使用系統
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPwd">目前密碼</Label>
                <Input
                  id="currentPwd"
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPwd">新密碼</Label>
                <Input
                  id="newPwd"
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPwd">確認新密碼</Label>
                <Input
                  id="confirmPwd"
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                />
                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="text-xs text-red-500">兩次密碼不一致</p>
                )}
              </div>

              {/* Password rules checklist */}
              {newPwd && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
                  <p className="text-xs font-medium text-slate-600 mb-2">密碼規範</p>
                  {rules.map((r) => (
                    <div key={r.label} className="flex items-center gap-2 text-xs">
                      {r.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span className={r.ok ? "text-green-700" : "text-slate-500"}>{r.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !validation?.valid || newPwd !== confirmPwd}
              >
                {loading ? "更新中..." : "確認修改密碼"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
