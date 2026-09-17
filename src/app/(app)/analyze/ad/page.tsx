"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/adintel/empty-state";
import { Loader2, Megaphone, Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { ProviderAd } from "@/lib/providers/types";

export default function AnalyzeAdPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<ProviderAd[] | null>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch("/api/analyze/ad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim() }),
    });
    const data = await res.json();
    setAds(data.ads ?? []);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze an ad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for ads by product name or keyword across supported public ad sources. Results here are not saved —
          track a store to persist ad monitoring over time.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search query</CardTitle>
          <CardDescription>e.g. &ldquo;posture corrector&rdquo;</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
            className="flex gap-2"
          >
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a product or keyword..." disabled={loading} />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {ads && ads.length === 0 && (
        <EmptyState icon={Megaphone} title="No ads found" description="We couldn't find supported public ad data for this query." />
      )}

      {ads && ads.length > 0 && (
        <div className="space-y-3">
          {ads.map((ad) => (
            <Card key={ad.externalId}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ad.creatives[0]?.headline ?? ad.offer}</p>
                  <p className="truncate text-xs text-muted-foreground">{ad.creatives[0]?.hook}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{ad.platform}</Badge>
                  <Badge variant={ad.active ? "success" : "secondary"}>{ad.active ? "Active" : "Inactive"}</Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(new Date(ad.lastSeenAt))}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
