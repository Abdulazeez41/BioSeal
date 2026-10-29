import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address?: string | null, length = 6): string {
  if (!address) return "—";
  if (address.length <= length * 2 + 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatCurrency(amount: string | number, symbol = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `0.00 ${symbol}`;
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateString;
  }
}
