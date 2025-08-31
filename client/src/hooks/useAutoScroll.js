import { useEffect, useRef, useState, useCallback } from 'react';

export const useAutoScroll = () => {
  const contentRef = useRef(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  const checkContentHeight = useCallback(() => {
    if (contentRef.current) {
      const contentElement = contentRef.current;
      const contentHeight = contentElement.scrollHeight;
      const containerHeight = window.innerHeight;
      
      // Calcula a altura disponível considerando diferentes elementos
      const headerHeight = window.innerWidth >= 768 ? 0 : 80; // Header mobile
      const sidebarHeight = window.innerWidth >= 768 ? 0 : 0; // Sidebar mobile
      const padding = 48; // Padding do container
      const margin = 24; // Margem adicional
      
      const availableHeight = containerHeight - headerHeight - sidebarHeight - padding - margin;
      
      // Ativa rolagem se o conteúdo for maior que o espaço disponível
      const shouldScroll = contentHeight > availableHeight;
      setNeedsScroll(shouldScroll);
      
      // Aplica classe CSS baseada na necessidade de rolagem
      if (shouldScroll) {
        contentElement.classList.add('content-needs-scroll');
        contentElement.classList.remove('content-no-scroll');
      } else {
        contentElement.classList.add('content-no-scroll');
        contentElement.classList.remove('content-needs-scroll');
      }
      
              // Log para debug (remover em produção)
        // console.log('AutoScroll Debug:', {
        //   contentHeight,
        //   containerHeight,
        //   availableHeight,
        //   shouldScroll,
        //   isMobile: window.innerWidth < 768
        // });
    }
  }, []);

  useEffect(() => {
    // Verifica na montagem
    checkContentHeight();
    
    // Adiciona listener para redimensionamento
    window.addEventListener('resize', checkContentHeight);
    
    // Verifica novamente após delays para garantir que o conteúdo foi renderizado
    const timeoutId1 = setTimeout(checkContentHeight, 100);
    const timeoutId2 = setTimeout(checkContentHeight, 500);
    const timeoutId3 = setTimeout(checkContentHeight, 1000);

    return () => {
      window.removeEventListener('resize', checkContentHeight);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [checkContentHeight]);

  // Função para forçar verificação (útil quando conteúdo é carregado dinamicamente)
  const forceCheck = useCallback(() => {
    setTimeout(checkContentHeight, 100);
  }, [checkContentHeight]);

  return { contentRef, needsScroll, forceCheck };
}; 