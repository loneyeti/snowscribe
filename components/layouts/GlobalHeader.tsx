// File: components/layouts/GlobalHeader.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserMenuButton } from "@/components/auth/UserMenuButton";
import { IconButton } from "@/components/ui/IconButton";
import { Settings2, Plus } from "lucide-react";
import { getClientProfile } from "@/lib/data/profiles";
import type { User } from "@supabase/supabase-js";
import { Button } from "../ui/Button";
import { CreateProjectModal } from "../projects/CreateProjectModal";

interface GlobalHeaderProps {
  user: User | null;
}

export function GlobalHeader({ user }: GlobalHeaderProps) {
  const router = useRouter();
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profile = await getClientProfile();
        setIsSiteAdmin(profile?.is_site_admin ?? false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handleProjectCreated = () => {
    // We just close the modal and refresh the router to show the new project on the list
    handleCloseCreateModal();
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">Snowscribe</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="default" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              New Novel
            </Button>
            {isSiteAdmin && (
              <IconButton
                icon={Settings2}
                aria-label="Site Settings"
                onClick={() => router.push("/settings")}
                title="Site Settings"
              />
            )}
            {user && (
              <UserMenuButton
                userName={user.email ?? undefined}
                userAvatarUrl={user.user_metadata.avatar_url}
              />
            )}
          </div>
        </div>
      </header>
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
