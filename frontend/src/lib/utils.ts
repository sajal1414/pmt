import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts every empty-string value in a form object to null before it hits the API.
 * A blank optional `<input type="date">`/`<select>` submits "" — the backend's pydantic
 * `date | None` / enum fields reject "" outright (they only accept a real value or the
 * key being absent/null), so every optional field must be normalized the same way.
 */
export function nullifyEmptyStrings<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] === "") {
      result[key] = null as never;
    }
  }
  return result;
}
