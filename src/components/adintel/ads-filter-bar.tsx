"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";

const PLATFORMS = ["META", "TIKTOK", "GOOGLE", "OTHER"];
const FORMATS = ["VIDEO", "IMAGE", "CAROUSEL", "OTHER"];
const STATUSES = ["ACTIVE", "INACTIVE"];

export function AdsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", q || null);
        }}
        className="relative flex-1"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ads..." className="pl-9" />
      </form>
      <div className="flex gap-2">
        <Select defaultValue={searchParams.get("platform") ?? "ALL"} onValueChange={(v) => setParam("platform", v)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All platforms</SelectItem>
            {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select defaultValue={searchParams.get("format") ?? "ALL"} onValueChange={(v) => setParam("format", v)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Format" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All formats</SelectItem>
            {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select defaultValue={searchParams.get("status") ?? "ALL"} onValueChange={(v) => setParam("status", v)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
