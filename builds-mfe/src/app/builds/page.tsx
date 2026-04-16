import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { bffFetch } from "@/lib/bff";

interface Thumbnail {
  id: string;
  name: string;
  type: string;
}

interface BuildListItem {
  id: string;
  name: string;
  userId: string;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
  thumbnails: Thumbnail[];
  totalPrice: number;
}

export default async function BuildsPage() {
  const builds = await bffFetch<BuildListItem[]>("/api/builds");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">PC builds</h1>
          <p className="text-sm text-muted-foreground">
            Every build you've put together, with its total price.
          </p>
        </div>
        <a href="/builds/new">
          <Button>New build</Button>
        </a>
      </div>

      {builds.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No builds yet</CardTitle>
            <CardDescription>
              Create your first build to see it here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((b) => (
            <a key={b.id} href={`/builds/${b.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{b.name}</CardTitle>
                  <CardDescription>
                    {b.thumbnails.length} component
                    {b.thumbnails.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-xs">
                  <ul className="flex flex-wrap gap-1">
                    {b.thumbnails.map((t) => (
                      <li
                        key={t.id}
                        className="rounded bg-muted px-2 py-0.5 text-muted-foreground"
                      >
                        {t.type}
                      </li>
                    ))}
                  </ul>
                  <div className="text-right text-sm font-semibold">
                    {b.totalPrice.toFixed(2)} €
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
