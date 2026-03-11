"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  useLeadById,
  useSendLeadEmailMutation,
  useUpdateLeadStatusMutation,
} from "@/hooks/use-leads-queries";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { data: lead, isLoading, error } = useLeadById(id ?? null);
  const updateStatusMutation = useUpdateLeadStatusMutation();
  const sendEmailMutation = useSendLeadEmailMutation();
  const [draftStatus, setDraftStatus] = useState<LeadStatus | null>(null);
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
    if (!accessToken || !id || !lead) return;
    const nextStatus = draftStatus ?? lead.status;
    if (nextStatus === lead.status) return;
    updateStatusMutation.mutate(
      { accessToken, id, status: nextStatus },
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
    <>
      <Link
        href="/leads"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> {t("leads.backToList")}
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
              <Textarea
                readOnly
                className="mt-3 bg-muted/30 text-sm text-foreground"
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
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="status-select"
                  className="text-sm text-foreground"
                >
                  {t("leads.table.status")}
                </Label>
                <Select
                  value={draftStatus ?? lead.status}
                  onValueChange={(value) => setDraftStatus(value as LeadStatus)}
                >
                  <SelectTrigger id="status-select" className="min-w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`leads.status.${s}` as "leads.status.NEW")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleUpdateStatus}
                disabled={
                  (draftStatus ?? lead.status) === lead.status ||
                  updateStatusMutation.isPending
                }
                className="self-end"
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
    </>
  );
}
