 import { useState } from "react";
 import { Check, Copy } from "lucide-react";
 import { cn } from "@/lib/utils";
 
interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  /** When true, render as plain text only (no syntax highlighting). Use for API examples so copy gives clean text. */
  plain?: boolean;
}
 
export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
  plain = false,
}: CodeBlockProps) {
   const [copied, setCopied] = useState(false);
 
   const handleCopy = async () => {
     await navigator.clipboard.writeText(code);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
   };
 
   const trimmedCode = code.trim();
   const lines = trimmedCode.split("\n");

   return (
     <div className="code-block overflow-hidden my-4 rounded-lg">
       {/* Header */}
       <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-code-border bg-muted/30 flex-wrap min-w-0">
         <div className="flex items-center gap-2">
           {filename && (
             <span className="text-xs font-medium text-muted-foreground">
               {filename}
             </span>
           )}
           {!filename && language && (
             <span className="text-xs text-muted-foreground uppercase tracking-wider">
               {language}
             </span>
           )}
         </div>
         <button
           onClick={handleCopy}
           type="button"
           className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 -my-1 rounded min-touch touch-manipulation"
         >
           {copied ? (
             <>
               <Check className="h-3.5 w-3.5 text-success" />
               <span>Copied!</span>
             </>
           ) : (
             <>
               <Copy className="h-3.5 w-3.5" />
               <span>Copy</span>
             </>
           )}
         </button>
       </div>

       {/* Code content: when plain, render as single block so JSON/structure displays correctly */}
       <div className="overflow-x-auto overflow-x-auto-touch">
         <pre className="p-3 sm:p-4 text-xs sm:text-sm leading-relaxed min-w-0 break-words">
           <code className={plain ? "block whitespace-pre" : ""}>
             {plain ? (
               trimmedCode
             ) : (
               lines.map((line, i) => (
                 <div key={i} className="table-row">
                   {showLineNumbers && (
                     <span className="table-cell pr-4 text-muted-foreground/50 select-none text-right">
                       {i + 1}
                     </span>
                   )}
                   <span className="table-cell whitespace-pre">
                     {highlightSyntax(line, language)}
                   </span>
                 </div>
               ))
             )}
           </code>
         </pre>
       </div>
     </div>
   );
 }
 
 // Simple syntax highlighting
 function highlightSyntax(line: string, language: string): React.ReactNode {
   // Keywords
   const keywords = /\b(const|let|var|function|async|await|return|import|from|export|default|if|else|for|while|class|extends|new|this|try|catch|throw|typeof|instanceof)\b/g;
   // Strings
   const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
   // Comments
   const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
   // Numbers
   const numbers = /\b(\d+\.?\d*)\b/g;
   // Functions
   const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
 
   let result = line;
   
   // Replace in order to avoid conflicts
   result = result.replace(comments, '<span class="text-muted-foreground/60">$1</span>');
   result = result.replace(strings, '<span class="text-success">$&</span>');
   result = result.replace(keywords, '<span class="text-accent">$1</span>');
   result = result.replace(numbers, '<span class="text-warning">$1</span>');
 
   return <span dangerouslySetInnerHTML={{ __html: result }} />;
 }