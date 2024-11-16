import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatHumanReadable(date: Date): string {
	return format(date, "MMMM d, yyyy 'at' h:mma"); // Convert "AM/PM" to "am/pm"
}