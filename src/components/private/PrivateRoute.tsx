"use client";

import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Cookies from "js-cookie";
import { ReactNode, useEffect, useState } from "react";

const PrivateRoute = ({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole: string;
}) => {
  const router = useRouter();
  const reduxRole = useAppSelector((state) => state.auth.role);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const cookieRole = Cookies.get("role");
    setRole(reduxRole || cookieRole || null);

    if (!cookieRole || cookieRole !== requireRole) {
      router.push("/auth/login");
    }
  }, [reduxRole, requireRole, router]);

  return role === requireRole ? <>{children}</> : null;
};

export default PrivateRoute;
