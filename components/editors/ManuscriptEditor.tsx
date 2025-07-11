import React, { useEffect, useMemo, useRef } from "react";
import type { NextFont } from "next/dist/compiled/@next/font";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { debounce } from "lodash-es";

// --- Configuration ---
const SAVE_DEBOUNCE_WAIT_MS = 1500; // Time to wait after user stops typing
const SAVE_DEBOUNCE_MAX_WAIT_MS = 5000; // Max time between saves, even if user types continuously

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

// --- Component ---
export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  initialText = "",
  saveText,
  font,
  textSize = "base",
  placeholder = "Start writing...",
}) => {
  // Store the latest saveText function in a ref to avoid re-creating the editor
  // when the parent component re-renders.
  const saveTextRef = useRef(saveText);
  useEffect(() => {
    saveTextRef.current = saveText;
  }, [saveText]);

  // The debounced save function.
  // useMemo ensures this function is created only once.
  const debouncedSave = useMemo(() => {
    return debounce(
      (editor: Editor) => {
        // TipTap's getText() provides the clean text for your database.
        // The blockSeparator ensures paragraphs are separated by newlines.
        const plainText = editor.getText({ blockSeparator: "\n" });
        saveTextRef.current(plainText);
        console.log("Auto-saved:", plainText);
      },
      SAVE_DEBOUNCE_WAIT_MS,
      {
        maxWait: SAVE_DEBOUNCE_MAX_WAIT_MS,
      }
    );
  }, []);

  const editor = useEditor({
    // 1. EXTENSIONS: We configure the editor's features.
    extensions: [
      // StarterKit provides the basics like paragraphs, text, etc.
      // We disable things we don't need, like bold, heading, etc.
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        // The 'paragraph' extension is crucial and enabled by default.
      }),
      // 2. PLACEHOLDER: This extension handles the placeholder text reliably.
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],

    // 3. STYLING: The editorProps is the "TipTap way" to apply classes.
    editorProps: {
      attributes: {
        // We construct the class string cleanly to avoid invalid characters.
        class: [
          // --- Layout & Sizing ---
          "w-full max-w-[70ch] mx-auto", // Center the editor column itself
          "flex-1", // Allow it to grow to fill the parent's height
          "overflow-y-auto", // Allow internal scrolling if content is long
          "outline-none", // Remove default focus outline

          // --- Padding & Font ---
          "p-4 md:p-6 lg:p-8",
          font.className,
          textSizeMap[textSize],

          // --- Colors ---
          "bg-white dark:bg-gray-900",
          "text-gray-900 dark:text-gray-100",

          // --- Manuscript Styling (The Core Fix) ---
          "leading-loose", // Set line spacing
          // Target paragraphs inside the editor for indentation.
          // This is more robust than using the `prose` plugin for this specific need.
          "[&_p]:indent-8",
          "[&_p]:my-0", // Remove extra vertical space between paragraphs

          // --- Placeholder Styling (The Core Fix) ---
          // Tiptap adds the 'is-empty' class to the editor. We target its `::before`
          // pseudo-element to show the placeholder text.
          "[&.is-editor-empty]:before:content-[attr(data-placeholder)]",
          "[&.is-editor-empty]:before:float-left",
          "[&.is-editor-empty]:before:text-gray-400 dark:[&.is-editor-empty]:before:text-gray-600",
          "[&.is-editor-empty]:before:pointer-events-none",
          "[&.is-editor-empty]:before:h-0",
        ].join(" "),
      },
    },

    // 4. CONTENT: Set the initial content from props.
    // TipTap automatically parses this into the correct <p> structure.
    content: initialText,

    // 5. AUTO-SAVE: The onUpdate hook triggers our debounced save.
    onUpdate: ({ editor }) => {
      debouncedSave(editor);
    },
  });

  // 6. SAVE ON UNMOUNT: This effect ensures work is saved when the user navigates away.
  useEffect(() => {
    // This is the cleanup function that runs when the component unmounts.
    return () => {
      if (!editor) return;

      // Cancel any pending debounced save to avoid a race condition.
      debouncedSave.cancel();

      // Trigger a final, immediate save with the latest content.
      const plainText = editor.getText({ blockSeparator: "\n" });
      saveTextRef.current(plainText);
      console.log("Final save on unmount.");

      // Destroy the editor instance to prevent memory leaks.
      editor.destroy();
    };
  }, [editor, debouncedSave]);

  return <EditorContent editor={editor} />;
};
