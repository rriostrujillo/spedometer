# Speedometer Pro - Build Script para Windows
# PowerShell 5.1 o superior requerido

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Speedometer Pro - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "→ $message" -ForegroundColor Blue
}

function Write-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

# Verificar Node.js
Write-Info "Verificando Node.js..."
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v', '').Split('.')[0]
    if ($majorVersion -lt 18) {
        throw "Se requiere Node.js 18 o superior"
    }
    Write-Success "Node.js $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado o es muy antiguo"
    Write-Host "Descarga Node.js desde: https://nodejs.org/"
    exit 1
}

# Verificar Java
Write-Info "Verificando Java..."
try {
    $javaVersion = java -version 2>&1 | Select-String -Pattern '"([0-9]+)"' | ForEach-Object { $_.Matches.Groups[1].Value }
    Write-Success "Java detectado"
} catch {
    Write-Error "Java no está instalado"
    Write-Host "Descarga Java JDK 17 desde: https://adoptium.net/"
    exit 1
}

# Instalar dependencias
Write-Info "Instalando dependencias..."
try {
    npm install | Out-Null
    Write-Success "Dependencias instaladas"
} catch {
    Write-Error "Error al instalar dependencias: $_"
    exit 1
}

# Build de la app web
Write-Info "Construyendo aplicación web..."
try {
    npm run build | Out-Null
    Write-Success "Build completado"
} catch {
    Write-Error "Error en el build: $_"
    exit 1
}

# Copiar assets
Write-Info "Copiando assets..."
Copy-Item -Path "public\*" -Destination "dist\" -Recurse -Force -ErrorAction SilentlyContinue
Write-Success "Assets copiados"

# Sincronizar con Capacitor
Write-Info "Sincronizando con Capacitor..."
try {
    npx cap sync android | Out-Null
    Write-Success "Sincronización completada"
} catch {
    Write-Error "Error al sincronizar con Android: $_"
    exit 1
}

# Verificar Android SDK
Write-Info "Verificando Android SDK..."
$androidSdk = $env:ANDROID_SDK_ROOT
if (-not $androidSdk) {
    $androidSdk = $env:ANDROID_HOME
}

if (-not $androidSdk -or -not (Test-Path $androidSdk)) {
    Write-Warning "Android SDK no encontrado en las variables de entorno"
    Write-Info "Buscando en ubicaciones comunes..."
    
    $possiblePaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "$env:ProgramFiles\Android\android-sdk",
        "C:\Android\android-sdk",
        "$env:USERPROFILE\android-sdk"
    )
    
    $foundSdk = $null
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $foundSdk = $path
            break
        }
    }
    
    if (-not $foundSdk) {
        Write-Warning "Android SDK no encontrado. Descargando..."
        
        $sdkDir = "$env:USERPROFILE\android-sdk"
        New-Item -ItemType Directory -Force -Path $sdkDir | Out-Null
        
        # Descargar command line tools
        $sdkUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
        $zipPath = "$env:TEMP\sdk-tools.zip"
        
        Write-Info "Descargando Android SDK Command Line Tools..."
        try {
            Invoke-WebRequest -Uri $sdkUrl -OutFile $zipPath -UseBasicParsing
            Write-Success "Descarga completada"
        } catch {
            Write-Error "Error al descargar SDK: $_"
            exit 1
        }
        
        Write-Info "Extrayendo..."
        Expand-Archive -Path $zipPath -DestinationPath "$sdkDir\cmdline-tools" -Force
        Rename-Item -Path "$sdkDir\cmdline-tools\cmdline-tools" -NewName "latest" -ErrorAction SilentlyContinue
        
        $env:ANDROID_SDK_ROOT = $sdkDir
        $env:Path += ";$sdkDir\cmdline-tools\latest\bin;$sdkDir\platform-tools"
        
        # Aceptar licencias
        Write-Info "Aceptando licencias de Android SDK..."
        $process = Start-Process -FilePath "sdkmanager.bat" -ArgumentList "--licenses" -Wait -PassThru -NoNewWindow
        
        # Instalar componentes
        Write-Info "Instalando componentes de Android SDK..."
        sdkmanager.bat "platforms;android-34" "build-tools;34.0.0" "platform-tools" | Out-Null
        
        Write-Success "Android SDK instalado en $sdkDir"
    } else {
        $env:ANDROID_SDK_ROOT = $foundSdk
        Write-Success "Android SDK encontrado en $foundSdk"
    }
} else {
    Write-Success "Android SDK configurado en $androidSdk"
}

# Configurar variables de entorno
$env:ANDROID_SDK_ROOT = $env:ANDROID_SDK_ROOT -or $env:ANDROID_HOME
$env:Path += ";$env:ANDROID_SDK_ROOT\cmdline-tools\latest\bin;$env:ANDROID_SDK_ROOT\platform-tools;$env:ANDROID_SDK_ROOT\build-tools\34.0.0"

# Construir APK
Write-Info "Construyendo APK..."
Set-Location -Path "android"

# Hacer gradlew ejecutable (no necesario en Windows, pero por si acaso)
$gradlewPath = ".\gradlew.bat"
if (-not (Test-Path $gradlewPath)) {
    Write-Error "No se encontró gradlew.bat"
    Set-Location -Path ".."
    exit 1
}

try {
    & $gradlewPath assembleDebug 2>&1 | ForEach-Object {
        if ($_ -match "BUILD SUCCESSFUL") {
            Write-Success "Build de Gradle completado"
        }
    }
} catch {
    Write-Error "Error al construir APK: $_"
    Set-Location -Path ".."
    exit 1
}

Set-Location -Path ".."

# Verificar que el APK se generó
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Success "APK generado exitosamente!"
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ¡BUILD COMPLETADO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ubicación del APK:"
    Write-Host "  $(Resolve-Path $apkPath)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Tamaño: $([math]::Round($apkSize, 2)) MB"
    Write-Host ""
    Write-Host "Para instalar en tu teléfono:"
    Write-Host "  1. Transfiere el APK a tu dispositivo Android"
    Write-Host "  2. Habilita 'Orígenes desconocidos' en Ajustes > Seguridad"
    Write-Host "  3. Toca el archivo para instalar"
    Write-Host ""
    Write-Host "O instala directamente con ADB:"
    Write-Host "  adb install -r $apkPath" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Error "No se pudo generar el APK"
    exit 1
}
