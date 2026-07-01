
import { useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileUp, MonitorIcon, ArrowUpIcon, Paperclip, Code2, Layers } from "lucide-react";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity));
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

interface RuixenMoonChatProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  commandHint?: string;
  commandMode?: {
    prompt: string;
    options: Array<{ label: string; value: string }>;
    onOptionSelect: (value: string) => void;
    isBusy?: boolean;
    error?: string;
    summary?: string;
    preview?: string;
    onReset?: () => void;
    stepLabel?: string;
  } | null;
}

export default function RuixenMoonChat({
  query,
  setQuery,
  onSearch,
  onFileSelect,
  disabled,
  commandHint,
  commandMode,
}: RuixenMoonChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex flex-col items-center"
      style={{
        backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center pt-24 pb-12">
        <div className="text-center">
          <h1 className="text-5xl font-semibold text-white drop-shadow-md">Lexis AI Research</h1>
          <p className="mt-4 text-neutral-300 text-lg max-w-lg mx-auto">
            Analyze papers, trace legal arguments, scale case studies, and navigate complex regulations, just start asking.
          </p>
          {commandHint ? (
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-300/75">{commandHint}</p>
          ) : null}
        </div>
      </div>

      <div className="w-full max-w-4xl mb-[15vh] px-4">
        {commandMode ? (
          <div className="mb-4 rounded-2xl border border-cyan-400/25 bg-black/70 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-cyan-100">{commandMode.prompt}</p>
              {commandMode.stepLabel ? (
                <span className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">{commandMode.stepLabel}</span>
              ) : null}
            </div>

            {commandMode.error ? <p className="mt-3 text-xs text-rose-300">{commandMode.error}</p> : null}
            {commandMode.isBusy ? <p className="mt-3 text-xs text-neutral-300">Generating draft...</p> : null}

            {commandMode.options?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {commandMode.options.map((option) => (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    disabled={commandMode.isBusy}
                    onClick={() => commandMode.onOptionSelect(option.value)}
                    className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            {commandMode.summary ? (
              <div className="mt-4 rounded-xl border border-neutral-700/70 bg-black/60 p-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Draft summary</p>
                <p className="mt-2 text-sm text-neutral-200">{commandMode.summary}</p>
              </div>
            ) : null}

            {commandMode.preview ? (
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-800 bg-black/60 p-3 text-xs leading-6 text-neutral-300">
                {commandMode.preview}
              </pre>
            ) : null}

            {commandMode.onReset ? (
              <div className="mt-3">
                <Button
                  variant="outline"
                  onClick={commandMode.onReset}
                  className="rounded-xl border-neutral-700/70 bg-black/40 text-neutral-300 hover:bg-neutral-800"
                >
                  Start New Draft Flow
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (query.trim() && !disabled) onSearch();
              }
            }}
            placeholder="Search Indian case laws, ask for a contract summary..."
            className={cn(
              "w-full px-6 py-4 resize-none border-none",
              "bg-transparent text-white text-base",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-400 min-h-[64px]"
            )}
            style={{ overflow: "hidden" }}
          />

          <div className="flex items-center justify-between p-3 border-t border-neutral-800/50">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.md,.rtf,.jpg,.jpeg,.png"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-white hover:bg-neutral-800 rounded-xl transition-all"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                disabled={!query.trim() || disabled}
                onClick={onSearch}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-lg",
                  query.trim() && !disabled
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                )}
              >
                <ArrowUpIcon className="w-5 h-5" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </div>
        </div>

        {!commandMode ? (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 max-w-2xl mx-auto">
            <QuickAction icon={<FileUp className="w-4 h-4" />} label="Anticipatory bail grounds CrPC" onClick={() => { setQuery("Anticipatory bail grounds CrPC"); onSearch(); }} />
            <QuickAction icon={<Layers className="w-4 h-4" />} label="Landmark privacy judgments" onClick={() => { setQuery("Landmark privacy judgments"); onSearch(); }} />
            <QuickAction icon={<Code2 className="w-4 h-4" />} label="Section 498A dowry procedure" onClick={() => { setQuery("Section 498A dowry procedure"); onSearch(); }} />
            <QuickAction icon={<MonitorIcon className="w-4 h-4" />} label="Consumer Protection 2019" onClick={() => { setQuery("Consumer Protection 2019"); onSearch(); }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border-neutral-700/60 bg-black/40 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all backdrop-blur-md"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Button>
  );
}
