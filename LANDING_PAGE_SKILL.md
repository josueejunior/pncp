# LANDING_PAGE_SKILL.md — v2
> Ultimate Landing Page Creator · Theme-agnostic · Interrogation-first
> Distilled from 5 production-grade landing pages across SaaS, e-commerce, and events.

---

# ██████████████████████████████████████████████████████
# PART 0 — MANDATORY INTERROGATION PROTOCOL
# ██████████████████████████████████████████████████████

## ⚠️ ABSOLUTE RULE — READ BEFORE ANYTHING ELSE

**Claude MUST NOT write a single line of code, CSS, or component structure until:**
1. All questions in this section have been answered by the user
2. Claude has composed a written **Design Brief** summarizing every answer
3. The user has explicitly approved the Design Brief (said "yes", "looks good", "let's go", etc.)

**If the user tries to rush past this step, Claude must politely hold the line:**
> "Before I start building, I need your answers to a few key questions — they're what guarantees the result is actually great for your specific case rather than generic. It'll take 2 minutes and save us multiple revision rounds."

There are **8 question categories**. Claude must ask ALL of them, grouped in 2–3 conversational turns (not as a wall of text). Use a friendly, direct tone. Make the user feel like they're briefing a senior designer.

---

## Q1 — PURPOSE & AUDIENCE

Ask exactly:
> "What is this page for, and who's the primary person landing on it?"

Listen for:
- **SaaS/product** — strangers discovering a tool (cold traffic)
- **Event/party** — invitees who already know about it (warm traffic)
- **E-commerce/store** — buyers browsing products
- **Agency/portfolio** — clients evaluating work
- **Personal brand** — followers / fans
- **Launch/waitlist** — early adopters signing up

This determines section sequence, CTA copy, and trust-building strategy.

---

## Q2 — VISUAL VIBE

Ask exactly:
> "Pick the vibe that feels closest to what you want — or describe it in your own words:"

Present these options (user can pick one or mix two):

| # | Vibe | Keywords | Real-world ref |
|---|------|----------|---------------|
| A | **Dark premium** | Deep space, subtle glows, glass surfaces | Apple, Vercel, Linear |
| B | **Neon rave** | Electric colors, scanlines, CRT, synthwave | event pages, music apps |
| C | **Clean corporate** | White/light, trustworthy, structured, subtle | Stripe, Notion, SaaS |
| D | **Warm playful** | Gradients, rounded, festive, colorful | consumer apps, parties |
| E | **Editorial bold** | High contrast, big typography, raw, brutalist | creative agencies |
| F | **Techy command** | Monospace, terminal, grid, blue-on-dark | dev tools, fintech |

Also ask:
- **Dark background or light background as the primary?**
- **Single theme, or light/dark toggle support?**

---

## Q3 — COLOR PALETTE

Ask exactly:
> "Give me 1–3 colors that represent your brand. If you don't have any yet, just describe the feeling (e.g. 'energetic orange', 'deep professional blue', 'cyberpunk cyan/magenta')."

Claude will derive from the answer:
- `--accent`: main CTA color
- `--accent-2`: supporting accent
- `--glow` values: `rgba()` versions for shadows and glows
- `--bg`: background base
- `--border`: accent at 10–14% opacity
- `--accent-grad`: 135deg from primary to secondary

**Rule:** Never use hardcoded colors inside components. Always derive tokens first.

---

## Q4 — ANIMATION INTENSITY

Ask exactly:
> "How animated should this page feel? Pick a level:"

| Level | Description | What it enables |
|-------|-------------|-----------------|
| **0 — Static** | No motion at all | Plain CSS, no JS animations |
| **1 — Subtle** | Hover states, gentle fade-ins | CSS transitions, simple reveal |
| **2 — Moderate** | Scroll reveals, staggered entries | IntersectionObserver + framer-motion |
| **3 — Intense** | Particle field, custom cursor, GSAP | Canvas, full framer-motion |
| **4 — Extreme** | Audio-reactive, entrance gate, beat cursor | Web Audio API, multi-canvas |

Also ask:
> "Should the page have a custom cursor, or keep the default?"

If yes, offer these styles:
- **Ring** — glowing circle that follows with spring lag (lightweight)
- **Particle orbit** — particles gravitate toward cursor (black-hole physics)
- **Beat-reactive** — visual modes triggered by clicks + synthesized sound
- **Balloon** — SVG balloon that explodes when particles collide with it
- **Fire trail** — ember particles trailing behind cursor
- **Radar sweep** — rotating sweep line with radial ticks

---

## Q5 — HERO VISUAL

Ask exactly:
> "What should sit in the hero section — the big visual centrepiece next to or behind your headline?"

| Option | Best for | Complexity |
|--------|----------|------------|
| **Text only** | Bold typography-first design | Low |
| **3D parallax card** | Product/SaaS showing a UI | Medium |
| **Animated console/terminal** | Dev tools, AI, data products | Medium |
| **Canvas particle field** | Premium dark pages, any category | High |
| **Sound wave / audio visual** | Events, music, entertainment | High |
| **Floating orbs + glassmorphism** | Clean SaaS, ambient energy | Medium |
| **Entrance splash gate** | Events, exclusive launches | High |
| **Image/video showcase** | E-commerce, portfolios, agencies | Medium |

---

## Q6 — SECTIONS NEEDED

Ask exactly:
> "Which sections does your page need? I'll sequence them optimally for conversion."

Present the full catalog:
```
□ Hero (always included)
□ Social proof / trust bar (logos, stats, badges)
□ Problem statement / pain point
□ How it works (3-step process)
□ Features grid (card-based, 6 cards)
□ Interactive demo / before-after reveal
□ Metrics / numbers (animated count-up)
□ Pricing / plans
□ Testimonials
□ Team / sellers / contact persons
□ FAQ accordion
□ Waitlist / RSVP form (with or without Firebase)
□ Countdown timer (events)
□ Gallery / portfolio
□ Map / venue info
□ CTA band (always recommended)
□ Footer
```

Also ask:
> "Should any section stay always dark regardless of the theme (like Stripe does with their feature sections)?"

---

## Q7 — STACK & CONSTRAINTS

Ask exactly:
> "Any technical constraints I should know about?"

Listen for:
- **Framework**: React/Next, Vue, plain HTML, etc.
- **Animation library**: framer-motion? GSAP? CSS only?
- **Backend/forms**: Firebase? Supabase? Just mailto? No backend needed?
- **Performance priority**: Will this run on slow mobile connections?
- **Existing design system**: Any component library or CSS framework?
- **Routing**: Single page or multi-route?

Default assumption if not specified: **React + TypeScript + framer-motion + CSS variables, no backend**.

