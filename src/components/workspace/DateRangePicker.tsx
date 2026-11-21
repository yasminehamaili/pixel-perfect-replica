import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage, useT } from "@/i18n/I18nProvider";
import { formatRange, getPresetRange, matchPreset, PRESET_IDS, type PresetId } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./WorkspaceProvider";

export function DateRangePicker() {
  const t = useT();
  const { dateLocale } = useLanguage();
  const { dateRange, setDateRange } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>(dateRange);
  const [month, setMonth] = useState<Date>(dateRange.from);

  const onOpenChange = (next: boolean) => {
    if (next) {
      setDraft(dateRange);
      setMonth(dateRange.from);
    }
    setOpen(next);
  };

  const pickPreset = (id: PresetId) => {
    const range = getPresetRange(id);
    setDraft(range);
    setMonth(range.from);
  };

  const complete = draft?.from && draft.to ? { from: draft.from, to: draft.to } : null;
  const activePreset = complete ? matchPreset(complete) : null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="pill" size="sm" className="h-9 gap-2 px-3.5 text-sm" aria-label={`${t("top.dateRange")}: ${formatRange(dateRange, dateLocale)}`}>
          <CalendarDays className="text-muted-foreground" aria-hidden />
          <span className="whitespace-nowrap">{formatRange(dateRange, dateLocale)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-auto rounded-xl p-0 shadow-pop">
        <div className="flex">
          <div className="flex w-44 flex-col gap-0.5 border-r p-2">
            <div className="eyebrow px-2 pb-1 pt-1">{t("date.presets")}</div>
            {PRESET_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => pickPreset(id)}
                data-active={activePreset === id}
                className="h-8 rounded-md px-2 text-left text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground"
              >
                {t(`date.${id}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draft}
              onSelect={setDraft}
              month={month}
              onMonthChange={setMonth}
              locale={dateLocale}
              className="p-3 [--cell-size:2.25rem]"
            />
            <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
              <span className={cn("text-sm", complete ? "text-foreground" : "text-muted-foreground")}>
                {complete ? formatRange(complete, dateLocale) : t("date.selectEnd")}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  {t("date.cancel")}
                </Button>
                <Button
                  size="sm"
                  disabled={!complete}
                  onClick={() => {
                    if (!complete) return;
                    setDateRange(complete);
                    setOpen(false);
                  }}
                >
                  {t("date.apply")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
