const asteria = {
    "rosewater": "#f5e0dc",
    "flamingo": "#f2cdcd",
    "pink": "#f5c2e7",
    "mauve": "#cba6f7",
    "red": "#f38ba8",
    "maroon": "#eba0ac",
    "peach": "#fab387",
    "yellow": "#f9e2af",
    "green": "#a6e3a1",
    "teal": "#94e2d5",
    "sky": "#89dceb",
    "sapphire": "#74c7ec",
    "blue": "#89b4fa",
    "lavender": "#b4befe",
    "text": "#ddd7ff",
    "subtext1": "#c4bce4",
    "subtext0": "#ada2c9",
    "overlay2": "#9589af",
    "overlay1": "#7f7096",
    "overlay0": "#69597e",
    "surface2": "#544267",
    "surface1": "#3f2c50",
    "surface0": "#2c173b",
    "base": "#16021f",
    "mantle": "#0c001b",
    "crust": "#0d0012"
}

const hexToRgb = (hex: string) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return [r, g, b];
}

const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta == 0)
        h = 0;
    else if (cmax == r)
        h = ((g - b) / delta) % 6;
    else if (cmax == g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `hsl(${h}, ${Math.round(s)}%, ${Math.round(l)}%)`;

}

const hexToHsl = (hex: string) => {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHsl(r, g, b);

}

const convertToVariant = (theme: Record<string, string>) => Object.entries(theme).reduce((o, [key, value]) => {
    return {
        ...o,
        [key]: {
            hex: value,
            rgb: `rgb(${hexToRgb(value).join(", ")})`,
            hsl: hexToHsl(value),
            raw: hexToRgb(value).join(", "),
        },
    };
}, {})


export const variants = {
    asteria: convertToVariant(asteria)
}
