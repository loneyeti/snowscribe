import React, { useRef, useEffect, useCallback } from "react";
import type { NextFont } from "next/dist/compiled/@next/font";

// --- Configuration ---
const SAVE_DEBOUNCE_MS = 1500;
const textSizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};
type TextSize = keyof typeof textSizeMap;

// --- Props Interface ---
interface ManuscriptEditorProps {
  initialText?: string;
  saveText: (text: string) => void | Promise<void>;
  font: NextFont;
  textSize?: TextSize;
  placeholder?: string;
}

// --- Helper Functions ---
const plainTextToHtml = (text: string): string => {
  // Return <p> with zero-width space for empty initial text
  // Helps browser apply styles/focus correctly from the start
  if (!text) return "<p>&#8203;</p>";
  return (
    text
      .split("\n")
      // Use <br> for actual empty lines within existing text
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join("")
  );
};

const htmlToPlainText = (html: string): string => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const lines: string[] = [];
  tempDiv.childNodes.forEach((node) => {
    if (node.nodeName === "P") {
      const pElement = node as HTMLParagraphElement;
      if (
        pElement.childNodes.length === 1 &&
        pElement.childNodes[0].nodeName === "BR"
      ) {
        lines.push("");
      } else {
        lines.push(pElement.textContent || "");
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      lines.push(node.textContent || "");
    }
  });

  let plainText = lines.join("\n");
  if (
    html.endsWith("<p><br></p>") &&
    plainText.endsWith("\n") &&
    lines.length > 1
  ) {
    // Trim heuristic, see previous explanation
  } else if (!html && plainText === "\n") {
    plainText = "";
  }

  plainText = plainText.replace(/\n{3,}/g, "\n\n");

  // Treat content that is just the initial zero-width space as empty
  if (html.trim() === "<p>​</p>" || html.trim() === "") return "";

  return plainText;
};

// --- Component ---
export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  initialText = "",
  saveText,
  font,
  textSize = "base",
  placeholder = "Start writing...",
}) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedSaveText = useRef(saveText);

  useEffect(() => {
    savedSaveText.current = saveText;
  }, [saveText]);

  const textSizeClass = textSizeMap[textSize] || textSizeMap.base;

  // Effect to initialize content and handle external changes to initialText
  useEffect(() => {
    if (contentEditableRef.current) {
      const currentHtml = contentEditableRef.current.innerHTML;
      const currentDomAsPlainText = htmlToPlainText(currentHtml);

      if (initialText !== currentDomAsPlainText) {
        const newHtml = plainTextToHtml(initialText);
        contentEditableRef.current.innerHTML = newHtml;
      }
    }
  }, [initialText]);

  // Debounced save function
  const debouncedSave = useCallback((text: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      savedSaveText.current(text);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Handle input events on the contentEditable div
  const handleInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const currentHtml = target.innerHTML;
      const newPlainText = htmlToPlainText(currentHtml);

      debouncedSave(newPlainText);

      // Scroll to cursor
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const cursorElement = range.startContainer.parentElement;
        cursorElement?.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    },
    [debouncedSave]
  );

  return (
    <div
      ref={contentEditableRef}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onInput={handleInput}
      className={`
            max-w-[70ch] w-[70ch] min-w-[70ch] flex-1 overflow-y-auto outline-none 
            p-4 md:p-6 lg:p-8
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            ${font.className}
            ${textSizeClass}
            leading-loose
            whitespace-pre-wrap
            break-words
            [&>p]:indent-8
            relative
            transition-colors duration-200
            rounded-lg
            box-shadow(0 1px 3px rgba(0,0,0,0.1))
          `}
      aria-label={placeholder || "Text input area"}
      spellCheck="true"
    >
      {/* Static text removed, content will be set by useEffect */}
    </div>
  );
};

// --- Helper Type for NextFont ---
/*
    declare module 'next/dist/compiled/@next/font' {
      interface NextFont {
        className: string;
        style: {
          fontFamily: string;
          fontWeight?: number | string;
          fontStyle?: string;
        };
      }
    }
      */
