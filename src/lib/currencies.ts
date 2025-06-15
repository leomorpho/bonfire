// Stripe supported currencies with their details
// Reference: https://stripe.com/docs/currencies

export interface Currency {
	code: string;
	name: string;
	symbol: string;
	minAmount: number; // Minimum amount in smallest unit (e.g., cents)
	decimalPlaces: number; // Number of decimal places (most currencies have 2, some have 0)
}

// Popular currencies that Stripe supports
export const SUPPORTED_CURRENCIES: Currency[] = [
	// Major currencies
	{ code: 'usd', name: 'US Dollar', symbol: '$', minAmount: 50, decimalPlaces: 2 },
	{ code: 'eur', name: 'Euro', symbol: '€', minAmount: 50, decimalPlaces: 2 },
	{ code: 'gbp', name: 'British Pound', symbol: '£', minAmount: 30, decimalPlaces: 2 },
	{ code: 'cad', name: 'Canadian Dollar', symbol: 'CA$', minAmount: 50, decimalPlaces: 2 },
	{ code: 'aud', name: 'Australian Dollar', symbol: 'A$', minAmount: 50, decimalPlaces: 2 },
	{ code: 'jpy', name: 'Japanese Yen', symbol: '¥', minAmount: 50, decimalPlaces: 0 }, // No decimal places
	{ code: 'cny', name: 'Chinese Yuan', symbol: '¥', minAmount: 400, decimalPlaces: 2 },
	{ code: 'chf', name: 'Swiss Franc', symbol: 'CHF', minAmount: 50, decimalPlaces: 2 },
	{ code: 'hkd', name: 'Hong Kong Dollar', symbol: 'HK$', minAmount: 400, decimalPlaces: 2 },
	{ code: 'sgd', name: 'Singapore Dollar', symbol: 'S$', minAmount: 50, decimalPlaces: 2 },
	{ code: 'sek', name: 'Swedish Krona', symbol: 'kr', minAmount: 300, decimalPlaces: 2 },
	{ code: 'dkk', name: 'Danish Krone', symbol: 'kr', minAmount: 250, decimalPlaces: 2 },
	{ code: 'nok', name: 'Norwegian Krone', symbol: 'kr', minAmount: 300, decimalPlaces: 2 },
	{ code: 'mxn', name: 'Mexican Peso', symbol: '$', minAmount: 1000, decimalPlaces: 2 },
	{ code: 'nzd', name: 'New Zealand Dollar', symbol: 'NZ$', minAmount: 50, decimalPlaces: 2 },
	{ code: 'inr', name: 'Indian Rupee', symbol: '₹', minAmount: 50, decimalPlaces: 2 },
	{ code: 'brl', name: 'Brazilian Real', symbol: 'R$', minAmount: 50, decimalPlaces: 2 },
	{ code: 'zar', name: 'South African Rand', symbol: 'R', minAmount: 50, decimalPlaces: 2 },
	{ code: 'aed', name: 'UAE Dirham', symbol: 'د.إ', minAmount: 200, decimalPlaces: 2 },
	{ code: 'ils', name: 'Israeli Shekel', symbol: '₪', minAmount: 50, decimalPlaces: 2 },
	{ code: 'krw', name: 'South Korean Won', symbol: '₩', minAmount: 50, decimalPlaces: 0 }, // No decimal places
	{ code: 'pln', name: 'Polish Złoty', symbol: 'zł', minAmount: 50, decimalPlaces: 2 },
	{ code: 'czk', name: 'Czech Koruna', symbol: 'Kč', minAmount: 50, decimalPlaces: 2 },
	{ code: 'thb', name: 'Thai Baht', symbol: '฿', minAmount: 50, decimalPlaces: 2 },
	{ code: 'myr', name: 'Malaysian Ringgit', symbol: 'RM', minAmount: 200, decimalPlaces: 2 },
	{ code: 'php', name: 'Philippine Peso', symbol: '₱', minAmount: 50, decimalPlaces: 2 },
	{ code: 'idr', name: 'Indonesian Rupiah', symbol: 'Rp', minAmount: 50, decimalPlaces: 2 },
	{ code: 'rub', name: 'Russian Ruble', symbol: '₽', minAmount: 50, decimalPlaces: 2 }
];

// Get currency by code
export function getCurrency(code: string): Currency | undefined {
	return SUPPORTED_CURRENCIES.find(c => c.code === code.toLowerCase());
}

// Format price with currency
export function formatPrice(amountInSmallestUnit: number, currencyCode: string): string {
	const currency = getCurrency(currencyCode);
	if (!currency) {
		// Fallback to basic formatting
		return `${(amountInSmallestUnit / 100).toFixed(2)} ${currencyCode.toUpperCase()}`;
	}

	// Convert from smallest unit to major unit
	const amount = currency.decimalPlaces === 0 
		? amountInSmallestUnit 
		: amountInSmallestUnit / Math.pow(10, currency.decimalPlaces);

	// Use Intl.NumberFormat for proper localization
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currencyCode.toUpperCase(),
			minimumFractionDigits: currency.decimalPlaces,
			maximumFractionDigits: currency.decimalPlaces
		}).format(amount);
	} catch (error) {
		// Fallback for unsupported currencies
		return `${currency.symbol}${amount.toFixed(currency.decimalPlaces)}`;
	}
}

// Convert amount to smallest unit (e.g., dollars to cents)
export function toSmallestUnit(amount: number, currencyCode: string): number {
	const currency = getCurrency(currencyCode);
	if (!currency) {
		// Default to 2 decimal places
		return Math.round(amount * 100);
	}
	
	return currency.decimalPlaces === 0 
		? Math.round(amount) 
		: Math.round(amount * Math.pow(10, currency.decimalPlaces));
}

// Convert from smallest unit to major unit
export function fromSmallestUnit(amountInSmallestUnit: number, currencyCode: string): number {
	const currency = getCurrency(currencyCode);
	if (!currency) {
		// Default to 2 decimal places
		return amountInSmallestUnit / 100;
	}
	
	return currency.decimalPlaces === 0 
		? amountInSmallestUnit 
		: amountInSmallestUnit / Math.pow(10, currency.decimalPlaces);
}

// Validate if amount meets minimum for currency
export function meetsMinimumAmount(amountInSmallestUnit: number, currencyCode: string): boolean {
	const currency = getCurrency(currencyCode);
	if (!currency) {
		// Default to 50 cents minimum
		return amountInSmallestUnit >= 50;
	}
	
	return amountInSmallestUnit >= currency.minAmount;
}

// Get display text for minimum amount
export function getMinimumAmountText(currencyCode: string): string {
	const currency = getCurrency(currencyCode);
	if (!currency) {
		return 'Minimum: $0.50';
	}
	
	return `Minimum: ${formatPrice(currency.minAmount, currencyCode)}`;
}