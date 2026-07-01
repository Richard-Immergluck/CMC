export const colors = {
  background: 'var(--cmc-color-background)',
  surface: 'var(--cmc-color-surface)',
  surfaceMuted: 'var(--cmc-color-surface-muted)',
  border: 'var(--cmc-color-border)',
  text: 'var(--cmc-color-text)',
  textMuted: 'var(--cmc-color-text-muted)',
  accent: 'var(--cmc-color-accent)',
  accentStrong: 'var(--cmc-color-accent-strong)',
  accentContrast: 'var(--cmc-color-accent-contrast)',
  success: 'var(--cmc-color-success)',
  warning: 'var(--cmc-color-warning)',
  danger: 'var(--cmc-color-danger)'
}

export const semanticColors = {
  pageBackground: 'var(--cmc-theme-page-background)',
  heading: 'var(--cmc-theme-heading)',
  tableHeaderBackground: 'var(--cmc-theme-table-header-background)',
  tableHeaderBorder: 'var(--cmc-theme-table-header-border)',
  tableHeaderText: 'var(--cmc-theme-table-header-text)',
  tableBorder: 'var(--cmc-theme-table-border)',
  sectionBackground: 'var(--cmc-theme-section-background)'
}

export const spacing = {
  1: 'var(--cmc-space-1)',
  2: 'var(--cmc-space-2)',
  3: 'var(--cmc-space-3)',
  4: 'var(--cmc-space-4)',
  5: 'var(--cmc-space-5)',
  6: 'var(--cmc-space-6)'
}

export const radii = {
  sm: 'var(--cmc-radius-sm)',
  md: 'var(--cmc-radius-md)'
}

export const shadows = {
  sm: 'var(--cmc-shadow-sm)',
  md: 'var(--cmc-shadow-md)',
  focus: 'var(--cmc-focus-ring)'
}

export const componentTokens = {
  control: {
    heightSm: 'var(--cmc-component-control-height-sm)',
    heightMd: 'var(--cmc-component-control-height-md)',
    heightLg: 'var(--cmc-component-control-height-lg)',
    radius: 'var(--cmc-component-control-radius)',
    border: 'var(--cmc-component-control-border)',
    background: 'var(--cmc-component-control-background)',
    text: 'var(--cmc-component-control-text)',
    placeholder: 'var(--cmc-component-control-placeholder)'
  },
  button: {
    primaryBackground: 'var(--cmc-component-button-primary-background)',
    primaryBorder: 'var(--cmc-component-button-primary-border)',
    primaryText: 'var(--cmc-component-button-primary-text)',
    primaryHoverBackground: 'var(--cmc-component-button-primary-hover-background)',
    secondaryBackground: 'var(--cmc-component-button-secondary-background)',
    secondaryBorder: 'var(--cmc-component-button-secondary-border)',
    secondaryText: 'var(--cmc-component-button-secondary-text)',
    dangerBackground: 'var(--cmc-component-button-danger-background)',
    dangerBorder: 'var(--cmc-component-button-danger-border)',
    dangerText: 'var(--cmc-component-button-danger-text)'
  },
  panel: {
    background: 'var(--cmc-component-panel-background)',
    border: 'var(--cmc-component-panel-border)',
    shadow: 'var(--cmc-component-panel-shadow)',
    accentBorder: 'var(--cmc-component-panel-accent-border)'
  },
  table: {
    rowBackground: 'var(--cmc-component-table-row-background)',
    rowHoverBackground: 'var(--cmc-component-table-row-hover-background)',
    rowBorder: 'var(--cmc-component-table-row-border)'
  }
}

export const typography = {
  familyBase: 'var(--cmc-font-family-base)',
  body: 'var(--cmc-font-size-body)',
  small: 'var(--cmc-font-size-small)',
  heading: 'var(--cmc-font-size-heading)',
  lineHeightBody: 'var(--cmc-line-height-body)',
  lineHeightHeading: 'var(--cmc-line-height-heading)'
}

export const designTokens = {
  colors,
  semanticColors,
  spacing,
  radii,
  shadows,
  componentTokens,
  typography
}
