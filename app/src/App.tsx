import { useState, useEffect, useRef, useCallback } from 'react';
import { Gauge } from 'lucide-react';
import './App.css';

// Tipos para la geolocalización
interface Position {
  coords: {
    latitude: number;
    longitude: number;
    speed: number | null;
    accuracy: number;
    heading: number | null;
    altitude: number | null;
  };
  timestamp: number;
}

interface MotionData {
  acceleration: { x: number | null; y: number | null; z: number | null } | null;
  accelerationIncludingGravity: { x: number | null; y: number | null; z: number | null } | null;
  rotationRate: { alpha: number | null; beta: number | null; gamma: number | null } | null;
}

function App() {
  // Estados principales
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [avgSpeed, setAvgSpeed] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'kmh' | 'mph'>('kmh');
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  
  // Referencias
  const watchId = useRef<number | null>(null);
  const speedHistory = useRef<number[]>([]);
  const lastPosition = useRef<Position | null>(null);
  const motionListener = useRef<any>(null);

  // Calcular velocidad basada en cambio de posición (fallback cuando speed es null)
  const calculateSpeedFromPosition = useCallback((current: Position, previous: Position): number => {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1 = previous.coords.latitude * Math.PI / 180;
    const lat2 = current.coords.latitude * Math.PI / 180;
    const deltaLat = (current.coords.latitude - previous.coords.latitude) * Math.PI / 180;
    const deltaLon = (current.coords.longitude - previous.coords.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distancia en metros

    const timeDiff = (current.timestamp - previous.timestamp) / 1000; // en segundos
    
    if (timeDiff > 0) {
      const speedMps = distance / timeDiff;
      return speedMps * 3.6; // Convertir a km/h
    }
    return 0;
  }, []);

  // Iniciar seguimiento de ubicación
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este dispositivo');
      return;
    }

    setError(null);
    setIsTracking(true);
    speedHistory.current = [];

    // Opciones de geolocalización de alta precisión
    const options = {
      enableHighAccuracy: true,
      timeout: 1000,
      maximumAge: 0
    };

    watchId.current = navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        const pos: Position = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            altitude: position.coords.altitude
          },
          timestamp: position.timestamp
        };

        let currentSpeedKmh = 0;

        // Usar velocidad del GPS si está disponible
        if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
          currentSpeedKmh = pos.coords.speed * 3.6; // m/s a km/h
        } else if (lastPosition.current) {
          // Calcular velocidad basada en cambio de posición
          currentSpeedKmh = calculateSpeedFromPosition(pos, lastPosition.current);
        }

        // Suavizar lecturas (filtro de media móvil)
        speedHistory.current.push(currentSpeedKmh);
        if (speedHistory.current.length > 5) {
          speedHistory.current.shift();
        }
        
        const smoothedSpeed = speedHistory.current.reduce((a, b) => a + b, 0) / speedHistory.current.length;
        const finalSpeed = Math.max(0, smoothedSpeed); // No permitir velocidades negativas

        setSpeed(finalSpeed);
        
        // Actualizar velocidad máxima
        setMaxSpeed(prev => Math.max(prev, finalSpeed));
        
        // Actualizar velocidad promedio
        const allSpeeds = speedHistory.current;
        const avg = allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length;
        setAvgSpeed(avg);

        lastPosition.current = pos;
      },
      (err) => {
        setError(`Error de geolocalización: ${err.message}`);
        setIsTracking(false);
      },
      options
    );

    // Solicitar permiso para sensores de movimiento (acelerómetro)
    if ('DeviceMotionEvent' in window) {
      // Para iOS 13+ necesitamos solicitar permiso
      const DeviceMotionEventAny = (window as any).DeviceMotionEvent;
      if (typeof DeviceMotionEventAny.requestPermission === 'function') {
        DeviceMotionEventAny.requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              setupMotionListener();
            }
          })
          .catch(console.error);
      } else {
        setupMotionListener();
      }
    }
  }, [calculateSpeedFromPosition]);

  // Configurar listener de movimiento
  const setupMotionListener = () => {
    motionListener.current = (event: DeviceMotionEvent) => {
      setMotionData({
        acceleration: event.acceleration,
        accelerationIncludingGravity: event.accelerationIncludingGravity,
        rotationRate: event.rotationRate
      });
    };
    window.addEventListener('devicemotion', motionListener.current);
  };

  // Detener seguimiento
  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (motionListener.current) {
      window.removeEventListener('devicemotion', motionListener.current);
      motionListener.current = null;
    }
    setIsTracking(false);
    setSpeed(0);
    lastPosition.current = null;
  }, []);

  // Convertir velocidad según unidad seleccionada
  const displaySpeed = unit === 'kmh' ? speed : speed * 0.621371;
  const displayMaxSpeed = unit === 'kmh' ? maxSpeed : maxSpeed * 0.621371;
  const displayAvgSpeed = unit === 'kmh' ? avgSpeed : avgSpeed * 0.621371;
  const unitLabel = unit === 'kmh' ? 'km/h' : 'mph';

  // Calcular ángulo para el medidor (0-240 grados)
  const maxGaugeValue = unit === 'kmh' ? 240 : 150;
  const gaugeAngle = Math.min((displaySpeed / maxGaugeValue) * 240, 240) - 120;

  // Calcular color basado en velocidad
  const getSpeedColor = (s: number) => {
    const maxVal = unit === 'kmh' ? 240 : 150;
    const percentage = s / maxVal;
    if (percentage < 0.3) return '#22c55e'; // Verde
    if (percentage < 0.6) return '#eab308'; // Amarillo
    if (percentage < 0.8) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  };

  // Efecto de limpieza
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Gauge className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Speedometer Pro
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUnit('kmh')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              unit === 'kmh' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            km/h
          </button>
          <button
            onClick={() => setUnit('mph')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              unit === 'mph' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            mph
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex flex-col items-center">
        {/* Speedometer Gauge */}
        <div className="relative w-72 h-72 mt-4">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl" />
          
          {/* Inner ring */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900" />
          
          {/* SVG Gauge */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            {/* Background arc */}
            <path
              d="M 30 170 A 85 85 0 1 1 170 170"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
            
            {/* Speed arc */}
            <path
              d="M 30 170 A 85 85 0 1 1 170 170"
              fill="none"
              stroke={getSpeedColor(displaySpeed)}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(displaySpeed / maxGaugeValue) * 400} 400`}
              className="transition-all duration-300"
              style={{
                strokeDashoffset: 0,
                filter: `drop-shadow(0 0 10px ${getSpeedColor(displaySpeed)})`
              }}
            />
            
            {/* Tick marks */}
            {[0, 20, 40, 60, 80, 100].map((tick, i) => {
              const angle = -120 + (i * 48);
              const rad = (angle * Math.PI) / 180;
              const x1 = 100 + 70 * Math.cos(rad);
              const y1 = 100 + 70 * Math.sin(rad);
              const x2 = 100 + 60 * Math.cos(rad);
              const y2 = 100 + 60 * Math.sin(rad);
              return (
                <line
                  key={tick}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#64748b"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              className="text-6xl font-black tabular-nums"
              style={{ color: getSpeedColor(displaySpeed) }}
            >
              {Math.round(displaySpeed)}
            </span>
            <span className="text-lg text-slate-400 font-medium mt-1">
              {unitLabel}
            </span>
          </div>
          
          {/* Needle */}
          <div 
            className="absolute top-1/2 left-1/2 w-1 h-28 origin-bottom transition-transform duration-300"
            style={{
              transform: `translate(-50%, -100%) rotate(${gaugeAngle}deg)`,
              background: `linear-gradient(to top, ${getSpeedColor(displaySpeed)}, transparent)`
            }}
          />
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-200 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg" />
        </div>

        {/* Control Button */}
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`mt-8 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-xl ${
            isTracking
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
          }`}
        >
          {isTracking ? '⏹ DETENER' : '▶ INICIAR'}
        </button>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Velocidad Máx</p>
            <p className="text-2xl font-bold text-cyan-400">
              {Math.round(displayMaxSpeed)} <span className="text-sm text-slate-500">{unitLabel}</span>
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Velocidad Prom</p>
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(displayAvgSpeed)} <span className="text-sm text-slate-500">{unitLabel}</span>
            </p>
          </div>
        </div>

        {/* Accelerometer Data */}
        {motionData && motionData.acceleration && (
          <div className="w-full max-w-md mt-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <p className="text-slate-400 text-sm mb-2">Acelerómetro</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-500">X</p>
                <p className="text-sm font-mono text-green-400">
                  {motionData.acceleration.x?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Y</p>
                <p className="text-sm font-mono text-green-400">
                  {motionData.acceleration.y?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Z</p>
                <p className="text-sm font-mono text-green-400">
                  {motionData.acceleration.z?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center max-w-md">
            {error}
          </div>
        )}

        {/* Instructions */}
        {!isTracking && !error && (
          <div className="mt-6 text-center text-slate-400 text-sm max-w-md">
            <p>Presiona INICIAR para comenzar a medir tu velocidad usando el GPS.</p>
            <p className="mt-2">Asegúrate de tener habilitada la ubicación en tu dispositivo.</p>
          </div>
        )}

        {/* Status indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-sm text-slate-400">
            {isTracking ? 'GPS Activo' : 'GPS Inactivo'}
          </span>
        </div>
      </main>
    </div>
  );
}

export default App;
