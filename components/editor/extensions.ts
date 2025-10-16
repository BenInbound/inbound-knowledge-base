import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

/**
 * TipTap editor extensions configuration
 * Used for both the editable editor and read-only article renderer
 */

export const getEditorExtensions = (options?: { editable?: boolean }) => {
  const { editable = true } = options || {};

  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4',
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: 'border-l-4 border-gray-300 pl-4 my-4 text-gray-600 italic',
        },
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg my-4',
      },
      allowBase64: false, // Only allow URLs for security
      inline: false,
    }),
    Link.configure({
      openOnClick: !editable,
      HTMLAttributes: {
        class: 'text-accent-600 hover:text-accent-700 underline cursor-pointer',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
      validate: (href) => /^https?:\/\//.test(href), // Only allow http/https links
    }),
  ];
};
