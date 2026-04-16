import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { bffFetch } from "@/lib/bff";

interface Component {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  specs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface DetailResponse extends Component {
  related: Component[];
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let detail: DetailResponse;
  try {
    detail = await bffFetch<DetailResponse>(`/api/catalog/${id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <a href="/catalog" className="text-sm text-muted-foreground underline">
        ← Back to catalog
      </a>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{detail.name}</CardTitle>
          <CardDescription>
            {detail.brand} · {detail.type} · {detail.price.toFixed(2)} €
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="mb-2 text-sm font-semibold">Specs</h3>
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {Object.entries(detail.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {detail.related.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-bold">
            Similar in this price range
          </h2>
          <p className="text-xs text-muted-foreground">
            Other {detail.type}s within ±20% of this price.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.related.map((r) => (
              <a key={r.id} href={`/catalog/${r.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">{r.name}</CardTitle>
                    <CardDescription>{r.brand}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-right font-semibold">
                    {r.price.toFixed(2)} €
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
