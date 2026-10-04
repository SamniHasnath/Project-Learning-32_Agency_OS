const formatters = new Map<string, Intl.NumberFormat>();

/** Formats a decimal string/number as currency, e.g. "1234.5" → "$1,234.50". */
export function money(value: string | number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || value === "") return "—";
  let fmt = formatters.get(currency);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 });
    } catch {
      fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
    }
    formatters.set(currency, fmt);
  }
  return fmt.format(Number(value));
}

/** Dates are stored in UTC; display them as calendar dates without timezone drift. */
export function date(value: string | null | undefined, style: "short" | "long" = "short") {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** yyyy-mm-dd for <input type="date">, `offsetDays` from today. */
export function isoDay(offsetDays = 0, from: Date | string = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function quantity(value: string | number) {
  return String(Number(value));
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
