"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { UserMenuButton } from "@/components/auth/UserMenuButton";
// CreateProjectModal is no longer rendered here
import type { User } from "@supabase/supabase-js";

interface HomePageHeaderActionsProps {
  user: User | null;
  onOpenCreateModal: () => void;
}

export function HomePageHeaderActions({
  user,
  onOpenCreateModal,
}: HomePageHeaderActionsProps) {
  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      <Button variant="default" size="sm" onClick={onOpenCreateModal}>
        New Novel
      </Button>
      {user && (
        <UserMenuButton
          userName={user.email ?? undefined}
          // onLogout will be handled by a Link/button inside UserMenuButton pointing to /auth/logout
        />
      )}
    </div>
  );
}