---

## Q8 — THE ONE THING

Ask exactly:
> "What's the ONE interaction or visual moment you want users to remember — the thing that makes this page feel unlike anything they've seen before?"

This becomes the **signature moment** of the page. Claude invests the most craft here.

Examples from the 5 reference pages:
- *"The 3D tracking card that tilts with your mouse"*
- *"Particles that spiral into your cursor like a black hole"*
- *"The fire cursor that reacts to every click"*
- *"A balloon cursor that explodes when particles hit it"*
- *"A beat-reactive cursor that plays real sounds and changes visual mode on click"*

If the user says "I don't know", Claude offers 3 concrete suggestions based on answers so far.

---

## DESIGN BRIEF TEMPLATE

Once all 8 questions are answered, Claude writes this back before generating anything:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN BRIEF — [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PURPOSE:        [e.g. SaaS product page for cold traffic]
AUDIENCE:       [e.g. developers discovering the tool]
VIBE:           [e.g. Dark premium + Techy command]
THEME:          [e.g. Dark only / Light/Dark toggle]
PALETTE:        [Primary: #xxx | Secondary: #xxx | BG: #xxx]
ANIMATION:      [Level 3 — Intense]
CURSOR:         [Particle orbit with black-hole physics]
HERO VISUAL:    [Canvas particle field + animated console]
SECTIONS:       [Hero → Trust → How it works → Features → Demo → CTA → Footer]
ALWAYS DARK:    [Features + CTA sections]
SIGNATURE:      [Particles that spiral into the cursor]
STACK:          [React + TS + framer-motion + Canvas, no backend]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Does this look right? Say "yes" and I'll start building.
```

**Wait for explicit approval. Do not start generating code until the user confirms.**

---

# ██████████████████████████████████████████████████████
# PART 1 — DESIGN INTENT SYSTEM
# ██████████████████████████████████████████████████████

## 1.1 — Typography Archetypes

Choose ONE display font and ONE body font. Never use both from the same archetype.

| Archetype | Display Font | Body Font | Best for |
|-----------|-------------|-----------|----------|
| **Premium SaaS** | `Inter` (900) | `Inter` (400–600) | clean, trustworthy, universal |
| **Display + Mono** | `Outfit` / `Plus Jakarta Sans` | `JetBrains Mono` | editorial + technical vibe |
| **Rave / Event** | `Bebas Neue` | `Inter` / `JetBrains Mono` | massive letterforms, high energy |
| **Creative Brand** | `Syne` / `Space Grotesk` | `Inter` | distinctive, modern, memorable |
| **Warm Consumer** | `Poppins` / `Nunito` | `Inter` | friendly, rounded, approachable |

**Typography Scale — always use `clamp()` for headings:**

```css
/* Hero headline — maximum impact */
.hero-title {
  font-size: clamp(3rem, 8vw, 7rem);       /* event / rave */
  font-size: clamp(2.6rem, 5.5vw, 4.2rem); /* SaaS / product */
  font-weight: 900;
  letter-spacing: -0.045em; /* tight for Inter/SaaS */
  letter-spacing: 0.08em;   /* wide for Bebas Neue */
  line-height: 1.0–1.15;
}
/* Section title */
.section-title { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
/* CTA headline */
.cta-headline  { font-size: clamp(2.5rem, 7vw, 4.75rem); line-height: 1.08; }
/* Eyebrow label */
.eyebrow       { font-size: 0.65–0.75rem; font-weight: 600–800; letter-spacing: 0.15–0.25em; text-transform: uppercase; }
```

---

## 1.2 — Color Token Formula (theme-agnostic)

Given any brand color, always derive this full token set. Never skip any variable.

```css
:root {
  /* Core accents */
  --accent:       [PRIMARY HEX];
  --accent-2:     [SECONDARY HEX];
  --accent-grad:  linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);

  /* Background family */
  --bg:           [darkest base — #07020f rave | #0a0e1a SaaS | #fff light];
  --bg-2:         [slightly lighter variant];
  --bg-card:      rgba([bg-rgb], 0.70–0.80);
  --glass-bg:     rgba([bg-rgb], 0.65–0.75);
  --glass-blur:   blur(20px) saturate(150%);

  /* Text family */
  --text:         [primary — near white dark | near black light];
  --text-muted:   rgba([text-rgb], 0.55);
  --text-dim:     rgba([text-rgb], 0.30);

  /* Border family */
  --border:       rgba([accent-rgb], 0.10–0.14);
  --border-hover: rgba([accent-rgb], 0.30–0.42);

  /* Glow family — 3 layers for depth */
  --glow-sm:  0 0 8px  rgba(R,G,B,0.6),  0 0 24px rgba(R,G,B,0.3);
  --glow-md:  0 0 18px rgba(R,G,B,0.7),  0 0 40px rgba(R,G,B,0.35), 0 0 80px rgba(R,G,B,0.15);
  --glow-lg:  0 4px 80px rgba(R,G,B,0.4), 0 0 160px rgba(R,G,B,0.2);

  /* Sizing */
  --radius:     16–22px;
  --radius-sm:  8–12px;
  --radius-pill: 50px;
  --nav-h:      64–88px;
}
```

---

## 1.3 — Background Energy Spectrum

Combine levels as needed — each adds depth:

```css
/* LEVEL 1: Subtle corner radials */
background:
  radial-gradient(circle at 0% 0%,    rgba(R,G,B,0.08), transparent 45%),
  radial-gradient(circle at 100% 100%, rgba(R,G,B,0.06), transparent 40%),
  var(--bg);

/* LEVEL 2: Directional gradient wash */
background: linear-gradient(135deg, #fff 0%, #f0f4ff 50%, #e0f2fe 100%);

/* LEVEL 3: Grid surface texture */
.grid-surface {
  background-image:
    linear-gradient(rgba(R,G,B,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(R,G,B,0.06) 1px, transparent 1px);
  background-size: 26–52px 26–52px;
}

/* LEVEL 4A: Noise grain (film texture) */
.noise-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 2; opacity: 0.025–0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 200px;
}

/* LEVEL 4B: CRT Scanlines */
.scanlines {
  position: fixed; inset: 0; pointer-events: none; z-index: 2;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
  );
}

/* LEVEL 5: Floating orb blobs */
.orb {
  position: fixed; border-radius: 50%;
  filter: blur(80–120px); opacity: 0.10–0.18;
  pointer-events: none; will-change: transform;
  animation: orb-float 7–12s ease-in-out infinite alternate;
}
@keyframes orb-float {
  from { transform: translateY(0) scale(1); }
  to   { transform: translateY(-40px) scale(1.07); }
}
/* 3 orbs, staggered positions and durations for natural depth */
/* Mobile: reduce to blur(60px), opacity(0.08), smaller sizes */
```

---

## 1.4 — Section Rhythm Patterns

**Pattern A — Uniform dark** (events, rave, premium dark):
All sections share `--bg`. CTA band gets rings/glow treatment. No section breaks.

**Pattern B — Stripe alternating** (SaaS with light/dark toggle):
```css
/* Adaptive sections */
.section-how     { background: var(--section-light-bg); }
.section-metrics { background: var(--section-mid-bg); }

/* Always dark — signature accent moments — even in light mode */
:root .section-features  { background: rgba(7,10,24,0.97); }
:root .section-cta       { background: rgba(6,9,20,0.97); }
[data-theme="dark"] .section-features { background: rgba(7,10,24,0.52); }
[data-theme="dark"] .section-cta      { background: rgba(6,9,20,0.50); }
```

**Pattern C — Light primary** (e-commerce, warm brands):
Background is white/light. Canvas and orbs dimmed on light:
```css
.landing[data-theme="light"] .canvas-wrapper { opacity: 0.12; }
.landing[data-theme="light"] .orbs-root      { opacity: 0.22; }
```

---

# ██████████████████████████████████████████████████████
# PART 2 — CSS ARCHITECTURE
# ██████████████████████████████████████████████████████

## 2.1 — CSS Reset Non-Negotiables

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-body); background: var(--bg); color: var(--text);
  overflow-x: hidden; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  cursor: none; /* ONLY when using a custom cursor */
}
input, textarea { font-family: inherit; user-select: text; }
img { display: block; max-width: 100%; -webkit-user-drag: none; }

::-webkit-scrollbar { width: 4–6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--accent-grad); border-radius: 99px; }
```

## 2.2 — @property Houdini (animated gradient borders)

```css
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.animated-border {
  --border-angle: 0deg;
  background: conic-gradient(from var(--border-angle), transparent 70%, var(--accent) 80%, var(--accent-2) 90%, transparent 100%);
  animation: border-spin 3s linear infinite;
}
@keyframes border-spin { to { --border-angle: 360deg; } }
```

## 2.3 — Glassmorphism Formula

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur); /* Safari */
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
/* Rule: always include -webkit- prefix for Safari support */
/* Rule: backdrop-filter only works if parent is NOT overflow:hidden */
```

---

# ██████████████████████████████████████████████████████
# PART 3 — BACKGROUND FX CATALOG
# ██████████████████████████████████████████████████████

## 3.1 — Canvas Particle System — 3 Tiers

### Tier 1 — CSS-only ambient (animation level 1–2)
No canvas. Use orbs + grid texture. Zero JS overhead.

### Tier 2 — Standard Particle Field (animation level 3)

Canvas `position:fixed`, `z-index:0`, `pointer-events:none`.

```tsx
// Configure per project — no hardcoded values
const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const CFG = isTouch
  ? { COUNT: 25,  MAX_SPEED: 2,   TRAIL: 0.20, CONN_R: 0,  HUE_A: 220, HUE_B: 265 }
  : { COUNT: 120, MAX_SPEED: 3.5, TRAIL: 0.17, CONN_R: 90, HUE_A: 220, HUE_B: 265 };
// HUE values: 185=cyan | 220=blue | 265=violet | 320=pink | 30=orange | 120=green

// Trail effect — do NOT use clearRect; fill with low-alpha bg instead
ctx.fillStyle = `rgba(${BG_RGB},${CFG.TRAIL})`;
ctx.fillRect(0, 0, W, H);

// Gravitational pull + orbital physics ("black hole" effect)
const dx = mx - p.x, dy = my - p.y;
const d  = Math.hypot(dx, dy) + 1;

if (p.orbital) {
  p.angV = Math.min(p.angV * 1.018 + 0.0012, 0.25); // accelerate
  p.r    = Math.max(p.r * 0.981, 3);                 // spiral inward
  p.angle += p.angV;
  p.x = mx + Math.cos(p.angle) * p.r;
  p.y = my + Math.sin(p.angle) * p.r;
  if (p.r < 5) { particles[i] = respawn(); continue; }
} else if (d < GRAVITY_R) {
  const force = Math.min(G / (d * d), 1.4);
  p.vx += (dx/d) * force;           // direct pull
  p.vy += (dy/d) * force;
  p.vx += (-dy/d) * force * 0.5;    // tangential swirl → spiral
  p.vy += ( dx/d) * force * 0.5;
  if (d < ORBIT_R) { p.orbital = true; p.angle = Math.atan2(p.y-my, p.x-mx); p.r = d; p.angV = 0.065; }
}

// Connection lines (desktop only)
if (CFG.CONN_R > 0) {
  const cd = Math.hypot(p.x - q.x, p.y - q.y);
  if (cd < CFG.CONN_R) {
    ctx.strokeStyle = `hsla(${p.hue},72%,68%,${(1 - cd/CFG.CONN_R) * 0.13})`;
    ctx.lineWidth = 0.55;
    // draw line p → q
  }
}
```

### Tier 3 — Audio-Reactive Wave Canvas (animation level 4)

```tsx
const CFG = isTouch
  ? { particles: 25, eqBars: 32, waveLayers: 2, waveStep: 8, dpr: 1, connections: false }
  : { particles: 80, eqBars: 64, waveLayers: 3, waveStep: 3, dpr: Math.min(devicePixelRatio, 2), connections: true };

// Wave layers — configure colors to match brand
const WAVE_LAYERS = [
  { color: [R1,G1,B1], phase: 0, speed: 0.008, yFrac: 0.72, ampBase: 22 },
  { color: [R2,G2,B2], phase: 1, speed: 0.012, yFrac: 0.78, ampBase: 16 },
  { color: [R3,G3,B3], phase: 2, speed: 0.016, yFrac: 0.84, ampBase: 12 },
];
// Amplitude of each layer is multiplied by audio band energy (bass/mid/high)

// EQ bars with smooth falloff + peak indicators
eqBarValues[i] = Math.max(eqBarValues[i] * 0.88, rawBarValue); // smooth fall
if (rawBarValue > eqBarPeaks[i]) { eqBarPeaks[i] = rawBarValue; eqBarPeakV[i] = 0; }
else { eqBarPeakV[i] += 0.0012; eqBarPeaks[i] = Math.max(0, eqBarPeaks[i] - eqBarPeakV[i]); }
```

## 3.2 — Entrance Splash Gate

Use when: exclusive events, music pages, requires user interaction before audio starts.

```tsx
export function EntranceSplash({ onEnter }: { onEnter: () => void }) {
  const [exiting, setExiting] = useState(false);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(() => onEnter(), 900);
  };

  // Canvas behind content: 4 sinusoidal wave layers + floating particles + center pulse rings
  // Wave config:
  const waves = [
    { color: `rgba(R1,G1,B1,0.15)`, freq: 0.008, amp: 60, speed: 0.8 },
    { color: `rgba(R2,G2,B2,0.12)`, freq: 0.006, amp: 80, speed: 1.2 },
    { color: `rgba(R3,G3,B3,0.10)`, freq: 0.010, amp: 40, speed: 0.6 },
    { color: `rgba(R4,G4,B4,0.08)`, freq: 0.004, amp: 100, speed: 1.5 },
  ];
}
```

```css
.entrance-splash { position: fixed; inset: 0; z-index: 9999; cursor: pointer; transition: opacity 0.7s ease, transform 0.7s ease; }
.entrance-splash.exiting { opacity: 0; transform: scale(1.1); pointer-events: none; }

/* EQ bars animation for entrance decoration */
.eq-bar { animation: eq-pulse 1.2s ease-in-out infinite; animation-delay: var(--delay); }
@keyframes eq-pulse { 0%,100%{height:8px;opacity:0.4} 50%{height:40px;opacity:1} }
```

---

# ██████████████████████████████████████████████████████
# PART 4 — CURSOR CATALOG
# ██████████████████████████████████████████████████████

## 4.0 — Touch Device Detection (ALWAYS implement)

```tsx
const isTouch = typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;
// In cursor component: if (isTouch) return null;
```
```css
@media (hover: none) and (pointer: coarse) {
  body { cursor: auto; }
  button, a, input { cursor: pointer; }
}
```

## 4.1 — CSS Ring Cursor (lightweight, level 1)

Two DOM elements: `.cursor-outer` (ring, spring lag) + `.cursor-dot` (precise center).
```css
.cursor-outer {
  position: fixed; width: 36px; height: 36px; border-radius: 50%;
  border: 1.5px solid var(--accent); pointer-events: none; z-index: 9999;
  transform: translate(-50%,-50%); mix-blend-mode: screen;
  box-shadow: var(--glow-sm); will-change: transform;
  transition: width 0.2s, height 0.2s, border-color 0.2s;
}
.cursor-outer.clicking { width: 56px; height: 56px; border-color: var(--accent-2); }
.cursor-dot {
  position: fixed; width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); pointer-events: none; z-index: 10000;
  transform: translate(-50%,-50%); box-shadow: var(--glow-sm);
}
```
```tsx
// Dot follows mouse exactly; outer ring lerps (spring lag)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// tick: outerX = lerp(outerX, mouseX, 0.13)
```

## 4.2 — Canvas Cursor (particle physics, level 3)

Full canvas, `z-index: 9999`, `mix-blend-mode: screen`, `pointer-events: none`.

```tsx
// Perpetual ring emission every N frames
if (frame % emitEvery === 0) {
  rings.push({ r: 4, alpha: 0.75, color: accentRGB, speed: ringSpeed });
}
// Ring update each tick
ring.r    += ring.speed;
ring.alpha *= 0.93; // fade decay

