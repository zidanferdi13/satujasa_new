"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { UI } from "@/lib/ui-strings";

/**
 * §19: the export form.
 *
 * Presets fill the dates; they never download. This file carries every customer NIK in the range,
 * so a preset that produced a file on click would turn a date picker into a one-click personal-data
 * export on the screen where someone is most likely to be clicking around. One action makes a
 * file, and the range is visible and correctable first.
 *
 * The dates are URL state, so the count under the form comes from the server on every change and
 * the owner can bookmark a range. Typing stays local until both dates are complete, which keeps the
 * URL from filling with half-typed values.
 */
export function ExportForm({
  from,
  to,
  format,
  rows,
  rangeValid,
  today,
}: {
  from: string;
  to: string;
  format: "xlsx" | "pdf";
  rows: number;
  rangeValid: boolean;
  /** The Jakarta day, computed on the server: a client render must not read the clock. */
  today: string;
}) {
  const router = useRouter();
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);
  const [formatValue, setFormatValue] = useState<"xlsx" | "pdf">(format);
  const [downloading, setDownloading] = useState(false);

  const monthStart = `${today.slice(0, 7)}-01`;
  const isToday = fromValue === today && toValue === today;
  const isMonth = fromValue === monthStart && toValue === today;

  useEffect(() => {
    if (!fromValue || !toValue) return;
    // The first render already has the URL the server sent; replacing it again would be a request
    // that changes nothing.
    if (fromValue === from && toValue === to && formatValue === format) return;
    const query = `?from=${fromValue}&to=${toValue}&format=${formatValue}`;
    router.replace(`/dashboard/owner/export${query}`, { scroll: false });
  }, [fromValue, toValue, formatValue, from, to, format, router]);

  // A download leaves the page mounted, so the label has to be reset by something: coming back to
  // the tab is the one signal the browser gives us.
  useEffect(() => {
    const reset = () => setDownloading(false);
    window.addEventListener("focus", reset);
    return () => window.removeEventListener("focus", reset);
  }, []);

  const preset = (value: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {value}
    </button>
  );

  return (
    <div className="mt-6 rounded-lg border p-6">
      <div className="flex flex-wrap items-center gap-2">
        {preset(UI.exp.presetToday, isToday, () => {
          setFromValue(today);
          setToValue(today);
        })}
        {preset(UI.exp.presetMonth, isMonth, () => {
          setFromValue(monthStart);
          setToValue(today);
        })}
        {!isToday && !isMonth ? (
          <span className="text-sm text-muted-foreground">{UI.exp.presetCustom}</span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">{UI.exp.from}</span>
          <input
            type="date"
            value={fromValue}
            onChange={(event) => setFromValue(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{UI.exp.to}</span>
          <input
            type="date"
            value={toValue}
            onChange={(event) => setToValue(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{UI.exp.tz}</p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">{UI.exp.format}</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {[
            { value: "xlsx" as const, label: UI.exp.formatXlsx },
            { value: "pdf" as const, label: UI.exp.formatPdf },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value={option.value}
                checked={formatValue === option.value}
                onChange={() => setFormatValue(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        {/* PM ruling: with no berkas in the range the action is absent, not disabled — the same
            rule as Cetak Surat Jalan on a cancelled berkas and Ubah for a seatless owner. A
            header-only workbook reads as a broken export, and an empty-state heading above a
            download of nothing is the contradiction the shared count exists to prevent. */}
        {!rangeValid ? (
          <p className="text-sm text-destructive">{UI.exp.errRange}</p>
        ) : rows > 0 ? (
          <a
            href={`/api/export?format=${formatValue}&from=${fromValue}&to=${toValue}`}
            onClick={() => setDownloading(true)}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {downloading ? UI.exp.downloading : UI.exp.download}
          </a>
        ) : null}
      </div>

      {/* An empty range is not an error: nothing is red, the dates stay, and the file still exists. */}
      <div aria-live="polite" className="mt-4">
        {rangeValid && rows === 0 ? (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{UI.exp.emptyTitle}</p>
            <p className="mt-1">{UI.exp.emptyBody}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
