"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function StoreAnalyzerInput() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/analyze/store?url=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-2 sm:flex-row">
      <div className="flex flex-1 items-center gap-2 px-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Analyze a store, product or competitor... (e.g. competitorstore.com)"
          className="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" className="shrink-0">
        Analyze
      </Button>
    </form>
  );
}
