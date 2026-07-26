export type ParsedAddress = {
  buyerNameSuggestion: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  contactNo: string | null;
};

function isPhoneLike(line: string): boolean {
  const digits = line.replace(/[^\d]/g, "");
  return digits.length >= 7 && /^[+]?[\d\s().-]+$/.test(line.trim());
}

function matchCityStateZip(line: string): { city: string; state: string; zip: string } | null {
  const m = line.trim().match(/^(.+),\s*([A-Za-z]{2,})\s+([A-Za-z0-9-]{3,10})$/);
  if (!m) return null;
  return { city: m[1].trim(), state: m[2].trim(), zip: m[3].trim() };
}

/**
 * Best-effort parse of a pasted address block, e.g.:
 *   Rosa Dieguez
 *   14458 SW 18TH ST.
 *   Miami, FL 33175
 *   United States
 *   3055281710
 */
export function parseShippingAddress(raw: string): ParsedAddress {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      buyerNameSuggestion: null,
      addressLine: null,
      city: null,
      state: null,
      zip: null,
      country: null,
      contactNo: null,
    };
  }

  const buyerNameSuggestion = lines[0];
  const remaining = [...lines];

  let contactNo: string | null = null;
  if (remaining.length > 1 && isPhoneLike(remaining[remaining.length - 1])) {
    contactNo = remaining.pop()!;
  }

  let cityStateZipIndex = -1;
  let cityStateZip: { city: string; state: string; zip: string } | null = null;
  for (let i = remaining.length - 1; i >= 1; i--) {
    const match = matchCityStateZip(remaining[i]);
    if (match) {
      cityStateZipIndex = i;
      cityStateZip = match;
      break;
    }
  }

  if (!cityStateZip) {
    return {
      buyerNameSuggestion,
      addressLine: remaining.slice(1).join(", ") || null,
      city: null,
      state: null,
      zip: null,
      country: null,
      contactNo,
    };
  }

  const addressLine = remaining.slice(1, cityStateZipIndex).join(", ") || null;
  const leftover = remaining.slice(cityStateZipIndex + 1);
  const country = leftover.length ? leftover.join(", ") : null;

  return {
    buyerNameSuggestion,
    addressLine,
    city: cityStateZip.city,
    state: cityStateZip.state,
    zip: cityStateZip.zip,
    country,
    contactNo,
  };
}
