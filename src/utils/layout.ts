import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 768;
  const maxContentWidth = isTablet ? 680 : undefined;
  const scannerSize = isTablet
    ? Math.min(Math.min(width, height) * 0.58, 520)
    : width * 0.72;

  return { isTablet, maxContentWidth, scannerSize, width, height };
}
