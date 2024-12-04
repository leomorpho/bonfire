import { writable } from 'svelte/store';

// Create a writable store for the style
export const styleStore = writable<string>('');

export const stylesGallery = [
    {
        id: 1,
        name: 'Style 1',
        cssTemplate: `
        --s: 40px; /* control the size*/
        --c1: #73c8a9;
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
    }
];