// Click burst: push N additional rings + glow center dot
onClick: rings.push(...Array.from({length: ringCount}, (_, i) => ({
  r: 6 + i * 12, alpha: 0.9 - i * 0.06, speed: ringSpeed * (0.8 + i * 0.3)
})));

// Spoke styles per mode: 'wave' | 'starburst' | 'radar' | 'pulse' | 'matrix'
// See Part 0 Q4 for full description of each
```

## 4.3 — Beat-Reactive Cursor (level 4)

6 visual modes in `modeRef` (no re-render): `wave | starburst | radar | pulse | matrix | kick`.
Each mode object: `{ ringColor, ringColorAlt, ringSpeed, ringMaxR, ringCount, spokeStyle }`.
On click: `synthesizeBeat(mode)` fires Web Audio oscillator. Mode persists via `modeRef.current`.

## 4.4 — Balloon Cursor with Pop Physics (level 3)

```tsx
// Particle field fires CustomEvent when collision detected
if (Math.hypot(p.x - balloonX, p.y - balloonY) < HIT_R) {
  const dist = Math.hypot(p.x-balloonX, p.y-balloonY) || 1;
  p.vx = ((p.x-balloonX)/dist) * 5.5; // scatter outward
  p.vy = ((p.y-balloonY)/dist) * 5.5;
  window.dispatchEvent(new CustomEvent('balloonPop', { detail: { x: balloonX, y: balloonY } }));
  popCooldownRef.current = true;
  setTimeout(() => { popCooldownRef.current = false; }, 1100);
}

