#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { palettes } from "./themes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themePath = path.join(__dirname, "../src/main/resources/themes");
const editorPath = path.join(__dirname, "editor.xml");
const uiPath = path.join(__dirname, "ui.theme.json");

const islandsLayout = {
  // JetBrains theme values are 2x the apparent radius in the UI.
  // 24 here renders as roughly a 12 px island/window radius.
  arc: 8,
  compactArc: 4,
  borderWidth: 5,
  compactBorderWidth: 4,
  inactiveAlpha: 0.44,
};

const islandsColors = {
  tableStripeColor: "toolbarBackground",
};

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  return normalized.match(/\w\w/g).map((x) => Number.parseInt(x, 16));
};

const rgbToHex = ([r, g, b]) =>
  `#${[r, g, b]
    .map((x) => Math.round(x).toString(16).padStart(2, "0"))
    .join("")}`;

const mixColor = (color1, color2, amount) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  return rgbToHex(rgb1.map((value, index) => value * amount + rgb2[index] * (1 - amount)));
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const tokenize = (expression) => {
  const tokens = [];
  let token = "";
  let depth = 0;

  for (const char of expression.trim()) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;

    if (/\s/.test(char) && depth === 0) {
      if (token) tokens.push(token);
      token = "";
      continue;
    }

    token += char;
  }

  if (token) tokens.push(token);
  return tokens;
};

