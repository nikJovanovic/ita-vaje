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
import { NewBuildForm } from "./new-build-form";

interface Component {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  specs: Record<string, string>;
}

export default async function NewBuildPage() {
  const auth = await readJwtFromCookies();
  if (!auth) redirect("/auth/login");

  const components = await bffFetch<Component[]>("/api/catalog");

  return (
    <div className="flex flex-col gap-6">
      <a href="/builds" className="text-sm text-muted-foreground underline">
        ← Back to builds
      </a>
      <Card>
        <CardHeader>
          <CardTitle>New build</CardTitle>
          <CardDescription>
            Name your build and pick the parts that go in it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewBuildForm components={components} />
        </CardContent>
      </Card>
    </div>
  );
}
