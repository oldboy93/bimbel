@echo off
title E-Learning Pitch Deck Launcher
echo ========================================================
echo   E-LEARNING BY UAY STUDIO - PITCH DECK LAUNCHER
echo ========================================================
echo.
echo [1/2] Menjalankan HTTP Server Lokal di Port 8765...
start /b npx serve "C:\Users\ubaid\.gemini\antigravity-ide\brain\dcfc837d-36cf-40e5-adc3-8fc8fe9c7da7" -p 8765 --no-clipboard

timeout /t 2 /nobreak >nul

echo [2/2] Menjalankan Cloudflare Tunnel Publik...
echo.
echo Silakan buka browser presenter di laptop Anda:
echo http://localhost:8765/pitchdeck.html
echo.
start http://localhost:8765/pitchdeck.html

"C:\Users\ubaid\.gemini\antigravity-ide\brain\dcfc837d-36cf-40e5-adc3-8fc8fe9c7da7\cloudflared.exe" tunnel --url http://localhost:8765
pause
