"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLeads } from "@/hooks/use-leads-queries";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { UserMenu } from "@/components/auth/user-menu";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import type { DiscoverEvent } from "@/lib/leads/leads-api";
import { discoverLeads } from "@/lib/leads/leads-api";
import { queryKeys } from "@/lib/query/query-keys";
import type { LeadStatus } from "@/types/lead";

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "CLOSED",
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDiscoverEvent(event: DiscoverEvent): string {
  switch (event.type) {
    case "step":
      return event.message;
    case "lead_created":
      return `Lead créé : ${event.lead.company} (${event.lead.domain})`;
    case "skip":
      return `Ignoré${event.company ? ` (${event.company})` : ""}: ${event.reason}`;
    case "done":
      return `Terminé. Créés : ${event.created}, ignorés : ${event.skipped}.`;
    case "error":
      return `Erreur : ${event.message}`;
    default:
      return JSON.stringify(event);
  }
}

export default function LeadsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated, isInitialized } = useAuth();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverLog, setDiscoverLog] = useState<string[]>([]);
  const { t } = useI18n();

  const runDiscover = useCallback(() => {
    if (!accessToken || isDiscovering) return;
    setIsDiscovering(true);
    setDiscoverLog([]);
    discoverLeads(
      accessToken,
      { source: "WTTJ", query: "React", limit: 20 },
      (event) => {
        setDiscoverLog((prev) => [...prev, formatDiscoverEvent(event)]);
        if (event.type === "done") {
          setIsDiscovering(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
        }
      },
    ).catch(() => {
      setIsDiscovering(false);
    });
  }, [accessToken, isDiscovering, queryClient]);

  const params =
    statusFilter !== "" ? { status: statusFilter as LeadStatus } : undefined;
  const { data: leads, isLoading, error } = useLeads(accessToken, params);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground">{t("common.loading")}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-semibold tracking-tight text-foreground"
          >
            {t("common.appName")}
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/leads">
              <Button variant="ghost" size="sm">
                {t("leads.title")}
              </Button>
            </Link>
            <UserMenu />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("leads.title")}
            </h1>
            <p className="text-muted-foreground">{t("leads.subtitle")}</p>
          </div>
          <Button
            onClick={runDiscover}
            disabled={isDiscovering}
            variant="secondary"
          >
            {isDiscovering ? t("leads.discoverRunning") : t("leads.discover")}
          </Button>
        </div>

        {discoverLog.length > 0 && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
            <h2 className="mb-2 text-sm font-medium text-foreground">
              {t("leads.discoverLog")}
            </h2>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {discoverLog.join("\n")}
            </pre>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-foreground"
          >
            {t("leads.filterByStatus")}
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value === "" ? "" : (e.target.value as LeadStatus),
              )
            }
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">—</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`leads.status.${s}` as "leads.status.NEW")}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        )}
        {error && (
          <p className="text-destructive">
            {error instanceof Error ? error.message : "Erreur"}
          </p>
        )}
        {!isLoading && !error && (!leads || leads.length === 0) && (
          <p className="text-muted-foreground">{t("leads.noLeads")}</p>
        )}
        {!isLoading && !error && leads && leads.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-foreground">
                    {t("leads.table.company")}
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    {t("leads.table.domain")}
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    {t("leads.table.email")}
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    {t("leads.table.source")}
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    {t("leads.table.status")}
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    {t("leads.table.createdAt")}
                  </th>
                  <th className="px-4 py-3 font-medium text-foreground">
                    {t("leads.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr key={lead.id} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3 text-foreground">
                      {lead.company}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.domain}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.source}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-foreground">
                        {t(`leads.status.${lead.status}` as "leads.status.NEW")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm">
                          {t("leads.viewDetail")}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
