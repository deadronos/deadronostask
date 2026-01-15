"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppIndex() {
  const router = useRouter();

  useEffect(() => {
    const view = window.localStorage.getItem("defaultView") ?? "today";
    router.replace(`/app/${view}`);
  }, [router]);

  return null;
}
