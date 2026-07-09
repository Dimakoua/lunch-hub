import React, { useEffect, useRef, useState } from 'react';
import { Compass, CameraOff, Smartphone, ChevronLeft, MapPin, Route, Navigation } from 'lucide-react';
import { Restaurant, Location } from '../types/restaurant';
import { getBearing, getDistance, getRelativeAngle } from '../utils/arMath';
import { formatDistance, formatWalkingTime } from '../utils/distanceFormatter';

interface ARFoodFinderProps {
  userLocation: Location;
  restaurants: Restaurant[];
  onClose: () => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  useImperial: boolean;
}

interface ARTag {
  restaurant: Restaurant;
  distance: number;
  bearing: number;
  relativeAngle: number;
}

export const ARFoodFinder: React.FC<ARFoodFinderProps> = ({
  userLocation,
  restaurants,
  onClose,
  onSelectRestaurant,
  useImperial,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [cameraError, setCameraError] = useState(false);
  const [sensorError, setSensorError] = useState(false);
  const [iosPromptRequired, setIosPromptRequired] = useState(false);
  const [activeTags, setActiveTags] = useState<ARTag[]>([]);

  // Start Rear Camera Stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(false);
    } catch (err) {
      console.error('AR Camera init failed:', err);
      setCameraError(true);
    }
  };

  const handleOrientation = (e: DeviceOrientationEvent) => {
    let currentHeading = e.alpha || 0;
    // Handle iOS Webkit compass heading specifically
    if ('webkitCompassHeading' in e) {
      currentHeading = (e as any).webkitCompassHeading;
    }
    setHeading(currentHeading);
  };

  const requestSensorPermission = async () => {
    const DeviceOrientation = DeviceOrientationEvent as any;
    if (typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const response = await DeviceOrientation.requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          setIosPromptRequired(false);
          setSensorError(false);
        } else {
          setSensorError(true);
        }
      } catch (err) {
        console.error('Sensor request failed:', err);
        setSensorError(true);
      }
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
      setSensorError(false);
    }
  };

  // Check orientation sensor support & permission prompts on mount
  useEffect(() => {
    startCamera();

    const DeviceOrientation = DeviceOrientationEvent as any;
    if (typeof DeviceOrientation.requestPermission === 'function') {
      setIosPromptRequired(true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      // Clean up orientation listener
      window.removeEventListener('deviceorientation', handleOrientation);
      
      // Stop webcam track
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Compute AR tag overlays periodically
  useEffect(() => {
    if (restaurants.length === 0) return;

    const tags: ARTag[] = restaurants.map((r) => {
      const distance = getDistance(userLocation.lat, userLocation.lon, r.lat, r.lon);
      const bearing = getBearing(userLocation.lat, userLocation.lon, r.lat, r.lon);
      const relativeAngle = getRelativeAngle(heading, bearing);

      return {
        restaurant: r,
        distance,
        bearing,
        relativeAngle,
      };
    });

    // Sort by distance (so closer cards render on top of farther ones)
    tags.sort((a, b) => b.distance - a.distance);
    setActiveTags(tags);
  }, [restaurants, userLocation, heading]);

  const getCompassDirection = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg % 360) / 45)) % 8;
    return directions[index];
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      {/* Background Camera Feed */}
      {!cameraError ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-4 bg-slate-950 z-0">
          <CameraOff className="w-16 h-16 opacity-30 text-red-500" />
          <h3 className="text-lg font-bold text-white">Camera Access Blocked</h3>
          <p className="text-sm max-w-xs leading-relaxed">
            Augmented Reality mode requires rear camera access. Enable camera permissions in your browser settings.
          </p>
        </div>
      )}

      {/* AR Tag Floating Cards Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {activeTags.map((tag) => {
          // Filter within 35° Field of View (FOV)
          const fov = 35;
          if (Math.abs(tag.relativeAngle) > fov) return null;

          // Map relative angle difference to horizontal screen coordinate (10% to 90%)
          const xPercent = 50 + (tag.relativeAngle / fov) * 40;

          // Scale card sizes based on distance (closer = bigger scale, max 1.1, min 0.5)
          const maxDist = 1200; // 1.2km
          const distanceFactor = Math.max(0, Math.min(1, tag.distance / maxDist));
          const scale = 1.1 - distanceFactor * 0.5;
          const opacity = 1.0 - distanceFactor * 0.6;
          
          // Vertical offset to create 3D depth (farther is higher on screen)
          const yPercent = 50 - distanceFactor * 20;

          return (
            <div
              key={tag.restaurant.id}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity: opacity,
                zIndex: Math.round(100 - distanceFactor * 50),
              }}
            >
              {/* Glassmorphic Food Card */}
              <div 
                onClick={() => onSelectRestaurant(tag.restaurant)}
                className="bg-slate-900/80 dark:bg-slate-950/85 text-white backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-[200px] max-w-[240px] cursor-pointer hover:border-emerald-400 active:scale-95 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-sm truncate leading-snug w-[140px]">
                    {tag.restaurant.name}
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md flex-shrink-0">
                    {tag.restaurant.cuisine || tag.restaurant.amenity || 'Food'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{formatDistance(tag.distance)}</span>
                  <span className="text-slate-500">•</span>
                  <span>{formatWalkingTime(tag.distance)} walk</span>
                </div>
              </div>

              {/* Dotted anchor line linking to the ground */}
              <div className="w-[1.5px] h-20 bg-gradient-to-b from-white/40 to-transparent mx-auto mt-1 border-dashed border-l border-white/30" />
            </div>
          );
        })}
      </div>

      {/* TOP HUD: Compass Header & Exit button */}
      <div className="relative z-20 px-4 py-3 bg-gradient-to-b from-slate-950/70 to-transparent flex items-center justify-between pointer-events-none">
        <button
          onClick={onClose}
          className="pointer-events-auto p-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-slate-800 text-white transition active:scale-95 shadow-lg"
          aria-label="Exit AR mode"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Compass HUD */}
        <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-2 rounded-2xl shadow-lg">
          <div className="flex items-center gap-1.5 text-white font-extrabold text-sm uppercase tracking-widest">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <span>{Math.round(heading)}° {getCompassDirection(heading)}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Compass Heading</span>
        </div>

        <div className="w-11 h-11" /> {/* Spacer */}
      </div>

      {/* BOTTOM HUD: Sensors Prompt & Manual Compass Slider fallback */}
      <div className="mt-auto relative z-20 px-6 py-6 bg-gradient-to-t from-slate-950/80 to-transparent flex flex-col gap-4 pointer-events-none">
        
        {/* iOS Orientation Permission prompt */}
        {iosPromptRequired && (
          <div className="mx-auto pointer-events-auto max-w-sm w-full bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-center shadow-xl">
            <Smartphone className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-bounce" />
            <h4 className="text-white font-bold text-sm">Motion Sensors Required</h4>
            <p className="text-slate-400 text-xs mt-1 mb-4">
              Accept motion calibration to unlock the live compass look-around mode.
            </p>
            <button
              onClick={requestSensorPermission}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition active:scale-95"
            >
              Calibrate Compass
            </button>
          </div>
        )}

        {/* Desktop Sweep Slider Fallback */}
        {(!iosPromptRequired || cameraError) && (
          <div className="mx-auto pointer-events-auto max-w-md w-full bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-3xl shadow-xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                No Sensor detected? Drag to Rotate manually
              </span>
              <span className="text-slate-400">Heading: {Math.round(heading)}°</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="359"
              value={Math.round(heading)}
              onChange={(e) => setHeading(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
