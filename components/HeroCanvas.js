'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF } from '@react-three/drei';
import { MathUtils } from 'three';

function FireTrail({ position, active }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 2.2;
  });

  return (
    <group ref={ref} position={position} scale={active ? 1.1 : 0.6}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.07, 0.25, 18]} />
        <meshStandardMaterial emissive="#ff9d55" color="#f97316" transparent opacity={active ? 0.95 : 0.35} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial emissive="#facc15" color="#fbbf24" transparent opacity={active ? 0.88 : 0.3} />
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

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <primitive object={gltf.scene} />
      {ringColor ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}> 
          <torusGeometry args={[1.25, 0.08, 20, 120]} />
          <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={0.18} transparent opacity={0.55} />
        </mesh>
      ) : null}
    </group>
  );
}

function Astronaut({ launched }) {
  const group = useRef();
  const gltf = useGLTF('/astronaut.glb');

  useFrame((state) => {
    if (!group.current) return;

    const idleY = Math.sin(state.clock.elapsedTime * 1.2) * 0.18;
    const idleX = Math.sin(state.clock.elapsedTime * 0.55) * 0.05;
    const targetY = launched ? -17.8 : -9.8;
    const targetZ = launched ? -10.8 : -4.2;
    const targetRotY = launched ? Math.PI * 0.7 : Math.PI;
    const targetRotZ = launched ? 0.16 : 0.05;

    group.current.position.y = MathUtils.lerp(group.current.position.y, targetY + idleY, 0.05);
    group.current.position.z = MathUtils.lerp(group.current.position.z, targetZ, 0.04);
    group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, targetRotY, 0.03);
    group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, idleX, 0.035);
    group.current.rotation.z = MathUtils.lerp(group.current.rotation.z, targetRotZ, 0.03);
  });

  const leftBoot = [0.14, -0.16, 0.05];
  const rightBoot = [-0.14, -0.16, 0.05];

  return (
    <group ref={group} position={[0, -9.8, -4.2]} rotation={[0, Math.PI, 0]} scale={launched ? 7.8 : 7.0}>
      <primitive object={gltf.scene} />
      <FireTrail position={leftBoot} active={launched} />
      <FireTrail position={rightBoot} active={launched} />
    </group>
  );
}

export function HeroCanvas({ launched }) {
  const starField = useMemo(() => <StarField />, []);
  const planets = useMemo(
    () => [
      { modelPath: '/saturn.glb', position: [3.6, 1.5, -9.8], scale: 0.65, ringColor: '#e0b7ff' },
      { modelPath: '/saturn.glb', position: [-4.1, -0.8, -10.5], scale: 0.48, ringColor: '#f8c56f' },
      { modelPath: '/saturn.glb', position: [4.9, -0.5, -12.4], scale: 0.38, ringColor: '#78c7ff' },
    ],
    []
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-[#020617]">
      <Canvas camera={{ position: [0, 2.6, 155], fov: 28 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 2]} intensity={1.2} color="#9ec5ff" />
        <directionalLight position={[-4, -2, -3]} intensity={0.45} color="#c76cff" />
        <pointLight position={[0, 3, -1]} intensity={0.55} color="#ffffff" />
        <Stars radius={260} depth={120} count={22000} factor={6} saturation={0} fade speed={0.76} />
        {starField}
        <Suspense fallback={null}>
          <PlanetModel modelPath="/earth.glb" position={[0, -11.3, -4.2]} scale={0.14} ringColor={null} />
          {planets.map((planet, index) => (
            <PlanetModel key={index} {...planet} />
          ))}
          <Astronaut launched={launched} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
          enableDamping
          dampingFactor={0.15}
          rotateSpeed={0.55}
        />
      </Canvas>
    </div>
  );
}
