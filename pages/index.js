import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const HeroCanvas = dynamic(() => import('../components/HeroCanvas').then((mod) => mod.HeroCanvas), {
  ssr: false,
});

export default function Home() {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    const handleSpace = (event) => {
      if (event.code === 'Space') {
        setLaunched(true);
      }
    };

    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-space text-slate-100">
      <HeroCanvas launched={launched} />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-6 py-6 sm:px-10">
        <div className="flex flex-col gap-4 rounded-full border border-slate-700/80 bg-slate-950/70 bg-opacity-80 p-5 text-white shadow-glow backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-teal-300">Space Command</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Astronaut mission control</h1>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Status</p>
            <p className="mt-2 text-xl font-semibold text-white">{launched ? 'Engaged' : 'Standby'}</p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 rounded-[2rem] border border-slate-700/80 bg-slate-950/80 px-6 py-6 text-center shadow-glow backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-teal-300">Mission controls</p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Press <span className="font-mono">Space</span> to launch</h2>
          <p className="max-w-2xl text-slate-300">
            Drag horizontally to look around the orbital scene. Vertical rotation is locked for smoother exploration.
          </p>
        </div>
      </div>
    </main>
  );
}
