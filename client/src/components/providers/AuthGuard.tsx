"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (!token && !isAuthPage) {
      // User is not logged in and trying to access a protected page
      router.replace("/login");
    } else if (token && isAuthPage) {
      // User is logged in and trying to access login/signup
      router.replace("/");
    } else {
      // Allowed to view the page
      setIsReady(true);
    }
  }, [pathname, router]);

  // Optionally show nothing or a loading spinner while checking auth
  if (!isReady) {
    return null; // Or a simple loading state
  }

  return <>{children}</>;
}