// Navbar: listen + track survival time + record
window.addEventListener('balloonPop', () => {
  setElapsed(prev => { setRecord(r => Math.max(r, prev)); return 0; });
  setPopFlash(true); setTimeout(() => setPopFlash(false), 600);
});
// Timer pauses on visibilitychange + blur (only counts active play time)
```

---

# ██████████████████████████████████████████████████████
# PART 5 — NAVIGATION PATTERNS
# ██████████████████████████████████████████████████████

## 5.1 — Glassmorphism Scroll-Aware Nav

```css
.landing-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--nav-h);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 clamp(16px, 5vw, 56px);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  background: rgba(BG-RGB, 0.55);
  border-bottom: 1px solid rgba(ACCENT-RGB, 0.06);
  transition: background 0.4s, border-color 0.4s, box-shadow 0.4s;
  overflow: visible; /* allow brand float animation to overflow */
}
.landing-nav.scrolled {
  background: rgba(BG-RGB, 0.92);
  box-shadow: 0 1px 20px rgba(0,0,0,0.3);
}
```

## 5.2 — Nav Link with Animated Underline

```css
.nav-link { position: relative; padding: 6px 10px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); transition: color 0.2s, background 0.2s; }
.nav-link::after {
  content: ''; position: absolute; bottom: 2px; left: 10px; right: 10px; height: 1.5px;
  background: var(--accent-grad); transform: scaleX(0); transform-origin: left;
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); border-radius: 99px;
}
.nav-link:hover { color: var(--text); background: rgba(ACCENT-RGB, 0.06); }
.nav-link:hover::after { transform: scaleX(1); }
```

## 5.3 — Dropdown Panel

```css
.dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: rgba(BG-RGB, 0.97); backdrop-filter: blur(24px);
  border: 1px solid var(--border); border-radius: 14px; padding: 6px; min-width: 200px;
  box-shadow: 0 20px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
  animation: dropIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-10px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

## 5.4 — Mobile Drawer

