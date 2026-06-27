import { designTokens } from './tokens'

export const themes = {
  light: {
    name: 'cmc-conservatoire-light',
    attribute: 'light'
  },
  dark: {
    name: 'cmc-conservatoire-dark',
    attribute: 'dark'
  }
}

export const defaultTheme = {
  ...themes.light,
  tokens: designTokens
}

export const getThemeAttribute = themeName => themes[themeName]?.attribute || defaultTheme.attribute
