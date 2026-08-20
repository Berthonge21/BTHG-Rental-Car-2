'use client';

import { forwardRef } from 'react';
import { Button, Box, useColorModeValue } from '@chakra-ui/react';
import type { ButtonProps } from '@chakra-ui/react';

/**
 * A button that replaces the default Chakra circular loading spinner
 * with a thin, animated progress bar at the bottom edge.
 *
 * When `isLoading` is true the button:
 * - Still renders its children text (no spinner replacement)
 * - Disables pointer events
 * - Reduces opacity to 0.85
 * - Shows a 3 px tall sliding progress bar inside its bottom edge
 */
export const ProgressButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function ProgressButton(props, ref) {
    const { isLoading, children, colorScheme = 'brand', ...rest } = props;

    // Derive progress bar color from colorScheme
    const progressBarColor = useColorModeValue(
      `${colorScheme}.400`,
      `${colorScheme}.300`
    );

    return (
      <>
        {/* Inject the keyframe animation once */}
        <style>{`
          @keyframes progressButtonSlide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
        <Button
          ref={ref}
          colorScheme={colorScheme}
          isDisabled={isLoading || props.isDisabled}
          opacity={isLoading ? 0.85 : 1}
          position="relative"
          overflow="hidden"
          transition="opacity 0.2s"
          {...rest}
          /* Override isLoading so Chakra does NOT inject its own spinner */
          isLoading={false}
        >
          {children}

          {/* Progress bar — only rendered while loading */}
          {isLoading && (
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              h="3px"
              overflow="hidden"
              borderBottomRadius={rest.borderRadius as string | undefined}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                w="50%"
                h="100%"
                bg={progressBarColor}
                borderRadius="full"
                style={{
                  animation: 'progressButtonSlide 1.4s ease-in-out infinite',
                }}
              />
            </Box>
          )}
        </Button>
      </>
    );
  }
);