```tsx
{mobileOpen && (
  <div style={{ position:'fixed', top:navH, left:0, right:0, bottom:0,
    background:'var(--bg)', zIndex:48, padding:'20px 24px', overflowY:'auto',
    borderTop:'1px solid var(--border)' }}>
    {/* Nav links, auth, social, seller list */}
  </div>
)}
```

---

# ██████████████████████████████████████████████████████
# PART 6 — HERO ARCHETYPES
# ██████████████████████████████████████████████████████

## 6.1 — Two-Column Text + Visual (SaaS)

```css
.hero {
  min-height: 100vh; display: flex; align-items: center;
  padding: clamp(80px,10vw,120px) clamp(20px,5vw,60px);
  max-width: 1280px; margin: 0 auto; gap: clamp(40px,6vw,80px);
  position: relative; z-index: 5;
}
.hero-left  { flex: 1; min-width: 0; }
.hero-right { flex: 0 0 320–380px; display: flex; align-items: center; justify-content: center; }
```

**Live badge (always include with a "now live" or status signal):**
```css
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(ACCENT-RGB, 0.08); border: 1px solid rgba(ACCENT-RGB, 0.20);
  color: var(--accent); padding: 5px 14px; border-radius: 99px;
  font-size: 0.73rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase;
}
.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.7);
  animation: liveDot 2s ease-in-out infinite;
}
@keyframes liveDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
```

**3D Mouse-Parallax Card:**
```tsx
const onMove = (e: MouseEvent) => {
  const rect = ref.current!.getBoundingClientRect();
  const dx = (e.clientX - (rect.left + rect.width/2))  / window.innerWidth;
  const dy = (e.clientY - (rect.top  + rect.height/2)) / window.innerHeight;
  ref.current!.style.transform = `perspective(800px) rotateY(${dx * 6}deg) rotateX(${-dy * 4}deg)`;
};
// onMouseLeave: reset transform to ''
// transition: 'transform 0.15s ease-out' on the element
```

## 6.2 — Centered Full-Viewport (event/rave)

```css
.hero-section {
  min-height: 100vh; min-height: 100svh;
  display: flex; align-items: center; justify-content: center;
  text-align: center; padding-top: var(--nav-h);
  position: relative; z-index: 1;
}
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(5rem, 18vw, 11rem);
  letter-spacing: 0.08em; line-height: 0.85;
  /* Split into 2 gradient words for max impact */
}
```

## 6.3 — Animated Console Window (AI/SaaS)

```tsx
<div className="console">
  <div className="console-bar">
    <span className="dot" style={{background:'#ef4444'}}/>
    <span className="dot" style={{background:'#f59e0b'}}/>
    <span className="dot" style={{background:'#22c55e'}}/>
    <span className="console-title mono">app.log — connected</span>
  </div>
  <div className="console-body">
    {rows.map((r, i) => (
      <div key={i} className="console-row mono" style={{animationDelay:`${i*0.15}s`}}>
        <span className="from">{r.from}</span>
        <span className="tag" style={{color:r.color}}>{r.tag}</span>
      </div>
    ))}
    <div className="ai-column">
      <div className="ai-orb"/> <span className="mono ai-label">AI CORE</span>
    </div>
  </div>
</div>
```

---

# ██████████████████████████████████████████████████████
# PART 7 — SECTION CATALOG
# ██████████████████████████████████████████████████████

## 7.1 — Trust Bar

**Trigger:** SaaS, product, any cold traffic.
Placed right after hero. Short trust signals with checkmarks or brand icons.

```css
.trust-bar { display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; }
.trust-item { display:inline-flex; align-items:center; gap:6px; color:var(--text-muted); font-size:0.84rem; }
```

## 7.2 — How It Works (3 steps)

```css
.steps-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:32px; max-width:900px; margin:0 auto; }
.step-number { font-family:var(--font-display); font-size:4rem; color:rgba(ACCENT-RGB,0.15); line-height:1; }
```

## 7.3 — Features Grid

Always 6 cards, 3-col desktop → 2-col tablet → 1-col mobile. Per-card `--card-accent` CSS var.

```css
.features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; max-width:1100px; margin:0 auto; }
@media(max-width:768px) { .features-grid { grid-template-columns:repeat(2,1fr); } }
@media(max-width:480px) { .features-grid { grid-template-columns:1fr; } }

/* Glow + top-bar pattern on each card */
.card-glow { position:absolute; top:-50px; right:-50px; width:140px; height:140px; border-radius:50%;
  background:radial-gradient(circle,var(--card-accent),transparent 70%); opacity:0; transition:opacity 0.35s; }
.feat-card:hover .card-glow { opacity:0.2; }
.card-top-bar { position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg,var(--card-accent),transparent); opacity:0; transition:opacity 0.3s; }
.feat-card:hover .card-top-bar { opacity:1; }
```

## 7.4 — Interactive Demo / Before-After

```css
.demo-grid { display:grid; grid-template-columns:1fr auto 1fr; gap:20px; align-items:center; }
.scanner-line.run { animation:scanDown 0.85s ease-in-out forwards; }
@keyframes scanDown { from{top:0;opacity:1} to{top:100%;opacity:0} }
.mask { position:absolute; inset:0; background:rgba(BG-RGB,0.85); transition:opacity 0.45s; }
.mask.hidden { opacity:0; pointer-events:none; }
```

## 7.5 — Metric Counters

```tsx
// IntersectionObserver triggers count-up animation once
// Duration: 1200ms, easing: linear interpolation
// Always pair: value (large) + suffix + label (small, mono, uppercase)
```

## 7.6 — Countdown Timer

```tsx
// Tick every 1000ms. Pause on visibilitychange. Show: DD | HH | MM | SS
const diff = new Date(EVENT_DATE).getTime() - Date.now();
// Display format: days / hours / minutes / seconds with font-display, font-size clamp
```

## 7.7 — RSVP / Waitlist Form with Firebase

```tsx
// Deduplication BEFORE saving — check Instagram + WhatsApp separately
// serverTimestamp() for createdAt
// Validation: normalize phone (digits only), normalize instagram (strip @, lowercase)
// Success state: show follow CTA (Instagram) instead of resetting form
```

## 7.8 — Seller / Team Cards

```css
.seller-card { display:flex; flex-direction:column; align-items:center; gap:14px;
  padding:32px 20px; border-radius:20px; border:2px solid var(--border);
  transition:border-color 0.3s, box-shadow 0.3s; }
/* Hover: border turns brand-specific color (e.g. #25D366 for WhatsApp) */
.seller-avatar { width:68px; height:68px; border-radius:50%;
  background:linear-gradient(135deg,rgba(COLOR,0.13),rgba(COLOR,0.26));
  border:2.5px solid rgba(COLOR,0.4);
  display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-size:20px; font-weight:700; }
.availability-dot { position:absolute; bottom:-1px; right:-1px; width:8px; height:8px;
  border-radius:50%; border:2px solid var(--bg);
  /* green=#10b981 | red=#ef4444 | gray=#9ca3af */ }
```

