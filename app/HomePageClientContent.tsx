"use client";

import { ProjectList } from "@/components/homepage/ProjectList";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import Link from "next/link";
import type { Project } from "@/lib/types"; // Assuming a Project type exists or will be created

interface HomePageClientContentProps {
  projects: Project[] | null;
  errorOccurred: boolean;
}

export default function HomePageClientContent({
  projects,
  errorOccurred,
}: HomePageClientContentProps) {
  if (errorOccurred) {
    return (
      <main className="flex-grow p-4 md:p-8 flex items-center justify-center text-center">
        <div>
          <Heading level={2} className="mb-2 text-xl text-destructive">
            Error Loading Projects
          </Heading>
          <Paragraph className="text-muted-foreground mb-6">
            We couldn&apos;t retrieve your projects at this time. Please try
            again later.
          </Paragraph>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow p-4 md:p-6 lg:p-8">
      {projects && projects.length > 0 ? (
        <ProjectList
          projects={projects.map((p) => ({
            id: p.id,
            title: p.title,
            genre: p.genre ?? undefined, // Ensure null becomes undefined
            // wordCount: p.word_count, // Assuming word_count might be added later
            lastUpdated: p.updated_at
              ? new Date(p.updated_at).toLocaleDateString()
              : undefined,
          }))}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-12 h-full min-h-[calc(100vh-10rem)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
            stroke="currentColor"
            className="w-20 h-20 mb-6 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-15h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M3 3h18M3 21h18"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <Heading level={2} className="mb-3 text-2xl font-semibold">
            No Projects Yet
          </Heading>
          <Paragraph className="text-muted-foreground mb-8 max-w-md">
            It looks like you haven&apos;t started any novels. Let&apos;s change
            that and bring your stories to life!
          </Paragraph>
          <Button asChild size="lg">
            <Link href="/projects/new">Start Your First Novel</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
