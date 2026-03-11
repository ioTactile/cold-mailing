"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

import { UserMenu } from "@/components/auth/user-menu";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/I18nProvider";

function AppHeader() {
  const { t } = useI18n();
  const { isAuthenticated, isInitialized } = useAuth();
  const pathname = usePathname();

  const isLeads = pathname.startsWith("/leads");

  return (
    <header className="border-b border-border/40 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          {t("common.appName")}
        </Link>
        <div className="flex items-center gap-3">
          {isInitialized && isAuthenticated && (
            <Link href="/leads">
              <Button variant={isLeads ? "secondary" : "ghost"} size="sm">
                {t("leads.title")}
              </Button>
            </Link>
          )}
          {isInitialized && isAuthenticated && <UserMenu />}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <Toaster position="top-right" />
    </div>
  );
}
