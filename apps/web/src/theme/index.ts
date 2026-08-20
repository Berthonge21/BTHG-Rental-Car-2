import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  semanticTokens: {
    colors: {
      'text.primary': {
        default: '#1a202c',
        _dark: '#E2E8F0',
      },
      'text.secondary': {
        default: '#4a5568',
        _dark: '#A0AEC0',
      },
      'text.muted': {
        default: '#718096',
        _dark: '#718096',
      },
    },
  },
  colors: {
    // Primary Gold - for buttons and accents
    brand: {
      50: '#fdf8e8',
      100: '#f9ecc5',
      200: '#f3d98a',
      300: '#dfc04f',
      400: '#C9A227', // Primary gold
      500: '#b8931f',
      600: '#9a7a1a',
      700: '#7c6215',
      800: '#5e4a10',
      900: '#40320b',
    },
    // Teal - for active states and success
    accent: {
      50: '#e6f9f8',
      100: '#c0f0ed',
      200: '#8be5df',
      300: '#55d9d1',
      400: '#1BC5BD', // Active teal
      500: '#18b0a9',
      600: '#148f89',
      700: '#106e69',
      800: '#0c4d49',
      900: '#082c29',
    },
    // Navy - for sidebar and dark elements
    navy: {
      50: '#e8ecef',
      100: '#c5cdd4',
      200: '#9eabb7',
      300: '#77899a',
      400: '#506785',
      500: '#2a4570',
      600: '#1e3554',
      700: '#142538',
      800: '#0B1C2D', // Sidebar navy
      900: '#060e17',
    },
    // Surface colors
    surface: {
      light: '#F9FAFB', // Main background
      dark: '#0f172a',
      card: '#FFFFFF',
    },
  },
  fonts: {
    heading: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'navy.800' : 'surface.light',
        color: props.colorMode === 'dark' ? 'white' : 'text.primary',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
      },
      variants: {
        solid: (props: { colorScheme: string }) => ({
          bg: props.colorScheme === 'brand' ? 'brand.400' : undefined,
          color: props.colorScheme === 'brand' ? 'white' : undefined,
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
        accent: {
          bg: 'accent.400',
          color: 'white',
          _hover: {
            bg: 'accent.500',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
        },
        ghost: {
          _hover: {
            bg: 'gray.100',
          },
        },
        outline: {
          borderColor: 'brand.400',
          color: 'brand.400',
          _hover: {
            bg: 'brand.50',
          },
        },
      },
    },
    Card: {
      baseStyle: (props: { colorMode: string }) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'navy.700' : 'white',
          borderRadius: 'xl',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'navy.600' : 'gray.100',
        },
      }),
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      },
      variants: {
        filled: {
          field: {
            borderRadius: 'lg',
            bg: 'gray.50',
            _hover: { bg: 'gray.100' },
            _focus: {
              bg: 'white',
              borderColor: 'brand.400',
            },
          },
        },
        outline: {
          field: {
            borderRadius: 'lg',
            _focus: {
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
            },
          },
        },
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
        px: 2,
        py: 0.5,
        fontWeight: '600',
        fontSize: 'xs',
      },
    },
    Menu: {
      baseStyle: {
        list: {
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'gray.100',
          boxShadow: 'lg',
          p: 1,
        },
        item: {
          borderRadius: 'md',
          fontSize: 'sm',
          _hover: {
            bg: 'gray.50',
          },
        },
      },
    },
    Table: {
      variants: {
        modern: {
          table: {
            borderCollapse: 'separate',
            borderSpacing: '0 4px',
          },
          th: {
            border: 'none',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'text.muted',
            fontSize: 'xs',
            py: 3,
            px: 4,
          },
          td: {
            border: 'none',
            py: 4,
            px: 4,
            _first: {
              borderLeftRadius: 'lg',
            },
            _last: {
              borderRightRadius: 'lg',
            },
          },
          tr: {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    Tabs: {
      variants: {
        soft: {
          tab: {
            borderRadius: 'lg',
            fontWeight: '500',
            color: 'text.muted',
            _selected: {
              color: 'white',
              bg: 'brand.400',
            },
          },
        },
      },
    },
  },
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    cardHover: '0 4px 12px rgba(0, 0, 0, 0.1)',
    soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
});
