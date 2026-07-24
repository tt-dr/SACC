import type { ChangeEvent, CSSProperties } from 'react'

export type PenDimension = number | string

export interface PenGradientStop {
  color: string
  position?: number
}

export interface PenGradientFill {
  type: 'gradient'
  gradientType?: 'linear' | 'radial' | string
  enabled?: boolean
  rotation?: number
  size?: {
    height?: number
    width?: number
  }
  colors?: PenGradientStop[]
}

export interface PenImageFill {
  type: 'image'
  enabled?: boolean
  mode?: string
  url?: string
}

export interface PenShadowEffect {
  type: 'shadow'
  shadowType?: string
  enabled?: boolean
  color?: string
  offset?: {
    x?: number
    y?: number
  }
  blur?: number
}

export interface PenStroke {
  align?: string
  thickness?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  fill?: string
  [key: string]: unknown
}

export type PenFill = string | PenGradientFill | PenImageFill | Record<string, unknown>
export type PenEffect = PenShadowEffect | Record<string, unknown>

export interface PenNode {
  id?: string
  type?: string
  name?: string
  children?: PenNode[]
  fill?: PenFill | PenFill[]
  stroke?: PenStroke
  effect?: PenEffect | PenEffect[]
  padding?: number | number[]
  cornerRadius?: number | number[]
  width?: PenDimension
  height?: PenDimension
  gap?: number
  x?: number
  y?: number
  layout?: string
  justifyContent?: string
  alignItems?: string
  alignSelf?: string
  opacity?: number
  clip?: boolean
  rotation?: number
  flipY?: boolean
  textAlign?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number | string
  lineHeight?: number
  content?: string
  visible?: boolean
  iconFontFamily?: string
  iconFontName?: string
  weight?: number
  [key: string]: unknown
}

export interface PenDocument extends PenNode {
  children?: PenNode[]
}

export interface PenLayoutContext {
  layoutMode: 'none' | 'absolute' | 'flex'
  flexDirection?: CSSProperties['flexDirection']
  centerAbsoluteChildren?: boolean
}

export interface PenButtonControl {
  ariaLabel?: string
  ariaPressed?: boolean
  disabled?: boolean
  onClick?: () => void
}

export interface PenInputControl {
  ariaLabel?: string
  placeholder?: string
  value?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

export interface PenInteractionControls {
  buttonControls: Record<string, PenButtonControl>
  hiddenNodeIds: Set<string>
  inputControls: Record<string, PenInputControl>
}

export interface PenPageViewResult {
  interactionControls: PenInteractionControls
  meta: Record<string, unknown>
  pageNode: PenNode | null | undefined
}

export type PenPageNormalizer = (page: PenNode | null | undefined, pathname: string) => PenNode | null | undefined
