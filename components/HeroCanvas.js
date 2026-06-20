'use client';

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF, Html, ScrollControls, Scroll, useScroll, useTexture, Billboard, Line, Center } from '@react-three/drei';
import { MathUtils } from 'three';
import * as THREE from 'three';
import { createPortal } from 'react-dom';


function CameraUpdater({ cameraPos, fov }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...cameraPos);
    camera.fov = fov;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [cameraPos, fov, camera]);
  return null;
}

function RealisticStar({ pos, brightness, color = '#ffffff' }) {
  const meshRef = useRef();

  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = Math.sin(state.clock.elapsedTime * 1.5 + phase) * 0.5 + 0.5;
    // very subtle twinkle
    const s = (0.95 + t * 0.1) * brightness;
    meshRef.current.scale.set(s, s, s);
  });
  return (
    <group position={pos} ref={meshRef}>
      {/* Intense white core */}
      <mesh>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Primary color corona */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Soft atmospheric glow */}
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload('/rocket_ship.glb');

function RocketShipNavModel() {
  const { scene } = useGLTF('/rocket_ship.glb');
  const ref = useRef();

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.8;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={ref} rotation={[0, 0, Math.PI / 6]}>
      <Center>
        <primitive object={scene.clone()} scale={1.44} />
      </Center>
    </group>
  );
}

function PersistentNav({ onNavigate }) {
  return (
    <div className="fixed top-4 right-4 z-[999] pointer-events-auto">
      <div
        onClick={onNavigate}
        className="flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        title="Back to Space"
      >
        <div className="w-20 h-20 md:w-28 md:h-28">
          <Canvas camera={{ position: [0, 0, 8], fov: 40 }} transparent>
            <ambientLight intensity={2.5} />
            <directionalLight position={[2, 2, 2]} intensity={2} />
            <Suspense fallback={null}>
              <RocketShipNavModel />
            </Suspense>
          </Canvas>
        </div>
        <div
          className="mt-1 text-white text-center opacity-80 uppercase tracking-widest"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem' }}
        >
          Back to Space
    b    </div>
      </div>
    </div>
  );
}

