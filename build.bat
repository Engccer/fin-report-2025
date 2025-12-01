@echo off
chcp 65001 > nul
echo ========================================
echo   장교조 재정 앱 빌드
echo ========================================
echo.

node build.js

echo.
if %ERRORLEVEL% EQU 0 (
    echo [성공] 빌드가 완료되었습니다.
    echo app\index.html 파일을 브라우저에서 열어주세요.
) else (
    echo [오류] 빌드 중 오류가 발생했습니다.
)

echo.
pause
