@echo off
setlocal

set "PROJECT="
set "SHORT=E:\hf"
set "BUILD_EXIT=1"
set "CREATED_JUNCTION=0"

for %%I in ("%~dp0..") do set "PROJECT=%%~fI"

if not exist "%PROJECT%\package.json" (
  echo ERROR: Project root could not be verified: "%PROJECT%"
  exit /b 2
)

if exist "%SHORT%" (
  echo ERROR: Short path "%SHORT%" is already in use.
  exit /b 3
)

mklink /J "%SHORT%" "%PROJECT%"
if errorlevel 1 (
  echo ERROR: Could not create temporary project junction.
  exit /b 4
)
set "CREATED_JUNCTION=1"

pushd "%SHORT%\android"
if errorlevel 1 (
  if "%CREATED_JUNCTION%"=="1" rmdir "%SHORT%"
  echo ERROR: Could not enter short-path Android directory.
  exit /b 5
)

call gradlew.bat assembleRelease --no-daemon --max-workers=2 --console=plain > "build\release-build-final.log" 2>&1
set "BUILD_EXIT=%ERRORLEVEL%"

> "build\release-build-final.exit" echo %BUILD_EXIT%

popd
if "%CREATED_JUNCTION%"=="1" rmdir "%SHORT%"

echo Release build exit code: %BUILD_EXIT%
exit /b %BUILD_EXIT%
