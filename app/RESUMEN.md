# Speedometer Pro - Resumen del Proyecto

## ¿Qué es?

**Speedometer Pro** es una aplicación Android que muestra la velocidad de tu auto en tiempo real usando el GPS de tu teléfono.

## Características principales

- **Velocímetro en tiempo real** con visualización tipo gauge
- **Cálculo dual de velocidad:**
  - Usa la velocidad reportada por el GPS (si está disponible)
  - Calcula velocidad basada en cambio de posición (fallback)
- **Estadísticas:** Velocidad máxima y promedio
- **Acelerómetro:** Muestra datos de aceleración en X, Y, Z
- **Unidades:** Cambia entre km/h y mph
- **Interfaz moderna:** Tema oscuro con animaciones suaves

## Archivos del proyecto

```
app/
├── src/
│   ├── App.tsx           # Código principal de la app
│   ├── App.css           # Estilos
│   └── main.tsx          # Punto de entrada
├── android/              # Proyecto Android nativo (generado por Capacitor)
│   └── app/src/main/
│       ├── AndroidManifest.xml    # Permisos configurados
│       └── ...
├── public/               # Assets estáticos
│   ├── manifest.json     # Configuración PWA
│   ├── speedometer-icon.svg
│   └── speedometer-icon-*.png    # Iconos en diferentes tamaños
├── dist/                 # Build de producción (generado)
├── capacitor.config.json # Configuración de Capacitor
├── package.json          # Dependencias y scripts
├── build-apk.sh          # Script de build para Linux/Mac
├── build-apk.ps1         # Script de build para Windows
├── README.md             # Documentación completa
├── INSTALAR.md           # Guía de instalación rápida
└── RESUMEN.md            # Este archivo
```

## Cómo generar el APK

### Opción rápida (Script automático)

**Windows (PowerShell):**
```powershell
.\build-apk.ps1
```

**Linux/Mac:**
```bash
./build-apk.sh
```

### Opción manual

```bash
# 1. Instalar dependencias
npm install

# 2. Construir app web
npm run build

# 3. Copiar assets
cp public/* dist/

# 4. Sincronizar con Android
npx cap sync android

# 5. Build APK
cd android
./gradlew assembleDebug
```

El APK se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`

## Permisos requeridos

La app solicita estos permisos en Android:

- `ACCESS_FINE_LOCATION` - GPS preciso para velocidad
- `ACCESS_COARSE_LOCATION` - Ubicación aproximada (fallback)
- `HIGH_SAMPLING_RATE_SENSORS` - Acelerómetro de alta frecuencia

## Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| React 18 | Framework UI |
| TypeScript | Tipado estático |
| Vite | Build tool |
| Tailwind CSS | Estilos |
| Capacitor | Puente web-native |
| Lucide React | Iconos |

## Cómo funciona

1. **Inicio:** El usuario presiona "INICIAR"
2. **Permisos:** La app solicita acceso a ubicación
3. **GPS:** Comienza a escuchar actualizaciones de ubicación
4. **Cálculo:** 
   - Si el GPS reporta velocidad, la usa directamente
   - Si no, calcula velocidad basada en distancia/tiempo entre puntos
5. **Suavizado:** Aplica media móvil para lecturas estables
6. **UI:** Actualiza el gauge y estadísticas en tiempo real

## Precisión

- **GPS directo:** ±0.5 m/s (cuando está disponible)
- **Cálculo por posición:** Depende de la precisión del GPS (3-10 metros típicamente)
- **Frecuencia de actualización:** 1 segundo (configurable)

## Notas importantes

- La app requiere **Android 5.0+** (API 21)
- El GPS necesita **vista al cielo** para mejor precisión
- La velocidad puede tardar **10-20 segundos** en estabilizarse
- **No uses el teléfono mientras conduces**

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "GPS no disponible" | Habilita ubicación en el teléfono |
| Velocidad inexacta | Espera 10-20 segundos para calibración |
| App se cierra | Concede permisos de ubicación |
| No instala | Habilita "Orígenes desconocidos" |

## Próximos pasos

1. Genera el APK usando uno de los métodos anteriores
2. Transfiere el APK a tu teléfono Android
3. Instala la aplicación
4. ¡Comienza a usar tu velocímetro GPS!

---

**Versión:** 1.0.0  
**Fecha:** 2026-04-15  
**Licencia:** MIT
