"use client";

import React, { useState } from "react";
import type { Database } from "@/lib/supabase/database.types";
import type { User } from "@supabase/supabase-js";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import { Button } from "@/components/ui/Button";
import { ProfileForm } from "./ProfileForm";
import { AccountForm } from "./AccountForm";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileClientProps {
  profile: Profile;
  user: User;
}

type Tab = "profile" | "account" | "ai" | "appearance" | "subscription";

export function ProfileClient({ profile, user }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileForm profile={profile} />;
      case "account":
        return <AccountForm user={user} />;
      case "ai":
        return <div>AI settings will go here.</div>;
      case "appearance":
        return <div>Appearance settings will go here.</div>;
      case "subscription":
        return <div>Subscription management will go here.</div>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <Heading level={1}>Profile & Settings</Heading>
        <Paragraph className="mt-2 text-muted-foreground">
          Manage your personal information, preferences, and account settings.
        </Paragraph>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <nav className="flex flex-row md:flex-col md:w-1/4 space-x-2 md:space-x-0 md:space-y-1">
          <TabButton
            label="Profile"
            isActive={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <TabButton
            label="Account"
            isActive={activeTab === "account"}
            onClick={() => setActiveTab("account")}
          />
          <TabButton
            label="AI Settings"
            isActive={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />
          <TabButton
            label="Appearance"
            isActive={activeTab === "appearance"}
            onClick={() => setActiveTab("appearance")}
          />
          <TabButton
            label="Subscription"
            isActive={activeTab === "subscription"}
            onClick={() => setActiveTab("subscription")}
          />
        </nav>

        <main className="flex-1 md:w-3/4 bg-card p-6 rounded-lg border border-border shadow-sm">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      onClick={onClick}
      className="w-full justify-start"
    >
      {label}
    </Button>
  );
}
