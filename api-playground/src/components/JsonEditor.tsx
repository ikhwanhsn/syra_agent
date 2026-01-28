import { useState, useEffect, useCallback } from 'react';
import { Check, Copy, AlertCircle, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: string;
}

export function JsonEditor({ 
  value, 
  onChange, 
  readOnly = false, 
  placeholder = '{\n  \n}',
  minHeight = '200px'
}: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [copied, setCopied] = useState(false);

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

  // Syntax highlighting for JSON
  const highlightedValue = value
    .replace(/"([^"]+)":/g, '<span class="text-accent">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="text-success">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-warning">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-primary">$1</span>')
    .replace(/: (null)/g, ': <span class="text-muted-foreground">$1</span>');

  return (
    <div className="relative group">
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
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      {/* Status indicator */}
      {!readOnly && value.trim() && (
        <div className={cn(
          "absolute bottom-2 right-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
          "bg-secondary/80 backdrop-blur-sm transition-colors",
          isValid ? "text-success" : "text-destructive"
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
          "code-editor relative overflow-hidden",
          !isValid && !readOnly && "border-destructive/50"
        )}
        style={{ minHeight }}
      >
        {readOnly ? (
          <pre 
            className="p-4 text-sm overflow-auto custom-scrollbar h-full"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: highlightedValue || '<span class="text-muted-foreground">No content</span>' }}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className={cn(
              "w-full bg-transparent text-sm text-foreground resize-none",
              "p-4 focus:outline-none focus:ring-0",
              "placeholder:text-muted-foreground/50"
            )}
            style={{ minHeight }}
          />
        )}
      </div>
    </div>
  );
}
