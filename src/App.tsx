/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Menu } from './components/Menu';
import { Workspace } from './components/Workspace';
import { FocusWorkspace } from './components/FocusWorkspace';
import { CoffeeType, FocusMode, COFFEE_MENU } from './types';

export default function App() {
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

  if (phase === 'menu') {
    return <Menu onStart={handleStart} />;
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
