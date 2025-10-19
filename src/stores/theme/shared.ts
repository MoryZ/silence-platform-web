import merge from 'lodash.merge';
import { generate } from '@ant-design/colors';
import { overrideThemeSettings, themeSettings } from '@/theme/setting';
import { themeVars } from '@/theme/vars';
import { toggleHtmlClass } from '@/utils/common';
import { ls } from '@/utils/stoarge';
import { DARK_CLASS } from '@/constants/app';

// ========== 类型兜底 ===========
type App = any;
const BUILD_TIME = '20240601';
// ========== 工具函数 ===========
function getPaletteColorByNumber(baseColor: string, index = 5) {
  const colors = generate(baseColor);
  return colors[index];
}
function addColorAlpha(color: string, alpha: number) {
  if (typeof color === 'string' && color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
function getColorPalette(baseColor: string, recommended = false) {
  // 返回 Map<number, string>，0-9
  const arr = generate(baseColor);
  const map = new Map<number, string>();
  arr.forEach((c, i) => map.set(i * 100 + 100, c));
  return map;
}
function getRgb(color: string) {
  // 仅支持 hex
  if (typeof color === 'string' && color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return { r, g, b };
  }
  return { r: 0, g: 0, b: 0 };
}

/** Init theme settings */
export function initThemeSettings() {
  const isProd = import.meta.env.PROD;

  // if it is development mode, the theme settings will not be cached, by update `themeSettings` in `src/theme/settings.ts` to update theme settings
  if (!isProd) return themeSettings;

  // if it is production mode, the theme settings will be cached in localStorage
  // if want to update theme settings when publish new version, please update `overrideThemeSettings` in `src/theme/settings.ts`

  const localSettings = ls.get('themeSettings');

  let settings = merge({}, themeSettings, localSettings);

  const isOverride = ls.get('overrideThemeFlag') === BUILD_TIME;

  if (!isOverride) {
    settings = merge({}, settings, overrideThemeSettings);

    ls.set('overrideThemeFlag', BUILD_TIME);
  }

  return settings;
}

/**
 * create theme token css vars value by theme settings
 *
 * @param colors Theme colors
 * @param tokens Theme setting tokens
 * @param [recommended=false] Use recommended color. Default is `false`
 */
export function createThemeToken(
  colors: any,
  tokens?: any,
  recommended = false
) {
  const paletteColors = createThemePaletteColors(colors, recommended);
  const { light, dark } = tokens || themeSettings.tokens;
  const themeTokens: any = {
    colors: {
      ...paletteColors,
      nprogress: paletteColors.primary,
      ...light.colors
    },
    boxShadow: {
      ...light.boxShadow
    }
  };
  const darkThemeTokens: any = {
    colors: {
      ...themeTokens.colors,
      ...dark?.colors
    },
    boxShadow: {
      ...themeTokens.boxShadow,
      ...dark?.boxShadow
    }
  };
  return {
    themeTokens,
    darkThemeTokens
  };
}

/**
 * Create theme palette colors
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
function createThemePaletteColors(colors: any, recommended = false) {
  const colorKeys = Object.keys(colors) as string[];
  const colorPaletteVar: any = {};
  colorKeys.forEach(key => {
    const colorMap = getColorPalette(colors[key], recommended);
    colorPaletteVar[key] = colorMap.get(500) || colors[key];
    colorMap.forEach((hex, number) => {
      colorPaletteVar[`${key}-${number}`] = hex;
    });
  });
  return colorPaletteVar;
}

/**
 * Get css var by tokens
 *
 * @param tokens Theme base tokens
 */
function getCssVarByTokens(tokens: any) {
  const styles: string[] = [];
  function removeVarPrefix(value: string) {
    return value.replace('var(', '').replace(')', '');
  }
  function removeRgbPrefix(value: string) {
    return value.replace('rgb(', '').replace(')', '');
  }
  for (const [key, tokenValues] of Object.entries(themeVars)) {
    for (const [tokenKey, tokenValue] of Object.entries(tokenValues as any)) {
      let cssVarsKey = removeVarPrefix(tokenValue as string);
      let cssValue = tokens[key][tokenKey];
      if (key === 'colors') {
        cssVarsKey = removeRgbPrefix(cssVarsKey);
        const { r, g, b } = getRgb(cssValue);
        cssValue = `${r} ${g} ${b}`;
      }
      styles.push(`${cssVarsKey}: ${cssValue}`);
    }
  }
  const styleStr = styles.join(';');
  return styleStr;
}

/**
 * Add theme vars to global
 *
 * @param tokens
 */
export function addThemeVarsToGlobal(tokens: any, darkTokens: any) {
  const cssVarStr = getCssVarByTokens(tokens);
  const darkCssVarStr = getCssVarByTokens(darkTokens);
  const css = `
    :root {
      ${cssVarStr}
    }
  `;
  const darkCss = `
    html.${DARK_CLASS} {
      ${darkCssVarStr}
    }
  `;
  const styleId = 'theme-vars';
  const style = document.querySelector(`#${styleId}`) || document.createElement('style');
  style.id = styleId;
  style.textContent = css + darkCss;
  document.head.appendChild(style);
}

/**
 * Toggle css dark mode
 *
 * @param darkMode Is dark mode
 */
export function toggleCssDarkMode(darkMode = false) {
  const { add, remove } = toggleHtmlClass(DARK_CLASS);

  if (darkMode) {
    add();
  } else {
    remove();
  }
}

/**
 * Toggle auxiliary color modes
 *
 * @param grayscaleMode
 * @param colourWeakness
 */
export function toggleAuxiliaryColorModes(grayscaleMode = false, colourWeakness = false) {
  const htmlElement = document.documentElement;
  htmlElement.style.filter = [grayscaleMode ? 'grayscale(100%)' : '', colourWeakness ? 'invert(80%)' : '']
    .filter(Boolean)
    .join(' ');
}

type NaiveColorScene = '' | 'Suppl' | 'Hover' | 'Pressed' | 'Active';
type NaiveColorKey = string;
type NaiveThemeColor = any;
interface NaiveColorAction {
  scene: NaiveColorScene;
  handler: (color: string) => string;
}

/**
 * Get naive theme colors
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
function getNaiveThemeColors(colors: any, recommended = false) {
  const colorActions: NaiveColorAction[] = [
    { scene: '', handler: color => color },
    { scene: 'Suppl', handler: color => color },
    { scene: 'Hover', handler: color => getPaletteColorByNumber(color, 5) },
    { scene: 'Pressed', handler: color => getPaletteColorByNumber(color, 7) },
    { scene: 'Active', handler: color => addColorAlpha(color, 0.1) }
  ];
  const themeColors: any = {};
  const colorEntries = Object.entries(colors) as [string, string][];
  colorEntries.forEach(color => {
    colorActions.forEach(action => {
      const [colorType, colorValue] = color;
      const colorKey: string = `${colorType}Color${action.scene}`;
      themeColors[colorKey] = action.handler(colorValue);
    });
  });
  return themeColors;
}

/**
 * Get naive theme
 *
 * @param colors Theme colors
 * @param [recommended=false] Use recommended color. Default is `false`
 */
export function getNaiveTheme(colors: any, recommended = false) {
  const { primary: colorLoading } = colors;
  const theme: any = {
    common: {
      ...getNaiveThemeColors(colors, recommended),
      borderRadius: '6px'
    },
    LoadingBar: {
      colorLoading
    },
    Tag: {
      borderRadius: '6px'
    }
  };
  return theme;
}

// 导出工具函数
export { getPaletteColorByNumber, addColorAlpha, getColorPalette };