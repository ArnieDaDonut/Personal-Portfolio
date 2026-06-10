'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, Html, ScrollControls, Scroll, useScroll } from '@react-three/drei';
import { MathUtils } from 'three';
import * as THREE from 'three';

function CameraUpdater({ cameraPos, fov }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...cameraPos);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [cameraPos, fov, camera]);
  return null;
}

function PresentationScene({ modelPath, onBack }) {
  const scroll = useScroll();
  const planetGltf = useGLTF(modelPath); // Kept in case we still want to show the original planet far below or in sky, but not used for floor now.
  const astronautGltf = useGLTF('/astronaut.glb');
  const volcanoGltf = useGLTF('/free__volcano_low_poly.glb');
  const lavaGltf = useGLTF('/low_poly_lava.glb');
  const astronautRef = useRef();
  const landscapeRef = useRef();

  const presentationLavaTiles = useMemo(() => {
    const tiles = [];
    const tileCount = 15; // 15x15 grid — covers the full floor area around the volcanoes so it reads as infinite
    const spacing = 700;
    for (let ix = -Math.floor(tileCount / 2); ix <= Math.floor(tileCount / 2); ix++) {
      for (let iz = -Math.floor(tileCount / 2); iz <= Math.floor(tileCount / 2); iz++) {
        tiles.push(
          <group key={`plava-${ix},${iz}`} position={[ix * spacing, 0, iz * spacing]} scale={800}>
            <primitive object={lavaGltf.scene.clone()} />
          </group>
        );
      }
    }
    return <>{tiles}</>;
  }, [lavaGltf]);

  useFrame((state, delta) => {
    if (!astronautRef.current || !landscapeRef.current) return;
    const offset = scroll.offset; // 0 to 1

    // Astronaut descends initially, and stops lower on the screen (Y=-6)
    const astronautTargetY = 8 - Math.min(offset * 20, 14);
    astronautRef.current.position.y = MathUtils.lerp(astronautRef.current.position.y, astronautTargetY, 0.1);

    // Astronaut tumbling logic: tumbles while falling, but rights itself perfectly at offset === 1
    if (offset < 0.9) {
      astronautRef.current.rotation.x = MathUtils.lerp(astronautRef.current.rotation.x, offset * Math.PI * 4, 0.05);
      astronautRef.current.rotation.y += delta * 0.2;
      astronautRef.current.rotation.z = MathUtils.lerp(astronautRef.current.rotation.z, offset * Math.PI, 0.05);
    } else {
      astronautRef.current.rotation.x = MathUtils.lerp(astronautRef.current.rotation.x, 0, 0.1);
      astronautRef.current.rotation.y = MathUtils.lerp(astronautRef.current.rotation.y, 0, 0.1);
      astronautRef.current.rotation.z = MathUtils.lerp(astronautRef.current.rotation.z, 0, 0.1);
    }

    // Landscape rushes UPWARDS to meet the astronaut
    // We adjust the final Y so that the lava floor aligns with the astronaut's boots at Y=-6
    const landscapeTargetY = -120 + offset * 114; // Ends at -6
    landscapeRef.current.position.y = MathUtils.lerp(landscapeRef.current.position.y, landscapeTargetY, 0.1);
  });

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
      {/* Lava glow lights for fiery ambiance */}
      <pointLight position={[0, -5, 0]} intensity={8} color="#ff4400" distance={800} decay={2} />
      <pointLight position={[-400, -5, -300]} intensity={6} color="#ff6600" distance={600} decay={2} />
      <pointLight position={[400, -5, -200]} intensity={6} color="#ff3300" distance={600} decay={2} />

      <group ref={astronautRef} position={[0, 8, 2]}>
        <primitive object={astronautGltf.scene.clone()} scale={1.5} />
      </group>

      {/* The entire moving landscape */}
      <group ref={landscapeRef} position={[0, -120, 0]}>
        {/* Large base lava tile to fill any gaps at the horizon */}
        <primitive object={lavaGltf.scene.clone()} scale={5000} position={[0, 0, 0]} />
        {/* Dense tiled lava floor grid */}
        {presentationLavaTiles}

        {/* Volcanoes sitting ON the lava surface */}
        <group position={[-350, 0, -500]} scale={180} rotation={[0, Math.PI / 4, 0]}>
          <primitive object={volcanoGltf.scene.clone()} />
        </group>
        <group position={[300, 0, -600]} scale={220} rotation={[0, -Math.PI / 6, 0]}>
          <primitive object={volcanoGltf.scene.clone()} />
        </group>
        <group position={[0, 0, -800]} scale={300} rotation={[0, Math.PI, 0]}>
          <primitive object={volcanoGltf.scene.clone()} />
        </group>
        <group position={[-600, 0, -350]} scale={150} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={volcanoGltf.scene.clone()} />
        </group>
        <group position={[550, 0, -450]} scale={170} rotation={[0, -Math.PI / 3, 0]}>
          <primitive object={volcanoGltf.scene.clone()} />
        </group>

        {/* Lava patches placed the same way as the volcanoes, just at their own positions */}
        <group position={[-350, 0, -500]} scale={220} rotation={[0, Math.PI / 4, 0]}>
          <primitive object={lavaGltf.scene.clone()} />
        </group>
        <group position={[300, 0, -600]} scale={260} rotation={[0, -Math.PI / 6, 0]}>
          <primitive object={lavaGltf.scene.clone()} />
        </group>
        <group position={[0, 0, -800]} scale={350} rotation={[0, Math.PI, 0]}>
          <primitive object={lavaGltf.scene.clone()} />
        </group>
        <group position={[-600, 0, -350]} scale={190} rotation={[0, Math.PI / 2, 0]}>
          <primitive object={lavaGltf.scene.clone()} />
        </group>
        <group position={[550, 0, -450]} scale={210} rotation={[0, -Math.PI / 3, 0]}>
          <primitive object={lavaGltf.scene.clone()} />
        </group>
      </group>

      <Scroll html>
        <div style={{ position: 'absolute', top: '10vh', left: '10vw', width: '40vw' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-orange-500 mb-4 font-mono drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">The Upper Atmosphere</h1>
          <p className="text-lg md:text-xl text-orange-100 bg-black/60 p-6 rounded-xl border border-orange-500/30 backdrop-blur-sm">
            Welcome to the presentation! As we descend through the fiery atmosphere of this shattered world, we'll explore Chapter 1 of the English project. Scroll down to descend further.
          </p>
        </div>

        <div style={{ position: 'absolute', top: '120vh', right: '10vw', width: '40vw' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-orange-500 mb-4 font-mono drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">The Middle Layers</h1>
          <p className="text-lg md:text-xl text-orange-100 bg-black/60 p-6 rounded-xl border border-orange-500/30 backdrop-blur-sm">
            The pressure increases. Here we discuss the major themes and motifs found in the literature, analyzing the core conflicts of the narrative.
          </p>
        </div>

        <div style={{ position: 'absolute', top: '220vh', left: '10vw', width: '40vw' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-orange-500 mb-4 font-mono drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">Nearing the Surface</h1>
          <p className="text-lg md:text-xl text-orange-100 bg-black/60 p-6 rounded-xl border border-orange-500/30 backdrop-blur-sm">
            Character development and conflict resolution take center stage as we approach the final destination of our literary journey.
          </p>
        </div>

        <div style={{ position: 'absolute', top: '320vh', right: '10vw', width: '40vw' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-orange-500 mb-4 font-mono drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">Touchdown</h1>
          <p className="text-lg md:text-xl text-orange-100 bg-black/60 p-6 rounded-xl border border-orange-500/30 backdrop-blur-sm">
            We have landed. This concludes the presentation.
          </p>
          <button
            onClick={onBack}
            className="mt-8 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(234,88,12,0.6)] font-mono uppercase tracking-wider"
          >
            Back to Space
          </button>
        </div>
      </Scroll>
    </>
  );
}

function FireTrail({ position, active }) {
  const ref = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 6;

    // Intense flickering rocket plume animation
    if (active) {
      const flicker = 1.0 + Math.sin(state.clock.elapsedTime * 45) * 0.25;
      ref.current.scale.set(flicker * 1.4, flicker * 2.8, flicker * 1.4);
    } else {
      ref.current.scale.set(0.01, 0.01, 0.01);
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Outer orange flame cone */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.09, 0.38, 12]} />
        <meshStandardMaterial emissive="#ff4500" color="#f97316" transparent opacity={active ? 0.95 : 0} />
      </mesh>
      {/* Inner yellow hot core */}
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.24, 10]} />
        <meshStandardMaterial emissive="#ffea00" color="#facc15" transparent opacity={active ? 0.98 : 0} />
      </mesh>
      {/* Small blue base flame for realism */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.08, 8]} />
        <meshStandardMaterial emissive="#00d2ff" color="#38bdf8" transparent opacity={active ? 0.9 : 0} />
      </mesh>
    </group>
  );
}

function StarField() {
  const positions = useMemo(() => {
    const count = 16000;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const radius = 130 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      array[i * 3 + 2] = radius * Math.cos(phi);
    }

    return array;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={positions.length / 3} />
      </bufferGeometry>
      <pointsMaterial color="#f8fbff" size={0.45} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function PlanetModel({ modelPath, position, ringColor, scale = 1.0, onClick, interactive = true, label }) {
  const gltf = useGLTF(modelPath);
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const hoverScale = useRef(1);

  const { uniformScale, hitBoxRadius } = useMemo(() => {
    const sceneClone = gltf.scene.clone();
    const box = new THREE.Box3().setFromObject(sceneClone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    const baseTarget = 3.0;
    const targetSize = modelPath === '/saturn.glb' || modelPath === '/saturn.glb'
      ? baseTarget * 3.0
      : modelPath === '/black_hole.glb'
        ? baseTarget * 5.0
        : modelPath === '/earth.glb'
          ? baseTarget * 2.5
          : baseTarget;

    const uScale = (maxDim > 0 ? targetSize / maxDim : 1.0) * scale;
    const radius = (maxDim > 0 ? maxDim / 2 : 1.0) * uScale * 1.2;
    return { uniformScale: uScale, hitBoxRadius: radius };
  }, [gltf, modelPath, scale]);

  useFrame((_, delta) => {
    if (ref.current && modelPath !== '/black_hole.glb') ref.current.rotation.y += delta * 0.08;
    const t = 1 - Math.pow(0.001, delta);
    const target = hovered ? 1.2 : 1;
    hoverScale.current = MathUtils.lerp(hoverScale.current, target, t);
    const currentScale = uniformScale * hoverScale.current;
    if (ref.current) {
      ref.current.scale.set(currentScale, currentScale, currentScale);
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {interactive && (
        <mesh
          visible={false}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[hitBoxRadius, 16, 16]} />
          <meshBasicMaterial />
        </mesh>
      )}
      <group ref={ref} scale={uniformScale}>
        <primitive object={gltf.scene.clone()} />
        {ringColor && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.25, 0.08, 20, 120]} />
            <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={0.18} transparent opacity={0.55} />
          </mesh>
        )}
      </group>
      {label && (
        <Html position={[0, hitBoxRadius + 0.8, 0]} center zIndexRange={[100, 0]}>
          <div
            className="text-white text-sm whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none select-none"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              opacity: hovered ? 1 : 0.6,
              transition: 'opacity 0.2s, transform 0.2s',
              transform: hovered ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Astronaut({ launched, sceneState, onLaunchComplete, onPeak, onLaunchStart }) {
  const group = useRef();
  const gltf = useGLTF('/astronaut.glb');
  const earthGltf = useGLTF('/earth.glb');
  const prevYRef = useRef(0);
  const peakCalledRef = useRef(false);
  const startCalledRef = useRef(false);

  // Track precise launch time for the pre-launch shake and engine ignition animation
  const launchStartTime = useRef(null);

  const { earthSurfaceY, footOffset } = useMemo(() => {
    // 1. Earth radius calculation
    const earthBox = new THREE.Box3().setFromObject(earthGltf.scene.clone());
    const earthSize = new THREE.Vector3();
    earthBox.getSize(earthSize);
    const earthMaxDim = Math.max(earthSize.x, earthSize.y, earthSize.z);

    const earthBaseTarget = 3.0;
    const earthTargetSize = earthBaseTarget * 2.5;
    const earthScale = (earthMaxDim > 0 ? earthTargetSize / earthMaxDim : 1.0) * 0.45;
    const earthRadius = (earthSize.y / 2) * earthScale;
    const earthCenterY = -2.8;

    // 2. Astronaut foot offset
    const astroBox = new THREE.Box3().setFromObject(gltf.scene.clone());
    const astroOffset = -astroBox.min.y;

    return {
      earthSurfaceY: earthCenterY + earthRadius,
      footOffset: astroOffset
    };
  }, [earthGltf, gltf]);

  useFrame((state) => {
    if (!group.current) return;

    // Fire onLaunchStart on the first frame after launch begins
    if (launched && onLaunchStart && !startCalledRef.current) {
      onLaunchStart();
      startCalledRef.current = true;
      launchStartTime.current = state.clock.getElapsedTime();
    }
    if (!launched) {
      startCalledRef.current = false;
      launchStartTime.current = null;
    }

    if (sceneState === 'space') {
      // Gentle floating/drifting animation in space (exaggerated for better visibility)
      const floatY = Math.sin(state.clock.elapsedTime * 0.8) * 0.35;
      const floatX = Math.sin(state.clock.elapsedTime * 0.5) * 0.25;
      const swayY = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
      const leanZ = Math.sin(state.clock.elapsedTime * 0.6) * 0.18;

      group.current.position.x = MathUtils.lerp(group.current.position.x, floatX, 0.05);
      group.current.position.y = MathUtils.lerp(group.current.position.y, floatY, 0.05);
      group.current.position.z = MathUtils.lerp(group.current.position.z, 0, 0.05);

      group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, swayY, 0.05);
      group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, floatX * 0.4, 0.05);
      group.current.rotation.z = MathUtils.lerp(group.current.rotation.z, leanZ, 0.05);
    } else {
      // Earth state (landing + launch physics)
      // Exaggerate idle animation to make it clearly noticeable
      const idleY = Math.sin(state.clock.elapsedTime * 1.8) * 0.18;
      const idleX = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
      const idleSwayY = Math.sin(state.clock.elapsedTime * 0.9) * 0.14;
      const idleLeanZ = Math.sin(state.clock.elapsedTime * 1.2) * 0.09;

      let targetY = earthSurfaceY + footOffset * 1.3; // Align astronaut feet with Earth surface
      let shakeX = 0;
      let shakeZ = 0;

      if (launched && launchStartTime.current !== null) {
        const elapsed = state.clock.getElapsedTime() - launchStartTime.current;
        if (elapsed < 0.8) {
          // Pre-takeoff engine ignition shake
          shakeX = (Math.random() - 0.5) * 0.15;
          shakeZ = (Math.random() - 0.5) * 0.15;
          targetY = 7; // keep locked on launchpad above surface
        } else {
          // Accelerate upwards
          targetY = 200; // Wayyyy upward launch
        }
      }

      const targetZ = 0; // No backward movement on launch
      const targetRotY = launched ? Math.PI * 0.7 : 0;
      const targetRotZ = launched ? 0.16 : 0;

      group.current.position.x = MathUtils.lerp(group.current.position.x, shakeX, 0.05);
      group.current.position.y = MathUtils.lerp(group.current.position.y, targetY + (launched ? 0 : idleY), 0.025);
      group.current.position.z = MathUtils.lerp(group.current.position.z, targetZ, 0.02);

      const rotYLerp = launched ? 0.015 : 0.18;
      const rotXLerp = launched ? 0.0175 : 0.12;
      const rotZLerp = launched ? 0.015 : 0.12;

      group.current.rotation.y = MathUtils.lerp(
        group.current.rotation.y,
        targetRotY + (launched ? 0 : idleSwayY),
        rotYLerp
      );
      group.current.rotation.x = MathUtils.lerp(
        group.current.rotation.x,
        launched ? 0 : idleX,
        rotXLerp
      );
      group.current.rotation.z = MathUtils.lerp(
        group.current.rotation.z,
        targetRotZ + (launched ? 0 : idleLeanZ),
        rotZLerp
      );

      // Check if launch is complete
      if (launched && onLaunchComplete) {
        const position = group.current.position;
        setFadeTransition('2.0s ease');
        const distanceSq =
          Math.pow(position.y - targetY, 2) +
          Math.pow(position.z - targetZ, 2) +
          Math.pow(group.current.rotation.y - targetRotY, 2);
        if (distanceSq < 0.01) {
          onLaunchComplete();
        }
      }

      // Peak detection
      if (launched && onPeak && !peakCalledRef.current) {
        const currentY = group.current.position.y;
        const velocityY = currentY - prevYRef.current;
        prevYRef.current = currentY;
        if (Math.abs(velocityY) < 0.005) {
          onPeak();
          peakCalledRef.current = true;
        }
      }
    }
  });

  const leftBoot = [0.14, -0.16, 0.05];
  const rightBoot = [-0.14, -0.16, 0.05];

  const currentScale = sceneState === 'space' ? 1.5 : 1.3;
  const [fadeTransition, setFadeTransition] = useState('2.5s ease');
  const initialPosition = sceneState === 'space' ? [0, 0, 0] : [0, 2, 0];


  return (
    <group ref={group} position={initialPosition} rotation={[0, 0, 0]} scale={currentScale} raycast={() => null}>
      <primitive object={gltf.scene} />
      <FireTrail position={leftBoot} active={launched && sceneState === 'earth'} />
      <FireTrail position={rightBoot} active={launched && sceneState === 'earth'} />
    </group>
  );
}

export function HeroCanvas({ launched, sceneState, selectedPlanet, onLaunchComplete, onPeak, onLaunchStart, onReturnToEarth, onPlanetClick, onBackToSpace, cameraPos = [0, -0.5, 20], fov = 38 }) {
  const lavaGltf = useGLTF('/just_lava.glb');




  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  // Hide prompt on spacebar press
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') {
        setShowPrompt(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);

  // Show prompt after 5 seconds to allow models to load
  useEffect(() => {
    const timer = setTimeout(() => setShowPrompt(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  const planets = useMemo(() => {
    if (sceneState === 'space') {
      return [
        { modelPath: '/saturn.glb', position: [10.0 * Math.cos(0), 1.5, 10.0 * Math.sin(0)], ringColor: '#e0b7ff', scale: 0.7, label: '' },
        { modelPath: '/earth.glb', position: [7.0 * Math.cos(Math.PI * 0.4), -1.0, 7.0 * Math.sin(Math.PI * 0.4)], ringColor: null, scale: 0.45, label: 'Back to Main Menu', onClick: onReturnToEarth },
        { modelPath: '/black_hole.glb', position: [8.0 * Math.cos(Math.PI * 1.2), 0, 14.0 * Math.sin(Math.PI * 1.2)], ringColor: null, scale: 0.9, label: '' },
        { modelPath: '/planet.glb', position: [7.0 * Math.cos(Math.PI * 0.8), 0, 7.0 * Math.sin(Math.PI * 0.8)], ringColor: null, scale: 1.5, label: 'English Presentation', onClick: () => onPlanetClick('/planet.glb') },
        { modelPath: '/purple_planet.glb', position: [7.0 * Math.cos(Math.PI * 1.6), 0, 7.0 * Math.sin(Math.PI * 1.6)], ringColor: null, scale: 1.2, label: '' },
      ];
    } else {
      // Initial scene: a single distant Saturn
      return [];
    }
  }, [sceneState]);

  const lavaTiles = useMemo(() => {
    const tiles = [];
    const tileCount = 5;
    const spacing = 800;
    const floorY = -10;
    for (let ix = -Math.floor(tileCount / 2); ix <= Math.floor(tileCount / 2); ix++) {
      for (let iz = -Math.floor(tileCount / 2); iz <= Math.floor(tileCount / 2); iz++) {
        tiles.push(
          <group key={`${ix},${iz}`} position={[ix * spacing, floorY, iz * spacing]} scale={800}>
            <primitive object={lavaGltf.scene.clone()} />
          </group>
        );
      }
    }
    return <>{tiles}</>;
  }, [lavaGltf]);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#020617]">
      <Canvas camera={{ position: cameraPos, fov }}>
        <CameraUpdater cameraPos={cameraPos} fov={fov} />
        <ambientLight intensity={0.4} />
        {sceneState !== 'presentation' && (
          <>
            <directionalLight position={[5, 5, 2]} intensity={1.5} color="#9ec5ff" />
            <directionalLight position={[-4, -2, -3]} intensity={0.65} color="#c76cff" />
            <pointLight position={[0, 3, -1]} intensity={0.85} color="#ffffff" />
            <Stars radius={260} depth={120} count={22000} factor={6} saturation={0} fadeSpeed={0.76} />

          </>
        )}
        <Suspense fallback={null}>
          {sceneState === 'earth' && (
            <PlanetModel modelPath="/earth.glb" position={[0, -2.8, 0]} scale={0.45} ringColor={null} interactive={false} />
          )}
          {sceneState === 'space' && planets.map((planet, index) => (
            <PlanetModel key={`${sceneState}-${index}`} {...planet} />
          ))}
          {sceneState !== 'presentation' && (
            <>
              {/* Lava floor */}
              <primitive object={lavaGltf.scene.clone()} scale={4000} position={[0, -10, 0]} />
              {/* Tiled lava floor */}
              {lavaTiles}
              <Astronaut
                launched={launched}
                sceneState={sceneState}
                onLaunchComplete={onLaunchComplete}
                onPeak={onPeak}
                onLaunchStart={onLaunchStart}
              />
            </>
          )}


          {sceneState === 'presentation' && selectedPlanet && (
            <ScrollControls pages={4} damping={0.1}>
              <PresentationScene modelPath={selectedPlanet} onBack={onBackToSpace} />
            </ScrollControls>
          )}
        </Suspense>
        {sceneState !== 'presentation' && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={sceneState === 'space' ? 0 : Math.PI / 6}
            maxPolarAngle={sceneState === 'space' ? Math.PI : Math.PI - Math.PI / 6}
            enableDamping
            dampingFactor={0.15}
            rotateSpeed={0.55}
          />
        )}
      </Canvas>
      {showPrompt && !launched && sceneState === 'space' && (

        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-2xl font-mono z-10">
          Press spacebar to take off
        </div>
      )}
    </div>
  );
}