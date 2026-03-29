"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
  Code2,
  Palette,
  Layers,
  Rocket,
} from "lucide-react";

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

      textarea.style.height = `${minHeight}px`; // reset first
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
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
  disabled?: boolean;
}

export default function RuixenMoonChat({ query, setQuery, onSearch, disabled }: RuixenMoonChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex flex-col items-center"
      style={{
        backgroundImage:
          "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Centered AI Title */}
      <div className="flex-1 w-full flex flex-col items-center justify-center pt-24 pb-12">
        <div className="text-center">
          <h1 className="text-5xl font-semibold text-white drop-shadow-md">
            Lexis AI Research
          </h1>
          <p className="mt-4 text-neutral-300 text-lg max-w-lg mx-auto">
            Analyze papers, trace legal arguments, scale case studies, and navigate complex regulations — just start asking.
          </p>
        </div>
      </div>

      {/* Input Box Section */}
      <div className="w-full max-w-4xl mb-[15vh] px-4">
        <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
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

          {/* Footer Buttons */}
          <div className="flex items-center justify-between p-3 border-t border-neutral-800/50">
            <Button
              variant="ghost"
              size="icon"
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
                  query.trim() && !disabled ? "bg-white text-black hover:bg-neutral-200" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                )}
              >
                <ArrowUpIcon className="w-5 h-5" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 max-w-2xl mx-auto">
          <QuickAction icon={<FileUp className="w-4 h-4" />} label="Anticipatory bail grounds CrPC" onClick={() => { setQuery("Anticipatory bail grounds CrPC"); onSearch(); }} />
          <QuickAction icon={<Layers className="w-4 h-4" />} label="Landmark privacy judgments" onClick={() => { setQuery("Landmark privacy judgments"); onSearch(); }} />
          <QuickAction icon={<Code2 className="w-4 h-4" />} label="Section 498A dowry procedure" onClick={() => { setQuery("Section 498A dowry procedure"); onSearch(); }} />
          <QuickAction icon={<MonitorIcon className="w-4 h-4" />} label="Consumer Protection 2019" onClick={() => { setQuery("Consumer Protection 2019"); onSearch(); }} />
        </div>
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
