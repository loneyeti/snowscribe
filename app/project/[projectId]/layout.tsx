// File: app/(dashboard)/project/[projectId]/layout.tsx
import React from "react";

// This layout component is a pass-through. It prevents the project-specific
// pages from inheriting the global header from the parent (dashboard) layout.
// The project's own AppShell component will provide its specific header.
export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
