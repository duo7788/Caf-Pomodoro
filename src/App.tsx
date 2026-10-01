/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { CoffeeLoading } from './components/CoffeeLoading';
import { LandingPage } from './components/LandingPage';
import { Menu } from './components/Menu';
import { Workspace } from './components/Workspace';
import { FocusWorkspace } from './components/FocusWorkspace';
import { CoffeeType, FocusMode, COFFEE_MENU } from './types';

export default function App() {
  const [loading, setLoading] = useState(false);
  const finishLoading = useCallback(() => setLoading(false), []);
  const [inApp, setInApp] = useState(() => window.location.hash === '#app');
  useEffect(() => {
    const onHashChange = () => {
      const enteringApp = window.location.hash === '#app';
      setLoading(enteringApp);
      setInApp(enteringApp);
      setPhase('menu');
      if (window.location.hash !== '#demo') window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [phase, setPhase] = useState<'menu' | 'focus'>('menu');
  const [coffeeType, setCoffeeType] = useState<CoffeeType>('americano');
  const [addons, setAddons] = useState<string[]>([]);
  const [mode, setMode] = useState<FocusMode>('countdown');

  const handleStart = (type: CoffeeType, selectedAddons: string[], selectedMode: FocusMode) => {
    setCoffeeType(type);
    setAddons(selectedAddons);
    setMode(selectedMode);
    setPhase('focus');
  };

  const handleMenuReset = () => {
    setPhase('menu');
  };

  if (!inApp) return <LandingPage />;

  if (phase === 'menu') {
    return (
      <>
        <div inert={loading} aria-hidden={loading || undefined}>
          <a className="app-home-link" href="#">← 产品介绍</a>
          <Menu onStart={handleStart} loading={loading} />
        </div>
        {loading && <CoffeeLoading onComplete={finishLoading} />}
      </>
    );
  }

  const currentConfig = COFFEE_MENU.find((c) => c.id === coffeeType)!;

  if (mode === 'countup') {
    return (
      <FocusWorkspace
        coffeeConfig={currentConfig}
        selectedAddons={addons}
        onBack={handleMenuReset}
      />
    );
  }

  return (
    <Workspace coffeeConfig={currentConfig} selectedAddons={addons} onBack={handleMenuReset} />
  );
}
