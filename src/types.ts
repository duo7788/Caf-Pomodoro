export type CoffeeType = 'espresso' | 'americano' | 'cappuccino' | 'latte' | 'quick_test';

/** 倒计时（选时长，时间驱动）/ 正计时（跟随专注，摄像头驱动） */
export type FocusMode = 'countdown' | 'countup';

export interface CoffeeConfig {
  id: CoffeeType;
  name: string;
  nameZh: string;
  baseTime: number; // in minutes
  color: string;
  description: string;
}

export const COFFEE_MENU: CoffeeConfig[] = [
  { id: 'quick_test', name: '1-Minute Test', nameZh: '小酌', baseTime: 1, color: '#3c2415', description: 'Test the coffee liquid ring effects quickly.' },
  { id: 'espresso', name: 'Espresso', nameZh: '浓缩', baseTime: 15, color: '#1a0f0a', description: 'A quick, intense focus session.' },
  { id: 'americano', name: 'Americano', nameZh: '美式', baseTime: 25, color: '#2a170d', description: 'The classic 25-minute Pomodoro.' },
  { id: 'cappuccino', name: 'Cappuccino', nameZh: '卡布奇诺', baseTime: 30, color: '#6b4423', description: 'A steady, balanced work period.' },
  { id: 'latte', name: 'Café Latte', nameZh: '拿铁', baseTime: 45, color: '#a67b5b', description: 'Smooth, deep work. Take your time.' },
];

export interface Addon {
  id: string;
  name: string;
  timeModifier: number; // in minutes
}

export const ADDONS: Addon[] = [
  { id: 'sugar', name: 'Sugar (+5m)', timeModifier: 5 },
  { id: 'extra_shot', name: 'Extra Shot (-5m)', timeModifier: -5 },
];
