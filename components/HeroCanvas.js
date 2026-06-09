'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF } from '@react-three/drei';
import { MathUtils } from 'three';

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

function PlanetModel({ modelPath, position, scale, ringColor }) {
  const gltf = useGLTF(modelPath);
  const ref = useRef();
  // Safe cloning of GLTF scene to prevent resource stealing across multiple instances
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <primitive object={scene} />
      {ringColor ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.25, 0.08, 20, 120]} />
          <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={0.18} transparent opacity={0.55} />
        </mesh>
      ) : null}
    </group>
  );
}

function Astronaut({ launched, sceneState, onLaunchComplete, onPeak, onLaunchStart }) {
  const group = useRef();
  const gltf = useGLTF('/astronaut.glb');
  const prevYRef = useRef(0);
  const peakCalledRef = useRef(false);
  const startCalledRef = useRef(false);

  // Track precise launch time for the pre-launch shake and engine ignition animation
  const launchStartTime = useRef(null);

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

      let targetY = 0.2; // Align astronaut feet with Earth surface
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

  const currentScale = sceneState === 'space' ? 1.8 : 1.3;
  const [fadeTransition, setFadeTransition] = useState('2.5s ease');
  const initialPosition = sceneState === 'space' ? [0, 0, 0] : [0, 2, 0];


  return (
    <group ref={group} position={initialPosition} rotation={[0, 0, 0]} scale={currentScale}>
      <primitive object={gltf.scene} />
      <FireTrail position={leftBoot} active={launched && sceneState === 'earth'} />
      <FireTrail position={rightBoot} active={launched && sceneState === 'earth'} />
    </group>
  );
}

export function HeroCanvas({ launched, sceneState, onLaunchComplete, onPeak, onLaunchStart, cameraPos = [0, -0.5, 20], fov = 38 }) {
  const starField = useMemo(() => <StarField />, []);

  const planets = useMemo(() => {
    if (sceneState === 'space') {
      return [
        { modelPath: '/saturn.glb', position: [-4.2, 1.8, -6.5], scale: 0.55, ringColor: '#e0b7ff' },
        { modelPath: '/saturn.glb', position: [4.5, -1.2, -5.8], scale: 0.45, ringColor: '#fb923c' },
        { modelPath: '/earth.glb', position: [-3.8, -2.2, -7.0], scale: 0.018, ringColor: null },
        { modelPath: '/saturn.glb', position: [3.5, 2.5, -8.0], scale: 0.35, ringColor: '#38bdf8' },
      ];
    } else {
      // Saturn off in the distance in the initial scene
      return [
        { modelPath: '/saturn.glb', position: [5.5, 2.0, -15.0], scale: 0.8, ringColor: '#e0b7ff' },
      ];
    }
  }, [sceneState]);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#020617]">
      <Canvas camera={{ position: cameraPos, fov }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 2]} intensity={1.5} color="#9ec5ff" />
        <directionalLight position={[-4, -2, -3]} intensity={0.65} color="#c76cff" />
        <pointLight position={[0, 3, -1]} intensity={0.85} color="#ffffff" />
        <Stars radius={260} depth={120} count={22000} factor={6} saturation={0} fade speed={0.76} />
        {starField}
        <Suspense fallback={null}>
          {sceneState === 'earth' && (
            <PlanetModel modelPath="/earth.glb" position={[0, -2.8, 0]} scale={0.03} ringColor={null} />
          )}
          {planets.map((planet, index) => (
            <PlanetModel key={`${sceneState}-${index}`} {...planet} />
          ))}
          <Astronaut
            launched={launched}
            sceneState={sceneState}
            onLaunchComplete={onLaunchComplete}
            onPeak={onPeak}
            onLaunchStart={onLaunchStart}
          />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={sceneState === 'space' ? 0 : Math.PI / 6}
          maxPolarAngle={sceneState === 'space' ? Math.PI : Math.PI - Math.PI / 6}
          enableDamping
          dampingFactor={0.15}
          rotateSpeed={0.55}
        />
      </Canvas>
    </div>
  );
}