function ConstellationScene({ onBack }) {
  const scroll = useScroll();
  const astronautGltf = useGLTF('/astronaut.glb');
  const astronautRef = useRef();
  const [currentPage, setCurrentPage] = useState(0);
  const { viewport } = useThree();

  const constellations = useMemo(() => [
    {
      name: 'Ojiig — The Fisher',
      nation: 'Anishinaabe / Ojibwe',
      subtitle: 'Guardian of the Seasons',
      description: (
        <>
          ● Rises high during spring, signals arrival of warmth and melting of snow.
          <br />
          <br />
          ● Represents a heroic fisher cat who travelled to the spirit world to release summer birds and bring back warmth.
          <br />
          <br />
          ● Acted as a precise seasonal clock to prepare for harsh or nicer weather
        </>
      ),
      stars: [
        { pos: [-2.2, 0.0, 0], b: 1.2 },
        { pos: [-1.3, 0.5, 0], b: 1.0 },
        { pos: [-0.2, 0.2, 0], b: 1.1 },
        { pos: [0.5, 0.9, 0], b: 0.9 },
        { pos: [1.4, 1.5, 0], b: 1.0 },
        { pos: [2.1, 1.2, 0], b: 1.3 },
        { pos: [2.5, 0.3, 0], b: 0.85 },
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
      color: '#ff7722',
    },


    {
      name: 'Muin — The Great Bear',
      nation: 'Mi\'kmaq',
      subtitle: 'The Eternal Hunt',
      description: (
        <>
          ● Tells a story of a giant bear (Muin) chased by seven bird hunters across the sky.
          <br />
          <br />
          ● As the constellation shifts through the year, it shows the natural cycles of earth.
          <br />
          <br />
          ● In the fall, the constellation tilts on its back, representing The Bear preparing to hibernate.
        </>
      ),
      stars: [
        { pos: [-0.5, 0.5, 0], b: 1.0 },
        { pos: [0.5, 0.5, 0], b: 1.0 },
        { pos: [0.5, -0.5, 0], b: 1.0 },
        { pos: [-0.5, -0.5, 0], b: 1.0 },
        { pos: [1.6, 0.2, 0], b: 0.85 },
        { pos: [2.5, 0.7, 0], b: 0.75 },
        { pos: [3.2, -0.1, 0], b: 0.7 },
        { pos: [3.8, 0.5, 0], b: 0.65 },
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [5, 6], [6, 7]],
      color: '#ff4466',
    },

    {
      name: 'A\'nó:wara — The Turtle',
      nation: 'Haudenosaunee / Iroquois',
      subtitle: 'Foundation of the World',
      description: (
        <>
          ● Represents turtle from the creation story whose back holds up the world, known as Turtle Island.
          <br />
          <br />
          ● The turtle shell has 13 central scales, tracking the 13 moon cycles in a year.
          <br />
          <br />
          ● Surrounded by 28 smaller scales, tracking the 28 days between each cycle, thus acting as a highly accurate timekeeping system.
        </>
      ),
      stars: [
        { pos: [0.0, 0.0, 0], b: 1.3 },
        { pos: [-1.2, 0.8, 0], b: 1.0 },
        { pos: [1.2, 0.8, 0], b: 1.0 },
        { pos: [-1.2, -0.8, 0], b: 1.0 },
        { pos: [1.2, -0.8, 0], b: 1.0 },
        { pos: [0.0, 2.2, 0], b: 0.85 },
        { pos: [-2.2, 0.0, 0], b: 0.8 },
        { pos: [2.2, 0.0, 0], b: 0.8 },
        { pos: [0.0, -2.2, 0], b: 0.85 },
      ],
      lines: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [3, 4], [1, 3], [2, 4], [1, 5], [2, 5], [1, 6], [3, 6], [2, 7], [4, 7], [3, 8], [4, 8]],
      color: '#33ffaa',
    },

  ], []);

  useFrame((state) => {
    const page = Math.round(scroll.offset * 6);
    if (currentPage !== page) {
      setCurrentPage(page);
    }

    if (!astronautRef.current) return;

    // Smooth time-based values for procedural animation
    const t = state.clock.elapsedTime;
    const scrollSpeed = scroll.delta * 80;

    // Floating motion
    const floatY = Math.sin(t * 1.5) * 0.2;
    const floatX = Math.cos(t * 1.2) * 0.1;

    // Position him at the top center, with subtle floating
    astronautRef.current.position.y = 2.5 + floatY;
    astronautRef.current.position.x = floatX;

    // Base rotation: 
    // z = -Math.PI / 2 makes him lie horizontally (head pointing right)
    // x = 0 and y = 0 means he faces the camera
    astronautRef.current.rotation.x = MathUtils.lerp(
      astronautRef.current.rotation.x,
      Math.sin(t * 2.0) * 0.05, // Subtle forward/back rocking
      0.05
    );
    astronautRef.current.rotation.y = MathUtils.lerp(
      astronautRef.current.rotation.y,
      Math.sin(t * 1.0) * 0.1, // Subtle twisting side-to-side
      0.05
    );
    astronautRef.current.rotation.z = MathUtils.lerp(
      astronautRef.current.rotation.z,
      -Math.PI / 2 + Math.sin(t * 3.0) * 0.08 - scrollSpeed * 0.2, // Head tilts slightly when scrolling
      0.05
    );
  });

  const isExcluded = currentPage === 0 || currentPage === 6;
  const showModel = !isExcluded;

  return (
    <>
      <color attach="background" args={['#0f1a30']} />
      <ambientLight intensity={0.8} />
      <Stars radius={220} depth={90} count={18000} factor={6} saturation={0.1} fadeSpeed={0.4} />

      {/* Per-constellation coloured accent lights, positioned along the scroll axis */}
      {constellations.map((c, i) => (
        <pointLight key={c.name} position={[i * viewport.width, 1, 4]} intensity={3} color={c.color} distance={14} decay={2} />
      ))}

      {/* Astronaut — fixed in world space, horizontally swimming above constellations */}
      <group ref={astronautRef} position={[0, 2.5, 4]}>
        <primitive object={astronautGltf.scene.clone()} scale={1.2} />
      </group>

      {/* 3-D scrolling constellation groups */}
      <Scroll>
        {constellations.map((c, i) => (
          <group key={c.name} position={[i * viewport.width, 0, 0]}>
            {/* Individual twinkling stars */}
            {c.stars.map((star, j) => (
              <RealisticStar key={j} pos={star.pos} brightness={star.b} color={c.color} />
            ))}
            {/* Prominent connecting lines */}
            {c.lines.map(([a, b], j) => (
              <Line
                key={j}
                points={[c.stars[a].pos, c.stars[b].pos]}
                color={c.color}
                lineWidth={3}
                transparent
                opacity={0.6}
              />
            ))}
          </group>
        ))}
      </Scroll>

      {/* HTML text panels */}
      <Scroll html>
        {constellations.map((c, i) => (
          <div
            key={c.name}
            style={{
              position: 'absolute',
              top: '60vh',
              left: `${i * 100 + 22}vw`,
              width: '44vw',
            }}
          >
            <p
              className="text-xs font-mono mb-1 uppercase tracking-widest"
              style={{ color: c.color, opacity: 0.75 }}
            >
              {c.nation}
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                color: c.color,
                filter: `drop-shadow(0 0 16px ${c.color}) drop-shadow(0 0 30px ${c.color}55)`,
                lineHeight: '1.4',
              }}
            >
              {c.name}
            </h2>
            <h3
              className="text-sm md:text-base mb-4 italic"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: '"Press Start 2P", monospace' }}
            >
              {c.subtitle}
            </h3>
            <p
              className="text-lg md:text-xl text-white/85 bg-black/55 p-7 rounded-2xl backdrop-blur-md leading-relaxed font-mono"
              style={{
                border: `1px solid ${c.color}35`,
                boxShadow: `inset 0 0 30px ${c.color}08, 0 0 20px ${c.color}12`,
              }}
            >
              {c.description}
            </p>
          </div>
        ))}
      </Scroll>
    </>
  );
}

