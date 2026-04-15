# Guía Rápida de Instalación - Speedometer Pro

## Método 1: Script Automático (Más fácil)

### En Windows:
1. Abre PowerShell como Administrador
2. Navega a la carpeta del proyecto
3. Ejecuta: `.uild-apk.ps1`

### En Linux/Mac:
1. Abre la terminal
2. Navega a la carpeta del proyecto
3. Ejecuta: `./build-apk.sh`

---

## Método 2: Android Studio (Más control)

### Paso 1: Instalar herramientas
1. Descarga e instala [Android Studio](https://developer.android.com/studio)
2. Durante la instalación, acepta instalar:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (opcional)

### Paso 2: Configurar proyecto
```bash
# Instalar dependencias
npm install

# Construir app web
npm run build

# Copiar assets
cp public/* dist/

# Sincronizar con Android
npx cap sync android
```

### Paso 3: Abrir en Android Studio
```bash
npx cap open android
```

### Paso 4: Generar APK
1. En Android Studio, espera a que termine la sincronización de Gradle
2. Ve al menú: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
3. Espera a que termine el build
4. Haz clic en "locate" cuando aparezca la notificación

---

## Método 3: Línea de comandos (Avanzado)

### Requisitos previos:
- Android SDK instalado
- Variables de entorno configuradas:
  - `ANDROID_SDK_ROOT` o `ANDROID_HOME`
  - `PATH` incluyendo: `platform-tools`, `build-tools`, `cmdline-tools`

### Comandos:
```bash
# 1. Instalar dependencias
npm install

# 2. Build web
npm run build

# 3. Copiar assets
cp public/* dist/

# 4. Sincronizar Capacitor
npx cap sync android

# 5. Build APK
cd android
./gradlew assembleDebug

# APK generado en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Instalación en el teléfono

### Opción A: Transferencia directa
1. Conecta tu teléfono al computador con USB
2. Copia el archivo `app-debug.apk` al teléfono
3. En el teléfono, abre el archivo APK
4. Si aparece "Orígenes desconocidos", ve a Ajustes y habilítalo
5. Toca "Instalar"

### Opción B: ADB (Android Debug Bridge)
```bash
# Verificar que el teléfono está conectado
adb devices

# Instalar APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Opción C: Google Drive / Email
1. Sube el APK a Google Drive o envíalo por email
2. Descárgalo en tu teléfono
3. Abre el archivo descargado
4. Instala la aplicación

---

## Solución de problemas comunes

### "Permiso denegado" al ejecutar script
```bash
# En Linux/Mac, dar permisos de ejecución:
chmod +x build-apk.sh
```

### "ANDROID_SDK_ROOT no encontrado"
```bash
# En Linux/Mac, agrega a tu ~/.bashrc o ~/.zshrc:
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin

# En Windows, agrega a Variables de Entorno del Sistema
```

### "Gradle sync failed" en Android Studio
1. Ve a `File` → `Sync Project with Gradle Files`
2. Espera a que termine la sincronización
3. Si falla, ve a `Build` → `Clean Project` y reintenta

### "App no instala" en el teléfono
- Verifica que tienes Android 5.0+ (API 21)
- Habilita "Orígenes desconocidos" en Ajustes > Seguridad
- Desinstala versiones anteriores de la app

### "GPS no funciona"
- Asegúrate de conceder permisos de ubicación
- Habilita la ubicación en tu teléfono
- Usa la app en un área abierta

---

## Ubicación del APK después del build

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ¿Necesitas ayuda?

Revisa el archivo `README.md` para más información detallada.
