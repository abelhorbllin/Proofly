"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";

export default function AnalyzeProductPage() {
  return (
    <Suspense>
      <AnalyzeProductForm />
    </Suspense>
  );
}

function AnalyzeProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function analyze(target: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "USAGE_LIMIT") setUpgradeOpen(true);
        else setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      const store = await fetch(`/api/stores/${data.storeId}/first-product`).then((r) => r.json()).catch(() => null);
      router.push(store?.productId ? `/products/${store.productId}` : `/stores/${data.storeId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = searchParams.get("url");
    if (initial) analyze(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze a product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a product page URL. ADINTEL analyzes the parent store and surfaces this product&apos;s ads, pricing and competitor activity.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product URL</CardTitle>
          <CardDescription>e.g. competitorstore.com/products/example</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim() && !loading) analyze(url.trim());
            }}
            className="flex gap-2"
          >
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="competitorstore.com/products/example" disabled={loading} />
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Analyze
            </Button>
          </form>
          {error && <p className="text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="store analyses" />
    </div>
  );
}
