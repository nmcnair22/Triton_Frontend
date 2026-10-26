import DOMPurify from 'dompurify';

// API and editor content remains untrusted when displayed as rich HTML.
export function sanitizeHtml(value) {
    return DOMPurify.sanitize(String(value ?? ''), {
        USE_PROFILES: { html: true }
    });
}
