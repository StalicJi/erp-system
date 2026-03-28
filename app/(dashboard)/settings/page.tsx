"use client";

import { useState, useEffect } from "react";
import { useErp } from "@/context/ErpContext";
import { AppSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Building2, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_APP_SETTINGS } from "@/types";

export default function SettingsPage() {
  const { appSettings, updateAppSettings, currentUser } = useErp();
  const [form, setForm] = useState<AppSettings>(appSettings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(appSettings);
    setDirty(false);
  }, [appSettings]);

  const set = (k: keyof AppSettings, v: unknown) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const handleSave = () => {
    updateAppSettings(form);
    setDirty(false);
    toast.success("系統設定已儲存");
  };

  const handleReset = () => {
    setForm(DEFAULT_APP_SETTINGS);
    setDirty(true);
  };

  const canWrite = currentUser?.permissions.includes("settings.write") ?? false;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系統設定</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            管理網站外觀與系統行為
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" /> 還原預設
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty}>
              <Save className="w-4 h-4 mr-1" /> 儲存設定
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* 外觀設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <CardTitle className="text-base">網站外觀</CardTitle>
            </div>
            <CardDescription>設定系統名稱與識別資訊</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>系統名稱</Label>
                <Input
                  value={form.siteName}
                  onChange={(e) => set("siteName", e.target.value)}
                  placeholder="ERP 系統"
                  disabled={!canWrite}
                />
                <p className="text-xs text-slate-400">顯示於左側選單頂部</p>
              </div>
              <div className="space-y-1.5">
                <Label>Logo 文字</Label>
                <Input
                  value={form.logoText}
                  onChange={(e) => set("logoText", e.target.value.slice(0, 4))}
                  placeholder="ERP"
                  maxLength={4}
                  disabled={!canWrite}
                />
                <p className="text-xs text-slate-400">最多 4 個字元</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>系統描述</Label>
              <Input
                value={form.siteDescription}
                onChange={(e) => set("siteDescription", e.target.value)}
                placeholder="企業資源規劃"
                disabled={!canWrite}
              />
              <p className="text-xs text-slate-400">
                顯示於系統名稱下方的副標題
              </p>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">預覽效果：</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {form.logoText || "ERP"}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {form.siteName || "系統名稱"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {form.siteDescription || "系統描述"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <CardTitle className="text-base">安全設定</CardTitle>
            </div>
            <CardDescription>管理登入與存取控制</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">允許員工自行註冊</p>
                <p className="text-xs text-slate-500">
                  開啟後，員工可在登入頁面自行建立帳號
                </p>
              </div>
              <Switch
                checked={form.allowSelfRegister}
                onCheckedChange={(v) => set("allowSelfRegister", v)}
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-1.5">
              <Label>連線逾時（分鐘）</Label>
              <Input
                type="number"
                min={30}
                max={1440}
                value={form.sessionTimeout}
                onChange={(e) =>
                  set("sessionTimeout", parseInt(e.target.value) || 480)
                }
                className="w-40"
                disabled={!canWrite}
              />
              <p className="text-xs text-slate-400">
                閒置超過此時間將自動登出（30-1440 分鐘）
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 日報設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <CardTitle className="text-base">日報設定</CardTitle>
            </div>
            <CardDescription>工作日報相關規則</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>日報截止時間（小時）</Label>
              <Input
                type="number"
                min={1}
                max={23}
                value={form.reportDeadlineHour}
                onChange={(e) =>
                  set("reportDeadlineHour", parseInt(e.target.value) || 18)
                }
                className="w-40"
                disabled={!canWrite}
              />
              <p className="text-xs text-slate-400">
                每日 {form.reportDeadlineHour}:00 前需完成日報填寫
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current user info */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <div className="text-xs text-slate-500 space-y-0.5">
                <p className="font-medium text-slate-600">目前登入身份</p>
                <p>
                  {currentUser?.name}（{currentUser?.position}）
                </p>
                <p>
                  {canWrite
                    ? "✓ 您有系統設定編輯權限"
                    : "⚠ 您只有查看權限，無法修改設定"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
