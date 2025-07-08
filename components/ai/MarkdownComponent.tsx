import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
// Import both light and dark themes and useTheme hook
import {
  vscDarkPlus,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface MarkdownComponentProps {
  markdown: string;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function MarkdownComponent({
  markdown,
}: MarkdownComponentProps) {
  const { resolvedTheme } = useTheme(); // Use resolvedTheme to handle 'system'
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderers: Components = {
    code({ inline, className, children, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || "");

      if (!isMounted) {
        // Render a placeholder or nothing on the server to avoid hydration mismatch
        return (
          <code className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5">
            ...
          </code>
        );
      }

      return !inline && match ? (
        <SyntaxHighlighter
          style={resolvedTheme === "dark" ? vscDarkPlus : oneLight}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className={cn("before:content-none after:content-none", className)}
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
