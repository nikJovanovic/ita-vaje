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
}

const TYPES = [
  "",
  "CPU",
  "GPU",
  "RAM",
  "Storage",
  "Motherboard",
  "PSU",
  "Case",
  "Cooling",
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const qs = type ? `?type=${encodeURIComponent(type)}` : "";
  const components = await bffFetch<Component[]>(`/api/catalog${qs}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold">Component catalog</h1>
        <p className="text-sm text-muted-foreground">
          Browse parts by category, compare specs, and pick components for your
          next build.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {TYPES.map((t) => {
          const href = t ? `/catalog?type=${t}` : "/catalog";
          const active = (type ?? "") === t;
          return (
            <a
              key={t || "all"}
              href={href}
              className={`rounded-full border px-3 py-1 ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {t || "All"}
            </a>
          );
        })}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((c) => (
          <a key={c.id} href={`/catalog/${c.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{c.name}</CardTitle>
                <CardDescription>
                  {c.brand} · {c.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {Object.keys(c.specs).length} specs
                </div>
                <div className="font-semibold">{c.price.toFixed(2)} €</div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
