import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';

const HeroCanvas = dynamic(() => import('../components/HeroCanvas').then((mod) => mod.HeroCanvas), {
  ssr: false,
});

export default function Home() {
  const [launched, setLaunched] = useState(false);
  const [sceneState, setSceneState] = useState('earth'); // 'earth' or 'space'
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [cameraPos, setCameraPos] = useState([0, -0.5, 20]); // Zoomed out starting position to view both astronaut and Earth
  const [fov, setFov] = useState(38);
  const timeoutRef = useRef(null);
  const [fadeTransition, setFadeTransition] = useState('2.5s ease');

  const handleLaunchComplete = () => {
    // Optional
  };

  const handleLaunchStart = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Immediately start fade to black as launch begins
    setFadeTransition('1.0s ease');
    setOverlayOpacity(1);

    // Swap scene structure and camera once the screen is fully black
    const transitionTimeout = setTimeout(() => {
      setSceneState('space');
      setCameraPos([0, 3, 22]); // Wider view to see all planets
      setFov(45);

      // Fade back in to show the floating scene
      setFadeTransition('1.5s ease');
      setOverlayOpacity(0);
    }, 1100);

    timeoutRef.current = transitionTimeout;
  };

  const handleReturnToEarth = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Fade to black
    setFadeTransition('1.0s ease');
    setOverlayOpacity(1);

    const transitionTimeout = setTimeout(() => {
      setSceneState('earth');
      setLaunched(false);
      setCameraPos([0, -0.5, 20]); // Back to initial camera position
      setFov(38);

      // Fade back in
      setFadeTransition('1.5s ease');
      setOverlayOpacity(0);
    }, 1100);

    timeoutRef.current = transitionTimeout;
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleSpace = (event) => {
      if (event.code === 'Space' && !launched) {
        setLaunched(true);
      }
    };

    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [launched]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-space text-slate-100">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>
      <HeroCanvas
        launched={launched}
        sceneState={sceneState}
        onLaunchComplete={handleLaunchComplete}
        onLaunchStart={handleLaunchStart}
        onReturnToEarth={handleReturnToEarth}
        cameraPos={cameraPos}
        fov={fov}
      />
      <div className="absolute inset-0 bg-black pointer-events-none z-50" style={{ opacity: overlayOpacity, transition: fadeTransition }}></div>
      {!launched && sceneState === 'earth' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none z-40 animate-pulse text-center w-full">
          <p 
            className="text-[#9ec5ff] text-sm md:text-base lg:text-lg drop-shadow-[0_0_8px_rgba(158,197,255,0.8)]"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Press Spacebar to Lift Off
          </p>
        </div>
      )}
    </main>
  );
}