// Script para inicializar o tema antes do React carregar
(function() {
  const theme = localStorage.getItem('theme');
  
  if (theme === 'dark' || !theme) {
    // Modo escuro como padrão para novos usuários
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
})(); 