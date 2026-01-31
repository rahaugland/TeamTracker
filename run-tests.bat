@echo off
echo Installing dependencies...
call pnpm install

echo.
echo Running tests...
call pnpm test:run

echo.
echo Generating coverage report...
call pnpm test:coverage

echo.
echo Done! Check coverage/index.html for detailed coverage report.
pause
