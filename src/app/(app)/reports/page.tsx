import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/adintel/empty-state";
import { GenerateReportForm } from "@/components/adintel/generate-report-form";
import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ReportsPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const [reports, stores, validations] = await Promise.all([
    db.report.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.store.findMany({ where: { organizationId, status: "COMPLETED" }, select: { id: true, name: true } }),
    db.productValidation.findMany({ where: { userId: session.user.id }, select: { id: true, productName: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate a branded PDF report from any analyzed store or product validation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate a report</CardTitle>
          <CardDescription>Includes data sources, confidence levels, key metrics and methodology.</CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateReportForm
            stores={stores.map((s) => ({ id: s.id, label: s.name }))}
            validations={validations.map((v) => ({ id: v.id, label: v.productName }))}
          />
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports generated yet" description="Generate your first report above." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">{r.type.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/reports/${r.id}/pdf`} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
