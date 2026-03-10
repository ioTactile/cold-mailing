"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { UserMenu } from "@/components/auth/user-menu";
import { AuthModal } from "@/components/home/AuthModal";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/I18nProvider";

export default function Home() {
  const { isAuthenticated, isInitialized } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,var(--home-bg-top)_0%,var(--home-bg-bottom)_100%)]">
      <header className="border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <span className="text-xl">{t("common.appName")}</span>
          </Link>
          <div className="flex items-center gap-3">
            {!isInitialized ? (
              <span className="text-sm text-muted-foreground">
                {t("common.loading")}
              </span>
            ) : isAuthenticated ? (
              <>
                <Link href="/leads">
                  <Button variant="ghost" size="sm">
                    {t("leads.title")}
                  </Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthModalOpen(true)}
              >
                <LogIn className="size-4" />
                {t("auth.login")}
              </Button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <section className="mb-14 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("home.title")}
          </h1>
          <p className="text-lg text-muted-foreground">{t("home.subtitle")}</p>
        </section>
      </main>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
