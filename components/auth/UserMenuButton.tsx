"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"; // Assuming these are correctly exported
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// A simple placeholder for an Avatar component.
// In a real app, this would likely show a user's image or initials.
const AvatarPlaceholder = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground",
      className
    )}
  >
    U
  </div>
);

export interface UserMenuButtonProps {
  // onLogout?: () => Promise<void> | void; // Removed
  onViewProfile?: () => void;
  onAccountSettings?: () => void;
  userName?: string; // Optional: display user's name or email
  userAvatarUrl?: string; // Optional: URL for user's avatar image
  className?: string;
}

const UserMenuButton: React.FC<UserMenuButtonProps> = ({
  // onLogout, // Removed
  onViewProfile,
  onAccountSettings,
  userName,
  userAvatarUrl,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild className={cn(className)}>
        <Button variant="ghost" size="icon" className="rounded-full">
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName || "User Avatar"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <AvatarPlaceholder />
          )}
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {userName && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Signed in as</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userName}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}{" "}
        {/* Correctly closed fragment */}
        {onViewProfile && (
          <DropdownMenuItem onClick={onViewProfile}>Profile</DropdownMenuItem>
        )}
        {onAccountSettings && (
          <DropdownMenuItem onClick={onAccountSettings}>
            Account Settings
          </DropdownMenuItem>
        )}
        {onViewProfile || onAccountSettings ? <DropdownMenuSeparator /> : null}
        {/* Removed onLogout prop, logout is now handled by a form POST to /auth/logout */}
        <form action="/auth/logout" method="post">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-left">
              Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
UserMenuButton.displayName = "UserMenuButton";

export { UserMenuButton };
