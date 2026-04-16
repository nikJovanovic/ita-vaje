"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearJwtCookie, readJwtFromDocument } from "@/lib/auth-client";

export function Header() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const read = () => {
      const j = readJwtFromDocument();
      setUser(j ? { email: j.payload.email } : null);
    };
    read();
    window.addEventListener("focus", read);
    return () => window.removeEventListener("focus", read);
  }, []);

  function logout() {
    clearJwtCookie();
    window.location.href = "/";
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-6 p-4">
        <a href="/" className="text-lg font-bold">
          PC Build Planner
        </a>
        <nav className="flex gap-4 text-sm">
          <a href="/catalog" className="hover:underline">
            Catalog
          </a>
          <a href="/builds" className="hover:underline">
            Builds
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <a href="/auth/me" className="hover:underline">
                {user.email}
              </a>
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <a href="/auth/login">
                <Button variant="outline" size="sm">
                  Log in
                </Button>
              </a>
              <a href="/auth/register">
                <Button size="sm">Sign up</Button>
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