function PleiadesStar({ pos, brightness, isMain = false }) {
  const r0 = 0.06 * brightness;
  return (
    <group position={pos}>
      {/* Bright white-blue core */}
      <mesh>
        <sphereGeometry args={[r0, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Inner blue halo */}
      <mesh>
        <sphereGeometry args={[r0 * 2.5, 16, 16]} />
        <meshBasicMaterial color="#d0eeff" transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Mid glow */}
      <mesh>
        <sphereGeometry args={[r0 * 5, 16, 16]} />
        <meshBasicMaterial color="#7bb8f0" transparent opacity={0.30} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Outer soft halo */}
      <mesh>
        <sphereGeometry args={[r0 * 10, 16, 16]} />
        <meshBasicMaterial color="#3a7abf" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Diffraction spikes — only for brighter stars */}
      {isMain && (
        <>
          {/* Horizontal spike */}
          <mesh>
            <planeGeometry args={[r0 * 28, r0 * 0.6]} />
            <meshBasicMaterial color="#c8e8ff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          {/* Vertical spike */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <planeGeometry args={[r0 * 28, r0 * 0.6]} />
            <meshBasicMaterial color="#c8e8ff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          {/* Diagonal spike */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[r0 * 18, r0 * 0.4]} />
            <meshBasicMaterial color="#a8d0f0" transparent opacity={0.30} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <planeGeometry args={[r0 * 18, r0 * 0.4]} />
            <meshBasicMaterial color="#a8d0f0" transparent opacity={0.30} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}

function PleiadesScene({ onBack }) {
  const scroll = useScroll();
  const astronautGltf = useGLTF('/astronaut.glb');
  const astronautRef = useRef();
  const clusterRef = useRef();

  // Real Pleiades star positions — scaled to fill a ~4-unit cluster
  const sisters = useMemo(() => [
    { name: 'Alcyone', pos: [0.2, 0.0, 0], b: 2.2, isMain: true },
    { name: 'Atlas', pos: [1.5, -1.3, 0.1], b: 1.8, isMain: true },
    { name: 'Pleione', pos: [1.75, -1.1, 0.1], b: 1.3, isMain: true },
    { name: 'Maia', pos: [-0.7, 1.3, 0.2], b: 1.7, isMain: true },
    { name: 'Electra', pos: [-1.6, -0.1, -0.1], b: 1.6, isMain: true },
    { name: 'Taygeta', pos: [-0.3, 2.1, 0.3], b: 1.2, isMain: true },
    { name: 'Celaeno', pos: [-0.1, 1.4, -0.2], b: 1.0, isMain: false },
    { name: 'Sterope', pos: [0.9, 1.5, 0.1], b: 0.9, isMain: false },
    { name: 'Merope', pos: [0.6, -0.7, -0.1], b: 1.4, isMain: true },
  ], []);

  // Smaller cluster stars scattered around the main group
  const smallStars = useMemo(() => {
    const rng = [
      [-2.1, 0.5, 0.1], [-1.8, 1.8, -0.2], [-1.2, -1.0, 0.15],
      [-0.5, -1.5, 0.0], [0.0, 2.8, 0.2], [1.0, 2.2, -0.1],
      [2.0, 0.2, 0.3], [2.2, -0.8, 0.1], [1.8, 1.0, -0.2],
      [-2.3, -0.5, 0.0], [0.4, -2.0, 0.1], [-1.5, 2.5, 0.2],
      [0.9, -1.8, -0.1], [-0.8, -2.0, 0.2], [2.5, 0.5, 0.0],
      [-2.5, 1.2, -0.1], [1.2, 2.7, 0.1], [-0.3, 3.0, -0.2],
    ];
    return rng.map((pos, i) => ({ pos, b: 0.4 + (i % 4) * 0.1 }));
  }, []);

  // Dense blue nebula cloud particles centered on cluster
  const nebulaPositions = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.8) * 4;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      // Flatten the z-axis a bit so it looks like a cloud in one plane
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.3;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!astronautRef.current || !clusterRef.current) return;
    const offset = scroll.offset;

    // Astronaut drifts downward and tumbles gently
    astronautRef.current.position.y = MathUtils.lerp(6, -4, Math.min(offset * 2, 1));
    astronautRef.current.rotation.x = offset * Math.PI * 3;
    astronautRef.current.rotation.z = Math.sin(offset * Math.PI * 4) * 0.3;
    const floatX = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
    astronautRef.current.position.x = 4 + floatX;

    // Cluster zooms in and slowly rotates
    const clusterScale = 1 + offset * 2.5;
    clusterRef.current.scale.set(clusterScale, clusterScale, clusterScale);
    clusterRef.current.rotation.y += 0.0008;
  });

  return (
    <>
      <color attach="background" args={['#0e162b']} />
      <ambientLight intensity={0.8} />
      {/* Blue fill lights to illuminate the nebula */}
      <pointLight position={[0, 0, 6]} intensity={2.0} color="#4488ff" distance={20} decay={2} />
      <pointLight position={[-1, 1, 4]} intensity={1.2} color="#2255cc" distance={15} decay={2} />

      {/* Astronaut tumbling down through the cluster */}
      <group ref={astronautRef} position={[4, 6, 5]}>
        <primitive object={astronautGltf.scene.clone()} scale={1.2} />
      </group>

      {/* Star cluster that zooms in as you scroll */}
      <group ref={clusterRef} position={[-0.5, 0.2, 0]}>

        {/* Dense blue nebula cloud */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={nebulaPositions} itemSize={3} count={nebulaPositions.length / 3} />
          </bufferGeometry>
          <pointsMaterial size={0.12} color="#4a90d9" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
        </points>

        {/* Soft blue nebula volume blobs around main stars */}
        {sisters.filter(s => s.isMain).map((star) => (
          <mesh key={`nebula-${star.name}`} position={star.pos}>
            <sphereGeometry args={[star.b * 0.9, 12, 12]} />
            <meshBasicMaterial color="#1a5faa" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}

        {/* Main bright sisters */}
        {sisters.map((star) => (
          <PleiadesStar key={star.name} pos={star.pos} brightness={star.b} isMain={star.isMain} />
        ))}

        {/* Smaller cluster stars */}
        {smallStars.map((star, i) => (
          <PleiadesStar key={`s${i}`} pos={star.pos} brightness={star.b} isMain={false} />
        ))}
      </group>

      {/* Text panels revealed by vertical scroll */}
      <Scroll html>
        <div style={{ position: 'absolute', top: '8vh', left: '5vw', width: '40vw' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-blue-300 mb-4 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 14px rgba(147,197,253,0.9))' }}>
            The Pleiades
          </h1>
          <p className="text-lg md:text-xl text-blue-100 bg-black/60 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm font-mono">
            The Seven Sisters &mdash; an open star cluster in the constellation Taurus and one of the nearest clusters to Earth. Visible to the naked eye, the Pleiades have been known since antiquity.
          </p>
        </div>

        <div style={{ position: 'absolute', top: '120vh', right: '5vw', width: '40vw' }}>
          <h2 className="text-2xl md:text-4xl font-bold text-blue-300 mb-4 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 14px rgba(147,197,253,0.9))' }}>
            The Seven Sisters
          </h2>
          <p className="text-lg md:text-xl text-blue-100 bg-black/60 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm font-mono">
            Named after the seven daughters of Atlas and Pleione: Alcyone, Maia, Electra, Taygeta, Celaeno, Sterope, and Merope. Each star tells its own story in the tapestry of Greek mythology.
          </p>
        </div>

        <div style={{ position: 'absolute', top: '230vh', left: '5vw', width: '40vw' }}>
          <h2 className="text-2xl md:text-4xl font-bold text-blue-300 mb-4 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 14px rgba(147,197,253,0.9))' }}>
            Myth &amp; Legend
          </h2>
          <p className="text-lg md:text-xl text-blue-100 bg-black/60 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm font-mono">
            In Greek mythology, the sisters were companions of Artemis. Pursued by the hunter Orion, Zeus transformed them into stars for protection. Nearly every ancient culture told stories about this brilliant cluster.
          </p>
        </div>

        <div style={{ position: 'absolute', top: '340vh', right: '5vw', width: '40vw' }}>
          <h2 className="text-2xl md:text-4xl font-bold text-blue-300 mb-4 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 14px rgba(147,197,253,0.9))' }}>
            A Stellar Nursery
          </h2>
          <p className="text-lg md:text-xl text-blue-100 bg-black/60 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm font-mono">
            At roughly 100 million years old, these young blue stars are surrounded by a faint reflection nebula. The cluster spans about 13 light-years and lies approximately 444 light-years from Earth.
          </p>
        </div>
      </Scroll>
    </>
  );
}

// Loads a GLTF, centers it, and scales it to a target diameter — always reliable
function CenteredGLTFPlanet({ path, diameter }) {
  const { scene } = useGLTF(path);

  const { cloned, modelScale } = useMemo(() => {
    const s = scene.clone();
    s.position.set(0, 0, 0);
    s.rotation.set(0, 0, 0);
    s.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    s.position.copy(center).negate();

    return { cloned: s, modelScale: maxDim > 0 ? diameter / maxDim : 1 };
  }, [scene, diameter]);

  return (
    <group scale={modelScale}>
      <primitive object={cloned} />
    </group>
  );
}

useGLTF.preload('/venus_fixed.glb');
useGLTF.preload('/mars_the_red_planet_free.glb');

function VenusMarsScene({ onBack }) {
  const scroll = useScroll();
  const astronautGltf = useGLTF('/astronaut.glb');
  const lavaGltf = useGLTF('/just_lava.glb');
  const astronautRef = useRef();
  const venusRef = useRef();
  const marsRef = useRef();
  const sceneRef = useRef();

  const lavaTiles = useMemo(() => {
    const tiles = [];
    const tileCount = 3;
    const spacing = 400;
    const floorY = -30;
    for (let ix = -Math.floor(tileCount / 2); ix <= Math.floor(tileCount / 2); ix++) {
      for (let iz = -Math.floor(tileCount / 2); iz <= Math.floor(tileCount / 2); iz++) {
        tiles.push(
          <group key={`${ix},${iz}`} position={[ix * spacing, floorY, iz * spacing]} scale={400}>
            <primitive object={lavaGltf.scene.clone()} />
          </group>
        );
      }
    }
    return <>{tiles}</>;
  }, [lavaGltf]);

  const astronautScene = useMemo(() => {
    const s = astronautGltf.scene.clone();
    s.position.set(0, 0, 0);
    s.rotation.set(0, 0, 0);
    s.scale.set(1, 1, 1);
    return s;
  }, [astronautGltf]);

  useFrame((state, delta) => {
    const offset = scroll.offset; // 0 to 1

    if (venusRef.current) venusRef.current.rotation.y += delta * 0.04;
    if (marsRef.current) marsRef.current.rotation.y += delta * 0.06;

    if (sceneRef.current) {
      // The planets gently drift upward — just enough to feel the fall, staying in frame
      sceneRef.current.position.y = offset * 5;
    }

    if (astronautRef.current) {
      // Astronaut starts between Venus & Mars, then falls down as you scroll
      const floatY = Math.sin(state.clock.elapsedTime * 0.6) * 0.2;
      astronautRef.current.position.y = THREE.MathUtils.lerp(0, -8, Math.min(offset * 1.2, 1.0)) + floatY;

      // Tumbling effect tied to scroll
      astronautRef.current.rotation.x = offset * Math.PI * 4;
      astronautRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2 + (offset * Math.PI * 2);
      astronautRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.08 + (Math.sin(offset * Math.PI * 4) * 0.3);
    }
  });

  return (
    <>
      <color attach="background" args={['#2e1010']} />
      <fog attach="fog" args={['#2e1010', 50, 150]} />
      <ambientLight intensity={1.0} />
      <Stars radius={200} depth={80} count={10000} factor={5} saturation={0} fadeSpeed={0.4} />

      <group ref={sceneRef}>
        {/* Volcanic Floor */}
        {lavaTiles}

        {/* Venus warm glow */}
        <pointLight position={[-8, 2, 5]} intensity={6} color="#ff8800" distance={40} decay={2} />
        <pointLight position={[-5, -3, 3]} intensity={3} color="#ffaa33" distance={30} decay={2} />

        {/* Mars cold red glow */}
        <pointLight position={[8, 2, 5]} intensity={6} color="#cc3300" distance={40} decay={2} />
        <pointLight position={[5, -3, 3]} intensity={3} color="#ff4422" distance={30} decay={2} />

        <directionalLight position={[0, 5, 10]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[0, -5, 10]} intensity={0.6} color="#ffddaa" />

        {/* Venus on the left — GLTF model, auto-centered on first render */}
        <group ref={venusRef} position={[-4, -1, 0]}>
          <CenteredGLTFPlanet path="/venus_fixed.glb" diameter={4.4} />
          {/* Atmospheric glow ring */}
          <mesh>
            <sphereGeometry args={[2.5, 32, 32]} />
            <meshBasicMaterial color="#e8a030" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
          </mesh>
        </group>

        {/* Mars on the right — GLTF model, auto-centered on first render */}
        <group ref={marsRef} position={[4, -1, 0]}>
          <CenteredGLTFPlanet path="/mars_the_red_planet_free.glb" diameter={3.8} />
          {/* Thin dust atmosphere */}
          <mesh>
            <sphereGeometry args={[2.2, 32, 32]} />
            <meshBasicMaterial color="#cc5533" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
          </mesh>
        </group>

      </group>

      {/* Astronaut floating between Venus & Mars */}
      <group ref={astronautRef} position={[0, 0, 6]}>
        <primitive object={astronautScene} scale={1.3} />
      </group>

      <Scroll html>
        {/* Title */}
        <div style={{ position: 'absolute', top: '5vh', left: 0, width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '95vw', textAlign: 'center' }}>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.5))' }}>
              Venus &amp; Mars
            </h1>
            <p className="text-2xl md:text-4xl text-white/60 font-mono italic mt-4">
              Different Worlds
            </p>
          </div>
        </div>

        {/* Section 2: Spiritual Identities */}
        <div style={{ position: 'absolute', top: '110vh', left: '3vw', width: '45vw' }}>
          <h2 className="text-3xl md:text-5xl font-bold text-amber-400 mb-5 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.8))' }}>
            Spirtual Identities
          </h2>
          <p className="text-lg md:text-2xl text-amber-100 bg-black/60 p-8 rounded-xl border border-amber-500/30 backdrop-blur-sm leading-relaxed font-mono">
            ● Planets are seen as relatives with distinct spirits and roles
            <br />
            <br />
            ● Venus is known as Ikwe Anung (The Women's Star)
            <br />
            <br />
            ● Mars is associated with fire, action, animal traits, etc.
            <br />
            <br />
            ● Venus's bright light and patterns were used to keep time and guide ceremony and daily life.
            <br />
            <br />
            ● Linked to ancestors, calendars, and spirtual guides
          </p>
        </div>

        {/* Section 3: Mars Atmosphere */}
        <div style={{ position: 'absolute', top: '210vh', left: '52vw', width: '45vw' }}>
          <h2 className="text-3xl md:text-5xl font-bold text-red-400 mb-5 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 10px rgba(248,113,113,0.8))' }}>
            Our Connection to the Skies
          </h2>
          <p className="text-lg md:text-2xl text-red-100 bg-black/60 p-8 rounded-xl border border-red-500/30 backdrop-blur-sm leading-relaxed font-mono">
            ● The cycles of Ikwe Anung, are parallel to the foundational roles of women in our society.
            <br />
            - Known as the Morning Star, birth of new day.
            <br />
            - Shines bright when everything gets dark, reflects roles of women as leaders and protectors.
            <br />
            <br />
            ● In Ininewuk (Cree) language structures the sky is reflected as something that actively surrounds and protect us.
            <br />
            <br />
            ● Planets provided structural and spirtual guidance for humans and continue to do so.

          </p>
        </div>

        {/* Section 4: Conclusion */}
        <div style={{ position: 'absolute', top: '310vh', left: 0, width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '85vw', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.5))' }}>
              Separate Worlds
            </h2>
            <p className="text-xl md:text-3xl text-white bg-black/60 p-8 rounded-xl border border-white/20 backdrop-blur-sm mb-10 leading-relaxed font-mono">
              Western and Indingeous astronomy are treated as completely separate fields
              <br />
              (If I Ever Get Out of Here).
              <br />
              <br />
              <b>Indigenous astronomy is seen to be:</b>
              <br />
              - Non-scientific
              <br />
              - Related to culture and ceremony
              <br />
              - Not relevant to "real" astronomy
              <br />
              <br />
              <b>Western astronomy is seen to be:</b>
              <br />
              - The norm/correct way
              <br />
              - Rigorous way of learning things.
              <br />
              <br />
              In reality, they're <b>intertwined</b>. We must learn to embrace both sides of astronomy so as to gain a more diverse understanding.
              <br />
              <br />
              <b>How do Indigenous beliefs, stories, and traditions related to the cosmos reflect or challenge modern & Western interpretations, and how does it reflect how different Indigenous communities connect to the world?</b>

            </p>
          </div>
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

function PlanetModel({ modelPath, position, ringColor, scale = 1.0, onClick, interactive = true, label, forceHover = null }) {
  const gltf = useGLTF(modelPath);
  const ref = useRef();
  const [internalHovered, setInternalHovered] = useState(false);
  const hovered = forceHover !== null ? forceHover : internalHovered;
  const hoverScale = useRef(1);

  const { uniformScale, hitBoxRadius } = useMemo(() => {
    const sceneClone = gltf.scene.clone();
    const box = new THREE.Box3().setFromObject(sceneClone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    const baseTarget = 3.0;
    const targetSize = modelPath === '/constellation.glb'
      ? baseTarget * 2.5
      : modelPath === '/earth.glb'
        ? baseTarget * 2.5
        : baseTarget;

    const uScale = (maxDim > 0 ? targetSize / maxDim : 1.0) * scale;
    const radius = (maxDim > 0 ? maxDim / 2 : 1.0) * uScale * 1.2;
    return { uniformScale: uScale, hitBoxRadius: radius };
  }, [gltf, modelPath, scale]);

  useFrame((_, delta) => {
    if (ref.current && modelPath !== '/constellation.glb') ref.current.rotation.y += delta * 0.08;
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
          onPointerOver={(e) => { e.stopPropagation(); setInternalHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); setInternalHovered(false); document.body.style.cursor = 'auto'; }}
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
            className="text-white text-sm whitespace-nowrap pointer-events-none select-none transition-all duration-200"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              opacity: hovered ? 1 : 0.8,
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
              filter: hovered ? 'drop-shadow(0 0 12px rgba(255,165,0,1))' : 'drop-shadow(0 0 8px rgba(255,255,255,0.8))',
              color: hovered ? '#ffcc00' : 'white',
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function VenusMarsGroup({ position, onClick, label }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} onClick={onClick}>
      <mesh
        visible={false}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[6, 6, 10]} />
        <meshBasicMaterial />
      </mesh>

      <PlanetModel modelPath="/venus_fixed.glb" position={[0, 0, -2.5]} interactive={false} forceHover={hovered} />
      <PlanetModel modelPath="/mars_the_red_planet_free.glb" position={[0, 0, 2.5]} interactive={false} forceHover={hovered} />

      <Html position={[0, 3.5, 0]} center zIndexRange={[100, 0]}>
        <div
          className="text-white text-sm whitespace-nowrap pointer-events-none select-none transition-all duration-200"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            opacity: hovered ? 1 : 0.8,
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            filter: hovered ? 'drop-shadow(0 0 12px rgba(255,165,0,1))' : 'drop-shadow(0 0 8px rgba(255,255,255,0.8))',
            color: hovered ? '#ffcc00' : 'white',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function DreamcatcherObject({ position, onClick, label }) {
  const [hovered, setHovered] = useState(false);
  const hoverScale = useRef(1);
  const ref = useRef();
  const { scene } = useGLTF('/dreamcatcher.glb');

  const { cloned, modelScale } = useMemo(() => {
    const s = scene.clone();
    s.position.set(0, 0, 0);
    s.rotation.set(0, 0, 0);
    s.scale.set(1, 1, 1);

    // Calculate bounding box in isolated local space to prevent world-transform offset bugs
    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    s.position.copy(center).negate();

    return { cloned: s, modelScale: maxDim > 0 ? 4.0 / maxDim : 1 };
  }, [scene]);

  useFrame((_, delta) => {
    const t = 1 - Math.pow(0.001, delta);
    const target = hovered ? 1.2 : 1.0;
    hoverScale.current = MathUtils.lerp(hoverScale.current, target, t);
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Hit area */}
      <mesh
        visible={false}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[3.5, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      {/* Warm feather glow */}
      <pointLight intensity={hovered ? 3 : 1.5} color="#ffaa44" distance={12} decay={2} />

      <group ref={ref} scale={modelScale}>
        <primitive object={cloned} />
      </group>

      {label && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]}>
          <div
            className="text-white text-sm whitespace-nowrap pointer-events-none select-none transition-all duration-200"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              opacity: hovered ? 1 : 0.8,
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
              filter: hovered ? 'drop-shadow(0 0 12px rgba(255,165,0,1))' : 'drop-shadow(0 0 8px rgba(255,255,255,0.8))',
              color: hovered ? '#ffcc00' : 'white',
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload('/dreamcatcher.glb');


function ImagePlanet({ modelPath, position, scale = 1.0, onClick, interactive = true, label }) {
  const texture = useTexture(modelPath);
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const hoverScale = useRef(1);

  const hitBoxRadius = 3.0 * scale;

  useFrame((_, delta) => {
    const t = 1 - Math.pow(0.001, delta);
    const target = hovered ? 1.2 : 1;
    hoverScale.current = MathUtils.lerp(hoverScale.current, target, t);
    const currentScale = scale * hoverScale.current;
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
      <Billboard ref={ref} follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        </mesh>
      </Billboard>
      {label && (
        <Html position={[0, hitBoxRadius + 0.8, 0]} center zIndexRange={[100, 0]}>
          <div
            className="text-white text-sm whitespace-nowrap pointer-events-none select-none transition-all duration-200"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              opacity: hovered ? 1 : 0.8,
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
              filter: hovered ? 'drop-shadow(0 0 12px rgba(255,165,0,1))' : 'drop-shadow(0 0 8px rgba(255,255,255,0.8))',
              color: hovered ? '#ffcc00' : 'white',
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

function DreamcatcherScene({ onBack }) {
  const scroll = useScroll();
  const { scene } = useGLTF('/dreamcatcher.glb');
  const ref = useRef();

  const { cloned, modelScale } = useMemo(() => {
    const s = scene.clone();
    s.position.set(0, 0, 0);
    s.rotation.set(0, 0, 0);
    s.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Offset the pivot point upwards so it spins around the circle's center
    center.y += size.y * 0.25;

    s.position.copy(center).negate();

    return { cloned: s, modelScale: maxDim > 0 ? 80.0 / maxDim : 1 };
  }, [scene]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      ref.current.rotation.z = -scroll.offset * Math.PI * 2;
      ref.current.rotation.y = 0.15;
      ref.current.rotation.x = 0.05;
    }
  });

  return (
    <>
      <color attach="background" args={['#1e102e']} />
      <fog attach="fog" args={['#1e102e', 50, 150]} />
      <ambientLight intensity={1.5} />
      <Stars radius={200} depth={80} count={10000} factor={5} saturation={0} fadeSpeed={0.4} />

      <group position={[-20, 5, -5]}>
        <group ref={ref} scale={modelScale}>
          <primitive object={cloned} />
        </group>
      </group>

      <pointLight position={[5, 5, 5]} intensity={2.5} color="#ffaa55" />
      <pointLight position={[-5, -5, -5]} intensity={2} color="#55aaff" />

      {/* Text panels revealed by vertical scroll */}
      <Scroll html>
        {/* Title */}
        <div style={{ position: 'absolute', top: '10vh', left: '50vw', width: '45vw' }}>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.5))' }}>
            Dreamcatchers
          </h1>
          <p className="text-2xl md:text-4xl text-white/60 font-mono italic mt-4">
            Making Dreams Come True
          </p>
        </div>

        {/* Panel 1 */}
        <div style={{ position: 'absolute', top: '110vh', left: '50vw', width: '45vw' }}>
          <h2 className="text-3xl md:text-5xl font-bold text-purple-400 mb-5 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 10px rgba(192,132,252,0.8))' }}>
            Origins of Dreams
          </h2>
          <p className="text-lg md:text-2xl text-purple-100 bg-black/60 p-8 rounded-xl border border-purple-500/30 backdrop-blur-sm leading-relaxed font-mono">
            ● Asibikaashi (Spider Woman) brought the sun back to the sky every morning and protected children from negativity.
            <br />
            <br />
            ● Soon, the nation spread and it became hard for Asibikaashi to protect and watch over children.
            <br />
            <br />
            ● Grandmothers, mothers, and sisters thus began weaving dreamcatchers to protect children. Dreamcatchers usually have 8 points, to honor the Spider Woman.
          </p>
        </div>

        {/* Panel 2 */}
        <div style={{ position: 'absolute', top: '210vh', left: '50vw', width: '45vw' }}>
          <h2 className="text-3xl md:text-5xl font-bold text-pink-400 mb-5 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 10px rgba(244,114,182,0.8))' }}>
            Wilfred Buck
          </h2>
          <p className="text-lg md:text-2xl text-pink-100 bg-black/60 p-8 rounded-xl border border-pink-500/30 backdrop-blur-sm leading-relaxed font-mono">
            ● Wilfred Buck is a key figure who shows Indigenous communities going forward and representing Indigneous astronomy is possible.
            <br />
            - Created a mobile planetarium with Indigenous constellations he takes around the world.
            <br />
            - Revitalized 38 Cree constellations by working with Elders and Knowledge Keepers for decades and created Ininew Achakos Masinkan, a Cree star map.
            <br />
            <br />
            ● Invoked strong emotions in elders and other Indigenous communities, showing real community impacts.
            <br />
            <br />
            ● Continues to push for Indigenous knowledge in astronomical fields.
          </p>
        </div>

        {/* Panel 3 */}
        <div style={{ position: 'absolute', top: '360vh', left: '50vw', width: '45vw' }}>
          <h2 className="text-3xl md:text-5xl font-bold text-teal-400 mb-5 font-mono" style={{ fontFamily: '"Press Start 2P", monospace', filter: 'drop-shadow(0 0 10px rgba(45,212,191,0.8))' }}>
            Dreams stay Dreams
          </h2>
          <p className="text-lg md:text-2xl text-teal-100 bg-black/60 p-8 rounded-xl border border-teal-500/30 backdrop-blur-sm leading-relaxed font-mono">
            ● Indigenous perspectives about astronomy are restricted and often ignored in society.
            <br />
            <br />
            ● Due to this, aspiring Indigneous astronmers do not get opportunities to grow their knowledge and provide others with knowledge about Indigenous astronomy.
            <br />
            <br />
            ● Ignorance like this leads to lack of diversity in our knowledge and loss of traditions.
          </p>
        </div>
      </Scroll>
    </>
  );
}

export function HeroCanvas ({ launched, sceneState, selectedPlanet, onLaunchComplete, onPeak, onLaunchStart, onReturnToEarth, onPlanetClick, onBackToSpace, cameraPos = [0, -0.5, 20], fov = 38 }) {
  const lavaGltf = useGLTF('/just_lava.glb');




  const [fadeOpacity, setFadeOpacity] = useState(0);
  const planets = useMemo(() => {
    if (sceneState === 'space') {
      const radius = 9.0;
      const angle = (Math.PI * 2) / 4; // 4 items evenly spaced (90 degrees)
      return [
        { isGroup: true, id: 'venus_mars', position: [radius * Math.cos(0 * angle), 0, radius * Math.sin(0 * angle)], label: 'Venus & Mars', onClick: () => onPlanetClick('/venus_and_mars') },
        { modelPath: '/earth.glb', position: [radius * Math.cos(1 * angle), -1.0, radius * Math.sin(1 * angle)], ringColor: null, scale: 0.45, label: 'Back into Orbit', onClick: onReturnToEarth },
        { modelPath: '/download (2).png', position: [radius * Math.cos(2 * angle), 1.0, radius * Math.sin(2 * angle)], ringColor: null, scale: 0.8, label: 'Constellations', onClick: () => onPlanetClick('/download (2).png') },
        { isGroup: true, id: 'dreamcatcher', position: [radius * Math.cos(3 * angle), 0.5, radius * Math.sin(3 * angle)], label: 'Dreamcatchers', onClick: () => onPlanetClick('/dreamcatcher') },
      ];
    } else {
      // Initial scene: empty (celestial bodies appear after launch into space)
      return [];
    }
  }, [sceneState, onPlanetClick, onReturnToEarth]);

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
    <div className="h-screen w-full overflow-hidden bg-[#0f172a]">
      {sceneState === 'presentation' && (
        <PersistentNav onNavigate={onBackToSpace} />
      )}
      <Canvas camera={{ position: cameraPos, fov }}>
        <CameraUpdater cameraPos={cameraPos} fov={fov} />
        <ambientLight intensity={1.2} />
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
          {sceneState === 'space' && planets.map((planet, index) => {
            if (planet.isGroup && planet.id === 'venus_mars') {
              return <VenusMarsGroup key={`${sceneState}-${index}`} {...planet} />;
            }
            if (planet.isGroup && planet.id === 'dreamcatcher') {
              return <DreamcatcherObject key={`${sceneState}-${index}`} {...planet} />;
            }
            return planet.modelPath.endsWith('.png') || planet.modelPath.endsWith('.jpg') ?
              <ImagePlanet key={`${sceneState}-${index}`} {...planet} /> :
              <PlanetModel key={`${sceneState}-${index}`} {...planet} />;
          })}
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


          {sceneState === 'presentation' && selectedPlanet === '/download (2).png' && (
            <ScrollControls horizontal pages={3} damping={0.1}>
              <ConstellationScene onBack={onBackToSpace} />
            </ScrollControls>
          )}
          {sceneState === 'presentation' && selectedPlanet === '/venus_and_mars' && (
            <ScrollControls pages={4.2} damping={0.1}>
              <VenusMarsScene onBack={onBackToSpace} />
            </ScrollControls>
          )}
          {sceneState === 'presentation' && selectedPlanet === '/dreamcatcher' && (
            <ScrollControls pages={4.5} damping={0.1}>
              <DreamcatcherScene onBack={onBackToSpace} />
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

    </div>
  );
}