import { useState } from "react";
import { BookOpen, Check, ChevronDown, Copy, Eye, EyeOff, KeyRound, Languages, Moon, Settings } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { API_KEY_PLACEHOLDER } from "@/config/workspace";
import type { Language } from "@/i18n/dictionary";
import { useLanguage, useT } from "@/i18n/I18nProvider";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { footerRowClass } from "./Sidebar";

const itemClass =
  "flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm text-popover-foreground";

export function maskKey(key: string): string {
  return `${key.slice(0, 8)}${"•".repeat(Math.max(4, key.length - 12))}${key.slice(-4)}`;
}

export function SettingsMenu({ onOpenDocs }: { onOpenDocs: () => void }) {
  const t = useT();
  const { dark, setDark } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    await navigator.clipboard.writeText(API_KEY_PLACEHOLDER);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setRevealed(false);
      }}
    >
      <PopoverTrigger className={footerRowClass}>
        <Settings className="size-[18px]" aria-hidden />
        {t("nav.settings")}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-(--layout-settings-menu) rounded-xl p-1.5 shadow-pop"
      >
        <div className="eyebrow px-2.5 pb-1 pt-2">{t("settings.title")}</div>

        <Collapsible open={keyOpen} onOpenChange={setKeyOpen}>
          <CollapsibleTrigger className={cn(itemClass, "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none")}>
            <KeyRound className="size-4 text-muted-foreground" aria-hidden />
            <span className="flex-1 text-left">{t("settings.apiKey")}</span>
            <ChevronDown
              className={cn("size-4 text-muted-foreground transition-transform", keyOpen && "rotate-180")}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2.5 pb-2 pt-1">
            <input
              readOnly
              aria-label={t("settings.apiKey")}
              value={revealed ? API_KEY_PLACEHOLDER : maskKey(API_KEY_PLACEHOLDER)}
              onFocus={(e) => e.currentTarget.select()}
              className="h-9 w-full rounded-md border border-input bg-muted px-2.5 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {revealed ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                {revealed ? t("settings.hide") : t("settings.show")}
              </button>
              <button
                type="button"
                onClick={copyKey}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                <span aria-live="polite">{copied ? t("settings.copied") : t("settings.copy")}</span>
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className={itemClass}>
          <Moon className="size-4 text-muted-foreground" aria-hidden />
          <label htmlFor="settings-dark" className="flex-1 cursor-pointer">
            {t("settings.darkMode")}
          </label>
          <Switch id="settings-dark" checked={dark} onCheckedChange={setDark} />
        </div>

        <div className={itemClass}>
          <Languages className="size-4 text-muted-foreground" aria-hidden />
          <span id="settings-language" className="flex-1">
            {t("settings.language")}
          </span>
          <ToggleGroup
            type="single"
            aria-labelledby="settings-language"
            value={language}
            onValueChange={(v) => v && setLanguage(v as Language)}
            className="gap-0 rounded-md bg-muted p-0.5"
          >
            {(["en", "fr"] as const).map((lang) => (
              <ToggleGroupItem
                key={lang}
                value={lang}
                className="h-7 min-w-11 rounded-[calc(var(--radius)-4px)] px-2 text-xs font-semibold text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-card"
              >
                {lang === "en" ? "ENG" : "FR"}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="my-1 h-px bg-border" role="separator" />

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onOpenDocs();
          }}
          className={cn(itemClass, "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none")}
        >
          <BookOpen className="size-4 text-muted-foreground" aria-hidden />
          {t("settings.documentation")}
        </button>
      </PopoverContent>
    </Popover>
  );
}
