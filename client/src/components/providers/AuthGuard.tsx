"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // "checking" = still verifying, "redirecting" = redirect in progress, "ready" = show content
  const [authState, setAuthState] = useState<"checking" | "redirecting" | "ready">("checking");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const isAdminRoute = pathname.startsWith("/admin");

    if (!token && !isAuthPage && !isAdminRoute) {
      // User is not logged in and trying to access a protected page
      setAuthState("redirecting");
      router.replace("/login");
    } else if (token && isAuthPage) {
      // User is logged in and trying to access login/signup
      setAuthState("redirecting");
      router.replace("/");
    } else {
      // Allowed to view the page
      setAuthState("ready");
    }
  }, [pathname, router]);

  // Show loading spinner while checking auth or redirecting
  if (authState !== "ready") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0f2f5",
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid #e4e6eb",
              borderTop: "4px solid #1877f2",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "#65676b", fontSize: 15, fontFamily: "sans-serif" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
