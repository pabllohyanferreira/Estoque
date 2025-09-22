// Script para forçar zoom padrão e remover configurações automáticas
(function() {
  'use strict';
  
  // Função para aplicar zoom padrão
  function applyDefaultZoom() {
    // Verificar se os elementos existem antes de acessá-los
    if (document.documentElement) {
      document.documentElement.style.zoom = '100%';
    }
    if (document.body) {
      document.body.style.zoom = '100%';
      document.body.style.fontSize = '16px';
    }
    
    // Remover qualquer transform de escala
    if (document.documentElement) {
      document.documentElement.style.transform = 'none';
    }
    if (document.body) {
      document.body.style.transform = 'none';
    }
    
    // Garantir que o viewport não tenha zoom
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
  }
  
  // Aplicar zoom padrão imediatamente
  applyDefaultZoom();
  
  // Aplicar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDefaultZoom);
  }
  
  // Aplicar quando a janela carregar
  window.addEventListener('load', applyDefaultZoom);
  
  // Observar mudanças no DOM para manter o zoom padrão
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        const target = mutation.target;
        if (target.style.zoom && target.style.zoom !== '100%') {
          target.style.zoom = '100%';
        }
        if (target.style.fontSize && target.style.fontSize !== '16px') {
          target.style.fontSize = '16px';
        }
      }
    });
  });
  
  // Iniciar observação quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true
      });
    });
  } else {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true
    });
  }
  
  // Prevenir zoom do usuário
  document.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });
  
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  });
  
  document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
  });
  
  document.addEventListener('gestureend', function(e) {
    e.preventDefault();
  });
  
})(); 