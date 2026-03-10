"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  useLeadById,
  useSendLeadEmailMutation,
  useUpdateLeadStatusMutation,
} from "@/hooks/use-leads-queries";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { getLinkedInMessage } from "@/lib/leads/leads-api";
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

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { accessToken, isAuthenticated, isInitialized } = useAuth();
  const { data: lead, isLoading, error } = useLeadById(accessToken, id ?? null);
  const updateStatusMutation = useUpdateLeadStatusMutation();
  const sendEmailMutation = useSendLeadEmailMutation();
  const [draftStatus, setDraftStatus] = useState<LeadStatus | null>(null);
  const selectedStatus = draftStatus ?? lead?.status ?? "";
  const [linkedInMessage, setLinkedInMessage] = useState<string | null>(null);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const handleSendEmail = () => {
    if (!accessToken || !id) return;
    sendEmailMutation.mutate({ accessToken, id });
  };

  const handleGenerateLinkedInMessage = async () => {
    if (!accessToken || !id) return;
    setLinkedInLoading(true);
    setLinkedInMessage(null);
    const result = await getLinkedInMessage(accessToken, id);
    setLinkedInLoading(false);
    if (result.ok) setLinkedInMessage(result.data.message);
  };

  const handleCopyLinkedInMessage = async () => {
    if (!linkedInMessage) return;
    await navigator.clipboard.writeText(linkedInMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, router]);

  const handleUpdateStatus = () => {
    if (!accessToken || !id || selectedStatus === "" || selectedStatus === lead?.status)
      return;
    updateStatusMutation.mutate(
      { accessToken, id, status: selectedStatus as LeadStatus },
      { onSuccess: () => setDraftStatus(null) },
    );
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground">{t("common.loading")}</span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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
        <Link
          href="/leads"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("leads.backToList")}
        </Link>

        {isLoading && (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        )}
        {error && (
          <p className="text-destructive">
            {error instanceof Error ? error.message : "Erreur"}
          </p>
        )}
        {!isLoading && !error && !lead && (
          <p className="text-muted-foreground">{t("leads.noLeads")}</p>
        )}
        {!isLoading && !error && lead && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("leads.leadDetail")} — {lead.company}
            </h1>

            <div className="rounded-lg border border-border bg-card p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t("leads.table.company")}
                  </dt>
                  <dd className="mt-1 text-foreground">{lead.company}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t("leads.table.domain")}
                  </dt>
                  <dd className="mt-1 text-foreground">{lead.domain}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t("leads.table.email")}
                  </dt>
                  <dd className="mt-1 text-foreground">{lead.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    LinkedIn
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {lead.linkedin ? (
                      <a
                        href={lead.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {lead.linkedin}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t("leads.table.source")}
                  </dt>
                  <dd className="mt-1 text-foreground">{lead.source}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t("leads.table.createdAt")}
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {formatDate(lead.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mb-6 rounded-lg border border-border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {t("leads.linkedinMessage")}
              </h2>
              {lead.linkedin && (
                <p className="mb-2 text-sm text-muted-foreground">
                  <a
                    href={lead.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {lead.linkedin}
                  </a>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleGenerateLinkedInMessage}
                  disabled={linkedInLoading}
                >
                  {linkedInLoading
                    ? t("common.loading")
                    : t("leads.generateLinkedInMessage")}
                </Button>
                {linkedInMessage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyLinkedInMessage}
                  >
                    {copied ? t("leads.copied") : t("leads.copy")}
                  </Button>
                )}
              </div>
              {linkedInMessage && (
                <textarea
                  readOnly
                  className="mt-3 w-full rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground"
                  rows={6}
                  value={linkedInMessage}
                />
              )}
            </div>

            {lead.email && lead.status !== "CONTACTED" && (
              <div className="mb-6 rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  {t("leads.sendEmail")}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleSendEmail}
                    disabled={sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending
                      ? t("common.loading")
                      : t("leads.sendEmail")}
                  </Button>
                  {sendEmailMutation.isSuccess && (
                    <span className="text-sm text-primary">
                      {t("leads.sendEmailSuccess")}
                    </span>
                  )}
                  {sendEmailMutation.isError && (
                    <span className="text-sm text-destructive">
                      {t("leads.sendEmailError")}{" "}
                      {sendEmailMutation.error instanceof Error
                        ? sendEmailMutation.error.message
                        : ""}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {t("leads.updateStatus")}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setDraftStatus(
                      e.target.value === "" ? null : (e.target.value as LeadStatus),
                    )
                  }
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {t(`leads.status.${s}` as "leads.status.NEW")}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={
                    selectedStatus === "" ||
                    selectedStatus === lead.status ||
                    updateStatusMutation.isPending
                  }
                >
                  {updateStatusMutation.isPending
                    ? t("common.loading")
                    : t("leads.updateStatus")}
                </Button>
                {updateStatusMutation.isError && (
                  <span className="text-sm text-destructive">
                    {updateStatusMutation.error instanceof Error
                      ? updateStatusMutation.error.message
                      : "Erreur"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
