import React, { useEffect } from 'react';
import { useAutoScroll } from '../hooks/useAutoScroll';

const AutoScrollWrapper = ({ children, className = '', onScrollChange }) => {
  const { contentRef, needsScroll, forceCheck } = useAutoScroll();

  // Notifica o componente pai quando o estado de rolagem muda
  useEffect(() => {
    if (onScrollChange) {
      onScrollChange(needsScroll);
    }
  }, [needsScroll, onScrollChange]);

  // Força verificação quando o conteúdo muda
  useEffect(() => {
    const observer = new MutationObserver(() => {
      forceCheck();
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [forceCheck]);

  return (
    <div 
      ref={contentRef}
      className={`auto-scroll-wrapper ${className}`}
      data-needs-scroll={needsScroll}
    >
      {children}
    </div>
  );
};

export default AutoScrollWrapper; 