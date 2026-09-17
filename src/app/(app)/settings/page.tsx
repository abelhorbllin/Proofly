import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "@/components/adintel/account-form";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck } from "lucide-react";

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and workspace preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm initialName={session.user.name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Badge variant="secondary">{session.user.role}</Badge>
          {session.user.role === "ADMIN" && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ShieldCheck className="h-4 w-4" /> Open admin panel
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing</CardTitle>
          <CardDescription>Manage your plan and view usage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/billing">
              <CreditCard className="h-4 w-4" /> Go to billing
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
