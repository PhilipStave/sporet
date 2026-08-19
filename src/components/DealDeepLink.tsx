"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/store/Store";

// Opens the customer drawer when the URL has ?deal=<id> (used by calendar links).
function Inner() {
  const params = useSearchParams();
  const { deals, loading, setSelectedDealId } = useStore();
  const handled = useRef<string | null>(null);
  const id = params.get("deal");

  useEffect(() => {
    if (!id || loading || handled.current === id) return;
    if (deals.some((d) => d.id === id)) {
      handled.current = id;
      setSelectedDealId(id);
    }
  }, [id, loading, deals, setSelectedDealId]);

  return null;
}

export function DealDeepLink() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
