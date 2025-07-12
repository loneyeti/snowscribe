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
    <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden gap-4 md:gap-6">
      {/* Middle Column (Contextual Navigation/List) */}
      <aside className="relative w-full md:w-1/3 rounded-xl border border-border overflow-y-auto bg-gradient-to-br from-card to-card/95 backdrop-blur-sm p-4 min-h-[300px] shadow-soft">
        {middleColumn}
      </aside>

      {/* Main Detail Column (Content/Editor) */}
      <section className="w-full md:w-2/3 overflow-y-auto bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-soft">
        {mainDetailColumn}
      </section>
    </div>
  );
}
