"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const DESKTOP_BREAKPOINT = 1280;

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        width: 1920,
        height: 1080,
        orientation: 'landscape',
      };
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isDesktop: width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT,
      isLargeDesktop: width >= DESKTOP_BREAKPOINT,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDeviceInfo({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT,
        isLargeDesktop: width >= DESKTOP_BREAKPOINT,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait',
      });
    };

    // Use ResizeObserver for better performance if available
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateDeviceInfo);
      resizeObserver.observe(document.documentElement);
      
      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // Fallback to window resize event
      window.addEventListener('resize', updateDeviceInfo);
      window.addEventListener('orientationchange', updateDeviceInfo);
      
      return () => {
        window.removeEventListener('resize', updateDeviceInfo);
        window.removeEventListener('orientationchange', updateDeviceInfo);
      };
    }
  }, []);

  return deviceInfo;
}

// Hook for responsive breakpoints
export function useBreakpoint() {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useDeviceInfo();
  
  return React.useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop || isLargeDesktop,
  }), [isMobile, isTablet, isDesktop, isLargeDesktop]);
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', onChange);
    setMatches(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, [query]);

  return matches;
}
