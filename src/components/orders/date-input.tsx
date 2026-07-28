"use client";

import { useEffect, useState } from "react";

function splitISO(value: string): { day: string; month: string; year: string } {
  if (!value) return { day: "", month: "", year: String(new Date().getFullYear()) };
  const [y, m, d] = value.split("-");
  return { day: d ?? "", month: m ?? "", year: y ?? String(new Date().getFullYear()) };
}

function digitsOnly(value: string, maxLen: number) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

/**
 * Date entry as three typed fields in dd/mm/yyyy order. Day and month are
 * blank by default (order dates vary per entry); year defaults to the
 * current year so it rarely needs retyping, but stays editable.
 */
export default function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const initial = splitISO(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  useEffect(() => {
    const split = splitISO(value);
    setDay(split.day);
    setMonth(split.month);
    setYear(split.year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(d: string, m: string, y: string) {
    setDay(d);
    setMonth(m);
    setYear(y);

    const dn = Number(d);
    const mn = Number(m);
    const yn = Number(y);
    const valid =
      d.length > 0 && m.length > 0 && y.length === 4 && dn >= 1 && dn <= 31 && mn >= 1 && mn <= 12 && yn > 0;
    if (valid) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD"
        aria-label="Day"
        className="input w-14 text-center"
        value={day}
        onChange={(e) => commit(digitsOnly(e.target.value, 2), month, year)}
      />
      <span className="text-muted">/</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="MM"
        aria-label="Month"
        className="input w-14 text-center"
        value={month}
        onChange={(e) => commit(day, digitsOnly(e.target.value, 2), year)}
      />
      <span className="text-muted">/</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="YYYY"
        aria-label="Year"
        className="input w-20 text-center"
        value={year}
        onChange={(e) => commit(day, month, digitsOnly(e.target.value, 4))}
      />
    </div>
  );
}
