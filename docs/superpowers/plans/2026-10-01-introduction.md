# Café Pomodoro Introduction Implementation Plan

**Goal:** Add a warm, dark introduction page with a two-tab simulated product demo and a working entry into the existing app.
**Architecture:** A separate LandingPage component owns demo-only state. App uses #app for direct application access and the root hash for the introduction. Existing timers and camera behavior stay in their existing components.
**Tech Stack:** React, TypeScript, existing SVG CoffeeCup, scoped CSS, Vite.

## Approved design
Product name is the headline; omit the rejected slogan. Use coffee brown, cream typography and warm light. Show 正计时 first, with explicitly simulated camera status, focus → distraction → ring sequence. Countdown is camera-free and shows regular liquid decreases. Add a pause control for animation, responsive layout, reduced-motion support, and short accurate feature/privacy notes. No camera permission on the introduction.

## Tasks
- [x] Create src/components/LandingPage.tsx and src/components/LandingPage.css: hero, actions, animated cup demo, two accessible tabs and feature notes.
- [x] Update src/App.tsx: route by #app, use hashchange for browser history, add return-to-introduction on menu.
- [x] Update index.html: product title, Chinese language and description.
- [x] Verify using npm run lint, npm run build, and browser checks for both demo tabs, animation pause, entry/back navigation and narrow viewport.

## Verification results
TypeScript checking and Vite build passed. Browser verified both tabs, pause, entry to existing menu, return to introduction, animated ring rendering, and 390px viewport without horizontal overflow. The build reports a 517 kB bundle-size advisory; no build errors.
