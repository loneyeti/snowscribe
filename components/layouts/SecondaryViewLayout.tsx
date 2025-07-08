import React from "react";

interface SecondaryViewLayoutProps {
  middleColumn: React.ReactNode;
  mainDetailColumn: React.ReactNode;
}

export function SecondaryViewLayout({
  middleColumn,
  mainDetailColumn,
}: SecondaryViewLayoutProps) {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Middle Column (Contextual Navigation/List) */}
      <aside className="w-1/3 border-r border-border overflow-y-auto bg-card p-4">
        {middleColumn}
      </aside>

      {/* Main Detail Column (Content/Editor) */}
      <section className="w-2/3 overflow-y-auto bg-background p-4">
        {mainDetailColumn}
      </section>
    </div>
  );
}