## 7.9 — Pricing Cards

```css
.pricing-card { flex:1 1 300px; max-width:380px; border-radius:22px; padding:32px;
  background:var(--glass-bg); backdrop-filter:var(--glass-blur);
  border:1px solid var(--border); transition:transform 0.3s, box-shadow 0.3s; }
.pricing-card:hover { transform:translateY(-6px); }
.pricing-card--featured { border-color:var(--accent);
  box-shadow:0 0 0 1px rgba(ACCENT-RGB,0.1), 0 24px 60px rgba(ACCENT-RGB,0.12); }
```

## 7.10 — CTA Band

**Option A — Rings + radial glow:**
```css
.cta-band { position:relative; padding:clamp(80px,10vw,130px) clamp(16px,5vw,64px); text-align:center; overflow:hidden; }
.cta-glow { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  width:600px; height:600px; border-radius:50%;
  background:radial-gradient(ellipse 80% 60%,rgba(ACCENT-RGB,0.14),transparent 65%); }
/* 3 concentric rings: 320px / 520px / 720px
   optional: animation: ringPulse 3s ease-in-out infinite, staggered delays */
```

**Option B — Grid overlay + radial center:**
```css
.cta-band::before { /* radial center glow */ }
.cta-band::after { content:''; position:absolute; inset:0;
  background-image:linear-gradient(rgba(ACCENT-RGB,0.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(ACCENT-RGB,0.04) 1px,transparent 1px);
  background-size:48px 48px; pointer-events:none; }
```

---

# ██████████████████████████████████████████████████████
# PART 8 — SCROLL ANIMATIONS
# ██████████████████████████████████████████████████████

## 8.1 — IntersectionObserver Reveal (no deps)

```css
.reveal { opacity:0; transform:translateY(28px); transition:opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1); }
.reveal.visible { opacity:1; transform:none; }
.reveal-d1{transition-delay:0.10s} .reveal-d2{transition-delay:0.20s}
.reveal-d3{transition-delay:0.30s} .reveal-d4{transition-delay:0.40s}
```

```tsx
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}
```

## 8.2 — Framer-Motion Stagger

```tsx
const container = { hidden:{}, show:{ transition:{ staggerChildren:0.11, delayChildren:0.1 } } };
const item = { hidden:{opacity:0,y:30}, show:{opacity:1,y:0,transition:{duration:0.6,ease:[0.4,0,0.2,1]}} };
// whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:0.2 }} — for individual elements
```

## 8.3 — GSAP ScrollTrigger

```tsx
gsap.registerPlugin(ScrollTrigger);
gsap.fromTo('.step', { opacity:0, y:40 }, {
  opacity:1, y:0, duration:0.7, stagger:0.15, ease:'power2.out',
  scrollTrigger: { trigger:'.steps-section', start:'top 75%' }
});
```

---

# ██████████████████████████████████████████████████████
# PART 9 — BUTTONS & INTERACTIVE ELEMENTS
# ██████████████████████████████████████████████████████

```css
.btn { display:inline-flex; align-items:center; gap:8px; font-weight:700; font-size:1rem;
  border-radius:var(--radius-pill); transition:transform 0.22s, box-shadow 0.22s; }
.btn:hover { transform:translateY(-2px); }
.btn:active { transform:translateY(0) scale(0.97); }

.btn-primary { background:var(--accent-grad); color:#fff; padding:14px 32px;
  box-shadow:0 4px 20px rgba(ACCENT-RGB,0.35); position:relative; overflow:hidden; }
.btn-primary:hover { box-shadow:0 10px 32px rgba(ACCENT-RGB,0.55); }
/* Optional inner shine */
.btn-primary::before { content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%);
  opacity:0; transition:opacity 0.2s; }
.btn-primary:hover::before { opacity:1; }

.btn-ghost     { background:transparent; color:var(--accent); border:2px solid var(--accent); padding:12px 28px; }
.btn-ghost:hover { background:var(--accent); color:#fff; }
.btn-ghost-dark { background:transparent; color:#fff; border:2px solid rgba(255,255,255,0.25); padding:12px 28px; }
.btn-ghost-dark:hover { border-color:rgba(255,255,255,0.6); }
.btn-sm { padding:8px 18px; font-size:0.82rem; }
.btn-lg { padding:16px 40px; font-size:1.05rem; }
```

---

# ██████████████████████████████████████████████████████
# PART 10 — GRADIENT TEXT SYSTEM
# ██████████████████████████████████████████████████████

```css
/* Static */
.gradient-text { background:var(--accent-grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* Animated sweep */
.gradient-text-sweep { background:linear-gradient(135deg, C1 0%, C2 45%, C3 80%, C4 100%);
  background-size:250% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  animation:gradientSweep 5s linear infinite; }
@keyframes gradientSweep { 0%{background-position:0% center} 100%{background-position:250% center} }

/* Shimmer */
.gradient-text-shimmer { background:linear-gradient(to right, C1 20%, C2 50%, C1 80%);
  background-size:500% auto; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  animation:shimmer 4s ease-in-out infinite alternate; }
@keyframes shimmer { 0%{background-position:0%} 100%{background-position:100%} }

/* Drop-shadow glow (for event/rave pages) */
.gradient-text-glow { filter:drop-shadow(0 0 30px rgba(ACCENT-RGB,0.4)); }
```

---

# ██████████████████████████████████████████████████████
# PART 11 — LANGUAGE & THEME TOGGLES
# ██████████████████████████████████████████████████████

```css
.lang-toggle { display:flex; align-items:center; gap:5px; background:rgba(ACCENT-RGB,0.06);
  border:1px solid var(--border); border-radius:20px; padding:5px 12px; transition:border-color 0.2s; }
.lang-active { background:var(--accent-grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.theme-toggle { display:flex; align-items:center; justify-content:center; width:34px; height:34px;
  border-radius:50%; background:var(--glass-bg); border:1px solid var(--border); transition:border-color 0.2s, box-shadow 0.2s; }
.theme-toggle:hover { border-color:var(--accent); box-shadow:var(--glow-sm); }
```

```tsx
// Theme toggle: animated icon swap with framer-motion
<motion.button onClick={onToggle} whileTap={{ scale:0.9 }}>
  <motion.div key={theme} initial={{rotate:-30,opacity:0,scale:0.7}} animate={{rotate:0,opacity:1,scale:1}} transition={{duration:0.25}}>
    {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
  </motion.div>
</motion.button>
```

