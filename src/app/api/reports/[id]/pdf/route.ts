import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { renderHtmlToPdf } from "@/lib/pdf/render-pdf";
import { renderStoreReportHtml, renderValidationReportHtml, type StoreReportData } from "@/lib/pdf/report-template";
import type { ValidationReport } from "@/lib/validation/types";

export async function GET(_req: Request, { params }: RouteContext<"/api/reports/[id]/pdf">) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const report = await db.report.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  const html =
    report.type === "STORE_ANALYSIS"
      ? renderStoreReportHtml(report.content as unknown as StoreReportData)
      : renderValidationReportHtml(report.content as unknown as ValidationReport);

  try {
    const pdf = await renderHtmlToPdf(html);
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed", err);
    return NextResponse.json({ error: "PDF generation failed." }, { status: 500 });
  }
}
