"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/data/auth";

// Enhanced Avatar component with glassmorphic design
const Avatar = ({
  userAvatarUrl,
  userName,
  className,
}: {
  userAvatarUrl?: string;
  userName?: string;
  className?: string;
}) => {
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div
      className={cn(
        "relative h-9 w-9 rounded-full overflow-hidden",
        "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
        "border border-slate-200/60 dark:border-slate-700/60",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "backdrop-blur-sm",
        className
      )}
    >
      {userAvatarUrl ? (
        <img
          src={userAvatarUrl}
          alt={userName || "User Avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
            {initials}
          </span>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow-sm" />
    </div>
  );
};

export interface UserMenuButtonProps {
  onViewProfile?: () => void;
  onAccountSettings?: () => void;
  userName?: string;
  userAvatarUrl?: string;
  className?: string;
}

const UserMenuButton: React.FC<UserMenuButtonProps> = ({
  onViewProfile,
  onAccountSettings,
  userName,
  userAvatarUrl,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full p-1 h-auto w-auto",
            "hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
            "transition-all duration-200 ease-out",
            "hover:scale-105 active:scale-95",
            "focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
            "focus:ring-offset-white dark:focus:ring-offset-slate-900",
            className
          )}
        >
          <Avatar
            userAvatarUrl={userAvatarUrl}
            userName={userName}
            className="transition-transform duration-200 group-hover:scale-105"
          />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-64 p-2",
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-xl shadow-slate-200/20 dark:shadow-slate-900/40",
          "rounded-xl",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        )}
        sideOffset={8}
      >
        {userName && (
          <>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex items-center gap-3">
                <Avatar
                  userAvatarUrl={userAvatarUrl}
                  userName={userName}
                  className="h-10 w-10"
                />
                <div className="flex flex-col space-y-1 min-w-0">
                  <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100 truncate">
                    {userName}
                  </p>
                  <p className="text-xs leading-none text-slate-500 dark:text-slate-400 truncate">
                    Signed in
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200/60 dark:bg-slate-700/60" />
          </>
        )}

        {onViewProfile && (
          <DropdownMenuItem
            onClick={onViewProfile}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
              "transition-all duration-150 ease-out",
              "cursor-pointer group"
            )}
          >
            <User className="h-4 w-4 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors" />
            <span className="font-medium">View Profile</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
              "transition-all duration-150 ease-out",
              "cursor-pointer group"
            )}
          >
            <Settings className="h-4 w-4 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors" />
            <span className="font-medium">Profile & Settings</span>
          </Link>
        </DropdownMenuItem>

        {(onViewProfile || onAccountSettings) && (
          <DropdownMenuSeparator className="bg-slate-200/60 dark:bg-slate-700/60 my-2" />
        )}

        <DropdownMenuItem asChild>
          <button
            onClick={handleSignOut}
            type="submit"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "hover:bg-red-50/80 dark:hover:bg-red-900/20",
              "transition-all duration-150 ease-out",
              "cursor-pointer group text-left"
            )}
          >
            <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-600 dark:text-slate-400 dark:group-hover:text-red-400 transition-colors" />
            <span className="font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              Sign Out
            </span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

UserMenuButton.displayName = "UserMenuButton";

export { UserMenuButton };
