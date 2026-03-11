import type { Language } from "@/i18n/config";

export type Dictionary = {
  common: {
    appName: string;
    loading: string;
    back: string;
    close: string;
    cancel: string;
  };
  languageSwitcher: {
    label: (language: Language) => string;
  };
  auth: {
    login: string;
  };
  home: {
    title: string;
    subtitle: string;
  };
  leads: {
    title: string;
    subtitle: string;
    table: {
      company: string;
      domain: string;
      email: string;
      source: string;
      status: string;
      createdAt: string;
      actions: string;
    };
    status: {
      NEW: string;
      CONTACTED: string;
      REPLIED: string;
      INTERESTED: string;
      CLOSED: string;
    };
    filterByStatus: string;
    noLeads: string;
    viewDetail: string;
    updateStatus: string;
    backToList: string;
    leadDetail: string;
    delete: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    discover: string;
    discoverLog: string;
    discoverRunning: string;
    sendEmail: string;
    sendEmailSuccess: string;
    sendEmailError: string;
    linkedinMessage: string;
    generateLinkedInMessage: string;
    copy: string;
    copied: string;
  };
};
