"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useDeleteLeadMutation, useLeads } from "@/hooks/use-leads-queries";
import { useI18n } from "@/i18n/I18nProvider";
import type { DiscoverEvent, DiscoverOptions } from "@/lib/leads/leads-api";
import { discoverLeads } from "@/lib/leads/leads-api";
import { queryKeys } from "@/lib/query/query-keys";
import { LeadSource, type LeadStatus } from "@/types/lead";

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "CLOSED",
];

const DEFAULT_DISCOVER_QUERY = "React";

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
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverLog, setDiscoverLog] = useState<string[]>([]);
  const [leadIdToDelete, setLeadIdToDelete] = useState<string | null>(null);
  const [discoverQuery, setDiscoverQuery] = useState<string>(
    DEFAULT_DISCOVER_QUERY,
  );
  const { t } = useI18n();
  const deleteLeadMutation = useDeleteLeadMutation();

  const runDiscover = useCallback(() => {
    if (!accessToken || isDiscovering) return;
    setIsDiscovering(true);
    setDiscoverLog([]);
    const trimmedQuery = discoverQuery.trim();
    if (!trimmedQuery) {
      setIsDiscovering(false);
      setDiscoverLog(["Veuillez saisir une requête de recherche."]);
      return;
    }
    const options: DiscoverOptions = {
      source: LeadSource.WTTJ,
      query: trimmedQuery,
      limit: 20,
    };
    discoverLeads(accessToken, options, (event) => {
      setDiscoverLog((prev) => [...prev, formatDiscoverEvent(event)]);
      if (event.type === "done") {
        setIsDiscovering(false);
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      }
    }).catch(() => {
      setIsDiscovering(false);
    });
  }, [accessToken, discoverQuery, isDiscovering, queryClient]);

  const params = statusFilter ? { status: statusFilter } : undefined;
  const { data: leads, isLoading, error } = useLeads(params);

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

  const handleDeleteLead = (id: string) => {
    if (!accessToken) return;

    deleteLeadMutation.mutate({ accessToken, id });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("leads.title")}
          </h1>
          <p className="text-muted-foreground">{t("leads.subtitle")}</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Label htmlFor="discover-query" className="text-sm">
            Requête de recherche
          </Label>
          <div className="flex gap-2">
            <Input
              id="discover-query"
              className="w-48"
              value={discoverQuery}
              onChange={(event) => setDiscoverQuery(event.target.value)}
              placeholder="Exemple : React, Next.js…"
            />
            <Button
              onClick={runDiscover}
              disabled={isDiscovering}
              variant="secondary"
            >
              {isDiscovering
                ? t("leads.discoverRunning")
                : t("leads.discover")}
            </Button>
          </div>
        </div>
      </div>

      {discoverLog.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
          <h2 className="mb-2 text-sm font-medium text-foreground">
            {t("leads.discoverLog")}
          </h2>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap wrap-break-word text-xs text-muted-foreground">
            {discoverLog.join("\n")}
          </pre>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <Label htmlFor="status-filter">{t("leads.filterByStatus")}</Label>
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(value) =>
            setStatusFilter(value === "all" ? null : (value as LeadStatus))
          }
        >
          <SelectTrigger id="status-filter" className="min-w-40">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span>—</span>
            </SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`leads.status.${s}` as "leads.status.NEW")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50">
                <TableHead className="px-4 py-3 font-medium text-foreground">
                  {t("leads.table.company")}
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-foreground">
                  {t("leads.table.domain")}
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-foreground">
                  {t("leads.table.email")}
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-foreground">
                  {t("leads.table.source")}
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-foreground">
                  {t("leads.table.status")}
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-foreground">
                  {t("leads.table.createdAt")}
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-foreground">
                  {t("leads.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} className="bg-card hover:bg-muted/30">
                  <TableCell className="px-4 py-3 text-foreground">
                    {lead.company}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {lead.domain}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {lead.email ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {lead.source}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-foreground">
                      {t(`leads.status.${lead.status}` as "leads.status.NEW")}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm">
                          {t("leads.viewDetail")}
                        </Button>
                      </Link>
                      <AlertDialog
                        open={leadIdToDelete === lead.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setLeadIdToDelete(lead.id);
                          } else {
                            setLeadIdToDelete(null);
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLeadMutation.isPending}
                          >
                            {t("leads.delete")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent size="sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("leads.deleteConfirmTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("leads.deleteConfirmDescription")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("common.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              {t("leads.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
