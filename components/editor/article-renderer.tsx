'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useMemo } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import type { ArticleContent } from '@/lib/types/database';
import { sanitizeTipTapJSON } from '@/lib/utils/sanitize';

interface ArticleRendererProps {
  content: ArticleContent;
}

export function ArticleRenderer({ content }: ArticleRendererProps) {
  // Sanitize content before rendering to prevent XSS attacks
  const sanitizedContent = useMemo(() => sanitizeTipTapJSON(content), [content]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
          rel: 'noopener noreferrer',  // Security: prevent reverse tabnabbing
        },
      }),
    ],
    content: sanitizedContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="article-content">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .article-content .ProseMirror {
          outline: none;
        }

        .article-content .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 500;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #111827;
        }

        .article-content .ProseMirror h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.875rem;
          color: #1f2937;
        }

        .article-content .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #374151;
        }

        .article-content .ProseMirror p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.75;
          color: #4b5563;
        }

        .article-content .ProseMirror ul,
        .article-content .ProseMirror ol {
          margin-top: 1rem;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .article-content .ProseMirror ul {
          list-style-type: disc;
        }

        .article-content .ProseMirror ol {
          list-style-type: decimal;
        }

        .article-content .ProseMirror li {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          color: #4b5563;
        }

        .article-content .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: #6b7280;
          font-style: italic;
        }

        .article-content .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }

        .article-content .ProseMirror pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }

        .article-content .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }

        .article-content .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }

        .article-content .ProseMirror a:hover {
          color: #1e40af;
        }

        .article-content .ProseMirror hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
}
