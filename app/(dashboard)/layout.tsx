"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useErp } from "@/context/ErpContext";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, employees } = useErp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (pathname !== "/change-password") {
      const emp = employees.find(e => e.id === currentUser.id);
      if (emp?.forcePasswordChange) {
        router.replace("/change-password");
      }
    }
  }, [currentUser, employees, pathname, router]);

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row lg:items-start">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
