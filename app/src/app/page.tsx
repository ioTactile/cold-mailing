"use client";

import { useState } from "react";

import { AuthModal } from "@/components/home/AuthModal";
import { useI18n } from "@/i18n/I18nProvider";

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <section className="text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("home.title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("home.subtitle")}</p>
      </section>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
