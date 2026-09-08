@echo off
title Rune Wars - Gioco
cd /d "%~dp0"

if not exist "node_modules\" (
  echo.
  echo Prima installazione delle dipendenze del gioco...
  echo Puo' richiedere qualche minuto, attendi.
  echo.
  call npm install
)

echo.
echo ================================================
echo   Gioco in avvio su http://localhost:3000
echo   Il browser si aprira' da solo.
echo   Per fermarlo: chiudi questa finestra.
echo ================================================
echo.

call npm run dev

echo.
echo Il gioco e' stato fermato.
pause
