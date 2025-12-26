/**
 * CSS Property Constants for StyleHydrator
 * 
 * Mapping from CSS properties to compact shorthand notation
 * for data-truth attributes.
 */

import type { TruthShorthandMap } from '@/types/styles';

/**
 * CSS property to shorthand mapping
 * Used by StyleHydrator to generate compact data-truth strings
 */
export const TRUTH_PROPERTIES: TruthShorthandMap = {
    // Layout
    display: 'display',
    flexDirection: 'flexDir',
    justifyContent: 'justify',
    alignItems: 'align',
    alignContent: 'alignC',
    flexWrap: 'wrap',
    gap: 'gap',
    rowGap: 'rowGap',
    columnGap: 'colGap',
    position: 'pos',
    gridTemplateColumns: 'gridCols',
    gridTemplateRows: 'gridRows',
    gridColumn: 'col',
    gridRow: 'row',

    // Box Model
    width: 'w',
    height: 'h',
    minWidth: 'minW',
    maxWidth: 'maxW',
    minHeight: 'minH',
    maxHeight: 'maxH',
    padding: 'pad',
    paddingTop: 'pt',
    paddingRight: 'pr',
    paddingBottom: 'pb',
    paddingLeft: 'pl',
    margin: 'margin',
    marginTop: 'mt',
    marginRight: 'mr',
    marginBottom: 'mb',
    marginLeft: 'ml',

    // Decoration
    background: 'bg',
    backgroundColor: 'bgColor',
    backgroundImage: 'bgImg',
    backgroundSize: 'bgSize',
    backgroundPosition: 'bgPos',
    borderRadius: 'radius',
    borderTopLeftRadius: 'radiusTL',
    borderTopRightRadius: 'radiusTR',
    borderBottomRightRadius: 'radiusBR',
    borderBottomLeftRadius: 'radiusBL',
    boxShadow: 'shadow',
    opacity: 'opacity',
    cursor: 'cursor',
    overflow: 'overflow',
    overflowX: 'overflowX',
    overflowY: 'overflowY',
    border: 'border',
    borderWidth: 'borderW',
    borderColor: 'borderC',
    borderStyle: 'borderS',

    // Typography
    fontFamily: 'font',
    fontSize: 'size',
    fontWeight: 'weight',
    lineHeight: 'lh',
    letterSpacing: 'tracking',
    textAlign: 'textAlign',
    textDecoration: 'decoration',
    textTransform: 'transform',
    color: 'color',
    whiteSpace: 'ws',
    wordBreak: 'wordBreak',

    // Transform & Effects
    transform: 'tf',
    transformOrigin: 'tfOrigin',
    transition: 'transition',
    filter: 'filter',
    backdropFilter: 'backdrop',

    // Position
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    zIndex: 'z',
};

/**
 * Default browser values to filter out
 * These values don't provide useful design information
 */
export const DEFAULT_VALUES: Record<string, string[]> = {
    display: ['inline', 'block'],
    position: ['static'],
    opacity: ['1'],
    cursor: ['auto'],
    overflow: ['visible'],
    fontWeight: ['400', 'normal'],
    textAlign: ['start', 'left'],
    textDecoration: ['none'],
    transform: ['none'],
    lineHeight: ['normal'],
    letterSpacing: ['normal'],
    whiteSpace: ['normal'],
};

/**
 * Properties that should be normalized (e.g., colors)
 */
export const NORMALIZE_PROPERTIES = [
    'color',
    'backgroundColor',
    'borderColor',
    'boxShadow',
] as const;
