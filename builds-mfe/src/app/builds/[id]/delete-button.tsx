"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { readJwtFromDocument } from "@/lib/auth-client";
import { bffUrl } from "@/lib/bff";

export function DeleteBuildButton({ buildId }: { buildId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!confirm("Delete this build?")) return;
    const j = readJwtFromDocument();
    if (!j) {
      window.location.href = "/auth/login";
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch(bffUrl(`/api/builds/${buildId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${j.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      window.location.href = "/builds";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        onClick={onClick}
        disabled={pending}
      >
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
