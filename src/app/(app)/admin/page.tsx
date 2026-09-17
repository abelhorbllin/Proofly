import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/adintel/metric-card";
import { Users, Building2, Activity, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";

const PROVIDERS = [
  { name: "Store data", envVar: "STORE_PROVIDER_API_KEY" },
  { name: "Ad data", envVar: "AD_PROVIDER_API_KEY" },
  { name: "Traffic data", envVar: "TRAFFIC_PROVIDER_API_KEY" },
  { name: "AI (OpenAI)", envVar: "OPENAI_API_KEY" },
];

export default async function AdminPage() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [userCount, orgCount, storeCount, validationCount, reportCount, users, subscriptions, recentStores] = await Promise.all([
    db.user.count(),
    db.organization.count(),
    db.store.count(),
    db.productValidation.count(),
    db.report.count(),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { organization: true } }),
    db.subscription.findMany({ include: { organization: true }, orderBy: { updatedAt: "desc" }, take: 10 }),
    db.store.findMany({ orderBy: { updatedAt: "desc" }, take: 10, include: { organization: true } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldAlert className="h-6 w-6 text-primary" /> Admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">System overview — users, subscriptions, usage and provider status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Users" value={userCount} icon={Users} />
        <MetricCard label="Organizations" value={orgCount} icon={Building2} />
        <MetricCard label="Stores analyzed" value={storeCount} icon={Activity} />
        <MetricCard label="Validations run" value={validationCount} />
        <MetricCard label="Reports generated" value={reportCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data providers</CardTitle>
          <CardDescription>Live providers require an API key; otherwise the app runs on deterministic mock data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-sm">{p.name}</span>
              <Badge variant={process.env[p.envVar] ? "success" : "secondary"}>{process.env[p.envVar] ? "Live" : "Mock"}</Badge>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3">
            <span className="text-sm">Stripe billing</span>
            <Badge variant={isStripeConfigured() ? "success" : "secondary"}>{isStripeConfigured() ? "Live" : "Mock"}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent users</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{u.role}</Badge>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(u.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {subscriptions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{s.organization.name}</p>
                  <p className="text-xs text-muted-foreground">{s.status}</p>
                </div>
                <Badge variant={s.plan === "FREE" ? "secondary" : "success"}>{s.plan}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent analyses</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {recentStores.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.organization.name} · {s.domain}</p>
              </div>
              <div className="text-right">
                <Badge variant={s.status === "COMPLETED" ? "success" : "warning"}>{s.status}</Badge>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(s.updatedAt)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
