"use client";

import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [entries, setEntries] = useState([]);
  const [filters, setFilters] = useState({ action: "", actorId: "", targetId: "" });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const response = await adminService.listAuditLogs(appliedFilters, { page, limit: 25 });
    if (response.success) {
      setEntries(response.data);
      setMeta(response.meta);
      setError("");
      if (page > Math.max(1, response.meta.totalPages || 1)) {
        setPage(Math.max(1, response.meta.totalPages || 1));
      }
    } else {
      setError(response.error.message || "Unable to load audit events.");
    }
    setLoading(false);
  }, [appliedFilters, page]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value.trim()])
    ));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Administrative audit log</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Read-only record of administrative and financial actions. Entries are newest first.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-4">
            <Input label="Action" value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} maxLength={200} />
            <Input label="Actor ID" value={filters.actorId} onChange={(event) => setFilters({ ...filters, actorId: event.target.value })} maxLength={200} />
            <Input label="Target ID" value={filters.targetId} onChange={(event) => setFilters({ ...filters, targetId: event.target.value })} maxLength={200} />
            <Button type="submit" className="self-end">Apply filters</Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={loadEntries}>Retry</Button>
        </div>
      ) : loading ? (
        <p className="p-10 text-center text-sm text-zinc-500">Loading audit events...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-zinc-500">No matching audit events.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">{entry.action}</h2>
                  <time className="text-xs text-zinc-500">{formatDate(entry.createdAt)}</time>
                </div>
                <p className="break-all text-xs text-zinc-500">Actor: {entry.actorId} · Target: {entry.targetId}</p>
                {entry.reason ? <p className="text-sm">{entry.reason}</p> : null}
                {Object.keys(entry.metadata || {}).length ? (
                  <pre className="overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-900">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{meta.total} event(s)</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <span>{page} / {Math.max(1, meta.totalPages || 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= (meta.totalPages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
