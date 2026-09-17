"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";
import { Loader2, FileText } from "lucide-react";

interface Option {
  id: string;
  label: string;
}

export function GenerateReportForm({ stores, validations }: { stores: Option[]; validations: Option[] }) {
  const router = useRouter();
  const [type, setType] = useState<"STORE_ANALYSIS" | "PRODUCT_VALIDATION">("STORE_ANALYSIS");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const options = type === "STORE_ANALYSIS" ? stores : validations;

  async function generate() {
    if (!targetId) return;
    setLoading(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, targetEntityId: targetId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code === "USAGE_LIMIT") setUpgradeOpen(true);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Select
        value={type}
        onValueChange={(v) => {
          setType(v as typeof type);
          setTargetId("");
        }}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="STORE_ANALYSIS">Store Analysis</SelectItem>
          <SelectItem value="PRODUCT_VALIDATION">Product Validation</SelectItem>
        </SelectContent>
      </Select>
      <Select value={targetId} onValueChange={setTargetId}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder={options.length ? "Select target" : "No eligible data yet"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={generate} disabled={loading || !targetId}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Generate report
      </Button>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="reports" />
    </div>
  );
}
