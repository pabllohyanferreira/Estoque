import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook personalizado para implementar scroll suave com mouse
 * @param {Object} options - Opções de configuração
 * @param {number} options.scrollSpeed - Velocidade do scroll (padrão: 0.5)
 * @param {boolean} options.smooth - Se deve usar scroll suave (padrão: true)
 * @param {number} options.maxHeight - Altura máxima do container (padrão: 600px)
 * @returns {Object} - Objeto com ref e configurações
 */
export const useScroll = (options = {}) => {
  const {
    scrollSpeed = 0.5,
    smooth = true,
    maxHeight = 600
  } = options;

  const scrollContainerRef = useRef(null);

  // Função para lidar com scroll do mouse
  const handleWheelScroll = useCallback((e) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      const container = scrollContainerRef.current;
      const scrollAmount = e.deltaY * scrollSpeed;
      container.scrollTop += scrollAmount;
    }
  }, [scrollSpeed]);

  // Adicionar event listener para scroll do mouse
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheelScroll, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheelScroll);
      };
    }
  }, [handleWheelScroll]);

  // Configurações de estilo para o container
  const scrollStyles = {
    maxHeight: `${maxHeight}px`,
    overflowY: 'auto',
    scrollBehavior: smooth ? 'smooth' : 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f3f4f6'
  };

  // Classes CSS para scrollbar personalizada
  const scrollClasses = [
    'scrollbar-thin',
    'scrollbar-thumb-gray-300',
    'dark:scrollbar-thumb-gray-600',
    'scrollbar-track-gray-100',
    'dark:scrollbar-track-gray-800',
    'hover:scrollbar-thumb-gray-400',
    'dark:hover:scrollbar-thumb-gray-500'
  ].join(' ');

  return {
    scrollContainerRef,
    scrollStyles,
    scrollClasses
  };
};

export default useScroll;
