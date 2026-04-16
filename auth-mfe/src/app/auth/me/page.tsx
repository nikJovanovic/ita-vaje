import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readJwtFromCookies } from "@/lib/auth";
import { bffFetch } from "@/lib/bff";

interface MeResponse {
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: string;
  };
  builds: Array<{
    id: string;
    name: string;
    totalPrice: number;
    thumbnails: Array<{ id: string; name: string; type: string }>;
  }>;
}

export default async function MePage() {
  const auth = await readJwtFromCookies();
  if (!auth) redirect("/auth/login");

  let data: MeResponse | null = null;
  let error: string | null = null;
  try {
    data = await bffFetch<MeResponse>("/api/me", { token: auth.token });
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : data ? (
            <>
              <div>
                <span className="text-muted-foreground">Username: </span>
                {data.user.username}
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                {data.user.email}
              </div>
              <div>
                <span className="text-muted-foreground">Joined: </span>
                {new Date(data.user.createdAt).toLocaleString()}
              </div>
            </>
          ) : (
            <p>Loading…</p>
          )}
        </CardContent>
      </Card>

      {data && data.builds.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your builds</CardTitle>
            <CardDescription>
              A quick look at the PCs you've planned.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {data.builds.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div>
                  <div className="font-medium">
                    <a href={`/builds/${b.id}`} className="underline">
                      {b.name}
                    </a>
                  </div>
                  <div className="text-muted-foreground">
                    {b.thumbnails.length} components
                  </div>
                </div>
                <div className="font-semibold">{b.totalPrice.toFixed(2)} €</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
