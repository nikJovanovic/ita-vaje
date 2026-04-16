import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readJwtFromCookies } from "@/lib/auth";
import { bffFetch } from "@/lib/bff";
import { DeleteBuildButton } from "./delete-button";

interface Component {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  specs: Record<string, string>;
}

interface BuildDetail {
  id: string;
  name: string;
  userId: string;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
  components: Component[];
  totalPrice: number;
  breakdown: Record<string, number>;
}

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let build: BuildDetail;
  try {
    build = await bffFetch<BuildDetail>(`/api/builds/${id}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) notFound();
    throw err;
  }

  const auth = await readJwtFromCookies();
  const isOwner = auth?.payload.sub === build.userId;

  return (
    <div className="flex flex-col gap-6">
      <a href="/builds" className="text-sm text-muted-foreground underline">
        ← Back to builds
      </a>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{build.name}</h1>
          <p className="text-sm text-muted-foreground">
            {build.components.length} components · {build.totalPrice.toFixed(2)}{" "}
            €
          </p>
        </div>
        {isOwner ? <DeleteBuildButton buildId={build.id} /> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price breakdown</CardTitle>
          <CardDescription>Totals by component category.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {Object.entries(build.breakdown).map(([cat, sum]) => (
              <div key={cat} className="flex justify-between border-b py-1">
                <dt className="text-muted-foreground">{cat}</dt>
                <dd className="font-medium">{sum.toFixed(2)} €</dd>
              </div>
            ))}
            <div className="flex justify-between border-b py-1 font-semibold">
              <dt>Total</dt>
              <dd>{build.totalPrice.toFixed(2)} €</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">Components</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {build.components.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">{c.name}</CardTitle>
                <CardDescription>
                  {c.brand} · {c.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-right text-sm font-semibold">
                {c.price.toFixed(2)} €
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

// Re-export required to keep notFound()/redirect() accessible if tests import
export { notFound, redirect };
