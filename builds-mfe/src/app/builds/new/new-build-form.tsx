"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readJwtFromDocument } from "@/lib/auth-client";
import { bffUrl } from "@/lib/bff";

interface Component {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
}

export function NewBuildForm({ components }: { components: Component[] }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const out = new Map<string, Component[]>();
    for (const c of components) {
      const list = out.get(c.type) ?? [];
      list.push(c);
      out.set(c.type, list);
    }
    return out;
  }, [components]);

  const total = useMemo(
    () =>
      components
        .filter((c) => selected.has(c.id))
        .reduce((sum, c) => sum + c.price, 0),
    [components, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || selected.size === 0) {
      setError("Name and at least one component are required.");
      return;
    }
    const j = readJwtFromDocument();
    if (!j) {
      window.location.href = "/auth/login";
      return;
    }
    setPending(true);
    try {
      const res = await fetch(bffUrl("/api/builds"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${j.token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          componentIds: Array.from(selected),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const created = (await res.json()) as { id: string };
      window.location.href = `/builds/${created.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Build name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gaming Rig 2026"
        />
      </div>

      <div className="flex flex-col gap-4">
        {Array.from(grouped.entries()).map(([type, list]) => (
          <section key={type} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              {type}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((c) => {
                const checked = selected.has(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded border p-3 text-sm ${
                      checked ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(c.id)}
                      />
                      <span>
                        <span className="font-medium">{c.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.brand}
                        </span>
                      </span>
                    </span>
                    <span className="font-semibold">
                      {c.price.toFixed(2)} €
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Selected: </span>
          {selected.size} components
        </div>
        <div className="text-lg font-semibold">{total.toFixed(2)} €</div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save build"}
      </Button>
    </form>
  );
}
