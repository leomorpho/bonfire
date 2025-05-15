import { fontFamily } from 'tailwindcss/defaultTheme';
import type { Config } from 'tailwindcss';

const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	plugins: [
		require('@tailwindcss/typography'),
		require('tailwindcss-animate'),
		require('daisyui'),
		plugin(function ({ addUtilities }) {
			addUtilities({
				'.ring-glow': {
					'@apply ring-2 ring-white ring-opacity-10 hover:ring-opacity-20': {}
				}
			});
		})
	],
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/layerchart/**/*.{svelte,js}'],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			// typography: (theme) => ({
			// 	DEFAULT: {
			// 		css: {
			// 			'--tw-prose-body': theme('colors.black'),
			// 			'--tw-prose-headings': 'var(--color-pink-900)',
			// 			'--tw-prose-invert-body': theme('colors.white')

			// 		}
			// 	}
			// }),
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				'color-1': 'hsl(var(--color-1))',
				'color-2': 'hsl(var(--color-2))',
				'color-3': 'hsl(var(--color-3))',
				'color-4': 'hsl(var(--color-4))',
				'color-5': 'hsl(var(--color-5))',
				surface: {
					content: 'hsl(var(--card-foreground) / <alpha-value>)',
					100: 'hsl(var(--background) / <alpha-value>)',
					200: 'hsl(var(--muted) / <alpha-value>)',
					// not sure what color maps here (should be darker than 200).  Could add a new color to `app.css`
					300: 'hsl(var(--background) / <alpha-value>)'
				},
				bonfireGreen: {
					100: 'rgb(200, 220, 205)',
					200: 'rgb(170, 200, 180)',
					300: 'rgb(140, 180, 155)',
					400: 'rgb(110, 160, 130)',
					500: 'rgb(38, 93, 67)', // Your original color
					600: 'rgb(30, 80, 55)',
					700: 'rgb(25, 65, 45)',
					800: 'rgb(20, 50, 35)',
					900: 'rgb(15, 35, 25)'
				},
				bonfirePurple: {
					100: 'rgb(210, 205, 220)',
					200: 'rgb(190, 185, 200)',
					300: 'rgb(170, 165, 180)',
					400: 'rgb(150, 145, 160)',
					500: 'rgb(127, 115, 177)', // Your original color
					600: 'rgb(100, 90, 150)',
					700: 'rgb(80, 70, 120)',
					800: 'rgb(60, 50, 90)',
					900: 'rgb(40, 30, 60)'
				},
				bonfireYellow: {
					100: 'rgb(250, 230, 180)',
					200: 'rgb(245, 215, 160)',
					300: 'rgb(240, 200, 140)',
					400: 'rgb(235, 185, 120)',
					500: 'rgb(242, 183, 71)', // Your original color
					600: 'rgb(200, 150, 50)',
					700: 'rgb(160, 120, 30)',
					800: 'rgb(120, 90, 10)',
					900: 'rgb(80, 60, 0)'
				},
				bonfireOrange: {
					100: 'rgb(245, 210, 190)',
					200: 'rgb(240, 195, 170)',
					300: 'rgb(235, 180, 150)',
					400: 'rgb(230, 165, 130)',
					500: 'rgb(230, 139, 76)', // Your original color
					600: 'rgb(200, 110, 50)',
					700: 'rgb(170, 80, 30)',
					800: 'rgb(140, 50, 10)',
					900: 'rgb(110, 20, 0)'
				},
				bonfireRed: {
					100: 'rgb(230, 180, 170)',
					200: 'rgb(220, 160, 150)',
					300: 'rgb(210, 140, 130)',
					400: 'rgb(200, 120, 110)',
					500: 'rgb(202, 85, 66)', // Your original color
					600: 'rgb(170, 60, 40)',
					700: 'rgb(140, 40, 20)',
					800: 'rgb(110, 20, 0)',
					900: 'rgb(80, 0, 0)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: [...fontFamily.sans]
			},
			animation: {
				orbit: 'orbit calc(var(--duration)*1s) linear infinite',
				'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
				shimmer: 'shimmer 8s infinite'
			},
			keyframes: {
				'aurora-border': {
					'0%, 100%': { borderRadius: '37% 29% 27% 27% / 28% 25% 41% 37%' },
					'25%': { borderRadius: '47% 29% 39% 49% / 61% 19% 66% 26%' },
					'50%': { borderRadius: '57% 23% 47% 72% / 63% 17% 66% 33%' },
					'75%': { borderRadius: '28% 49% 29% 100% / 93% 20% 64% 25%' }
				},
				'aurora-1': {
					'0%, 100%': { top: '0', right: '0' },
					'50%': { top: '50%', right: '25%' },
					'75%': { top: '25%', right: '50%' }
				},
				'aurora-2': {
					'0%, 100%': { top: '0', left: '0' },
					'60%': { top: '75%', left: '25%' },
					'85%': { top: '50%', left: '50%' }
				},
				'aurora-3': {
					'0%, 100%': { bottom: '0', left: '0' },
					'40%': { bottom: '50%', left: '25%' },
					'65%': { bottom: '25%', left: '50%' }
				},
				'aurora-4': {
					'0%, 100%': { bottom: '0', right: '0' },
					'50%': { bottom: '25%', right: '40%' },
					'90%': { bottom: '50%', right: '25%' }
				},
				orbit: {
					'0%': {
						transform: 'rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)'
					}
				},
				'border-beam': {
					'100%': {
						'offset-distance': '100%'
					}
				},
				'shine-pulse': {
					'0%': {
						'background-position': '0% 0%'
					},
					'50%': {
						'background-position': '100% 100%'
					},
					to: {
						'background-position': '0% 0%'
					}
				},
				shimmer: {
					'0%, 90%, 100%': {
						'background-position': 'calc(-100% - var(--shimmer-width)) 0'
					},
					'30%, 60%': {
						'background-position': 'calc(100% + var(--shimmer-width)) 0'
					}
				}
			}
		}
	}
} as Config;

export default config;
