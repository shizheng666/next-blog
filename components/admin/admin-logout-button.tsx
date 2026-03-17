"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/services/client/auth.client";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await authClient.logout();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
      {loading ? "退出中..." : "退出登录"}
    </Button>
  );
}
