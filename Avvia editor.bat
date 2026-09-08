@echo off
title Rune Wars - Card Editor
cd /d "%~dp0editor"

if not exist "node_modules\" (
  echo.
  echo Prima installazione delle dipendenze dell'editor...
  echo Puo' richiedere qualche minuto, attendi.
  echo.
  call npm install
)

echo.
echo ================================================
echo   Editor in avvio su http://localhost:3100
echo   Il browser si aprira' da solo.
echo   Per fermarlo: chiudi questa finestra.
echo ================================================
echo.

call npm run dev

echo.
echo L'editor e' stato fermato.
pause
