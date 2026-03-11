import type { Language } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary.type";

export const frDictionary: Dictionary = {
  common: {
    appName: "Cold Mailing",
    loading: "Chargement…",
    back: "Retour",
    close: "Fermer",
    cancel: "Annuler",
  },
  languageSwitcher: {
    label: (language: Language) => (language === "fr" ? "Français" : "English"),
  },
  auth: {
    login: "Se connecter",
  },
  home: {
    title: "Cold Mailing",
    subtitle: "Envoyez des emails à vos clients",
  },
  leads: {
    title: "Leads",
    subtitle: "Prospects et suivi",
    table: {
      company: "Entreprise",
      domain: "Domaine",
      email: "Email",
      source: "Source",
      status: "Statut",
      createdAt: "Créé le",
      actions: "Actions",
    },
    status: {
      NEW: "Nouveau",
      CONTACTED: "Contacté",
      REPLIED: "Répondu",
      INTERESTED: "Intéressé",
      CLOSED: "Fermé",
    },
    filterByStatus: "Filtrer par statut",
    noLeads: "Aucun lead.",
    viewDetail: "Voir",
    updateStatus: "Modifier le statut",
    backToList: "Retour à la liste",
    leadDetail: "Détail du lead",
    delete: "Supprimer",
    deleteConfirmTitle: "Supprimer ce lead ?",
    deleteConfirmDescription:
      "Cette action est définitive et supprimera le lead de la liste.",
    discover: "Lancer une découverte",
    discoverLog: "Journal de la découverte",
    discoverRunning: "Découverte en cours…",
    sendEmail: "Envoyer l'email",
    sendEmailSuccess: "Email envoyé.",
    sendEmailError: "Erreur lors de l'envoi.",
    linkedinMessage: "Message LinkedIn",
    generateLinkedInMessage: "Générer le message LinkedIn",
    copy: "Copier",
    copied: "Copié !",
  },
};
