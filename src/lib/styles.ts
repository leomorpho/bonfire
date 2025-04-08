import { writable } from 'svelte/store';
import type { FontSelection } from '$lib/types';

// Create a writable store for the style
export const styleStore = writable<string>('');
export const overlayColorStore = writable<string>('');
export const overlayOpacityStore = writable<number>(0);
export const fontStore = writable<FontSelection | null>(null);

/**
 * Parse a hex color to RGB format.
 * @param hex - The hex color string.
 * @returns - The RGB values as a string (e.g., "255, 255, 255").
 */
export function parseColor(hex: string): string {
	if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
		hex = '#000000';
		console.log('Invalid hex color format, setting a default');
	}

	// If shorthand (#rgb), expand it to full form (#rrggbb)
	if (hex.length === 4) {
		hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
	}

	const bigint = parseInt(hex.slice(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;

	return `${r}, ${g}, ${b}`;
}

export const randomSort = (array) => array.sort(() => Math.random() - 0.5);

// Function to get a random FontSelection
export function getRandomFontSelection(): FontSelection {
	// Convert the Font object to an array of entries
	const fontEntries = Object.entries(Font);

	// Select a random entry from the array
	const [randomFontName, randomFontDetails] =
		fontEntries[Math.floor(Math.random() * fontEntries.length)];

	// Return the FontSelection object
	return {
		name: randomFontName,
		style: randomFontDetails.style,
		cdn: randomFontDetails.cdn
	};
}

// Track the used themes and fonts
const usedThemes: Set<string> = new Set();
const usedFonts: Set<string> = new Set();

// Function to get the next available theme
export const getNextTheme = () => {
	// Filter out used themes
	const availableThemes = stylesGallery.filter((style) => !usedThemes.has(style.cssTemplate));

	if (availableThemes.length === 0) {
		// Reset if all themes have been used
		usedThemes.clear();
		return stylesGallery[0].cssTemplate;
	}

	// Select a random available theme
	const nextTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
	usedThemes.add(nextTheme.cssTemplate);
	return nextTheme.cssTemplate;
};

// Function to get the next available font
export const getNextFont = (): FontSelection => {
	// Convert the Font object to an array of entries
	const fontEntries = Object.entries(Font);

	// Filter out used fonts
	const availableFonts = fontEntries.filter(([fontName]) => !usedFonts.has(fontName));

	if (availableFonts.length === 0) {
		// Reset if all fonts have been used
		usedFonts.clear();
		const [firstFontName, firstFontDetails] = fontEntries[0];
		return {
			name: firstFontName,
			style: firstFontDetails.style,
			cdn: firstFontDetails.cdn
		};
	}

	// Select a random available font
	const [nextFontName, nextFontDetails] =
		availableFonts[Math.floor(Math.random() * availableFonts.length)];
	usedFonts.add(nextFontName);
	return {
		name: nextFontName,
		style: nextFontDetails.style,
		cdn: nextFontDetails.cdn
	};
};

export const stylesGallery = [
	{
		id: 1,
		name: 'Hip curves',
		cssTemplate: `
        --s: 40px; /* control the size*/
        --c1: #5E8275FF;
        --c2: #dee1b6;
        --c3: #bd5532;
        --c4: #373b44;
        
        --c:,#0000 39%,var(--c1) 40% 93%,#0000 94%;
        --_s:calc(1.5*var(--s))/calc(4*var(--s)) calc(3*var(--s));
        background:
            radial-gradient(calc(1.5*var(--s)) at 37.5%   0%var(--c))
            calc(-.5*var(--s)) var(--_s),
            radial-gradient(calc(1.5*var(--s)) at 37.5% 100%var(--c))
            calc(1.5*var(--s)) var(--_s),
            radial-gradient(25% calc(50%/3),#0000 96%,var(--c2))
            0 0/calc(2*var(--s)) calc(3*var(--s)),
            repeating-conic-gradient(var(--c3) 0 25%,var(--c4) 0 50%)
            0 0/calc(4*var(--s)) calc(6*var(--s));
        `
	},
	{
		id: 2,
		name: 'Multicolor Circles Pattern',
		cssTemplate: `
                --s: 80px; /* control the size*/
                --c1: #f8ca00;
                --c2: #8a9b0f;
                --c3: #c02942;
                --c4: #53777a;
                --c5: #c5bc8e;
                
                --_g:conic-gradient(at 25%,#0000 75%,var(--c1) 0);
                --_s:/calc(2*var(--s)) calc(2*var(--s));
                background:
                    radial-gradient(#0000 64%,var(--c5) 65%) 
                    0 0/var(--s) var(--s),
                    var(--_g) 0 0 var(--_s),
                    var(--_g) var(--s) var(--s) var(--_s),
                    repeating-conic-gradient(#0000 0 25%,var(--c2) 0 50%)
                    0 0 var(--_s),
                    linear-gradient(var(--c3) 50%,var(--c4) 0) 
                    0 0/1% var(--s);
        `
	},
	{
		id: 3,
		name: 'Pills Pattern',
		cssTemplate: `
                --s: 60px; /* control the size*/
                --c1: #dcd1b4;
                --c2: #5e9fa3;
                
                background:
                    repeating-conic-gradient(var(--c1) 0 25%,#0000 0 50%)
                    0 0/calc(4*var(--s)) calc(2*var(--s)),
                    conic-gradient(#0000 50%,var(--c2) 0)
                    calc(var(--s)/2) 0/calc(2*var(--s)) 1%,
                    radial-gradient(var(--c2) 70%,var(--c1) 72%)
                    0 0/var(--s) var(--s);
        `
	},
	{
		id: 4,
		name: 'Mosaic Triangles Pattern',
		cssTemplate: `
            --s: 70px; /* control the size*/
            --c1: #655643;
            --c2: #80bca3;
            
            --g:,var(--c1) 25%,var(--c2) 0 50%,#0000 0;
            background:
                repeating-conic-gradient(var(--c1) 0 30deg,#0000 0 150deg,var(--c2) 0 50%)
                calc(1.5*var(--s)) calc(.865*var(--s)),
                conic-gradient(from  30deg at 75% 75%var(--g)),
                conic-gradient(from -30deg at 75% 25%var(--g)),
                conic-gradient(from 150deg at 25% 75%var(--g)),
                conic-gradient(from 210deg at 25% 25%var(--g)),
                repeating-conic-gradient(var(--c1) 0 30deg,var(--c2) 0 60deg);
            background-size: calc(3*var(--s)) calc(1.73*var(--s));
        `
	},
	{
		id: 5,
		name: 'Overlapping Cubes Pattern',
		cssTemplate: `
            --s: 84px; /* control the size*/
            --c1: #fefcdd;
            --c2: #cdcbcc;
            --c3: #999999;
            
            --_g: 0 120deg,#0000 0;
            background:
                conic-gradient(             at calc(250%/3) calc(100%/3),var(--c3) var(--_g)),
                conic-gradient(from -120deg at calc( 50%/3) calc(100%/3),var(--c2) var(--_g)),
                conic-gradient(from  120deg at calc(100%/3) calc(250%/3),var(--c1) var(--_g)),
                conic-gradient(from  120deg at calc(200%/3) calc(250%/3),var(--c1) var(--_g)),
                conic-gradient(from -180deg at calc(100%/3) 50%,var(--c2)  60deg,var(--c1) var(--_g)),
                conic-gradient(from   60deg at calc(200%/3) 50%,var(--c1)  60deg,var(--c3) var(--_g)),
                conic-gradient(from  -60deg at 50% calc(100%/3),var(--c1) 120deg,var(--c2) 0 240deg,var(--c3) 0);
            background-size: calc(var(--s)*sqrt(3)) var(--s);
        `
	},
	{
		id: 6,
		name: 'Diagonal Wavy Lines & Squares Pattern',
		cssTemplate: `
            --s: 40px; /* control the size*/
            --c1: #ab3e5b;
            --c2: #f9f2e7;
            
            --_g:#0000 17.5%,var(--c1) 18% 35%,var(--c2) 35.5% 39%,#0000 40%;
            background:
                radial-gradient(at 100% 0,var(--_g))
                0       calc(var(--s)/-2)/calc(2*var(--s)) calc(2*var(--s)),
                radial-gradient(at 0 100%,var(--_g))
                calc(var(--s)/2) var(--s)/calc(2*var(--s)) calc(2*var(--s)),
                conic-gradient(#0000 75%,var(--c1) 0) 0 0/var(--s) var(--s) 
                var(--c2);
        `
	},
	{
		id: 7,
		name: 'Curved Lines Pattern',
		cssTemplate: `
            --s: 100px; /* control the size*/
    --c1: #fff0e5;
    --c2: #025d8c;
    --c3: #e1642a;
    
    --_g: 50%,#0000 37%,var(--c1) 39% 70%,#0000 72%;
    --_t: 50%,var(--c2) 40deg,var(--c3) 0 140deg,var(--c2) 0 180deg,#0000 0; 
    --_s: 47% 50% at;
    background: 
      radial-gradient(var(--_s) -10% var(--_g)) 0 calc(var(--s)/2),
      radial-gradient(var(--_s) -10% var(--_g)) calc(var(--s)/2) 0,
      radial-gradient(var(--_s) 110% var(--_g)),
      radial-gradient(var(--_s) 110% var(--_g)) calc(var(--s)/2) calc(var(--s)/2),
      conic-gradient(from   0deg at 55% var(--_t)) calc(var(--s)/4) 0,
      conic-gradient(from 180deg at 45% var(--_t)) calc(var(--s)/4) 0,
      var(--c2);
    background-size: var(--s) var(--s);
        `
	},
	{
		id: 7,
		name: 'Geometric Flowers Pattern',
		cssTemplate: `
  --s: 69px; /* control the size*/
  --c1: #c02942;
  --c2: #53777a;
  --c3: #ecd078;
  --c4: #d95b43;
  
  background:
    radial-gradient(var(--c1) 24%,#0000 25%),
    radial-gradient(var(--c2) 30%,#0000 32%) calc(var(--s)/2) calc(var(--s)/2),
    repeating-conic-gradient(from 30deg,var(--c3) 0 30deg,var(--c4) 0 25%);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 8,
		name: 'Overlapping Circles Pattern',
		cssTemplate: `
  --s: 150px; /* control the size*/
  --c1: #f7d2a1;
  --c2: #05057e;
  
  --_g: 
     var(--c1) 0%  5% ,var(--c2) 6%  15%,var(--c1) 16% 25%,var(--c2) 26% 35%,var(--c1) 36% 45%,
     var(--c2) 46% 55%,var(--c1) 56% 65%,var(--c2) 66% 75%,var(--c1) 76% 85%,var(--c2) 86% 95%,
     #0000 96%;
  background:
    radial-gradient(50% 50% at 100% 0,var(--_g)),
    radial-gradient(50% 50% at 0 100%,var(--_g)),
    radial-gradient(50% 50%,var(--_g)),
    radial-gradient(50% 50%,var(--_g)) calc(var(--s)/2) calc(var(--s)/2)
    var(--c1);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 9,
		name: 'Triangles Pattern With 3D Effect',
		cssTemplate: `
  --s: 105px; /* control the size*/
  --c1: #b9b9b9;
  --c2: #dcdcdc;
  --c3: #fafafa;
  
  background:
    conic-gradient(from 75deg,var(--c1)   15deg ,var(--c2) 0 30deg ,#0000 0 180deg,
                              var(--c2) 0 195deg,var(--c1) 0 210deg,#0000 0) 
       calc(var(--s)/2) calc(.5*var(--s)/tan(30deg)),
    conic-gradient(var(--c1)   30deg ,var(--c3) 0 75deg ,var(--c1) 0 90deg, var(--c2) 0 105deg,
                   var(--c3) 0 150deg,var(--c2) 0 180deg,var(--c3) 0 210deg,var(--c1) 0 256deg,
                   var(--c2) 0 270deg,var(--c1) 0 286deg,var(--c2) 0 331deg,var(--c3) 0);
  background-size: var(--s) calc(var(--s)/tan(30deg));
        `
	},
	{
		id: 10,
		name: 'Equilateral Triangles Pattern',
		cssTemplate: `
  --s: 120px; /* control the size*/
  --c1: #fa6900;
  --c2: #d95b43;
  --c3: #ecd078;
  
  background:
    conic-gradient(from 150deg at 50% 33%,#0000,var(--c1) .5deg 60deg,#0000 60.5deg) 
      calc(var(--s)/2) calc(var(--s)/sqrt(2)),
    conic-gradient(from -30deg at 50% 66%,#0000,var(--c2) .5deg 60deg,var(--c3) 60.5deg);
  background-size: var(--s) calc(.5*var(--s)/tan(30deg));
        `
	},
	{
		id: 11,
		name: 'Parallelograms Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #4ecdc4;
  --c2: #556270;
  
  background: 
    linear-gradient(atan(-.5),var(--c1) 33%,var(--c2) 33.5% 66.5%,var(--c1) 67%) 
    0/var(--s) var(--s);
        `
	},
	{
		id: 12,
		name: 'Distorted Mesh Pattern',
		cssTemplate: `
  --s: 140px; /* control the size*/
  --c1: #170409;
  --c2: #67917a;
  
  --_g: #0000 52%,var(--c1) 54% 57%,#0000 59%; 
  background: 
   radial-gradient(farthest-side at -33.33% 50%,var(--_g)) 0 calc(var(--s)/2),
   radial-gradient(farthest-side at 50% 133.33%,var(--_g)) calc(var(--s)/2) 0,
   radial-gradient(farthest-side at 133.33% 50%,var(--_g)),
   radial-gradient(farthest-side at 50% -33.33%,var(--_g)),
   var(--c2);
  background-size: calc(var(--s)/4.667) var(--s),var(--s) calc(var(--s)/4.667);
        `
	},
	{
		id: 13,
		name: 'Diagonal Squares Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #00a0b0;
  --c2: #eb6841;
  
  --_g: var(--c1) 0 25%,#0000 0 50%;
  background:
   repeating-conic-gradient(at 33% 33%,var(--_g)),
   repeating-conic-gradient(at 66% 66%,var(--_g)),
   var(--c2); 
  background-size: var(--s) var(--s); 
        `
	},
	{
		id: 14,
		name: 'Hearts Pattern',
		cssTemplate: `
        --s: 120px; /* control the size*/
  --c1: #e7525b;
  --c2: #78dbf0;
  
  --_g: 80%,var(--c1) 25.4%,#0000 26%;
  background:
   radial-gradient(at 80% var(--_g)),
   radial-gradient(at 20% var(--_g)),
   conic-gradient(from -45deg at 50% 41%,var(--c1) 90deg,var(--c2) 0) 
      calc(var(--s)/2) 0;
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 15,
		name: 'Zig-Zag Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #eceddc;
  --c2: #29ab87;
  
  --_g: var(--c1) 90deg,#0000 90.5deg;
  background:
   conic-gradient(from -45deg,var(--_g)),
   conic-gradient(from 135deg,var(--_g)) calc(var(--s)/2) 0,
   var(--c2);
  background-size: var(--s) var(--s)
        `
	},
	{
		id: 16,
		name: 'Stars Pattern',
		cssTemplate: `
  --s: 90px; /* control the size*/
  --c1: #fff220;
  --c2: #a8c6fe;
  
  --d: calc(var(--s)/10);  /* control the gap between stars */
  
  --_g: var(--c1) 36deg, #0000 0;   
  background:
    conic-gradient(from 162deg at calc(var(--s) * .5)  calc(var(--s) * .68), var(--_g)),
    conic-gradient(from 18deg  at calc(var(--s) * .19) calc(var(--s) * .59), var(--_g)),
    conic-gradient(from 306deg at calc(var(--s) * .81) calc(var(--s) * .59), var(--_g)),
    var(--c2);
  background-position: 0 calc(var(--s) * 0.35);
  background-size: calc(var(--s) + var(--d)) calc(var(--s) + var(--d));
        `
	},
	{
		id: 17,
		name: 'Rectangles & Parallelograms Pattern',
		cssTemplate: `
  --s: 150px; /* control the size*/
  --c1: #ff847c;
  --c2: #e84a5f;
  --c3: #fecea8;
  --c4: #99b898;
  
  background:
    conic-gradient(from  45deg at 75% 75%, var(--c3) 90deg,var(--c1) 0 180deg,#0000 0),
    conic-gradient(from -45deg at 25% 25%, var(--c3) 90deg,#0000 0),
    conic-gradient(from -45deg at 50% 100%,#0000 180deg,var(--c3) 0),
    conic-gradient(from -45deg,var(--c1) 90deg, var(--c2) 0 225deg,var(--c4) 0);
  background-size: var(--s) var(--s); 
        `
	},
	{
		id: 18,
		name: 'Squares Pattern With 3D Effect',
		cssTemplate: `
  --s: 222px; /* control the size*/
  --c1: #7f727b;
  --c2: #d6b4c2;
  --c3: #baa0ab;
  
  --_g: var(--c1) 10%,var(--c2) 10.5% 19%,#0000 19.5% 80.5%,var(--c2) 81% 89.5%,var(--c3) 90%;
  --_c: from -90deg at 37.5% 50%,#0000 75%;
  --_l1: linear-gradient(145deg,var(--_g));
  --_l2: linear-gradient( 35deg,var(--_g));
  background: 
    var(--_l1), var(--_l1) calc(var(--s)/2) var(--s),
    var(--_l2), var(--_l2) calc(var(--s)/2) var(--s),
    conic-gradient(var(--_c),var(--c1) 0) calc(var(--s)/8) 0,
    conic-gradient(var(--_c),var(--c3) 0) calc(var(--s)/2) 0,
    linear-gradient(90deg,var(--c3) 38%,var(--c1) 0 50%,var(--c3) 0 62%,var(--c1) 0);
  background-size: var(--s) calc(2*var(--s)/3);
        `
	},
	{
		id: 19,
		name: 'Equal Sign (Rotated Rectangles) Pattern',
		cssTemplate: `
  --s: 200px; /* control the size*/
  --c1: #ffffff;
  --c2: #1095c1;
  
  --_g: #0000 8%,var(--c1) 0 17%,#0000 0 58%;
  background: 
    linear-gradient(135deg,#0000 20.5%,var(--c1) 0 29.5%,#0000 0) 0 calc(var(--s)/4),
    linear-gradient( 45deg,var(--_g)) calc(var(--s)/2) 0,
    linear-gradient(135deg,var(--_g),var(--c1) 0 67%,#0000 0),        
    linear-gradient( 45deg,var(--_g),var(--c1) 0 67%,#0000 0 83%,var(--c1) 0 92%,#0000 0),
    var(--c2); 
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 20,
		name: 'Triangles & Chevrons Pattern',
		cssTemplate: `
  --s: 64px; /* control the size*/
  --c1: #e0e4cc;
  --c2: #69d2e7;
  
  --_g: 90deg,#0000 0; 
  background:
    conic-gradient(from 135deg,var(--c1) var(--_g)) var(--s) calc(var(--s)/2),
    conic-gradient(from 135deg,var(--c2) var(--_g)),
    conic-gradient(from 135deg at 50% 0,var(--c1) var(--_g)) var(--c2); 
  background-size: calc(2*var(--s)) var(--s);
        `
	},
	{
		id: 21,
		name: 'Rhombus & Stripes Pattern',
		cssTemplate: `
  --s: 64px; /* control the size*/
  --c1: #eb6841;
  --c2: #edc951;
  
  background:
    conic-gradient(from -45deg,var(--c1) 90deg,#0000 0 180deg,var(--c2) 0 270deg,#0000 0)   
      0 calc(var(--s)/2)/var(--s) var(--s),    
    conic-gradient(from 135deg at 50% 0,var(--c1) 90deg,var(--c2) 0)  
      0 0/calc(2*var(--s)) var(--s);
        `
	},
	{
		id: 22,
		name: 'Mosaic Triangles Pattern',
		cssTemplate: `
  --s: 36px; /* control the size*/
  --c1: #b62f31;
  --c2: #ecdacb;
  --c3: #8e1f08;
  
  --_g: calc(2*var(--s)*1.732) calc(2*var(--s)) 
    conic-gradient(from 60deg at 62.5% 50%,var(--c3) 60deg,#0000 0); 
  background:
       calc( 2.598*var(--s)/2) calc(var(--s)/ 2)/var(--_g),
       calc(-0.866*var(--s)/2) calc(var(--s)/-2)/var(--_g),
    repeating-conic-gradient(var(--c2) 0 90deg,#0000 0 180deg) 
       0 0/calc(2*var(--s)*1.732) calc(2*var(--s)),
    repeating-conic-gradient(from 60deg,var(--c1) 0 60deg,var(--c2) 0 180deg) 
       0 0/calc(var(--s)*1.732) var(--s);
        `
	},
	{
		id: 23,
		name: 'Mosaic Parallelograms & Squares Pattern',
		cssTemplate: `
  --s: 125px; /* control the size*/
  --c1: #ffd877;
  --c2: #b92d5d;
  
  --_g: var(--c1) 90deg,var(--c2) 0 135deg,#0000 0;
  background:
    conic-gradient(from  -45deg at calc(100%/3)   calc(100%/3)  ,var(--c1) 90deg,#0000 0 ),
    conic-gradient(from -135deg at calc(100%/3)   calc(2*100%/3),var(--_g)),
    conic-gradient(from  135deg at calc(2*100%/3) calc(2*100%/3),var(--_g)),
    conic-gradient(from   45deg at calc(2*100%/3) calc(100%/3)  ,var(--_g),var(--c1) 0 225deg,var(--c2) 0);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 24,
		name: 'Rhombus & Rectangles Pattern',
		cssTemplate: `
  --s: 170px; /* control the size*/
  --c1: #3b8686;
  --c2: #cff09e;
  
  --_c: #0000 75%,var(--c1) 0; 
  --_g1: conic-gradient(at 20.71% 50%,var(--_c));
  --_g2: conic-gradient(at 50% 20.71%,var(--_c));
  background:
    var(--_g1) calc(var(--s)/ 6.828) calc(var(--s)/2),var(--_g1) calc(var(--s)/-2.828) 0,
    conic-gradient(from   45deg at 29.29% 29.29%,var(--_c)) calc(var(--s)/-6.828) 0,
    var(--_g2) calc(var(--s)/2) calc(var(--s)/-2.828),var(--_g2) 0 calc(var(--s)/ 6.828),
    conic-gradient(from -135deg at 29.29% 70.71%,var(--_c)) calc(var(--s)/-6.828) 0,
    var(--c2);
  background-size: var(--s) var(--s), var(--s) var(--s), calc(var(--s)/2) calc(var(--s)/2);
        `
	},
	{
		id: 25,
		name: 'Diamond Pattern With 3D Effect',
		cssTemplate: `
  --s: 65px; /* control the size*/
  --c1: #dadee1;
  --c2: #4a99b4;
  --c3: #9cceb5;
  
  --_c: 75%,var(--c3) 52.72deg,#0000 0;
  --_g1: conic-gradient(from -116.36deg at 25% var(--_c));
  --_g2: conic-gradient(from   63.43deg at 75% var(--_c));
  background:
    var(--_g1), var(--_g1) calc(3*var(--s)) calc(var(--s)/2),
    var(--_g2), var(--_g2) calc(3*var(--s)) calc(var(--s)/2),
    conic-gradient(
      var(--c2)   63.43deg ,var(--c1) 0 116.36deg,
      var(--c2) 0 180deg   ,var(--c1) 0 243.43deg,
      var(--c2) 0 296.15deg,var(--c1) 0);
  background-size: calc(2*var(--s)) var(--s);
        `
	},
	{
		id: 26,
		name: 'Cube Columns Pattern',
		cssTemplate: `
  --s: 82px; /* control the size*/
  --c1: #b2b2b2;
  --c2: #ffffff;
  --c3: #d9d9d9;
  
  --_g: var(--c3) 0 120deg,#0000 0;
  background:
    conic-gradient(from -60deg at 50% calc(100%/3),var(--_g)),
    conic-gradient(from 120deg at 50% calc(200%/3),var(--_g)),
    conic-gradient(from  60deg at calc(200%/3),var(--c3) 60deg,var(--c2) 0 120deg,#0000 0),
    conic-gradient(from 180deg at calc(100%/3),var(--c1) 60deg,var(--_g)),
    linear-gradient(90deg,var(--c1)   calc(100%/6),var(--c2) 0 50%,
                          var(--c1) 0 calc(500%/6),var(--c2) 0);
  background-size: calc(1.732*var(--s)) var(--s);
        `
	},
	{
		id: 27,
		name: 'Triangles Pattern',
		cssTemplate: `
  --s: 76px; /* control the size*/
  --c1: #f6d86b;
  --c2: #ff8c82;
  
  background:
    conic-gradient(
      var(--c2) atan(2), var(--c1) 0 calc(180deg - atan(2)),
      var(--c2) 0 180deg,var(--c1) 0 calc(180deg + atan(2)),
      var(--c2) 0 calc(360deg - atan(2)),var(--c1) 0);
  background-size: calc(2*var(--s)) var(--s);
        `
	},
	{
		id: 28,
		name: 'Z Shape Pattern',
		cssTemplate: `
  --s: 106px; /* control the size*/
  --c1: #eafde6;
  --c2: #b1dd8c;
  
  background:
    conic-gradient(from  30deg at 87.5% 75%,var(--c1)  60deg,var(--c2) 0 120deg,#0000 0) 0 calc(.2165*var(--s)),
    conic-gradient(from -90deg at 50%   25%,var(--c2)  60deg,var(--c1) 0 180deg,#0000 0),
    conic-gradient(from  90deg at 50%   75%,var(--c2) 120deg,var(--c1) 0 180deg,#0000 0),
    conic-gradient(from -30deg at 87.5% 50%,var(--c2) 120deg,var(--c1) 0 240deg,#0000 0),
    conic-gradient(from  90deg at 37.5% 50%,var(--c2) 120deg,var(--c1) 0 180deg,var(--c2) 0 240deg,var(--c1) 0);
  background-size: var(--s) calc(.866*var(--s));
        `
	},
	{
		id: 29,
		name: 'Nested Rhombus Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #caf0fe;
  --c2: #dad6ca;
  
  --_g1: 
    var(--c1)   calc(25%/3) ,#0000 0 calc(50%/3),
    var(--c1) 0 25%         ,#0000 0 75%,
    var(--c1) 0 calc(250%/3),#0000 0 calc(275%/3),
    var(--c1) 0;
  --_g2: 
    #0000   calc(25%/3) ,var(--c1) 0 calc(50%/3),
    #0000 0 calc(250%/3),var(--c1) 0 calc(275%/3),
    #0000 0;
  background:
    linear-gradient( 45deg,var(--_g2)),linear-gradient( 45deg,var(--_g1)),
    linear-gradient(-45deg,var(--_g2)),linear-gradient(-45deg,var(--_g1))
    var(--c2); /* second color */
  background-position: 0 0,var(--s) var(--s);
  background-size: calc(2*var(--s)) calc(2*var(--s));


        `
	},
	{
		id: 30,
		name: 'Three Braided Lines Pattern',
		cssTemplate: `
  --s: 30px; /* control the size*/
  --c1: #5e9fa3;
  --c2: #b05574;
  --c3: #b39c82;
  --c4: #dcd1b4;
  
  background:
    conic-gradient(at 50% calc(100%/6),var(--c1) 60deg,#0000 0),
    conic-gradient(at calc(100%/6) 50%,#0000 240deg,var(--c1) 0),
    conic-gradient(from 180deg at calc(100%/6) calc(500%/6),var(--c1) 60deg,#0000 0),
    conic-gradient(from 180deg at calc(500%/6),#0000 240deg,var(--c1) 0) calc(4*.866*var(--s)) 0,
    repeating-linear-gradient(-150deg,var(--c2) 0 calc(100%/6),#0000   0 50%),
    repeating-linear-gradient(-30deg, var(--c3) 0 calc(100%/6),var(--c4) 0 50%);
  background-size: calc(6*.866*var(--s)) calc(3*var(--s))
        `
	},
	{
		id: 31,
		name: 'Quatrefoils Pattern',
		cssTemplate: `
  --s: 60px; /* control the size*/
  --c1: #b09f79;
  --c2: #476074;
  
  --_g: #0000 83%,var(--c1) 85% 99%,#0000 101%;
  background:
    radial-gradient(27% 29% at right ,var(--_g)) calc(var(--s)/ 2) var(--s),
    radial-gradient(27% 29% at left  ,var(--_g)) calc(var(--s)/-2) var(--s),
    radial-gradient(29% 27% at top   ,var(--_g)) 0 calc(var(--s)/ 2),
    radial-gradient(29% 27% at bottom,var(--_g)) 0 calc(var(--s)/-2)
    var(--c2);
  background-size: calc(2*var(--s)) calc(2*var(--s));
        `
	},
	{
		id: 32,
		name: 'Curvy Pattern',
		cssTemplate: `
  --s: 80px; /* control the size*/
  --c1: #5e8c6a;
  --c2: #bfb35a;
  
  --_s: calc(2*var(--s)) calc(2*var(--s));
  --_g: 35.36% 35.36% at;
  --_c: #0000 66%,var(--c2) 68% 70%,#0000 72%;
  background:
    radial-gradient(var(--_g) 100% 25%,var(--_c)) var(--s) var(--s)/var(--_s),
    radial-gradient(var(--_g) 0    75%,var(--_c)) var(--s) var(--s)/var(--_s),
    radial-gradient(var(--_g) 100% 25%,var(--_c)) 0 0/var(--_s),
    radial-gradient(var(--_g) 0    75%,var(--_c)) 0 0/var(--_s),
    repeating-conic-gradient(var(--c1) 0 25%,#0000 0 50%) 0 0/var(--_s),
    radial-gradient(var(--_c)) 0 calc(var(--s)/2)/var(--s) var(--s)
    var(--c1);
        `
	},
	{
		id: 33,
		name: 'Loop Circles Pattern',
		cssTemplate: `
  --s: 150px; /* control the size*/
  --c1: #ccbf82;
  --c2: #604848;
  
  --_g: var(--c1)        6.1%,var(--c2)  6.4% 18.6%,var(--c1) 18.9% 31.1%,
        var(--c2) 31.4% 43.6%,var(--c1) 43.9% 56.1%,var(--c2) 56.4% 68.6%,#0000 68.9%;
  background:
    radial-gradient(var(--s) at 100% 0   ,var(--_g)),
    radial-gradient(var(--s) at 0    0   ,var(--_g)),
    radial-gradient(var(--s) at 0    100%,var(--_g)),
    radial-gradient(var(--s) at 100% 100%,var(--_g)) var(--c1);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 34,
		name: 'Rotated Squares Pattern',
		cssTemplate: `
  --s: 150px; /* control the size*/
  --c1: #046d8b;
  --c2: #2fb8ac;
  
  --_g: #0000 90deg,var(--c1) 0;
  background:
    conic-gradient(from 116.56deg at calc(100%/3) 0   ,var(--_g)),
    conic-gradient(from -63.44deg at calc(200%/3) 100%,var(--_g))
    var(--c2);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 35,
		name: 'Diagonal Zig-Zag Pattern',
		cssTemplate: `
  --s: 60px; /* control the size*/
  --c1: #d6d6d6;
  --c2: #ffa57d;
  --c3: #865c4f;
  
  --_s: calc(2*var(--s)) calc(2*var(--s));
  --_g1: var(--_s) conic-gradient(at calc(500%/6) 50%,var(--c3) 25%,#0000 0);
  --_g2: var(--_s) conic-gradient(at calc(200%/3) 50%,var(--c2) 25%,#0000 0);
  background:
    var(--s) var(--s)/var(--_g1),0 0/var(--_g1),
    var(--s) var(--s)/var(--_g2),0 0/var(--_g2),
    repeating-conic-gradient(var(--c1) 0 25%,#0000 0 50%) 0 0/var(--_s),
    linear-gradient(var(--c1) calc(100%/3),var(--c2) 0 calc(200%/3),var(--c3) 0)
     0 0/var(--s) var(--s);
        `
	},
	{
		id: 36,
		name: 'Stairs Pattern With 3D Effect',
		cssTemplate: `
  --s: 50px; /* control the size*/
  --c1: #f4a4c0;
  --c2: #000000;
  --c3: #ffffff;
  
  --_g: conic-gradient(at 50% 25%,#0000 75%,var(--c1) 0);
  background:
    var(--_g),var(--_g) var(--s) var(--s),
    var(--_g) calc(2*var(--s)) calc(2*var(--s)),
    var(--_g) calc(3*var(--s)) calc(3*var(--s)),
    repeating-linear-gradient(135deg,var(--c2) 0 12.5%,var(--c3) 0 25%);
  background-size: calc(4*var(--s)) calc(4*var(--s))
        `
	},
	{
		id: 37,
		name: 'Nested Diamond Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #668284;
  --c2: #b6d8c0;
  --c3: #b9d7d9;
  
  --_g: #0000, var(--c1) 1deg 30deg,var(--c2) 31deg 89deg,var(--c1) 90deg 119deg,#0000 120deg;
  background:
    conic-gradient(from -60deg at 50% 28.86%,var(--_g)),
    conic-gradient(from  30deg at 71.14% 50%,var(--_g)),
    conic-gradient(from 120deg at 50% 71.14%,var(--_g)),
    conic-gradient(from 210deg at 28.86% 50%,var(--_g))
    var(--c3);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 38,
		name: 'Circles & Squares Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #fecb3e;
  --c2: #987f69;
  
  --_g: var(--c1) 0 100%,#0000 102%;
  background:
    conic-gradient(#0000 75%,var(--_g)) calc(var(--s)/4) calc(var(--s)/4),
    radial-gradient(65% 65% at 50% -50%,var(--_g)),
    radial-gradient(65% 65% at -50% 50%,var(--_g)),
    radial-gradient(65% 65% at 50% 150%,var(--_g)),
    radial-gradient(65% 65% at 150% 50%,var(--_g))
    var(--c2);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 39,
		name: 'Triangles & Trapezoids Pattern',
		cssTemplate: `
  --s: 76px; /* control the size*/
  --c1: #f77825;
  --c2: #60b99a;
  --c3: #f1efa5;
  --c4: #554236;
  
  background:
    conic-gradient(from 150deg,var(--c1)    60deg,#0000 0 180deg,
                               var(--c2) 0 240deg,#0000 0) var(--s) 0,
    conic-gradient(from -30deg,var(--c1)    60deg,var(--c3) 0 120deg,var(--c4) 0 180deg,
                               var(--c2) 0 240deg,var(--c3) 0 300deg,var(--c4) 0);
  background-size: calc(2*var(--s)) var(--s);
        `
	},
	{
		id: 40,
		name: 'Striped Circles Pattern',
		cssTemplate: `
  --s: 76px; /* control the size*/
  --c1: #1a144a;
  --c2: #2eb044;
  
  --_g: conic-gradient(var(--c1) 25%,#0000 0) 0 0;
  background:
    var(--_g)/calc(2*var(--s)) calc(var(--s)/9.5),
    var(--_g)/calc(var(--s)/9.5) calc(2*var(--s)),
    repeating-conic-gradient(#0000 0 25%,var(--c1) 0 50%) 
     var(--s) 0 /calc(2*var(--s)) calc(2*var(--s)),
    radial-gradient(50% 50%,var(--c2) 98%,var(--c1)) 
     0 0/var(--s) var(--s);
        `
	},
	{
		id: 41,
		name: 'Nested Triangles Pattern With 3D Effect',
		cssTemplate: `
  --s: 162px; /* control the size*/
  --c1: #cd2942;
  --c2: #62928c;
  --c3: #e8cba9;
  --c4: #33152e;
  --c5: #414352;
  
  --_g: conic-gradient(from 30deg at 50% 25%,#0000 300deg,var(--c1) 0);
  background:
    var(--_g) calc(0.2885*var(--s)) calc(7*var(--s)/12),
    var(--_g) 0 calc(var(--s)/12),
    conic-gradient(from 120deg at 50% calc(250%/3),var(--c2) 120deg,#0000 0),
    repeating-conic-gradient(from 30deg,#0000 0 60deg,var(--c3) 0 120deg),
    repeating-conic-gradient(var(--c4) 0 60deg,var(--c2) 0 120deg,var(--c5) 0 180deg);
  background-size: calc(0.577*var(--s)) var(--s);
        `
	},
	{
		id: 42,
		name: 'Triangles Grid Pattern',
		cssTemplate: `
  --s: 200px; /* control the size*/
  --c1: #dc9d37;
  --c2: #fed450;
  --c3: #125c65;
  --c4: #bc4a33;
  --c5: #ffffff;
  
  --_g: var(--c1) 25%,var(--c2) 0 50%,#0000 0;
  --_l1: var(--c5) 0 1px,#0000 0 calc(25% - 1px),var(--c5) 0 25%;
  --_l2: var(--c5) 0 1px,#0000 0 calc(50% - 1px),var(--c5) 0 50%;
  background:
    repeating-linear-gradient( 45deg,var(--_l1)),
    repeating-linear-gradient(-45deg,var(--_l1)),
    repeating-linear-gradient(  0deg,var(--_l2)),
    repeating-linear-gradient( 90deg,var(--_l2)),
    conic-gradient(from 135deg at 25% 75%,var(--_g)),
    conic-gradient(from 225deg at 25% 25%,var(--_g)),
    conic-gradient(from  45deg at 75% 75%,var(--_g)),
    conic-gradient(from -45deg at 75% 25%,var(--_g)),
    repeating-conic-gradient(var(--c3) 0 45deg,var(--c4) 0 90deg);  
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 43,
		name: 'Flower Petals Pattern',
		cssTemplate: `
  --s: 60px; /* control the size*/
  --c1: #f2b4a8;
  --c2: #91204d;
  
  --_g: radial-gradient(25% 25% at 25% 25%,var(--c1) 99%,#0000 101%);
  background:
   var(--_g) var(--s) var(--s)/calc(2*var(--s)) calc(2*var(--s)),
   var(--_g) 0 0/calc(2*var(--s)) calc(2*var(--s)),
   radial-gradient(50% 50%,var(--c2) 98%,#0000) 0 0/var(--s) var(--s),
   repeating-conic-gradient(var(--c2) 0 25%,var(--c1) 0 50%) 
     calc(.5*var(--s)) 0/calc(2*var(--s)) var(--s);
        `
	},
	{
		id: 44,
		name: 'Circles & Curved Lines Pattern',
		cssTemplate: `
  --s: 70px; /* control the size*/
  --c1: #6b5344;
  --c2: #f8ecc9;
  
  --_l: #0000 46%,var(--c1) 47% 53%,#0000 54%;
  background:
    radial-gradient(100% 100% at 100% 100%,var(--_l)) var(--s) var(--s),
    radial-gradient(100% 100% at 0    0   ,var(--_l)) var(--s) var(--s),
    radial-gradient(100% 100%,#0000 22%,var(--c1) 23% 29%, #0000 30% 34%,var(--c1) 35% 41%,#0000 42%),
    var(--c2);
  background-size: calc(var(--s)*2) calc(var(--s)*2);
        `
	},
	{
		id: 45,
		name: 'Wavy Pattern With 3D Effect',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #f8b195;
  --c2: #355c7d;
  
  --_g: 
     var(--c2) 6%  14%,var(--c1) 16% 24%,var(--c2) 26% 34%,var(--c1) 36% 44%,
     var(--c2) 46% 54%,var(--c1) 56% 64%,var(--c2) 66% 74%,var(--c1) 76% 84%,var(--c2) 86% 94%;
  background:
    radial-gradient(100% 100% at 100% 0,var(--c1) 4%,var(--_g),#0008 96%,#0000),
    radial-gradient(100% 100% at 0 100%,#0000, #0008 4%,var(--_g),var(--c1) 96%)
    var(--c1);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 46,
		name: 'Multicolor Wavy Lines Pattern',
		cssTemplate: `
  --s: 140px; /* control the size*/
  --c1: #ab3e5b;
  --c2: #ffbe40;
  --c3: #accec0;
  --c4: #61a6ab;
  
  --_g: 
    #0000 25%,#0008 47%,var(--c1)  53% 147%,var(--c2) 153% 247%,
    var(--c1) 253% 347%,var(--c2) 353% 447%,var(--c1) 453% 547%,#0008 553%,#0000 575%;
  --_s: calc(25%/3) calc(25%/4) at 50%; 
  background:
    radial-gradient(var(--_s) 100%,var(--_g)),
    radial-gradient(var(--_s) 100%,var(--_g)) calc(var(--s)/2) calc(3*var(--s)/4),
    radial-gradient(var(--_s) 0   ,var(--_g)) calc(var(--s)/2) 0,
    radial-gradient(var(--_s) 0   ,var(--_g)) 0                calc(3*var(--s)/4),
    repeating-linear-gradient(90deg,var(--c3) calc(25%/-6) calc(25%/6),var(--c4) 0 calc(25%/2));
  background-size: var(--s) calc(3*var(--s)/2)
        `
	},
	{
		id: 47,
		name: 'Citrus Shapes Pattern',
		cssTemplate: `
  --s: 55px; /* control the size*/
  --c1: #f9f2e7;
  --c2: #88a65e;
  --c3: #bfb35a;
  
  --b: calc(var(--s)/3.67); /* control the thickness of the curved lines */
  
  --_r: calc(1.28*var(--s) + var(--b)/2) at top 50%;
  --_f: calc(99.5% - var(--b)),var(--c1) calc(101% - var(--b)) 99.5%,#0000 101%;
  --_g0: calc(-.8*var(--s)), var(--c2) var(--_f);
  --_g1: calc(-.8*var(--s)), var(--c3) var(--_f);
  --_s: calc(1.8*var(--s) + var(--b));
  background: 
    radial-gradient(var(--_r) right var(--_g0)) calc(-1*var(--_s)) var(--s),
    radial-gradient(var(--_r) left  var(--_g1))         var(--_s)  calc(-1*var(--s)),
    radial-gradient(var(--_r) right var(--_g1)) calc(var(--_s)/-2) calc(-1*var(--s)),
    radial-gradient(var(--_r) left  var(--_g0)) calc(var(--_s)/ 2) var(--s),
    linear-gradient(90deg,var(--c2) 50%,var(--c3) 0);
  background-size: var(--_s) calc(4*var(--s));
        `
	},
	{
		id: 48,
		name: 'Quarter Circles Pattern',
		cssTemplate: `
  --s: 89px; /* control the size*/
  --c1: #00807f;
  --c2: #e8ddcb;
  
  --_g: var(--c1) 35%, #0000 36%;
  background: 
    radial-gradient(at 100% 100%, var(--_g)),
    radial-gradient(at 0    0   , var(--_g))
    var(--c2);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 49,
		name: 'Lollipop Pattern',
		cssTemplate: `
  --s: 56px; /* control the size*/
  --c1: #3fb8af;
  --c2: #ff9e9d;
  
  --_c1: var(--c1) 99%,#0000 101%;
  --_c2: var(--c2) 99%,#0000 101%;
  
  --r:calc(var(--s)*.866); 
  --g0:radial-gradient(var(--s),var(--_c1));
  --g1:radial-gradient(var(--s),var(--_c2));
  --f:radial-gradient(var(--s) at calc(100% + var(--r)) 50%,var(--_c1));
  --p:radial-gradient(var(--s) at 100% 50%,var(--_c2));
  background:
    var(--f) 0 calc(-5*var(--s)/2),
    var(--f) calc(-2*var(--r)) calc(var(--s)/2),
    var(--p) 0 calc(-2*var(--s)),
    var(--g0) var(--r) calc(-5*var(--s)/2),
    var(--g1) var(--r) calc( 5*var(--s)/2),
    radial-gradient(var(--s) at 100% 100%,var(--_c1)) 0 calc(-1*var(--s)),   
    radial-gradient(var(--s) at 0%   50% ,var(--_c1)) 0 calc(-4*var(--s)),
    var(--g1) calc(-1*var(--r)) calc(-7*var(--s)/2),
    var(--g0) calc(-1*var(--r)) calc(-5*var(--s)/2),
    var(--p) calc(-2*var(--r)) var(--s),
    var(--g0) calc(-1*var(--r)) calc(var(--s)/ 2),
    var(--g1) calc(-1*var(--r)) calc(var(--s)/-2),
    var(--g0) 0 calc(-1*var(--s)),
    var(--g1) var(--r) calc(var(--s)/-2),
    var(--g0) var(--r) calc(var(--s)/ 2) 
    var(--c2);
  background-size: calc(4*var(--r)) calc(6*var(--s));
        `
	},
	{
		id: 50,
		name: 'Semi Circles & Full Circles Pattern',
		cssTemplate: `
  --s: 53px; /* control the size*/
  --c1: #cff09e;
  --c2: #0b486b;
  
  --_g: radial-gradient(var(--c2) 49%,#0000 50%);
  background:
   var(--_g) calc(var(--s)/-2) calc(var(--s)/2),
   repeating-conic-gradient(from 45deg,var(--c1) 0 25%,#0000 0 50%)
     calc(var(--s)/2) calc(var(--s)/2),
   var(--_g),var(--_g) var(--s) var(--s) var(--c1);
  background-size: calc(2*var(--s)) calc(2*var(--s));
        `
	},
	{
		id: 51,
		name: 'Christmas Tree Pattern',
		cssTemplate: `
  --s: 75px; /* control the size*/
  --c1: #ffffff;
  --c2: #a31e39;
  --c3: #31570e;
  
  --_c:#0000,var(--c1) 1deg 79deg,#0000 81deg;
  --g0:conic-gradient(from 140deg at 50% 87.5% ,var(--_c));
  --g1:conic-gradient(from 140deg at 50% 81.25%,var(--_c));
  --g2:conic-gradient(from 140deg at 50% 75%   ,var(--_c));
  --g3:conic-gradient(at 10% 20%,#0000 75%,var(--c1) 0);
  background:
    var(--g0) 0 calc(var(--s)/-4),var(--g0) var(--s) calc(3*var(--s)/4),
    var(--g1) ,var(--g1) var(--s) var(--s),
    var(--g2) 0 calc(var(--s)/ 4),var(--g2) var(--s) calc(5*var(--s)/4),
    var(--g3) calc( var(--s)/-10) var(--s),
    var(--g3) calc(9*var(--s)/10) calc(2*var(--s)),
    repeating-conic-gradient(from 45deg,var(--c2) 0 25%,var(--c3) 0 50%);
  background-size: calc(2*var(--s)) calc(2*var(--s));
        `
	},
	{
		id: 52,
		name: 'Christmas Style Pattern',
		cssTemplate: `
  --s: 48px; /* control the size*/
  --c1: #d8d8d8;
  --c2: #bb2528;
  --c3: #146b3a;
  
  --b: calc(var(--s)/2.67); /* control the thickness of the wavy line */
  
  --_r: calc(1.28*var(--s) + var(--b)/2) at left 50%;
  --_f: calc(100% - var(--b)),var(--c1) calc(101% - var(--b)) 100%,#0000 101%;
  --g0: calc(-.8*var(--s)),var(--c2) var(--_f);
  --g1: calc(-.8*var(--s)),var(--c3) var(--_f);
  --_s: calc(1.5*var(--s) + var(--b));
  background: 
    radial-gradient(var(--_r) bottom var(--g0)) calc(2*var(--s)) calc(-1*var(--_s)),
    radial-gradient(var(--_r) bottom var(--g1)) calc(-1*var(--s)) calc(var(--_s)/-2),
    radial-gradient(var(--_r) top    var(--g1)) 0 var(--_s),
    radial-gradient(var(--_r) top    var(--g0)) var(--s) calc(var(--_s)/ 2),
    linear-gradient(var(--c2) 50%,var(--c3) 0);
  background-size: calc(4*var(--s)) var(--_s);
        `
	},
	{
		id: 53,
		name: 'Diagonal Rectangles Pattern',
		cssTemplate: `
  --s: 150px; /* control the size*/
  --c1: #5e412f;
  --c2: #fcebb6;
  
  background:
    linear-gradient(135deg,#0000 18.75%,var(--c1) 0 31.25%,#0000 0),
    repeating-linear-gradient(45deg,var(--c1) -6.25% 6.25%,var(--c2) 0 18.75%);
  background-size: var(--s) var(--s); 

        `
	},
	{
		id: 54,
		name: 'Colorful Overlapping Circles Pattern',
		cssTemplate: `
  --s: 120px; /* control the size*/
  --c1: #1a2030;
  --c2: #0f9177;
  --c3: #fdebad;
  --c4: #d34434;
  --c5: #b5d999;
  
  --_g: radial-gradient(#0000 70%,var(--c1) 71%);
  background:
    var(--_g),var(--_g) calc(var(--s)/2) calc(var(--s)/2),
    conic-gradient(var(--c2) 25%,var(--c3) 0 50%,var(--c4) 0 75%,var(--c5) 0);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 55,
		name: 'Pill Shapes Pattern',
		cssTemplate: `
  --s: 34px; /* control the size*/
  --c1: #ecbe13;
  --c2: #309292;
  
  --_g: radial-gradient(calc(var(--s)/2),var(--c1) 97%,#0000);
  background:
    var(--_g),var(--_g) calc(2*var(--s)) calc(2*var(--s)),
    repeating-conic-gradient(from 45deg,#0000 0 25%,var(--c2) 0 50%) calc(-.707*var(--s)) calc(-.707*var(--s)),
    repeating-linear-gradient(135deg,var(--c1) calc(var(--s)/-2) calc(var(--s)/2),var(--c2) 0 calc(2.328*var(--s)));
  background-size: calc(4*var(--s)) calc(4*var(--s));
        `
	},
	{
		id: 56,
		name: 'Curved Segments Pattern',
		cssTemplate: `
  --s: 60px; /* control the size*/
  --c1: #7bb0a8;
  --c2: #a7dbab;
  
  --_c: var(--c1) calc(100% - var(--s)/2) 99%,#0000;
  --_g: var(--s),#0000 calc(99% - var(--s)/2),var(--_c);
  background:
    radial-gradient(var(--s) at 100% var(--_g)),
    radial-gradient(calc(var(--s)/4) at 50% calc(100%/3),var(--_c)) var(--s) 0,
    radial-gradient(var(--s) at   0% var(--_g)) 0 calc(3*var(--s))
    var(--c2);
  background-size: 
    calc(2*var(--s)) calc(9*var(--s)/4),
    calc(2*var(--s)) calc(3*var(--s)/4);
        `
	},
	{
		id: 57,
		name: 'Waves Pattern',
		cssTemplate: `
  --s: 30px; /* control the size*/
  --c1: #e5fcc2;
  --c2: #45ada8;
  
  --_s:37.5% 12.5% at 62.5%;
  --_g:34% 99%,#0000 101%;
  --g1:radial-gradient(var(--_s) 100%,#0000 32%,var(--c1) var(--_g));
  --g2:radial-gradient(var(--_s) 0   ,#0000 32%,var(--c1) var(--_g));
  --g3:radial-gradient(var(--_s) 100%,#0000 32%,var(--c2) var(--_g));
  --g4:radial-gradient(var(--_s) 0   ,#0000 32%,var(--c2) var(--_g));
  background:
    var(--g1),
    var(--g2) 0                calc(3*var(--s)),
    var(--g3) var(--s)         calc(3*var(--s)),
    var(--g4) var(--s)         calc(6*var(--s)),
    var(--g1) calc(2*var(--s)) calc(6*var(--s)),
    var(--g2) calc(2*var(--s)) calc(9*var(--s)),
    var(--g3) calc(3*var(--s)) calc(9*var(--s)),
    var(--g4) calc(3*var(--s)) 0,
    repeating-linear-gradient(var(--c1) 0 25%,var(--c2) 0 50%);
  background-size: calc(4*var(--s)) calc(12*var(--s));
        `
	},
	{
		id: 58,
		name: 'Chevron Stripes Pattern',
		cssTemplate: `
  --s: 65px; /* control the size*/
  --c1: #ffd9a8;
  --c2: #d9cafe;
  
  --g: calc(var(--s)/5); /* control the gap */
  --_l: #0000 calc(33% - .866*var(--g)),var(--c1) calc(33.2% - .866*var(--g)) 33%,#0000 34%;
  background:
    repeating-linear-gradient(var(--c1) 0 var(--g), #0000 0 50%)
     0 calc(.866*var(--s) - var(--g)/2),
    conic-gradient(from -150deg at var(--g) 50%,var(--c1) 120deg,#0000 0),
    linear-gradient(-120deg,var(--_l)),linear-gradient( -60deg,var(--_l))
    var(--c2);
  background-size: var(--s) calc(3.466*var(--s))
        `
	},
	{
		id: 59,
		name: 'Wavy Pattern With 3D Effect',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #e1f5c4;
  --c2: #3b8183;
  
  --_g:#0000, #0004 5%,
     var(--c2) 6%  14%,var(--c1) 16% 24%,var(--c2) 26% 34%,var(--c1) 36% 44%,
     var(--c2) 46% 54%,var(--c1) 56% 64%,var(--c2) 66% 74%,var(--c1) 76% 84%,
     var(--c2) 86% 94%,#0004 95%,#0000;
  background:
    radial-gradient(100% 50% at 100% 0   ,var(--_g)),
    radial-gradient(100% 50% at 0    50% ,var(--_g)),
    radial-gradient(100% 50% at 100% 100%,var(--_g));
  background-size: var(--s) calc(2*var(--s));
        `
	},
	{
		id: 60,
		name: 'Arrows Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #cff09e;
  --c2: #3b8686;
  
  background:
    conic-gradient(#0000 75%,var(--c1) 0) 0 calc(var(--s)/4),
    conic-gradient(from 45deg,var(--c1) 25%,var(--c2) 0);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 61,
		name: 'Irregular Zig-Zag Pattern',
		cssTemplate: `
  --s: 66px; /* control the size*/
  --c1: #b38184;
  --c2: #413e4a;
  
  --c: var(--c1) 25%;  
  background: 
    conic-gradient(from -45deg at 75% 12.5%,var(--c),#0000 0),
    conic-gradient(from 135deg at 25% 87.5%,var(--c),#0000 0) 
     0 calc(var(--s)/2),
    conic-gradient(from 180deg at 50% 75%,#0000 62.5%,var(--c)),
    conic-gradient(            at 50% 25%,#0000 62.5%,var(--c)) 
     0 calc(var(--s)/2) var(--c2);
  background-size: var(--s) calc(2*var(--s));
        `
	},
	{
		id: 62,
		name: 'Zig-Zag Pattern With 3D Effect',
		cssTemplate: `
  --s: 36px; /* control the size*/
  --c1: #000000;
  --c2: #d2d3d5;
  --c3: #727c7e;
  
  --g1: conic-gradient(at calc(250%/3) calc(50%/3),var(--c2) 60deg,#0000 0 300deg,var(--c1) 0);
  --g2: conic-gradient(at calc(50%/3) 50%,#0000 75%,var(--c1) 0);
  --g3: conic-gradient(at calc(100%/3) 50%,#0000 75%,var(--c2) 0);
  --g4: conic-gradient(from 59deg at calc(200%/3) calc(249%/9),var(--c3) 61deg,#0000 62deg);
  --g5: conic-gradient(from 60deg at 50% calc(250%/3),#f1f1f1 /*4th color*/ 60deg,var(--c1) 0 120deg,#0000 0);
  --_p: calc(9*tan(30deg)*var(--s));
  background:
    var(--g1) calc(-1*var(--s)) 0,var(--g1) calc(2*var(--s)) var(--_p),
    var(--g2),var(--g2) calc(3*var(--s)) var(--_p),
    var(--g3),var(--g3) calc(3*var(--s)) var(--_p),
    var(--g4),var(--g4) calc(3*var(--s)) var(--_p),
    var(--g5) calc(3*var(--s)) 0,var(--g5) 0 var(--_p) var(--c3);
  background-size: calc(6*var(--s)) calc(2*var(--_p))
        `
	},
	{
		id: 63,
		name: 'Outline Circles Pattern',
		cssTemplate: `
  --s: 220px; /* control the size*/
  --c1: #774f38;
  --c2: #f1d4af;
  
  --_g:radial-gradient(#0000 60%,var(--c1) 61% 63%,#0000 64% 77%,var(--c1) 78% 80%,#0000 81%);
  --_c:,#0000 75%,var(--c2) 0;
  background:
    conic-gradient(at 12% 20% var(--_c)) calc(var(--s)* .44) calc(.9*var(--s)),
    conic-gradient(at 12% 20% var(--_c)) calc(var(--s)*-.06) calc(.4*var(--s)),
    conic-gradient(at 20% 12% var(--_c)) calc(.9*var(--s)) calc(var(--s)* .44),
    conic-gradient(at 20% 12% var(--_c)) calc(.4*var(--s)) calc(var(--s)*-.06),
    var(--_g),var(--_g) calc(var(--s)/2) calc(var(--s)/2) var(--c2);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 64,
		name: 'Right Triangles Pattern',
		cssTemplate: `
  --s: 70px; /* control the size*/
  --c1: #f67280;
  --c2: #355c7d;
  
  --_g:,#0000 75%,var(--c1) 0;
  background:
    linear-gradient(-45deg var(--_g)),
    linear-gradient( 45deg var(--_g)) 
     0 calc(var(--s)/2) var(--c2);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 65,
		name: 'Optical Illusion Pattern',
		cssTemplate: `
  --s: 50px; /* control the size*/
  --c1: #5e412f;
  --c2: #fcebb6;
  
  background:
    radial-gradient(25% 50%,var(--c1) 98%,#0000)
     var(--s) 0/calc(2*var(--s)) var(--s),
    radial-gradient(25% 50%,var(--c2) 98%,#0000)
     0 0/calc(2*var(--s)) var(--s),
    repeating-conic-gradient(var(--c1) 0 25%,var(--c2) 0 50%) 
     0 0/calc(2*var(--s)) calc(2*var(--s));
        `
	},
	{
		id: 66,
		name: 'Thick Wavy Lines Pattern',
		cssTemplate: `
  --s: 50px; /* control the size*/
  --c1: #d9ceb2;
  --c2: #948c75;
  
  --_g: calc(2*var(--s)) calc(2*var(--s)) 
    radial-gradient(25% 25%,var(--c1) 99%,#0000 101%);
  background:
    0 var(--s)/var(--_g),var(--s) 0/var(--_g),
    radial-gradient(50% 50%,var(--c2) 97%,#0000)
     calc(var(--s)/2) calc(var(--s)/2)/var(--s) var(--s),
    linear-gradient(90deg,var(--c1) 50%,var(--c2) 0) 
     0 0/calc(2*var(--s));
        `
	},
	{
		id: 67,
		name: 'Two Color Circles Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #5a3d31;
  --c2: #e5edb8;
  
  background:
    radial-gradient(#0000 50%,var(--c1) 52% 55%,var(--c2) 57%)
    0 0/var(--s) var(--s),
    repeating-linear-gradient(45deg,var(--c1) 0 25%,var(--c2) 0 50%)
    0 0/calc(2*var(--s)) calc(2*var(--s))
        `
	},
	{
		id: 68,
		name: 'Folded Zig-Zag Pattern',
		cssTemplate: `
  --s: 84px; /* control the size*/
  --c1: #ffffff;
  --c2: #71e9a0;
  --c3: #2a6a9b;
  
  --a:from -30deg at;
  background:
    linear-gradient(#0000 50%,#0004 0),
    conic-gradient(var(--a) 90%,var(--c1) 240deg,#0000     0),
    conic-gradient(var(--a) 75%,var(--c2) 240deg,#0000     0),
    conic-gradient(var(--a) 25%,#0000     240deg,var(--c1) 0),
    conic-gradient(var(--a) 40%,var(--c1) 240deg,var(--c3) 0);
  background-size: calc(1.5*var(--s)) var(--s);
        `
	},
	{
		id: 69,
		name: 'Diagonal Wavy Lines Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #cc2a41;
  --c2: #351330;
  
  --_g: #0000 24%,
    var(--c2) 26% 34%,var(--c1) 36% 44%,
    var(--c2) 46% 54%,var(--c1) 56% 64%,
    var(--c2) 66% 74%,#0000 76%;
  background:
    radial-gradient(100% 100% at 100% 0,var(--_g)),
    radial-gradient(100% 100% at 0 100%,var(--_g)),
    radial-gradient(var(--c2) 14%,var(--c1) 16%) 
     calc(var(--s)/2) calc(var(--s)/2);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 70,
		name: 'Wave & Circles Pattern',
		cssTemplate: `
  --s: 160px; /* control the size*/
  --c1: #a14016;
  --c2: #cfc89a;
  
  --_g: var(--s) var(--s) 
    radial-gradient(var(--c1) 17%,var(--c2) 18% 35%,#0000 36.5%);
  background: 
    calc(var(--s)/-4) calc(var(--s)/-4)/var(--_g),
    calc(var(--s)/ 4) calc(var(--s)/ 4)/var(--_g),
    radial-gradient(var(--c2) 34%,var(--c1) 36% 68%,#0000 70%) 
     0 0/calc(var(--s)/2) calc(var(--s)/2),
    repeating-linear-gradient(45deg,var(--c1) -12.5% 12.5%,var(--c2) 0 37.5%)
     0 0/var(--s) var(--s);
        `
	},
	{
		id: 71,
		name: 'Retro Style Circles Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #80bca3;
  --c2: #655643;
  
  background:
    radial-gradient(var(--c2) 15%,
      #0000 17% 20%,var(--c2) 22% 25%,
      #0000 27% 30%,var(--c2) 32% 35%,
      #0000 37% 40%,var(--c2) 42% 45%,
      #0000 47% 50%,var(--c2) 52% 55%, var(--c1) 57%)
     calc(var(--s)/2) 0/var(--s) var(--s),
    repeating-conic-gradient(var(--c2) 0 25%,var(--c1) 0 50%)
     0 0/calc(2*var(--s)) calc(2*var(--s));
        `
	},
	{
		id: 72,
		name: 'Honeycomb Pattern',
		cssTemplate: `
  --s: 37px; /* control the size*/
  --c1: #1c6761;
  --c2: #ecbe13;
  
  --c:#0000,var(--c1) .5deg 119.5deg,#0000 120deg;
  --g1:conic-gradient(from  60deg at 56.25% calc(425%/6),var(--c));
  --g2:conic-gradient(from 180deg at 43.75% calc(425%/6),var(--c));
  --g3:conic-gradient(from -60deg at 50%   calc(175%/12),var(--c));
  background:
    var(--g1),var(--g1) var(--s) calc(1.73*var(--s)),
    var(--g2),var(--g2) var(--s) calc(1.73*var(--s)),
    var(--g3) var(--s) 0,var(--g3) 0 calc(1.73*var(--s)) 
    var(--c2);
  background-size: calc(2*var(--s)) calc(3.46*var(--s));
        `
	},
	{
		id: 73,
		name: 'Two Color Spheres Pattern',
		cssTemplate: `
  --s: 90px; /* control the size*/
  --c1: #dad8a7;
  --c2: #ff3d7f;
  --c3: #34dfd2;
  
  --_s:0 0/var(--s) var(--s);
  background:
    radial-gradient(#0000 50%,#0002 54%,var(--c1) 57%) var(--_s),
    radial-gradient(circle at 40% 30%,#0000 4%,#000 90%) var(--_s),
    repeating-conic-gradient(var(--c2) 0 25%,var(--c3) 0 50%)
     0 0/calc(2*var(--s)) calc(2*var(--s));
        `
	},
	{
		id: 74,
		name: 'Intersecting Wavy Lines Pattern',
		cssTemplate: `
  --s: 6px; /* control the size*/
  --c1: #3b2d38;
  --c2: #ffb5af;
  
  --g:#0000 66%,var(--c1) 68% 98%,#0000;
  background:
    radial-gradient(30% 30% at 0%   30%,var(--g))
     var(--s) calc(9*var(--s)),
    radial-gradient(30% 30% at 100% 30%,var(--g))
     var(--s) calc(-1*var(--s)),
    radial-gradient(30% 30% at 30% 100%,var(--g))
     calc(10*var(--s)) 0,
    radial-gradient(30% 30% at 30% 0%  ,var(--g))
     var(--c2);
  background-size: calc(20*var(--s)) calc(20*var(--s));
        `
	},
	{
		id: 75,
		name: 'Rectanges Pattern With 3D Effect',
		cssTemplate: `
  --s: 194px; /* control the size*/
  --c1: #f6edb3;
  --c2: #acc4a3;
  --c3: #55897c;
  
  --_l:#0000 calc(25%/3),var(--c1) 0 25%,#0000 0;
  --_g:conic-gradient(from 120deg at 50% 87.5%,var(--c1) 120deg,#0000 0);
  background:
    var(--_g),var(--_g) 0 calc(var(--s)/2),
    conic-gradient(from 180deg at 75%,var(--c2) 60deg,#0000 0),
    conic-gradient(from 60deg at 75% 75%,var(--c1) 0 60deg,#0000 0),
    linear-gradient(150deg,var(--_l)) 0 calc(var(--s)/2),
    conic-gradient(at 25% 25%,#0000 50%,var(--c2) 0 240deg,var(--c1) 0 300deg,var(--c2) 0),
    linear-gradient(-150deg,var(--_l)) var(--c3);
  background-size: calc(0.866*var(--s)) var(--s);
        `
	},
	{
		id: 76,
		name: 'Triangles & Squares Pattern',
		cssTemplate: `
  --s: 160px; /* control the size*/
  --c1: #e08e79;
  --c2: #f1d4af;
  --c3: #955e3e;
  
  background:
    conic-gradient(from  15deg at 86.6%,
      var(--c3) 25%,var(--c2) 0 150deg,#0000 0),
    conic-gradient(from -75deg at 50% 13.39%,
      var(--c1) 60deg,var(--c3) 0 150deg,
      var(--c2) 0 210deg,#0000 0),
    conic-gradient(from 15deg at 36.6% 63.4%,
     var(--c1) 60deg,var(--c3) 0 150deg,
     var(--c1) 0 210deg,var(--c2) 0 75%,var(--c3) 0);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 77,
		name: 'Hexagons, Squares & Triangles Pattern',
		cssTemplate: `
  --s: 41px; /* control the size*/
  --c1: #f2c45a;
  --c2: #5e8c6a;
  --c3: #88a65e;
  
  --_g:,var(--c1) 25%,var(--c2) 0 150deg,var(--c1) 0 240deg,#0000 0;
  background:
    conic-gradient(from  60deg at calc(3.866*var(--s)),var(--c2) 60deg,#0000 0)
     calc(1.366*var(--s)) calc(1.366*var(--s)),
    conic-gradient(from 240deg at calc( .866*var(--s)),var(--c2) 60deg,#0000 0)
     calc(2.366*var(--s)) calc(1.366*var(--s)),
    conic-gradient(at var(--s) var(--s),#0000 75%,var(--c1) 0)
     calc(1.366*var(--s)) calc(var(--s)/-2),
    conic-gradient(from 30deg at calc(-.288*var(--s)) 50%, #0000 120deg,var(--c3) 0),
    conic-gradient(from 90deg at calc(3.732*var(--s)) calc(1.866*var(--s)),
     var(--c3) 120deg,#0000 0),
    conic-gradient(from -30deg at calc(3.732*var(--s)) calc(.866*var(--s)),
     var(--c3) 120deg,var(--c1) 0 210deg,#0000 0),
    conic-gradient(from 150deg at calc( .866*var(--s))var(--_g)),
    conic-gradient(from -30deg at calc(2.866*var(--s))var(--_g)) var(--c3);
  background-size: calc(4.732*var(--s)) calc(2.732*var(--s));
        `
	},
	{
		id: 78,
		name: 'Zig-Zag Pattern With 3D Effect',
		cssTemplate: `
  --s: 90px; /* control the size*/
  --c1: #78c0a8;
  --c2: #add8e6;
  
  --g:from 45deg at 50% 35%,#0000 75%,;
  --_s:var(--s) calc(2*var(--s));
  background:
    conic-gradient(var(--g)var(--c2) 0) 
     calc(var(--s)/2) var(--s)/var(--_s),
    conic-gradient(var(--g)var(--c1) 0) 
     calc(var(--s)/2)        0/var(--_s),
    conic-gradient(#0004 135deg,#0000 0 225deg,#0009 0)
     0 0/var(--s) var(--s),
    linear-gradient(var(--c1) 50%,var(--c2) 0) 
     0 var(--s)/var(--_s);
        `
	},
	{
		id: 79,
		name: 'Zig-Zag Stripes Pattern',
		cssTemplate: `
  --s: 120px; /* control the size*/
  --c1: #403b33;
  --c2: #e3ad40;
  
  --g:,var(--c1) 25%,#0000 0;
  background:
    conic-gradient(from  45deg at 75% 75%var(--g)),
    conic-gradient(from 135deg at 25% 75%var(--g)),
    conic-gradient(from -45deg at 75% 25%var(--g)),
    conic-gradient(from 225deg at 25% 25%var(--g)),
    repeating-conic-gradient(from -45deg,var(--c1) 0 45deg,var(--c2) 0 50%);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 80,
		name: 'Chevrons Pattern',
		cssTemplate: `
  --s: 150px; /* control the size*/
  --c1: #633d2e;
  --c2: #f7af63;
  
  --l:var(--c1) 20%,#0000 0;
  --g:35%,var(--c2) 0 45%,var(--c1) 0;
  background:
    linear-gradient(45deg,var(--l) 45%,var(--c1) 0 70%,#0000 0),
    linear-gradient(-45deg,var(--l) var(--g) 70%,#0000 0),
    linear-gradient(45deg,var(--c1) var(--g));
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 81,
		name: 'Two Color Diagonal Arrows Pattern',
		cssTemplate: `
  --s: 85px; /* control the size*/
  --c1: #339194;
  --c2: #f6d86b;
  
  --g1:conic-gradient(from  45deg at 62.5% 12.5%,#0000 75%,var(--c1) 0);
  --g2:conic-gradient(from -45deg at 12.5% 12.5%,#0000 75%,var(--c1) 0);
  --g3:conic-gradient(from 225deg at 87.5% 87.5%,#0000 75%,var(--c2) 0);
  --g4:conic-gradient(from 135deg at 87.5% 37.5%,#0000 75%,var(--c2) 0);
  background:
    var(--g4),var(--g4) var(--s) var(--s),
    var(--g3),var(--g3) var(--s) var(--s),
    var(--g2),var(--g2) var(--s) var(--s),
    var(--g1),var(--g1) var(--s) var(--s),
    repeating-linear-gradient(135deg,var(--c2) 0 12.5%,var(--c1) 0 25%);
  background-size: calc(2*var(--s)) calc(2*var(--s))
        `
	},
	{
		id: 82,
		name: 'Lines & Dots Pattern',
		cssTemplate: `
  --s: 60px; /* control the size*/
  --c1: #dee8be;
  --c2: #cd8c52;
  
  --c:#0000 71%,var(--c1) 0 79%,#0000 0;
  --_s:calc(var(--s)/2)/calc(2*var(--s)) calc(2*var(--s));
  background:
    linear-gradient(45deg,var(--c))
     calc(var(--s)/-2) var(--_s),
    linear-gradient(135deg,var(--c))
     calc(var(--s)/2) var(--_s),
    radial-gradient(var(--c1) 35%,var(--c2) 37%)
     0 0/var(--s) var(--s);
        `
	},
	{
		id: 83,
		name: 'Outline Triangles Pattern',
		cssTemplate: `
  --s: 112px; /* control the size*/
  --c1: #490a3d;
  --c2: #ffdad8;
  
  --g1:conic-gradient(from -45deg at 60%,#0000 75%,var(--c1) 0);
  --g2:conic-gradient(from -45deg at 30%,#0000 75%,var(--c2) 0);
  background: 
    var(--g2) calc(var(--s)/8) 0,var(--g2) calc(5*var(--s)/8) var(--s),
    var(--g1),var(--g1) calc(var(--s)/2) var(--s) var(--c2);
  background-size: var(--s) calc(2*var(--s));
        `
	},
	{
		id: 84,
		name: 'Rhombus Pattern',
		cssTemplate: `
  --s: 100px; /* control the size*/
  --c1: #f8edd1;
  --c2: #d88a8a;
  --c3: #9d9d93;
  
  --c:#0000 48%,var(--c1) 0 52%,#0000 0;
  background:
    linear-gradient(-45deg,var(--c)),linear-gradient( 45deg,var(--c)),
    repeating-conic-gradient(from 45deg,var(--c2) 0 25%,var(--c3) 0 50%);
  background-size: var(--s) var(--s);
        `
	},
	{
		id: 85,
		name: 'Pixelated Zig-Zag Pattern',
		cssTemplate: `
  --s: 60px; /* control the size*/
  --c1: #1c2130;
  --c2: #d14334;
  
  --c:var(--c1) 0 25%,#0000 0;
  --p:0 0/calc(3*var(--s)) calc(2*var(--s));
  background:
    conic-gradient(from -45deg at 75% 62.5%,var(--c)) var(--p),
    conic-gradient(from 135deg at 25% 37.5%,var(--c)) var(--p),
    repeating-conic-gradient(from 90deg,var(--c),var(--c2) 0 50%)
     0 0/var(--s) var(--s);
        `
	},
	{
		id: 86,
		name: 'Herringbone Pattern',
		cssTemplate: `
  --s: 50px; /* control the size*/
  --c1: #f8e4c1;
  --c2: #2b4e72;
  
  --c:#0000 75%,var(--c1) 0;
  --g1:conic-gradient(at 78% 3%,var(--c));
  --g2:conic-gradient(at 3% 78%,var(--c));
  background:
    var(--g1),
    var(--g1) var(--s) var(--s),
    var(--g1) calc(2*var(--s)) calc(2*var(--s)),
    var(--g1) calc(3*var(--s)) calc(3*var(--s)),
    var(--g2) 0 calc(3*var(--s)),
    var(--g2) var(--s) 0,
    var(--g2) calc(2*var(--s)) var(--s),
    var(--g2) calc(3*var(--s)) calc(2*var(--s))
    var(--c2);
  background-size: calc(4*var(--s)) calc(4*var(--s));
        `
	},
	{
		id: 87,
		name: 'Checkerboard Optical Illusion Pattern',
		cssTemplate: `
  --s: 80px; /* control the size*/
  --c1: #6b5344;
  --c2: #f8ecc9;
  
  --c:var(--c1) 0;
  --g:conic-gradient(at 50% 25%,#0000 75%,var(--c));
  background:
    repeating-linear-gradient(#0000 0 48%,var(--c) 50%),var(--g),
    conic-gradient(#0000 75%,var(--c)) calc(var(--s)/4) calc(var(--s)/2),
    var(--g) calc(var(--s)/2) var(--s) var(--c2);
  background-size: var(--s) var(--s),var(--s) calc(2*var(--s));
        `
	},
	{
		id: 88,
		name: 'Outline Leafs Pattern',
		cssTemplate: `
  --s: 50px; /* control the size*/
  --c1: #f2f26f;
  --c2: #a0c55f;
  
  --c:#0000 79%,var(--c1) 81% 99%,var(--c2) 101% 150%,#0000 0;
  background:
    radial-gradient(var(--s) at 100% 100%,var(--c)),
    radial-gradient(var(--s) at 100% 0   ,var(--c)) calc(3*var(--s)/2) 0,
    radial-gradient(var(--s) at 0    100%,var(--c)) calc(  var(--s)/2) 0,
    radial-gradient(var(--s) at 0    0   ,var(--c)) calc(2*var(--s)) 0,
    repeating-linear-gradient(90deg,
      var(--c1) 0 calc(20%/3),#0000 0 calc(70%/3),
      var(--c1) 0 30%,#0000 0 50%) calc(var(--s)/-5) 0 var(--c2);
  background-size: calc(3*var(--s)) calc(5*var(--s)/2);
        `
	},
	{
		id: 89,
		name: 'Tiny Squares Pattern',
		cssTemplate: `
  --s: 30px; /* control the size*/
  --c1: #8c2318;
  --c2: #f2c45a;
  
  background:
    conic-gradient(at 60% 60%,var(--c1) 75%,#0000 0)
     0 0/calc(5*var(--s)/2) calc(5*var(--s)/2),
    repeating-conic-gradient(var(--c1) 0 25%,#0000 0 50%)
     0 0/calc(5*var(--s)) calc(5*var(--s)),
    repeating-conic-gradient(var(--c2) 0 25%,var(--c1) 0 50%)
     0 0/var(--s) var(--s);
        `
	},
	{
		id: 90,
		name: 'Wavy magicpattern',
		cssTemplate: `
    --background-color: #e5e5f7;
    --secondary-color: #FDDA50FF;
    --secondary-color-opacity: rgba(68, 76, 247, 1); /* Adjust opacity here */
    --circle-size: 23px; /* Size of the radial pattern */

    background-color: var(--background-color);
    opacity: 1;
    background-image: 
        repeating-radial-gradient(circle at 0 0, transparent 0, var(--background-color) var(--circle-size)), 
        repeating-linear-gradient(var(--secondary-color-opacity), var(--secondary-color));
        `
	},
	{
		id: 91,
		name: 'Circles magicpattern',
		cssTemplate: `
    --background-color: #e5e5f7;
    --primary-color: #444cf7;
    --circle-size: 15px; /* Size of the repeating radial pattern */
    --opacity-level: 1;

    background-color: var(--background-color);
    opacity: var(--opacity-level);
    background-image: 
        radial-gradient(circle at center center, var(--primary-color), var(--background-color)),
        repeating-radial-gradient(circle at center center, var(--primary-color), var(--primary-color), var(--circle-size), transparent calc(var(--circle-size) * 2), transparent var(--circle-size));
    background-blend-mode: multiply;
        `
	},
	{
		id: 92,
		name: 'Fun party circles',
		cssTemplate: `
      --u: 0.375em; /* Base unit */
  --s: calc(50 * var(--u)); /* Size */
  --d: calc(0.25 * var(--s)); /* Derived size */

  --l0: calc(100% - 1px), #fff;
  --l1: 0% 25%, #0000 0% 50%;
  --g: repeating-conic-gradient(#fff var(--l1));
  background: 
    var(--g),
    radial-gradient(closest-side, transparent var(--l0)),
    linear-gradient(90deg, #0000 0 25%, currentcolor 0 75%, #d6af46 0),
    repeating-conic-gradient(#88b6b4 var(--l1)),
    var(--g),
    radial-gradient(closest-side, currentcolor var(--l0));
  background-size: 
    calc(2 * var(--d)) calc(2 * var(--d)),
    var(--d) var(--d),
    calc(0.5 * var(--s)),
    var(--s) var(--s),
    calc(2 * var(--u)) calc(2 * var(--u)),
    var(--u) var(--u);
  color: #31334a;
        `
	},
	{
		id: 93,
		name: 'Swirlings B&W',
		cssTemplate: `
       --d: 6em; /* Diameter */
  --r: calc(0.5 * var(--d)); /* Radius */
  --g: calc(var(--d) * (sqrt(2) - 1)); /* Gap */
  --s: calc(var(--d) + var(--g)); /* Size */
  --p: calc(var(--r) / 3); /* Inner radius */
  --q: calc(2 * var(--p)); /* Outer radius */

  --sl: calc(var(--q) + 1px) calc(var(--r) + -0.5px), 
         transparent calc(var(--r) + 0.5px);
  background: 
    radial-gradient(#fff var(--p), 
                    #000 calc(var(--p) + 1px) var(--q), 
                    #fff var(--sl)) calc(0.5 * var(--s)) calc(0.5 * var(--s)), 
    repeating-conic-gradient(#000 0% 25%, transparent 0% 50%) 
                    calc(0.25 * var(--s)) calc(0.25 * var(--s)), 
    radial-gradient(#000 var(--p), 
                    #fff calc(var(--p) + 1px) var(--q), 
                    #000 var(--sl));
  background-size: var(--s) var(--s), calc(2 * var(--s)) calc(2 * var(--s));
  background-blend-mode: lighten;
        `
	},
	{
		id: 94,
		name: 'Repeating circles',
		cssTemplate: `
--primary-color: #ff9999; /* Main color for the radial gradient */
--background-color: #ffffff; /* Background color */
--size: 4em;

background: repeating-radial-gradient(circle, var(--primary-color), var(--background-color) 20%);
background-size: var(--size) var(--size);
background-color: var(--background-color);
opacity: 1;
        `
	},
	{
		id: 95,
		name: 'Vertical gradient lines',
		cssTemplate: `
--primary-color: #f799ff; /* Main color for the gradient */
--background-color: #fff1d5; /* Background color */
--gradient-size: 3em; /* Size for the repeating gradient */

background: repeating-linear-gradient(90deg, var(--background-color), var(--primary-color));
background-size: var(--gradient-size) var(--gradient-size);
background-color: var(--background-color);
opacity: 1;
        `
	},
	{
		id: 96,
		name: 'Horizontal gradient lines',
		cssTemplate: `
--primary-color: #99bcff; /* Main color for the gradient */
    --background-color: #ffcbcb; /* Background color */
    --gradient-size: 3em; /* Size for the repeating gradient */

background: repeating-linear-gradient(0deg, var(--background-color), var(--primary-color));
    background-size: var(--gradient-size) var(--gradient-size);
    background-color: var(--background-color);
    opacity: 1;
        `
	},
	{
		id: 97,
		name: 'Seigaiha',
		cssTemplate: `
background-color:silver;
background-image:
radial-gradient(circle at 100% 150%, silver 24%, white 24%, white 28%, silver 28%, silver 36%, white 36%, white 40%, transparent 40%, transparent),
radial-gradient(circle at 0    150%, silver 24%, white 24%, white 28%, silver 28%, silver 36%, white 36%, white 40%, transparent 40%, transparent),
radial-gradient(circle at 50%  100%, white 10%, silver 10%, silver 23%, white 23%, white 30%, silver 30%, silver 43%, white 43%, white 50%, silver 50%, silver 63%, white 63%, white 71%, transparent 71%, transparent),
radial-gradient(circle at 100% 50%, white 5%, silver 5%, silver 15%, white 15%, white 20%, silver 20%, silver 29%, white 29%, white 34%, silver 34%, silver 44%, white 44%, white 49%, transparent 49%, transparent),
radial-gradient(circle at 0    50%, white 5%, silver 5%, silver 15%, white 15%, white 20%, silver 20%, silver 29%, white 29%, white 34%, silver 34%, silver 44%, white 44%, white 49%, transparent 49%, transparent);
background-size: 100px 50px;
`
	},
	{
		id: 98,
		name: 'Retro furnish',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/retro-furnish.png'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
        `
	},
	{
		id: 99,
		name: 'Ahoy',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/ahoy.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
        `
	},
	{
		id: 100,
		name: 'Alchemy',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/alchemy.gif'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
        `
	},
	{
		id: 101,
		name: 'Asteroids',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/asteroids.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
        `
	},
	{
		id: 102,
		name: 'Bicycles',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/bicycles.png'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
    
        `
	},
	{
		id: 103,
		name: 'Brijan',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/brijan.gif'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
     
        `
	},
	{
		id: 104,
		name: 'Bunting flag',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/bunting-flag.png'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
    
        `
	},
	{
		id: 105,
		name: 'Celebration',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/celebration.png'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
  
        `
	},
	{
		id: 106,
		name: 'Chalkboard',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/chalkboard.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
    
        `
	},
	{
		id: 107,
		name: 'Cocina',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/cocina.gif'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%; 
        `
	},
	{
		id: 108,
		name: 'Cuadros',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/cuadros.png'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;    
        `
	},
	{
		id: 109,
		name: 'Dark wood',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/dark-wood.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;  
        `
	},
	{
		id: 110,
		name: 'Jade',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/jade.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;      
        `
	},
	{
		id: 111,
		name: 'Design tools',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/design-tools.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;   
        `
	},
	{
		id: 112,
		name: 'Escape flight',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/escape-flight.png'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;    
        `
	},
	{
		id: 113,
		name: 'Fancy pants',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/fancy-pants.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;   
        `
	},
	{
		id: 114,
		name: 'Fiesta',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/fiesta.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;   
        `
	},
	{
		id: 116,
		name: 'Flowers',
		cssTemplate: `
    background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/flowers.jpg'); /* Replace with the URL of your tileable image */
    background-repeat: repeat; /* Tiles the image in both directions */
    background-size: auto; /* Ensures the image retains its original size */
    background-color: #ffffff; /* Fallback background color */
    width: 100%;
    height: 100%;   
        `
	},
	{
		id: 117,
		name: 'Geometrica',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/geometrica.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
      `
	},
	{
		id: 118,
		name: 'Glitch',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/glitch.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
      `
	},
	{
		id: 119,
		name: 'Hodgepodge',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/hodgepodge.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 120,
		name: 'Green goblin',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/green-goblin.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 121,
		name: 'Guglieri speciale',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/guglieri-speciale.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 122,
		name: 'Hotdogs',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/hotdogs.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 123,
		name: 'Isometropolis',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/isometropolis.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 124,
		name: 'Junk mail',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/junk-mail.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 125,
		name: 'Kale salad',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/kale-salad.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 126,
		name: 'Kitty',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/kitty.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 127,
		name: 'Kiwis',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/kiwis.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 128,
		name: 'Knitting',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/knitting.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 129,
		name: 'Leather nunchuck',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/leather-nunchuck.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 130,
		name: 'Magnus 2050',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/magnus-2050.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 131,
		name: 'Magnus 2051',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/magnus-2051.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 132,
		name: 'Maze',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/maze.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 133,
		name: 'Naranjas',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/naranjas.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 134,
		name: 'Neon autumn',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/neon-autumn.gif'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 135,
		name: 'NYC candy',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/nyc-candy.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 136,
		name: 'Ocean',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/ocean.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 137,
		name: 'Plaid',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/plaid.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 138,
		name: 'Quake',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/quake.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 139,
		name: 'Raspberry lace',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/raspberry-lace.gif'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 140,
		name: 'The illusionist',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/the-illusionist.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 141,
		name: 'Kitty',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/science.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 142,
		name: 'Shattered island',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/shattered-island.gif'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 143,
		name: 'Special delivery',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/special-delivery.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 144,
		name: 'Subway lines',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/subway-lines.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 145,
		name: 'Sushi',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/sushi.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 146,
		name: 'White wood',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/white-wood.jpg'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 147,
		name: 'Wild sea',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/wild-sea.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	},
	{
		id: 148,
		name: '輪紋',
		cssTemplate: `
  background-image: url('https://f002.backblazeb2.com/file/bonfire-public/seamless-patterns/輪紋.png'); /* Replace with the URL of your tileable image */
  background-repeat: repeat; /* Tiles the image in both directions */
  background-size: auto; /* Ensures the image retains its original size */
  background-color: #ffffff; /* Fallback background color */
  width: 100%;
  height: 100%;   
    `
	}
];

export const Font = {
	Roboto: {
		style: "font-family: 'Roboto', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap'
	},
	Montserrat: {
		style: "font-family: 'Montserrat', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Montserrat&display=swap'
	},
	Lato: {
		style: "font-family: 'Lato', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Lato&display=swap'
	},
	OpenSans: {
		style: "font-family: 'Open Sans', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap'
	},
	// PlayfairDisplay: {
	// 	style: "font-family: 'Playfair Display', serif;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap'
	// },
	Merriweather: {
		style: "font-family: 'Merriweather', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Merriweather&display=swap'
	},
	Raleway: {
		style: "font-family: 'Raleway', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Raleway&display=swap'
	},
	// PTSerif: {
	// 	style: "font-family: 'PT Serif', serif;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=PT+Serif&display=swap'
	// },
	FiraSans: {
		style: "font-family: 'Fira Sans', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Fira+Sans&display=swap'
	},
	Barlow: {
		style: "font-family: 'Barlow', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Barlow&display=swap'
	},
	JetBrainsMonoVariable: {
		style: "font-family: 'JetBrains Mono', monospace;",
		cdn: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap'
	},
	Caveat: {
		style: "font-family: 'Caveat', cursive; font-size: 2.0em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Caveat&display=swap'
	},
	DancingScript: {
		style: "font-family: 'Dancing Script', cursive; font-size: 2.0em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap'
	},
	GrenzeGotischVariable: {
		style: "font-family: 'Grenze Gotisch', system-ui; font-size: 1.5em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Grenze+Gotisch&display=swap'
	},
	RockSalt: {
		style: "font-family: 'Rock Salt', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Rock+Salt&display=swap'
	},
	DotGothic16: {
		style: "font-family: 'DotGothic16', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap'
	},
	Exo2: {
		style: "font-family: 'Exo 2', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Exo+2&display=swap'
	},
	Lexend: {
		style: "font-family: 'Lexend', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Lexend&display=swap'
	},
	// KronaOne: {
	// 	style: "font-family: 'Krona One', sans-serif;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Krona+One&display=swap'
	// },
	Alice: {
		style: "font-family: 'Alice', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Alice&display=swap'
	},
	InknutAntiqua: {
		style: "font-family: 'Inknut Antiqua', serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Inknut+Antiqua&display=swap'
	},
	PermanentMarker: {
		style: "font-family: 'Permanent Marker', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap'
	},
	VT323: {
		style: "font-family: 'VT323', monospace;",
		cdn: 'https://fonts.googleapis.com/css2?family=VT323&display=swap'
	},
	IndieFlower: {
		style: "font-family: 'Indie Flower', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap'
	},
	ChakraPetch: {
		style: "font-family: 'Chakra Petch', sans-serif;",
		cdn: 'https://fonts.googleapis.com/css2?family=Chakra+Petch&display=swap'
	},
	CedarvilleCursive: {
		style: "font-family: 'Cedarville Cursive', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap'
	},
	TwinkleStar: {
		style: "font-family: 'Twinkle Star', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Twinkle+Star&display=swap'
	},
	SpecialElite: {
		style: "font-family: 'Special Elite', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap'
	},
	Mansalva: {
		style: "font-family: 'Mansalva', cursive; font-size: 1.8em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Mansalva&display=swap'
	},
	// Audiowide: {
	// 	style: "font-family: 'Audiowide', cursive;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Audiowide&display=swap'
	// },
	// Handjet: {
	// 	style: "font-family: 'Handjet', cursive; font-size: 1.8em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Handjet&display=swap'
	// },
	FingerPaint: {
		style: "font-family: 'Finger Paint', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Finger+Paint&display=swap'
	},
	BerkshireSwash: {
		style: "font-family: 'Berkshire Swash', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Berkshire+Swash&display=swap'
	},
	// Tourney: {
	// 	style: "font-family: 'Tourney', cursive;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Tourney&display=swap'
	// },
	LobsterTwo: {
		style: "font-family: 'Lobster Two', cursive; font-size: 1.7em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Lobster+Two&display=swap'
	},
	FrederickatheGreat: {
		style: "font-family: 'Fredericka the Great', cursive; font-size: 1.4em;", // Adjusted size
		cdn: 'https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap'
	},
	// Sacramento: {
	// 	style: "font-family: 'Sacramento', cursive; font-size: 2.5em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Sacramento&display=swap'
	// },
	ShadowsIntoLightTwo: {
		style: "font-family: 'Shadows Into Light Two', cursive;",
		cdn: 'https://fonts.googleapis.com/css2?family=Shadows+Into+Light+Two&display=swap'
	},
	Underdog: {
		style: "font-family: 'Underdog', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Underdog&display=swap'
	},
	Codystar: {
		style: "font-family: 'Codystar', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Codystar&display=swap'
	},
	LibreBaskerville: {
		style: "font-family: 'Libre Baskerville', serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap'
	},
	JosefinSans: {
		style: "font-family: 'Josefin Sans', sans-serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Josefin+Sans&display=swap'
	},
	// AbrilFatface: {
	// 	style: "font-family: 'Abril Fatface', cursive; font-size: 1.6em;", // Adjusted size
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap'
	// },
	// BigShouldersStencil: {
	// 	style: "font-family: 'Big Shoulders Stencil', cursive; font-size: 1.5em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil&display=swap'
	// },
	Orbitron: {
		style: "font-family: 'Orbitron', sans-serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Orbitron&display=swap'
	},
	Righteous: {
		style: "font-family: 'Righteous', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap'
	},
	// AmaticSC: {
	// 	style: "font-family: 'Amatic SC', cursive; font-size: 1.8em;", // Adjusted size
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Amatic+SC&display=swap'
	// },
	// RubikMonoOne: {
	// 	style: "font-family: 'Rubik Mono One', monospace; font-size: 1.2em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Rubik+Mono+One&display=swap'
	// },
	// YanoneKaffeesatz: {
	// 	style: "font-family: 'Yanone Kaffeesatz', sans-serif; font-size: 1.7em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Yanone+Kaffeesatz&display=swap'
	// },
	Prata: {
		style: "font-family: 'Prata', serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Prata&display=swap'
	},
	Cantarell: {
		style: "font-family: 'Cantarell', sans-serif; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Cantarell&display=swap'
	},
	AdventPro: {
		style: "font-family: 'Advent Pro', sans-serif; font-size: 1.4em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Advent+Pro&display=swap'
	},
	// Monoton: {
	// 	style: "font-family: 'Monoton', cursive; font-size: 1.6em;", // Adjusted size
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Monoton&display=swap'
	// },
	Creepster: {
		style: "font-family: 'Creepster', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Creepster&display=swap'
	},
	// RubikBubbles: {
	// 	style: "font-family: 'Rubik Bubbles', cursive; font-size: 1.2em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Rubik+Bubbles&display=swap'
	// },
	// Ultra: {
	// 	style: "font-family: 'Ultra', serif; font-size: 1.2em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Ultra&display=swap'
	// },
	// Fascinate: {
	// 	style: "font-family: 'Fascinate', cursive; font-size: 1.2em;",
	// 	cdn: 'https://fonts.googleapis.com/css2?family=Fascinate&display=swap'
	// },
	Metamorphous: {
		style: "font-family: 'Metamorphous', cursive; font-size: 1.2em;",
		cdn: 'https://fonts.googleapis.com/css2?family=Metamorphous&display=swap'
	}
};
