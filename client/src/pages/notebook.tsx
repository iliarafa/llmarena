import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "llm-arena-notebook";
const DEBOUNCE_DELAY = 500;

export default function Notebook() {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedContent = localStorage.getItem(STORAGE_KEY);
    if (savedContent) {
      setContent(savedContent);
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, content);
    }, DEBOUNCE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold" data-testid="text-notebook-title">Notebook</h1>
          </div>
          <p className="hidden sm:block text-[12px] font-medium text-[#000000]">
            Auto-saves locally as you type
          </p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing... Your notes are saved automatically and stored only on your device."
          className="min-h-[calc(100vh-12rem)] resize-none text-base focus-visible:ring-0 border-0"
          data-testid="textarea-notebook"
        />
      </main>
    </div>
  );
}
