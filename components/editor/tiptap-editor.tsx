'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { getEditorExtensions } from './extensions';
import { EditorToolbar } from './editor-toolbar';
import { uploadImage } from '@/lib/storage/image-upload';
import type { ArticleContent } from '@/lib/types/database';

interface TipTapEditorProps {
  content?: ArticleContent;
  onChange?: (content: ArticleContent) => void;
  placeholder?: string;
  editable?: boolean;
  userId?: string; // Required for image uploads
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing your article...',
  editable = true,
  userId,
}: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const editor = useEditor({
    extensions: getEditorExtensions({ editable }),
    content: content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    },
    editable,
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 border border-t-0 border-gray-300 rounded-b-lg',
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        const json = editor.getJSON();
        onChange(json as ArticleContent);
      }
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!userId) {
      setUploadError('User ID is required for image uploads');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImage(file, userId);

      // Insert image into editor
      if (editor) {
        editor.chain().focus().setImage({ src: result.url }).run();
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor">
      {editable && (
        <>
          <EditorToolbar
            editor={editor}
            onImageUpload={userId ? triggerImageUpload : undefined}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 text-sm">
              Uploading image...
            </div>
          )}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
              Error: {uploadError}
            </div>
          )}
        </>
      )}
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-editor .ProseMirror {
          outline: none;
        }

        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder}';
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          float: left;
        }

        .tiptap-editor .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #111827;
        }

        .tiptap-editor .ProseMirror h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.875rem;
          color: #1f2937;
        }

        .tiptap-editor .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #374151;
        }

        .tiptap-editor .ProseMirror p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.75;
          color: #4b5563;
        }

        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol {
          margin-top: 1rem;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .tiptap-editor .ProseMirror ul {
          list-style-type: disc;
        }

        .tiptap-editor .ProseMirror ol {
          list-style-type: decimal;
        }

        .tiptap-editor .ProseMirror li {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          color: #4b5563;
        }

        .tiptap-editor .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: #6b7280;
          font-style: italic;
        }

        .tiptap-editor .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
          color: #dc2626;
        }

        .tiptap-editor .ProseMirror pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }

        .tiptap-editor .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }

        .tiptap-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }

        .tiptap-editor .ProseMirror a:hover {
          color: #1e40af;
        }

        .tiptap-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin-top: 2rem;
          margin-bottom: 2rem;
        }

        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }

        .tiptap-editor .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
        }
      `}</style>
    </div>
  );
}
