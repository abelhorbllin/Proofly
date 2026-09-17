import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ValidationReportView } from "@/components/adintel/validation-report-view";
import type { ValidationReport } from "@/lib/validation/types";
import { formatDate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export default async function ValidationDetailPage({ params }: PageProps<"/validate/[id]">) {
  const { id } = await params;
  const session = await requireSession();

  const validation = await db.productValidation.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!validation) notFound();

  const report = validation.result as unknown as ValidationReport;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-primary" /> {validation.productName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Validated on {formatDate(validation.createdAt)}</p>
      </div>
      <ValidationReportView report={report} />
    </div>
  );
}
