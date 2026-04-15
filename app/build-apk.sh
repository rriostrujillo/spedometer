#!/bin/bash

# Script de build para Speedometer Pro APK
# Compatible con Linux y macOS

set -e

echo "========================================"
echo "  Speedometer Pro - Build Script"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función de error
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Función de éxito
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Función de info
info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Verificar Node.js
info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    error_exit "Node.js no está instalado. Descárgalo de https://nodejs.org/"
fi
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error_exit "Se requiere Node.js 18 o superior. Versión actual: $(node --version)"
fi
success "Node.js $(node --version)"

# Verificar Java
info "Verificando Java..."
if ! command -v java &> /dev/null; then
    error_exit "Java no está instalado. Instala Java JDK 17: https://adoptium.net/"
fi
success "Java detectado"

# Instalar dependencias
info "Instalando dependencias..."
npm install || error_exit "Error al instalar dependencias"
success "Dependencias instaladas"

# Build de la app web
info "Construyendo aplicación web..."
npm run build || error_exit "Error en el build"
success "Build completado"

# Copiar assets
info "Copiando assets..."
cp -r public/* dist/ 2>/dev/null || true
success "Assets copiados"

# Sincronizar con Capacitor
info "Sincronizando con Capacitor..."
npx cap sync android || error_exit "Error al sincronizar con Android"
success "Sincronización completada"

# Verificar Android SDK
info "Verificando Android SDK..."
if [ -z "$ANDROID_SDK_ROOT" ] && [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠ ANDROID_SDK_ROOT no está configurado${NC}"
    echo "Buscando Android SDK en ubicaciones comunes..."
    
    # Buscar en ubicaciones comunes
    SDK_PATHS=(
        "$HOME/Android/Sdk"
        "$HOME/Library/Android/sdk"
        "/usr/local/android-sdk"
        "/opt/android-sdk"
        "$HOME/android-sdk"
    )
    
    FOUND_SDK=""
    for path in "${SDK_PATHS[@]}"; do
        if [ -d "$path" ]; then
            FOUND_SDK="$path"
            break
        fi
    done
    
    if [ -z "$FOUND_SDK" ]; then
        echo -e "${YELLOW}Android SDK no encontrado. Descargando...${NC}"
        
        # Crear directorio para SDK
        SDK_DIR="$HOME/android-sdk"
        mkdir -p "$SDK_DIR"
        
        # Descargar command line tools
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            SDK_URL="https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
        else
            # Linux
            SDK_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
        fi
        
        info "Descargando Android SDK Command Line Tools..."
        curl -L -o /tmp/sdk-tools.zip "$SDK_URL" || error_exit "Error al descargar SDK"
        
        info "Extrayendo..."
        unzip -q /tmp/sdk-tools.zip -d "$SDK_DIR/cmdline-tools" || error_exit "Error al extraer SDK"
        mv "$SDK_DIR/cmdline-tools/cmdline-tools" "$SDK_DIR/cmdline-tools/latest" 2>/dev/null || true
        
        export ANDROID_SDK_ROOT="$SDK_DIR"
        export PATH="$PATH:$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools"
        
        # Aceptar licencias
        info "Aceptando licencias de Android SDK..."
        yes | sdkmanager --licenses || true
        
        # Instalar plataformas y build tools
        info "Instalando componentes de Android SDK..."
        sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" || true
        
        success "Android SDK instalado en $SDK_DIR"
    else
        export ANDROID_SDK_ROOT="$FOUND_SDK"
        success "Android SDK encontrado en $FOUND_SDK"
    fi
else
    success "Android SDK configurado"
fi

# Configurar variables de entorno
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/34.0.0"

# Construir APK
info "Construyendo APK..."
cd android

# Hacer gradlew ejecutable
chmod +x gradlew 2>/dev/null || true

# Build debug APK
./gradlew assembleDebug || error_exit "Error al construir APK"

cd ..

# Verificar que el APK se generó
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    success "APK generado exitosamente!"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ¡BUILD COMPLETADO!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Ubicación del APK:"
    echo "  $(pwd)/$APK_PATH"
    echo ""
    echo "Tamaño: $(du -h "$APK_PATH" | cut -f1)"
    echo ""
    echo "Para instalar en tu teléfono:"
    echo "  1. Transfiere el APK a tu dispositivo Android"
    echo "  2. Habilita 'Orígenes desconocidos' en Ajustes > Seguridad"
    echo "  3. Toca el archivo para instalar"
    echo ""
    echo "O instala directamente con ADB:"
    echo "  adb install -r $APK_PATH"
    echo ""
else
    error_exit "No se pudo generar el APK"
fi
