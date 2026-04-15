# Speedometer Pro - Velocímetro GPS

Aplicación Android que muestra la velocidad de tu auto usando el GPS y sensores del teléfono.

## Características

- **Velocímetro en tiempo real** usando GPS de alta precisión
- **Cálculo de velocidad** basado en cambio de posición (fallback cuando el GPS no reporta velocidad)
- **Velocidad máxima y promedio** durante el viaje
- **Acelerómetro** para datos adicionales de movimiento
- **Unidades** km/h y mph
- **Interfaz moderna** con tema oscuro y animaciones suaves

## Cómo generar el APK

### Opción 1: Usando Android Studio (Recomendado)

1. **Instalar requisitos:**
   - [Android Studio](https://developer.android.com/studio)
   - [Node.js](https://nodejs.org/) 18+
   - Java JDK 17

2. **Clonar/Descargar este proyecto**

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Construir la app web:**
   ```bash
   npm run build
   ```

5. **Sincronizar con Capacitor:**
   ```bash
   npx cap sync android
   ```

6. **Abrir en Android Studio:**
   ```bash
   npx cap open android
   ```

7. **Generar APK:**
   - En Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - O usa: `./gradlew assembleDebug` en la terminal de Android Studio

8. **El APK se generará en:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Opción 2: Script Automatizado (Windows/Linux/Mac)

1. **Ejecutar el script de build:**
   ```bash
   # En Windows (PowerShell):
   .\build-apk.ps1
   
   # En Linux/Mac:
   ./build-apk.sh
   ```

2. **El script instalará automáticamente:**
   - Android SDK Command Line Tools
   - Gradle
   - Todas las dependencias necesarias

3. **El APK se generará en:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Opción 3: Usando Docker

```bash
docker run --rm -v "$(pwd):/app" -w /app \
  -e ANDROID_SDK_ROOT=/opt/android-sdk \
  capacitor-android-build \
  ./gradlew assembleDebug
```

## Instalación en tu teléfono

1. **Transferir el APK** a tu teléfono Android
2. **Habilitar "Orígenes desconocidos"** en Ajustes > Seguridad
3. **Instalar el APK** tocándolo en tu gestor de archivos
4. **Conceder permisos** de ubicación cuando la app lo solicite

## Permisos requeridos

- **Ubicación precisa (GPS):** Para calcular la velocidad
- **Ubicación aproximada:** Fallback para ubicación general
- **Sensores:** Para el acelerómetro (opcional)

## Uso

1. Abre la app **Speedometer Pro**
2. Presiona el botón **"INICIAR"**
3. Concede los permisos de ubicación
4. ¡Comienza a conducir y ver tu velocidad en tiempo real!

## Solución de problemas

### "GPS no disponible"
- Asegúrate de tener habilitada la ubicación en tu teléfono
- Verifica que hayas concedido los permisos a la app
- Intenta en un área abierta con vista al cielo

### "Velocidad inexacta"
- La precisión mejora después de 10-20 segundos de uso
- El GPS necesita tiempo para calibrarse
- La velocidad del GPS puede tardar en actualizarse

### App se cierra al iniciar
- Verifica que tienes Android 5.0 (API 21) o superior
- Asegúrate de que el teléfono tiene GPS

## Desarrollo

### Estructura del proyecto
```
app/
├── src/                    # Código fuente React
│   ├── App.tsx            # Componente principal
│   └── App.css            # Estilos
├── android/               # Proyecto Android nativo
├── public/                # Assets estáticos
├── capacitor.config.json  # Configuración de Capacitor
└── package.json           # Dependencias
```

### Comandos útiles
```bash
# Desarrollo en navegador
npm run dev

# Build para producción
npm run build

# Sincronizar cambios con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

## Tecnologías utilizadas

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Capacitor** - Puente web-native
- **Lucide React** - Iconos

## Licencia

MIT License - Libre para uso personal y comercial.

---

**Nota:** Usa esta app de forma responsable. No uses el teléfono mientras conduces. La precisión depende de la calidad del GPS de tu dispositivo.
