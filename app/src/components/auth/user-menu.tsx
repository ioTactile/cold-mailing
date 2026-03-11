"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function UserMenu() {
  const { user, isAuthenticated, logoutMutation } = useAuth();

  if (!isAuthenticated || !user) return null;

  return (
    <Button
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
      variant="outline"
    >
      Déconnexion
    </Button>
  );
}
