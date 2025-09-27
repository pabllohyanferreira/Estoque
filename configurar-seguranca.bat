@echo off
echo 🔒 Configurador de Segurança - Sistema Lojify
echo =============================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Por favor, instale o Node.js primeiro.
    echo 📥 Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não encontrado. Por favor, reinstale o Node.js.
    pause
    exit /b 1
)

echo ✅ Node.js e npm encontrados
echo.

REM Executar script de configuração
echo 🚀 Executando configurador de segurança...
node configurar-seguranca.js

echo.
echo 📋 Configuração concluída!
echo.
echo 🎯 Para iniciar o sistema:
echo    1. cd server
echo    2. npm install
echo    3. npm start
echo.
echo 📖 Consulte CONFIGURACAO_SEGURANCA.md para mais detalhes
echo.
pause
