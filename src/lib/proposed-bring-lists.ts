import { BringListCountTypes } from './enums';

export interface ProposedBringItem {
	name: string;
	unit: BringListCountTypes;
	quantity_needed: number;
	details?: string;
}

export interface ProposedBringList {
	id: string;
	name: string;
	description: string;
	emoji: string;
	category: string;
	items: ProposedBringItem[];
}

export const proposedBringLists: ProposedBringList[] = [
	{
		id: 'bbq-party',
		name: 'BBQ Party',
		description: 'Perfect for outdoor grilling and summer gatherings',
		emoji: '🔥',
		category: 'Outdoor',
		items: [
			{ name: 'Hamburger Patties', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2, details: 'Fresh ground beef patties' },
			{ name: 'Hot Dogs', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2, details: 'All-beef hot dogs' },
			{ name: 'Hamburger Buns', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Hot Dog Buns', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Charcoal', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Bags of charcoal for grilling' },
			{ name: 'Lighter Fluid', unit: BringListCountTypes.COUNT, quantity_needed: 1 },
			{ name: 'Paper Plates', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3 },
			{ name: 'Napkins', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Packs of napkins' },
			{ name: 'Condiments', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'Ketchup, mustard, mayo, relish' }
		]
	},
	{
		id: 'birthday-party',
		name: 'Birthday Party',
		description: 'Everything needed for a memorable birthday celebration',
		emoji: '🎂',
		category: 'Celebration',
		items: [
			{ name: 'Birthday Cake', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'Main birthday cake' },
			{ name: 'Candles', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'Number candles for age' },
			{ name: 'Paper Plates', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Plastic Forks', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Napkins', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Packs of party napkins' },
			{ name: 'Party Hats', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1 },
			{ name: 'Balloons', unit: BringListCountTypes.COUNT, quantity_needed: 20, details: 'Assorted colors' },
			{ name: 'Soda/Juice', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2, details: 'Cans or bottles' },
			{ name: 'Ice Cream', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Half-gallon containers' }
		]
	},
	{
		id: 'potluck-dinner',
		name: 'Potluck Dinner',
		description: 'Coordinated dishes for a shared meal experience',
		emoji: '🍽️',
		category: 'Food',
		items: [
			{ name: 'Main Dish', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Serves 6-8 people each' },
			{ name: 'Side Dishes', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Vegetables, salads, rice, etc.' },
			{ name: 'Appetizers', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Finger foods and starters' },
			{ name: 'Desserts', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Cakes, pies, or cookies' },
			{ name: 'Beverages', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Non-alcoholic drinks' },
			{ name: 'Disposable Plates', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Utensils Set', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1, details: 'Fork, knife, spoon' },
			{ name: 'Serving Utensils', unit: BringListCountTypes.COUNT, quantity_needed: 6, details: 'Spoons, tongs, ladles' }
		]
	},
	{
		id: 'beach-day',
		name: 'Beach Day',
		description: 'Sun, sand, and surf essentials for a perfect beach outing',
		emoji: '🏖️',
		category: 'Outdoor',
		items: [
			{ name: 'Beach Umbrellas', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'For shade and protection' },
			{ name: 'Beach Chairs', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1 },
			{ name: 'Cooler with Ice', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Large coolers filled with ice' },
			{ name: 'Sunscreen', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'SPF 30+ bottles' },
			{ name: 'Beach Towels', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Water Bottles', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3, details: 'Stay hydrated!' },
			{ name: 'Snacks', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Chips, fruit, sandwiches' },
			{ name: 'Beach Games', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Frisbee, volleyball, etc.' },
			{ name: 'Trash Bags', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Leave no trace!' }
		]
	},
	{
		id: 'movie-night',
		name: 'Movie Night',
		description: 'Cozy indoor entertainment with cinema-style snacks',
		emoji: '🍿',
		category: 'Indoor',
		items: [
			{ name: 'Popcorn', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Bags or boxes of popcorn' },
			{ name: 'Candy', unit: BringListCountTypes.COUNT, quantity_needed: 6, details: 'Theater-style candy' },
			{ name: 'Soda', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Blankets', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Cozy throw blankets' },
			{ name: 'Pillows', unit: BringListCountTypes.COUNT, quantity_needed: 6, details: 'Extra comfort' },
			{ name: 'Ice Cream', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'For intermission treats' },
			{ name: 'Tissues', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'For emotional movies' }
		]
	},
	{
		id: 'picnic',
		name: 'Park Picnic',
		description: 'Outdoor dining with portable and easy-to-share foods',
		emoji: '🧺',
		category: 'Outdoor',
		items: [
			{ name: 'Picnic Blankets', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Large waterproof blankets' },
			{ name: 'Sandwiches', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2, details: 'Pre-made sandwiches' },
			{ name: 'Fresh Fruit', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Easy to eat fruits' },
			{ name: 'Chips', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Individual or family bags' },
			{ name: 'Drinks', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2, details: 'Water, juice, or soda' },
			{ name: 'Paper Plates', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Wet Wipes', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'For easy cleanup' },
			{ name: 'Cooler Bags', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Keep food fresh' }
		]
	},
	{
		id: 'game-night',
		name: 'Game Night',
		description: 'Board games, snacks, and friendly competition',
		emoji: '🎲',
		category: 'Indoor',
		items: [
			{ name: 'Board Games', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Variety of games for different group sizes' },
			{ name: 'Card Games', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Classic and modern card games' },
			{ name: 'Snack Mix', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Trail mix, nuts, chips' },
			{ name: 'Pizza', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Large pizzas for the group' },
			{ name: 'Soda', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Coffee/Tea', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'For late-night gaming' },
			{ name: 'Paper and Pens', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'For scoring and notes' }
		]
	},
	{
		id: 'holiday-party',
		name: 'Holiday Party',
		description: 'Festive celebration with seasonal treats and decorations',
		emoji: '🎄',
		category: 'Celebration',
		items: [
			{ name: 'Holiday Cookies', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Dozens of festive cookies' },
			{ name: 'Hot Chocolate', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Packets or homemade mix' },
			{ name: 'Eggnog', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Cartons of eggnog' },
			{ name: 'Holiday Decorations', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Garland, ornaments, lights' },
			{ name: 'Disposable Cups', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3 },
			{ name: 'Holiday Music Playlist', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'Festive background music' },
			{ name: 'Gift Exchange Gifts', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1, details: 'If doing Secret Santa' }
		]
	},
	{
		id: 'camping-trip',
		name: 'Camping Trip',
		description: 'Outdoor adventure essentials for a night under the stars',
		emoji: '⛺',
		category: 'Outdoor',
		items: [
			{ name: 'Tents', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: '2-4 person tents' },
			{ name: 'Sleeping Bags', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1 },
			{ name: 'Camping Chairs', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1 },
			{ name: 'Firewood', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Bundles of firewood' },
			{ name: 'Matches/Lighter', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Waterproof options' },
			{ name: 'Camping Food', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3, details: 'Meals for duration of trip' },
			{ name: 'Water Bottles', unit: BringListCountTypes.PER_PERSON, quantity_needed: 4 },
			{ name: 'Flashlights', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1, details: 'With extra batteries' },
			{ name: 'First Aid Kit', unit: BringListCountTypes.COUNT, quantity_needed: 1 }
		]
	},
	{
		id: 'baby-shower',
		name: 'Baby Shower',
		description: 'Celebrating the upcoming arrival with gifts and treats',
		emoji: '🍼',
		category: 'Celebration',
		items: [
			{ name: 'Baby Gifts', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1, details: 'From registry or thoughtful picks' },
			{ name: 'Cupcakes', unit: BringListCountTypes.COUNT, quantity_needed: 24, details: 'Baby-themed cupcakes' },
			{ name: 'Punch', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Non-alcoholic punch bowls' },
			{ name: 'Baby Decorations', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Balloons, banners, centerpieces' },
			{ name: 'Game Supplies', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Baby shower games' },
			{ name: 'Disposable Plates', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Plastic Forks', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Napkins', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Baby-themed napkins' }
		]
	},
	{
		id: 'housewarming',
		name: 'Housewarming Party',
		description: 'Welcome to the new home with practical and celebratory items',
		emoji: '🏠',
		category: 'Celebration',
		items: [
			{ name: 'House Plants', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Low-maintenance houseplants' },
			{ name: 'Bottle of Wine', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Nice bottles for toasting' },
			{ name: 'Appetizer Platters', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Cheese, crackers, veggies' },
			{ name: 'Desserts', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Cakes or pastries' },
			{ name: 'Disposable Plates', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Plastic Cups', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3 },
			{ name: 'Cocktail Napkins', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Elegant party napkins' }
		]
	},
	{
		id: 'sports-viewing',
		name: 'Sports Viewing Party',
		description: 'Game day essentials for cheering on your team',
		emoji: '🏈',
		category: 'Indoor',
		items: [
			{ name: 'Wings', unit: BringListCountTypes.COUNT, quantity_needed: 50, details: 'Buffalo wings or variety' },
			{ name: 'Pizza', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Large pizzas' },
			{ name: 'Beer', unit: BringListCountTypes.PER_PERSON, quantity_needed: 4, details: 'Various beer options' },
			{ name: 'Soda', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Chips and Dips', unit: BringListCountTypes.COUNT, quantity_needed: 6, details: 'Tortilla chips, salsa, guac' },
			{ name: 'Paper Plates', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3 },
			{ name: 'Paper Towels', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'For messy finger foods' },
			{ name: 'Team Decorations', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Banners, pom-poms, etc.' }
		]
	},
	{
		id: 'book-club',
		name: 'Book Club Meeting',
		description: 'Literary discussion with light refreshments',
		emoji: '📚',
		category: 'Indoor',
		items: [
			{ name: 'Coffee', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Regular and decaf options' },
			{ name: 'Tea Selection', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'Variety of tea bags' },
			{ name: 'Pastries', unit: BringListCountTypes.COUNT, quantity_needed: 12, details: 'Muffins, scones, or croissants' },
			{ name: 'Fresh Fruit', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'Seasonal fruit platter' },
			{ name: 'Notebooks', unit: BringListCountTypes.PER_PERSON, quantity_needed: 1, details: 'For taking notes' },
			{ name: 'Pens', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2 },
			{ name: 'Discussion Questions', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'Prepared talking points' }
		]
	},
	{
		id: 'cocktail-party',
		name: 'Cocktail Party',
		description: 'Elegant evening with sophisticated drinks and appetizers',
		emoji: '🍸',
		category: 'Indoor',
		items: [
			{ name: 'Mixed Spirits', unit: BringListCountTypes.COUNT, quantity_needed: 6, details: 'Vodka, gin, whiskey, etc.' },
			{ name: 'Mixers', unit: BringListCountTypes.COUNT, quantity_needed: 8, details: 'Tonic, soda, juices' },
			{ name: 'Garnishes', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Olives, cherries, citrus' },
			{ name: 'Elegant Appetizers', unit: BringListCountTypes.COUNT, quantity_needed: 6, details: 'Canapés, shrimp, cheese' },
			{ name: 'Cocktail Napkins', unit: BringListCountTypes.COUNT, quantity_needed: 4, details: 'Elegant disposable napkins' },
			{ name: 'Ice', unit: BringListCountTypes.COUNT, quantity_needed: 3, details: 'Bags of ice for drinks' },
			{ name: 'Glassware', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3, details: 'Cocktail glasses or plastic' }
		]
	},
	{
		id: 'study-group',
		name: 'Study Group Session',
		description: 'Productive learning environment with brain fuel',
		emoji: '📖',
		category: 'Indoor',
		items: [
			{ name: 'Coffee', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'To stay alert and focused' },
			{ name: 'Energy Snacks', unit: BringListCountTypes.COUNT, quantity_needed: 5, details: 'Nuts, granola bars, fruit' },
			{ name: 'Notebooks', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2, details: 'For notes and practice' },
			{ name: 'Pens/Pencils', unit: BringListCountTypes.PER_PERSON, quantity_needed: 5 },
			{ name: 'Highlighters', unit: BringListCountTypes.PER_PERSON, quantity_needed: 3, details: 'Different colors' },
			{ name: 'Study Materials', unit: BringListCountTypes.COUNT, quantity_needed: 1, details: 'Textbooks, worksheets' },
			{ name: 'Calculator', unit: BringListCountTypes.COUNT, quantity_needed: 2, details: 'If needed for subject' },
			{ name: 'Water Bottles', unit: BringListCountTypes.PER_PERSON, quantity_needed: 2, details: 'Stay hydrated' }
		]
	}
];

export function getProposedBringListById(id: string): ProposedBringList | undefined {
	return proposedBringLists.find(list => list.id === id);
}

export function getProposedBringListsByCategory(category: string): ProposedBringList[] {
	return proposedBringLists.filter(list => list.category === category);
}

export const categories = [...new Set(proposedBringLists.map(list => list.category))];