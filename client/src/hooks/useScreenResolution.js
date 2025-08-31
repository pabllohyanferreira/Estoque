import { useState, useEffect } from 'react';

// Definição dos breakpoints
const BREAKPOINTS = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1366,
  xl: 1600,
  '2xl': 1920
};

export const useScreenInfo = () => {
  const [screenInfo, setScreenInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    breakpoint: 'lg',
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determinar breakpoint
      let breakpoint = 'lg';
      if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl';
      else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
      else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
      else if (width >= BREAKPOINTS.md) breakpoint = 'md';
      else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';
      else breakpoint = 'xs';

      // Determinar tipo de dispositivo
      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;

      setScreenInfo({
        width,
        height,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop
      });

      // Manter tamanho padrão sem zoom
      document.body.style.zoom = '100%';
      document.body.style.fontSize = '16px';
    };

    // Atualizar na inicialização
    updateScreenInfo();

    // Adicionar listener para mudanças de resolução
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  return {
    ...screenInfo,
    canShowSidebar: screenInfo.isDesktop
  };
}; 