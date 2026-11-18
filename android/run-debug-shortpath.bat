@echo off
setlocal

subst H: /d >nul 2>&1
subst H: "E:\hadex\hadi factor native"
if errorlevel 1 exit /b 2

pushd H:\android
if errorlevel 1 (
  subst H: /d
  exit /b 3
)

call gradlew.bat -I .hadex-maven-mirror.init.gradle clean assembleDebug --no-daemon --max-workers=1 --console=plain > "hadex-build-shortpath.log" 2>&1
set "BUILD_EXIT=%ERRORLEVEL%"

popd
subst H: /d

echo BUILD_EXIT=%BUILD_EXIT%
exit /b %BUILD_EXIT%