---

# ██████████████████████████████████████████████████████
# PART 12 — ADMIN / PROTECTED PAGE PATTERN
# ██████████████████████████████████████████████████████

For event guest lists, RSVP management, any operator-only view.

```tsx
// Lightweight session auth (no backend)
const [authed, setAuthed] = useState(() => sessionStorage.getItem('page-auth') === 'true');
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  if (email === VALID_EMAIL && pass === VALID_PASS) {
    sessionStorage.setItem('page-auth', 'true'); setAuthed(true);
  } else { setError('Credenciais inválidas'); }
};
```

Table: glassmorphism wrapper, `overflow-x: auto`, column headers uppercase + letter-spacing,
row hover `background: rgba(ACCENT-RGB, 0.03)`, monospace for dates/phones/IDs.

---

# ██████████████████████████████████████████████████████
# PART 13 — PERFORMANCE TIERS
# ██████████████████████████████████████████████████████

## Device Split Pattern

```tsx
const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const MOBILE  = { particles: 20, connections: false, dpr: 1, blur: '60px', orbOpacity: 0.08 };
const DESKTOP = { particles: 120, connections: true, dpr: Math.min(devicePixelRatio, 2), blur: '100px', orbOpacity: 0.14 };
const CFG = isTouch ? MOBILE : DESKTOP;
```

## Animation Pause on Tab Switch

```tsx
// ALWAYS implement for canvas-heavy pages
const active = () => !document.hidden && document.hasFocus();
document.addEventListener('visibilitychange', () => active() ? resume() : pause());
window.addEventListener('blur', pause);
window.addEventListener('focus', () => { if (active()) resume(); });
```

## Mobile Responsive Reductions

```css
@media (max-width: 640px) {
  .orb { filter: blur(60px); opacity: 0.08; }
  .orb-1 { width: 280px; height: 280px; }
  .console { display: none; } /* hide heavy hero decoration */
  .hero-right { display: none; } /* simplify to text-only hero */
}
```

---

# ██████████████████████████████████████████████████████
# PART 14 — RESPONSIVE BREAKPOINTS
# ██████████████████████████████████████████████████████

| Breakpoint | Width | Key changes |
|---|---|---|
| **Wide** | Default | Max containers, full grids, all decorations |
| **Tablet** | `≤960px` | Hero stacks, 2-col grids, nav pads shrink |
| **Mobile** | `≤640px` | 1-col everything, hide heavy decorative elements |
| **Small** | `≤400px` | Font size reduction, tighter grids |

```css
@media (max-width: 960px) {
  .hero { flex-direction:column; min-height:auto; padding:110px 28px 70px; gap:50px; }
  .features-grid { grid-template-columns:1fr 1fr; }
  .nav-links .nav-link { display:none; } /* keep: logo + CTA + hamburger */
}
@media (max-width: 640px) {
  .hero { padding:96px 20px 60px; }
  .features-grid { grid-template-columns:1fr; }
  footer { flex-direction:column; text-align:center; }
}
@media (hover: none) and (pointer: coarse) { body { cursor:auto; } button,a { cursor:pointer; } }
```

---

# ██████████████████████████████████████████████████████
# PART 15 — FOOTER PATTERNS
# ██████████████████████████████████████████████████████

**Multi-column (SaaS / e-commerce):**
```css
footer { background:var(--bg); padding:clamp(48px,6vw,80px) clamp(16px,5vw,64px) 32px; }
.footer-grid { max-width:1120px; margin:0 auto; display:grid;
  grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:40px;
  padding-bottom:40px; border-bottom:1px solid rgba(255,255,255,0.06); }
.footer-bottom { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-top:24px; }
```

**Minimal (events, single-page):**
```css
.landing-footer { padding:24px 6%; border-top:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between; font-size:0.82rem; }
.footer-link:hover { color:var(--accent); }
```

---

# ██████████████████████████████████████████████████████
# PART 16 — ANTI-PATTERNS (NEVER DO)
# ██████████████████████████████████████████████████████

**CSS:**
❌ Hardcoded hex/rgb colors inside components — always use CSS variables
❌ `background: white` or `background: black` with no texture/gradient
❌ `border-radius: 4px` on cards — use 14–24px for modern feel
❌ `transition: all` — always specify exact properties
❌ Box shadows without brand color tinting
❌ Flat buttons with no shadow, gradient, or glow
❌ `font-weight: 400` on hero titles — minimum 700
❌ Fixed pixel font sizes on headings — always `clamp()`
❌ `backdrop-filter` without `-webkit-backdrop-filter`

**Interactions:**
❌ Custom cursor without `cursor: none` on `body`
❌ `cursor: none` without `@media (hover: none)` restore on mobile
❌ Canvas without `pointer-events: none`
❌ Canvas without `visibilitychange` pause (wastes battery)
❌ `window.addEventListener` without cleanup in `useEffect` return
❌ Hover effects with no `transform: translateY` — always add lift

**Structure:**
❌ Single breakpoint — implement 3–4 minimum
❌ No `ErrorBoundary` on canvas or audio components
❌ `overflow: hidden` on body without testing iOS safari

**Performance:**
❌ Particle count > 80 on mobile — always split MOBILE/DESKTOP config
❌ `blur()` filters > 100px on more than 3 simultaneous elements
❌ `will-change: transform` on every element — reserve for canvas/cursor only

**Animations:**
❌ No `prefers-reduced-motion` check on heavy motion (accessibility)
❌ GSAP/framer-motion loaded but only used for 1 simple fade
❌ Canvas tick loop that never pauses — check `document.hidden`

---

# ██████████████████████████████████████████████████████
# PART 17 — PRE-GENERATION QUALITY CHECKLIST
# ██████████████████████████████████████████████████████

Run this mentally before outputting any code. Fix any NO before generating.

