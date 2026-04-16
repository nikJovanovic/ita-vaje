import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sections = [
  {
    href: "/catalog",
    title: "Browse components",
    description:
      "CPUs, GPUs, RAM, storage and more — filter by category and drill into specs.",
    cta: "Open catalog",
  },
  {
    href: "/builds",
    title: "Your builds",
    description:
      "Assemble, price, and manage named PC builds. See category totals at a glance.",
    cta: "View builds",
  },
  {
    href: "/auth/login",
    title: "Account",
    description:
      "Sign in to save your builds, or create an account to get started.",
    cta: "Sign in",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          PC Build Planner
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse parts, plan your next build, and keep track of what it will
          cost.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.href}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
              <CardDescription>{s.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={s.href}>
                <Button variant="default">{s.cta}</Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
