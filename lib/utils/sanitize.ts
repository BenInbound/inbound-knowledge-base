import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with a strict configuration suitable for rich text content
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: Return as-is, will be sanitized on client
    return html;
  }

  // Client-side sanitization
  return DOMPurify.sanitize(html, {
    // Allow only safe HTML tags
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Links and images
      'a', 'img',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Blockquotes
      'blockquote',
      // Divs and spans (for TipTap structure)
      'div', 'span',
    ],

    // Allow only safe attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel',  // Links
      'src', 'alt', 'title', 'width', 'height',  // Images
      'class',  // For styling
      'data-*',  // For TipTap data attributes
    ],

    // Additional security options
    ALLOW_DATA_ATTR: true,  // Allow data-* attributes for TipTap
    ALLOW_ARIA_ATTR: true,  // Allow aria-* for accessibility

    // Disallow scripts and unsafe content
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],

    // URL sanitization
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

    // Return a string instead of a TrustedHTML object
    RETURN_TRUSTED_TYPE: false,
  });
}

/**
 * Sanitize TipTap JSON content
 * Recursively sanitizes text nodes in TipTap JSON structure
 */
export function sanitizeTipTapJSON(content: any): any {
  if (!content) return content;

  if (typeof content === 'string') {
    return sanitizeHTML(content);
  }

  if (Array.isArray(content)) {
    return content.map(sanitizeTipTapJSON);
  }

  if (typeof content === 'object') {
    const sanitized: any = { ...content };

    // Sanitize text content
    if (sanitized.text) {
      sanitized.text = sanitizeHTML(sanitized.text);
    }

    // Recursively sanitize nested content
    if (sanitized.content) {
      sanitized.content = sanitizeTipTapJSON(sanitized.content);
    }

    // Sanitize marks (inline formatting)
    if (sanitized.marks) {
      sanitized.marks = sanitized.marks.map((mark: any) => {
        if (mark.attrs) {
          // Sanitize link hrefs
          if (mark.type === 'link' && mark.attrs.href) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `<a href="${mark.attrs.href}"></a>`;
            const sanitizedDiv = DOMPurify.sanitize(tempDiv.innerHTML);
            const match = sanitizedDiv.match(/href="([^"]*)"/);
            mark.attrs.href = match ? match[1] : '#';
          }
        }
        return mark;
      });
    }

    // Sanitize image sources
    if (sanitized.type === 'image' && sanitized.attrs?.src) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `<img src="${sanitized.attrs.src}">`;
      const sanitizedDiv = DOMPurify.sanitize(tempDiv.innerHTML);
      const match = sanitizedDiv.match(/src="([^"]*)"/);
      sanitized.attrs.src = match ? match[1] : '';
    }

    return sanitized;
  }

  return content;
}

/**
 * Sanitize user input before storing
 * Use this before saving content to the database
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return input;

  // Remove any null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim excessive whitespace
  sanitized = sanitized.trim();

  // Limit length to prevent DoS
  const maxLength = 1000000; // 1MB of text
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}
