import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, AlertCircle, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Heuristic: treat as image if URL has common image extension or path patterns (including CDN/generated). */
function isImageUrl(url: string): boolean {
  const s = url.trim();
  if (!/^https?:\/\//i.test(s)) return false;
  const lower = s.toLowerCase();
  const imageExt = /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?|$)/i;
  if (imageExt.test(lower)) return true;
  if (/\/img\//i.test(lower) || /\/image/i.test(lower) || /\/images\//i.test(lower)) return true;
  if (/\/generated\//i.test(lower) || /imgen\.|cdn\.|digitaloceanspaces/i.test(lower)) return true;
  return false;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** True when the whole buffer parses as JSON (object/array/primitive). */
function isValidJsonDocument(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: string;
}

const IMAGE_PREVIEW_DELAY_MS = 300;
const IMAGE_PREVIEW_SIZE = 280;

export function JsonEditor({ 
  value, 
  onChange, 
  readOnly = false, 
  placeholder = '{\n  \n}',
  minHeight = '200px'
}: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const showPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setIsValid(true);
      return;
    }
    try {
      JSON.parse(value);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  }, [value]);

  const handleFormat = useCallback(() => {
    if (!value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Can't format invalid JSON
    }
  }, [value, onChange]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const clearImagePreview = useCallback(() => {
    if (showPreviewTimeoutRef.current) {
      clearTimeout(showPreviewTimeoutRef.current);
      showPreviewTimeoutRef.current = null;
    }
    pendingUrlRef.current = null;
    setHoveredImageUrl(null);
  }, []);

  const handleBodyMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!readOnly) return;
    const el = (e.target as HTMLElement).closest?.('[data-image-url]') as HTMLElement | null;
    const url = el?.getAttribute?.('data-image-url');
    if (url) {
      pendingUrlRef.current = url;
      setPreviewPosition({ x: e.clientX, y: e.clientY });
      if (!showPreviewTimeoutRef.current) {
        showPreviewTimeoutRef.current = setTimeout(() => {
          showPreviewTimeoutRef.current = null;
          if (pendingUrlRef.current) setHoveredImageUrl(pendingUrlRef.current);
        }, IMAGE_PREVIEW_DELAY_MS);
      }
    } else {
      clearImagePreview();
    }
  }, [readOnly, clearImagePreview]);

  const handleBodyMouseLeave = useCallback(() => {
    clearImagePreview();
  }, [clearImagePreview]);

  // Syntax highlighting for JSON; string values that are image URLs get a hoverable span
  const highlightedValue = value
    .replace(/"([^"]+)":/g, (_, key) => `<span class="text-primary">"${escapeHtml(key)}"</span>:`)
    .replace(/: "([^"]*)"/g, (_, content) => {
      const isImage = isImageUrl(content);
      const escaped = escapeHtml(content);
      const attr = escapeAttr(content);
      if (isImage) {
        return `: <span class="text-primary image-url-preview cursor-help underline decoration-dotted decoration-primary/40" data-image-url="${attr}">"${escaped}"</span>`;
      }
      return `: <span class="text-foreground/90">"${escaped}"</span>`;
    })
    .replace(/: (\d+)/g, ': <span class="text-muted-foreground">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-foreground">$1</span>')
    .replace(/: (null)/g, ': <span class="text-muted-foreground">$1</span>');

  return (
    <div className="relative group h-full flex flex-col min-h-0 min-w-0 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!readOnly && value.trim() && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleFormat}
            disabled={!isValid}
            className="h-7 w-7 bg-secondary/80 backdrop-blur-sm"
          >
            <Wand2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {value.trim() && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className="h-7 w-7 bg-secondary/80 backdrop-blur-sm"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      {/* Status indicator */}
      {!readOnly && value.trim() && (
        <div className={cn(
          "absolute bottom-2 right-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md z-10",
          "bg-secondary/80 backdrop-blur-sm transition-colors",
          isValid ? "text-primary" : "text-destructive"
        )}>
          {isValid ? (
            <>
              <Check className="h-3 w-3" />
              Valid JSON
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              Invalid JSON
            </>
          )}
        </div>
      )}

      {/* Editor */}
      <div
        className={cn(
          "code-editor relative flex-1 min-h-0 min-w-0 overflow-auto custom-scrollbar w-full max-w-full",
          !isValid && !readOnly && "border-destructive/50"
        )}
        onMouseMove={readOnly ? handleBodyMouseMove : undefined}
        onMouseLeave={readOnly ? handleBodyMouseLeave : undefined}
      >
        {readOnly ? (
          !value.trim() ? (
            <pre className="p-4 text-sm text-muted-foreground">No content</pre>
          ) : !isValidJsonDocument(value) ? (
            <pre className="p-4 text-sm w-full max-w-full whitespace-pre-wrap break-words text-foreground/95 font-mono overflow-x-auto">
              {value}
            </pre>
          ) : (
            <pre
              className="p-4 text-sm w-full max-w-full whitespace-pre-wrap break-words overflow-x-auto text-foreground/95"
              dangerouslySetInnerHTML={{ __html: highlightedValue }}
            />
          )
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className={cn(
              'w-full h-full bg-transparent text-base sm:text-sm text-foreground resize-none',
              'p-3 sm:p-4 focus:outline-none focus:ring-0',
              'placeholder:text-muted-foreground/50',
            )}
          />
        )}
      </div>

      {/* Image preview popover - container fits image aspect ratio (max 280px) so no blank space */}
      {hoveredImageUrl &&
        createPortal(
          <div
            className="fixed z-[100] rounded-lg border border-border bg-muted/95 shadow-xl overflow-hidden pointer-events-none w-fit max-w-[280px] max-h-[280px]"
            style={{
              left: Math.min(previewPosition.x + 16, Math.max(8, window.innerWidth - IMAGE_PREVIEW_SIZE - 16)),
              top: Math.max(8, Math.min(previewPosition.y - 16, window.innerHeight - IMAGE_PREVIEW_SIZE - 8)),
            }}
          >
            <img
              src={hoveredImageUrl}
              alt="Preview"
              className="block max-w-[280px] max-h-[280px] w-auto h-auto object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => {
                setHoveredImageUrl(null);
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
