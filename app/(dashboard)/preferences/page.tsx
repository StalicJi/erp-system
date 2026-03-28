"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import {
  FONT_SCALE_STORAGE_KEY,
  clampFontScale,
  parseStoredFontScale,
} from "@/lib/preferences";
import { Monitor, Moon, Sun, Type, CheckCircle2, XCircle } from "lucide-react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function PreferencesPage() {
  const { currentUser, changePassword } = useErp();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setMounted(true);
    const storedScale = parseStoredFontScale(
      localStorage.getItem(FONT_SCALE_STORAGE_KEY),
    );
    setFontScale(storedScale);
  }, []);

  const updateFontScale = (nextScale: number) => {
    const safeScale = clampFontScale(nextScale);
    setFontScale(safeScale);
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(safeScale));
    document.documentElement.style.setProperty(
      "--app-font-scale",
      String(safeScale),
    );
  };

  const resetPersonalDisplaySettings = () => {
    setTheme("system");
    updateFontScale(1);
    toast.success("已還原個人顯示設定");
  };

  const pwdValidation = newPassword ? validatePassword(newPassword) : null;

  const pwdRules = [
    { label: "長度 6-12 個字元", ok: newPassword.length >= 6 && newPassword.length <= 12 },
    { label: "包含大寫英文字母", ok: /[A-Z]/.test(newPassword) },
    { label: "包含小寫英文字母", ok: /[a-z]/.test(newPassword) },
    { label: "包含數字", ok: /[0-9]/.test(newPassword) },
    { label: "包含特殊符號", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) },
  ];

  const handleChangePassword = () => {
    if (!currentUser) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("請完整填寫密碼欄位");
      return;
    }
    if (!pwdValidation?.valid) {
      toast.error("新密碼不符合規範");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("新密碼與確認密碼不一致");
      return;
    }
    const ok = changePassword(currentUser.id, currentPassword, newPassword);
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("密碼已更新");
    } else {
      toast.error("目前密碼不正確");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">個人設定</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          深淺主題與字體大小僅影響你目前使用的瀏覽器
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">顯示偏好</CardTitle>
          </div>
          <CardDescription>每位員工可獨立設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>主題模式</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={mounted && theme === "light" ? "default" : "outline"}
                className="justify-start"
                onClick={() => setTheme("light")}
              >
                <Sun className="w-4 h-4 mr-2" /> 淺色
              </Button>
              <Button
                type="button"
                variant={mounted && theme === "dark" ? "default" : "outline"}
                className="justify-start"
                onClick={() => setTheme("dark")}
              >
                <Moon className="w-4 h-4 mr-2" /> 深色
              </Button>
              <Button
                type="button"
                variant={mounted && theme === "system" ? "default" : "outline"}
                className="justify-start"
                onClick={() => setTheme("system")}
              >
                <Monitor className="w-4 h-4 mr-2" /> 跟隨系統
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-scale">字體大小</Label>
              <span className="text-xs text-muted-foreground">
                {Math.round(fontScale * 100)}%
              </span>
            </div>
            <input
              id="font-scale"
              type="range"
              min={0.85}
              max={1.3}
              step={0.05}
              value={fontScale}
              onChange={(e) => updateFontScale(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>小</span>
              <span>標準</span>
              <span>大</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetPersonalDisplaySettings}
            >
              還原個人顯示
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">修改密碼</CardTitle>
          </div>
          <CardDescription>僅變更你的登入密碼</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">目前密碼</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="請輸入目前密碼"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">新密碼</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="請輸入新密碼"
            />
          </div>
          {newPassword && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
              <p className="text-xs font-medium text-slate-600 mb-2">密碼規範</p>
              {pwdRules.map((r) => (
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
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">確認新密碼</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次輸入新密碼"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">兩次密碼不一致</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={!pwdValidation?.valid || newPassword !== confirmPassword || !currentPassword}
            >
              儲存新密碼
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
