import type { CSSProperties } from 'react'

declare module '@mui/material/styles' {
  interface Palette {
    brand: Palette['primary']
  }
  interface PaletteOptions {
    brand?: PaletteOptions['primary']
  }
  interface TypographyVariants {
    hero: CSSProperties
  }
  interface TypographyVariantsOptions {
    hero?: CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    hero: true
  }
}
