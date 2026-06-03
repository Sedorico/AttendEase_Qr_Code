"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        router.push("/admin");
      } else if (user?.role === "manager") {
        router.push("/manager");
      } else {
        router.push("/employee");
      }
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  return null;
}