const renderTemplate = (template, context) => {
  let output = template;

  output = output.replace(/{{#if\s+([a-zA-Z0-9_]+)}}([\s\S]*?){{\/if}}/g, (_, key, body) =>
    context[key] ? body : "",
  );

  return output.replace(/{{\s*([^{}]+?)\s*}}/g, (_, expression) =>
    String(evaluateExpression(expression, context)),
  );
};

const evaluateExpression = (expression, context) => {
  const trimmed = expression.trim();
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return evaluateExpression(trimmed.slice(1, -1), context);
  }

  const tokens = tokenize(trimmed);
  const [name, ...args] = tokens;

  if (name === "isLatte") {
    const [lightCol, darkCol] = args.map((arg) => evaluateArgument(arg, context));
    return context.isLatte ? lightCol : darkCol;
  }

  if (name === "opacity") {
    const [color, opacity] = args.map((arg) => evaluateArgument(arg, context));
    return mixColor(color, context.base, Number(opacity)).replace("#", "");
  }

  if (name === "opacityWithHex") {
    const [color, opacity] = args.map((arg) => evaluateArgument(arg, context));
    return mixColor(color, context.base, Number(opacity));
  }

  if (name === "mix") {
    const [color1, color2, amount] = args.map((arg) => evaluateArgument(arg, context));
    return mixColor(color1, color2, Number(amount)).replace("#", "");
  }

  return evaluateArgument(trimmed, context);
};

const evaluateArgument = (arg, context) => {
  const trimmed = arg.trim();
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return evaluateExpression(trimmed.slice(1, -1), context);
  }

  if (Object.hasOwn(context, trimmed)) {
    return context[trimmed];
  }

  if (/^\d*\.\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
};

const makePaletteValues = (palette, transform) =>
  Object.fromEntries(Object.entries(palette).map(([key, value]) => [key, transform(value)]));

const makeUiOptions = (key, palette) => {
  const hexValues = makePaletteValues(palette, (value) => value.toUpperCase());
  const isDark = true;

  return {
    name: capitalize(key),
    editorScheme: `/themes/${key}.xml`,
    isDark,
    isLatte: !isDark,
    accentColor: hexValues.mauve,
    secondaryAccentColor: hexValues.yellow,
    primaryForeground: hexValues.text,
    primaryBackground: hexValues.base,
    secondaryBackground: hexValues.surface0,
    panelBackground: hexValues.mantle,
    hoverBackground: hexValues.surface0,
    selectionBackground: hexValues.surface0,
    selectionInactiveBackground: hexValues.base,
    borderColor: hexValues.base,
    separatorColor: hexValues.surface0,
    ...hexValues,
  };
};

const makeEditorOptions = (key, palette, italics) => {
  const hexValues = makePaletteValues(palette, (value) =>
    value.replace("#", "").toLowerCase(),
  );
  const isLight = false;

  return {
    name: `${capitalize(key)}${!italics ? " (no italics)" : ""}`,
    italics,
    isLatte: isLight,
    parent_scheme: isLight ? "Default" : "Darcula",
    ...hexValues,
  };
};

const addIslandsOverrides = (theme, colors) => {
  theme.name = "Islands Asteria";
  theme.editorScheme = "/themes/asteria.xml";
  theme.parentTheme = "Islands Dark";

  theme.colors.panelBackground = colors.base;
  theme.colors.toolbarBackground = colors.crust;
  theme.colors.tabBackground = mixColor(colors.mauve, colors.base, 0.2);
  theme.colors.transparentToolbarBackground = `${colors.crust}00`;

  theme.ui.Islands = 1;

  theme.ui.Island = {
    arc: islandsLayout.arc,
    "arc.compact": islandsLayout.compactArc,
    borderWidth: islandsLayout.borderWidth,
    "borderWidth.compact": islandsLayout.compactBorderWidth,
    borderColor: "panelBackground",
    inactiveAlpha: islandsLayout.inactiveAlpha,
  };

  theme.ui.EditorTabs = {
    ...theme.ui.EditorTabs,
    hoverBackground: "selectionBackground",
    underlinedTabBackground: "tabBackground",
    inactiveUnderlinedTabBackground: "tabBackground",
    underlinedBorderColor: "accentColor",
  };

  theme.ui.MainToolbar = {
    ...theme.ui.MainToolbar,
    borderColor: "transparentToolbarBackground",
    background: "toolbarBackground",
  };

  theme.ui.MainWindow = {
    background: "toolbarBackground",
    Tab: {
      background: "toolbarBackground",
      borderColor: "toolbarBackground",
      selectedBackground: "panelBackground",
      selectedForeground: "primaryForeground",
      hoverBackground: "hoverBackground",
      selectedInactiveBackground: "primaryBackground",
      separatorColor: "separatorColor",
    },
  };

  theme.ui.StatusBar = {
    ...theme.ui.StatusBar,
    borderColor: "transparentToolbarBackground",
    background: "toolbarBackground",
  };

  theme.ui.Table = {
    ...theme.ui.Table,
    // stripeColor: islandsColors.tableStripeColor,
    stripeColor: colors.mantle,
  };

  theme.ui.ToolWindow = {
    ...theme.ui.ToolWindow,
    Header: {
      ...theme.ui.ToolWindow.Header,
      background: "panelBackground",
      borderColor: "panelBackground",
      inactiveBackground: "panelBackground",
    },
    background: "panelBackground",
    Stripe: {
      borderColor: "transparentToolbarBackground",
      background: "toolbarBackground",
    },
  };
};

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

fs.mkdirSync(themePath, { recursive: true });

const uiTemplate = fs.readFileSync(uiPath, "utf8");
const editorTemplate = fs.readFileSync(editorPath, "utf8");

for (const [key, palette] of Object.entries(palettes)) {
  const uiOptions = makeUiOptions(key, palette);
  const renderedUi = renderTemplate(uiTemplate, uiOptions);
  const parsedUi = JSON.parse(renderedUi);
  parsedUi.dark = parsedUi.dark === "true";

  writeJson(path.join(themePath, `${key}.json`), makePaletteValues(palette, (value) => ({
    hex: value,
    rgb: `rgb(${hexToRgb(value).join(", ")})`,
    raw: hexToRgb(value).join(", "),
  })));
  writeJson(path.join(themePath, `${key}.theme.json`), parsedUi);

  const islandsUi = JSON.parse(JSON.stringify(parsedUi));
  addIslandsOverrides(islandsUi, makePaletteValues(palette, (value) => value.toUpperCase()));
  writeJson(path.join(themePath, `${key}-islands.theme.json`), islandsUi);

  for (const italics of [true, false]) {
    const editorOptions = makeEditorOptions(key, palette, italics);
    const output = renderTemplate(editorTemplate, editorOptions);
    const suffix = italics ? "" : "-no-italics";
    fs.writeFileSync(path.join(themePath, `${key}${suffix}.xml`), output);
  }
}
