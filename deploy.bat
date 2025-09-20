@echo off
echo ========================================
echo    LOJIFY - DEPLOY DE PRODUÇÃO
echo ========================================
echo.

echo Verificando configurações...
if not exist "server\.env" (
    echo ❌ Arquivo server\.env não encontrado
    echo Execute: node configurar-producao.js
    pause
    exit /b 1
)

if not exist "client\.env" (
    echo ❌ Arquivo client\.env não encontrado
    echo Execute: node configurar-producao.js
    pause
    exit /b 1
)

echo ✅ Configurações encontradas
echo.

echo Fazendo build do sistema...
node build-production.js

if %errorlevel% neq 0 (
    echo ❌ Erro no build
    pause
    exit /b 1
)

echo.
echo Copiando arquivos de produção...
copy "server\start-production.js" "server\start.js" >nul
copy "server\package-production.json" "server\package.json" >nul

echo.
echo Instalando dependências de produção...
cd server
npm install --production
cd ..

echo.
echo ========================================
echo ✅ DEPLOY CONCLUÍDO!
echo ========================================
echo.
echo Para iniciar o sistema:
echo cd server
echo npm start
echo.
echo Ou execute: start-simple.bat
echo.
pause
