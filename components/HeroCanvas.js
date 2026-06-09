'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF } from '@react-three/drei';
import { MathUtils } from 'three';
import * as THREE from 'three';

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

function PlanetModel({ modelPath, position, ringColor }) {
  const gltf = useGLTF(modelPath);
  const ref = useRef();
  // Compute uniform scale based on model's bounding box dimensions
  const uniformScale = useMemo(() => {
    // Ensure the scene is cloned to avoid mutating original
    const sceneClone = gltf.scene.clone();
    const box = new THREE.Box3().setFromObject(sceneClone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    // Desired visual size (adjust as needed)
    const baseTarget = 3.0;
    const targetSize = modelPath === '/saturn (1).glb' || modelPath === '/saturn.glb'
      ? baseTarget * 3.0 // double Saturn size (original 1.5 * 2)
      : modelPath === '/black_hole.glb'
      ? baseTarget * 5.0 // double black hole size (original 2.5 * 2)
      : baseTarget;
    return maxDim > 0 ? targetSize / maxDim : 1.0;
  }, [gltf]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={ref} position={position} scale={uniformScale}>
      <primitive object={gltf.scene.clone()} />
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

  const currentScale = sceneState === 'space' ? 1.5 : 1.3;
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
        // Five planets using available models
            { modelPath: '/saturn (1).glb', position: [6 * Math.cos(0), 0, 6 * Math.sin(0)], ringColor: '#e0b7ff' },
          { modelPath: '/earth.glb', position: [6 * Math.cos(Math.PI / 2.5), 0, 6 * Math.sin(Math.PI / 2.5)], ringColor: null },
           { modelPath: '/planet.glb', position: [6 * Math.cos(2 * Math.PI / 2.5), 0, 6 * Math.sin(2 * Math.PI / 2.5)], ringColor: null },
           { modelPath: '/black_hole.glb', position: [6 * Math.cos(3 * Math.PI / 2.5), 0, 6 * Math.sin(3 * Math.PI / 2.5)], ringColor: null },
          { modelPath: '/purple_planet.glb', position: [6 * Math.cos(4 * Math.PI / 2.5), 0, 6 * Math.sin(4 * Math.PI / 2.5)], ringColor: null }
      ];
    } else {
      // Initial scene: a single distant Saturn
      return [
         { modelPath: '/saturn (1).glb', position: [5.5, 2.0, -15.0], scale: 0.8, ringColor: '#e0b7ff' },
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