```
BRIEF
  □ All 8 Q&A questions answered?
  □ Design Brief explicitly approved by user?

TOKENS
  □ All colors declared as CSS variables — zero hardcoded hex in components?
  □ Both dark + light token values defined?
  □ Glow system derived from accent RGB values?
  □ --font-display and --font-body declared?

TYPOGRAPHY
  □ Hero title uses clamp()?
  □ Section titles use clamp()?
  □ Letter-spacing appropriate for chosen font?
  □ Eyebrow labels: uppercase + letter-spacing ≥0.15em?

CANVAS / ANIMATION
  □ All canvas: pointer-events: none?
  □ All canvas: resize handler?
  □ All rAF loops: cancelAnimationFrame cleanup in useEffect return?
  □ Touch detected → canvas/cursor returns null?
  □ Tab-switch pause (visibilitychange + blur/focus)?
  □ MOBILE / DESKTOP config split for particle counts?

CURSOR
  □ cursor: none on body if custom cursor?
  □ @media (hover: none) restores cursor on interactive elements?
  □ mix-blend-mode: screen on cursor canvas?

BUTTONS
  □ Every button: hover transform + shadow change?
  □ Primary CTA: gradient fill + colored box-shadow?
  □ Active state: scale(0.97) or translateY(0)?

CARDS
  □ Every card: hover translateY(-4px) minimum?
  □ Per-accent cards use --card-accent CSS custom property?
  □ Glassmorphism: backdrop-filter AND -webkit-backdrop-filter?

SCROLL
  □ .reveal class on every section/grid item?
  □ Stagger delays on grid children (d1 d2 d3...)?
  □ IntersectionObserver uses obs.unobserve (fires once)?

RESPONSIVE
  □ Nav hides text links on mobile, shows hamburger?
  □ Hero stacks to column at ≤960px?
  □ All grids go 1-col at ≤640px?
  □ Orbs/blobs reduced on mobile?
  □ Footer stacks on mobile?

PERFORMANCE
  □ will-change: transform on canvas and cursor elements?
  □ Heavy blur reduced on mobile?
  □ No canvas count >80 particles on touch devices?
```

---

# ██████████████████████████████████████████████████████
# PART 18 — COMPLETE PAGE SCAFFOLD TEMPLATE
# ██████████████████████████████████████████████████████

Fill slots marked [BRACKETS] from the approved Design Brief.

```tsx
export function LandingPage() {
  const [theme, setTheme] = useState<'dark'|'light'>('dark'); // omit if single theme
  const [entered, setEntered] = useState(false);              // omit if no splash gate
  useReveal();

  return (
    <div className="landing" data-theme={theme}>

      {/* ── Entrance Gate ── (omit if not in brief) */}
      {!entered && <EntranceSplash onEnter={() => setEntered(true)} />}

      {/* ── Global Overlays ── */}
      <div className="noise-overlay"/>  {/* level 4+ only */}
      <div className="scanlines"/>       {/* rave/CRT only */}

      {/* ── Background Layers (z-index 0) ── */}
      <div className="orb orb-1"/> <div className="orb orb-2"/> <div className="orb orb-3"/>
      <div className="canvas-wrapper">
        <BackgroundCanvas />   {/* particle field OR wave canvas — configured per brief */}
      </div>

      {/* ── Custom Cursor (z-index 9999) ── */}
      <CustomCursor />   {/* null on touch devices */}

      {/* ── Navigation (z-index 100, fixed) ── */}
      <nav className="landing-nav">
        <a href="/" className="nav-brand">[Brand]</a>
        <div className="nav-links">
          <a href="#[section]" className="nav-link">[Label]</a>
          <LangToggle />
          <ThemeToggle theme={theme} onToggle={...} />  {/* omit if single theme */}
          <a href="/login" className="nav-link">[Sign in]</a>
          <a href="/register" className="btn btn-primary btn-sm">[CTA text]</a>
        </div>
        <button className="hamburger" onClick={...}/>  {/* mobile only */}
      </nav>

      {/* ── Main Content (z-index 2) ── */}
      <main>

        {/* Sections from Design Brief, in order */}
        <HeroSection />
        {/* ... */}

        {/* CTA Band — always last before footer */}
        <section className="cta-band">
          <div className="cta-glow"/>
          {[320,520,720].map(sz => <div key={sz} className="cta-ring" style={{width:sz,height:sz}}/>)}
          <div className="cta-content reveal">
            <h2 className="cta-headline gradient-text">[Headline]</h2>
            <p className="cta-sub">[Subtitle]</p>
            <a href="/register" className="btn btn-primary btn-lg">[CTA] <ArrowRight/></a>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-left">
          <Brand /> <span>© {new Date().getFullYear()} [Company]</span>
        </div>
        <div className="footer-links">
          <a href="/privacy" className="footer-link">Privacy</a>
          <span>·</span>
          <a href="/terms" className="footer-link">Terms</a>
        </div>
      </footer>

    </div>
  );
}
```

---

# ██████████████████████████████████████████████████████
# PART 19 — QUICK DECISION MATRIX
# ██████████████████████████████████████████████████████

| Situation | Best choice |
|-----------|-------------|
| Cold SaaS traffic, professional feel | Vibe A/C · Level 2 · Ring cursor · Stripe section rhythm |
| AI / developer tool | Vibe F · Console hero · Mono labels · Particle orbit cursor |
| Exclusive event, warm audience | Vibe B · Entrance splash · Beat cursor · Countdown + RSVP |
| E-commerce / consumer product | Vibe D · Light primary · Balloon cursor · Seller cards · WhatsApp CTA |
| Creative agency / portfolio | Vibe E · Large display font · Magnetic cards · Level 3+ |
| Music / entertainment | Vibe B · Audio-reactive canvas · Beat cursor · Wave hero |
| Local business | Light primary · WhatsApp grid · Google Maps · Level 1–2 |
| Personal brand | Vibe A or D · Floating orbs · Glass cards · Waitlist form |
| **Animation level** | |
| Rural/slow mobile audience | Level 1–2 only. No canvas. Default cursor. |
| Desktop-first, tech audience | Level 3–4. Full physics. Multi-canvas. |
| Unknown audience | Level 2 — covers 90% of cases beautifully |
| **Canvas choice** | |
| Want depth, no JS | CSS orbs only (Tier 1) |
| Want particles, simple | Tier 2, no orbital physics |
| Want the "wow" | Tier 2 + gravitational/orbital + brand-matched hues |
| Event with audio | Tier 3 — audio-reactive wave canvas |
| **Cursor choice** | |
| Minimal / fast | No custom cursor |
| Premium SaaS dark | Ring cursor |
| Premium dark + particles already | Particle orbit (share canvas) |
| Event / party page | Beat-reactive or balloon |
| High-energy brand | Fire trail cursor |

---

*Built from 5 production landing pages:*
*LP1 — LB Tracking (SaaS · dark blue/cyan · CSS-only animations)*
*LP2 — LB Inbox Flow (SaaS · azure/violet · GSAP + framer-motion + particle field)*
*LP3 — Syne Spark (AI SaaS · fire orange/red · framer-motion + canvas)*
*LP4 — Ornato Sublimação (e-commerce · warm pink/orange · balloon cursor + WhatsApp sellers)*
*LP5 — Open House Party (event · neon rave · entrance gate + beat cursor + audio-reactive canvas)*

*Every pattern is battle-tested in production React + TypeScript applications.*
