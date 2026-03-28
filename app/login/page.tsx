"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useErp } from "@/context/ErpContext";
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
import { toast } from "sonner";
import { Building2, LogIn } from "lucide-react";

export default function LoginPage() {
  const { login } = useErp();
  const router = useRouter();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = login(employeeNumber.trim(), password);
    if (success) {
      toast.success("登入成功");
      router.push("/home");
    } else {
      toast.error("帳號或密碼錯誤，或帳號已停用");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-muted/30 to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ERP 系統</h1>
            <p className="text-sm text-muted-foreground">企業資源規劃</p>
          </div>
        </div>
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>登入</CardTitle>
            {/* <CardDescription>請輸入您的帳號與密碼</CardDescription> */}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeNumber">員工編號</Label>
                <Input
                  id="employeeNumber"
                  type="text"
                  placeholder="請輸入編號"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? "登入中..." : "登入"}
              </Button>
            </form>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">預設帳號：</p>
              <p>管理層：EMP000 / boss1234</p>
              <p>人資部經理：EMP301 / hr.mgr123</p>
              <p>資訊部經理：EMP101 / it.mgr123</p>
              <p>業務部經理：EMP201 / sales.mgr123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
