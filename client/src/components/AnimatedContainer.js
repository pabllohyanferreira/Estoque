import React, { useState, useEffect } from 'react';

const AnimatedContainer = ({ children, className = '', animationType = 'grow-in', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationClass = () => {
    switch (animationType) {
      case 'grow-in':
        return 'animate-grow-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'expand-width':
        return 'animate-expand-width';
      case 'expand-height':
        return 'animate-expand-height';
      default:
        return 'animate-grow-in';
    }
  };

  return (
    <div 
      className={`${className} ${isVisible ? getAnimationClass() : 'opacity-0'}`}
      style={{ 
        transform: isVisible ? 'none' : 'scale(0.8) translateY(20px)',
        transition: 'all 0.4s ease-out'
      }}
    >
      {children}
    </div>
  );
};

// Hook para animações baseadas em scroll
export const useScrollAnimation = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return [setRef, isInView];
};

// Componente para animações baseadas em scroll
export const ScrollAnimatedContainer = ({ children, className = '', animationType = 'grow-in' }) => {
  const [ref, isInView] = useScrollAnimation();

  const getAnimationClass = () => {
    if (!isInView) return '';
    
    switch (animationType) {
      case 'grow-in':
        return 'animate-grow-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'expand-width':
        return 'animate-expand-width';
      case 'expand-height':
        return 'animate-expand-height';
      default:
        return 'animate-grow-in';
    }
  };

  return (
    <div 
      ref={ref}
      className={`${className} ${getAnimationClass()}`}
      style={{ 
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'none' : 'scale(0.8) translateY(20px)',
        transition: 'all 0.4s ease-out'
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer; 