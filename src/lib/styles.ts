export const stylesGallery = [
    {
        id: 1,
        name: 'Style 1',
        cssTemplate: `
            .{selector} {
                --s: 80px;
                --c1: #f8ca00;
                --c2: #8a9b0f;
                --c3: #c02942;
                --c4: #53777a;
                --c5: #c5bc8e;

                background:
                    radial-gradient(#0000 64%, var(--c5) 65%) 0 0/var(--s) var(--s),
                    var(--_g) 0 0 var(--_s),
                    var(--_g) var(--s) var(--s) var(--_s),
                    repeating-conic-gradient(#0000 0 25%, var(--c2) 0 50%) 0 0 var(--_s),
                    linear-gradient(var(--c3) 50%, var(--c4) 0) 0 0/1% var(--s);
            }
        `
    },
    {
        id: 2,
        name: 'Multicolor Circles Pattern',
        cssTemplate: `
            .{selector} {
                --s: 100px;
                --c1: #e63946;
                --c2: #f1faee;
                --c3: #a8dadc;
                --c4: #457b9d;
                --c5: #1d3557;

                background:
                    radial-gradient(var(--c1) 25%, var(--c2) 60%) 0 0/var(--s) var(--s),
                    conic-gradient(var(--c3), var(--c4), var(--c5)) 0 0/100% 100%;
            }
        `
    }
];