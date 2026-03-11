import type { Language } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary.type";

export const enDictionary: Dictionary = {
  common: {
    appName: "Cold Mailing",
    loading: "Loading…",
    back: "Back",
    close: "Close",
    cancel: "Cancel",
  },
  languageSwitcher: {
    label: (language: Language) => (language === "fr" ? "Français" : "English"),
  },
  auth: {
    login: "Sign in",
  },
  home: {
    title: "Cold Mailing",
    subtitle: "Send emails to your clients",
  },
  leads: {
    title: "Leads",
    subtitle: "Prospects and tracking",
    inputs: {
      discoverQueryLabel: "Search query",
      discoverQueryPlaceholder: "Example: React, Next.js…",
      discoverSourcesLabel: "Sources",
      discoverLocationLabel: "Location (city / zone)",
      discoverLocationRadiusLabel: "Radius (km)",
      discoverLocationLatLabel: "Latitude",
      discoverLocationLngLabel: "Longitude",
    },
    table: {
      company: "Company",
      domain: "Domain",
      email: "Email",
      source: "Source",
      status: "Status",
      createdAt: "Created",
      actions: "Actions",
      links: "Links",
    },
    status: {
      NEW: "New",
      CONTACTED: "Contacted",
      REPLIED: "Replied",
      INTERESTED: "Interested",
      CLOSED: "Closed",
    },
    filterByStatus: "Filter by status",
    noLeads: "No leads.",
    viewDetail: "View",
    updateStatus: "Update status",
    backToList: "Back to list",
    leadDetail: "Lead detail",
    delete: "Delete",
    deleteConfirmTitle: "Delete this lead?",
    deleteConfirmDescription:
      "This action is irreversible and will remove the lead from the list.",
    discover: "Start discovery",
    discoverLog: "Discovery log",
    discoverRunning: "Discovery in progress…",
    sendEmail: "Send email",
    sendEmailSuccess: "Email sent.",
    sendEmailError: "Error sending email.",
    linkedinMessage: "LinkedIn message",
    generateLinkedInMessage: "Generate LinkedIn message",
    copy: "Copy",
    copied: "Copied!",
  },
};
