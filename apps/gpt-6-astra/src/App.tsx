import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Expand,
  Flame,
  Grid2X2,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Wind,
  X,
  Waves,
  SlidersHorizontal,
  Move,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const elements = [
  {
    name: 'Fire',
    latin: 'IGNIS',
    word: 'The force of transformation.',
    description:
      'Restless energy. Rising heat. A thousand fleeting sparks, forever becoming something new.',
    color: '#ff8c42',
    Icon: Flame,
  },
  {
    name: 'Air',
    latin: 'AER',
    word: 'The freedom of the unseen.',
    description:
      'An invisible current made visible. Delicate streams gather, spiral, and disappear into the atmosphere.',
    color: '#d5e4ee',
    Icon: Wind,
  },
  {
    name: 'Water',
    latin: 'AQUA',
    word: 'The art of being fluid.',
    description:
      'Always moving. Always adapting. Light bends across an ever-changing surface, held in a moment of balance.',
    color: '#5fb9ff',
    Icon: Waves,
  },
  {
    name: 'Earth',
    latin: 'TERRA',
    word: 'The strength beneath it all.',
    description:
      'Ancient stone, living minerals. A world of rough edges and quiet strength, shaped by the passage of time.',
    color: '#b4c48c',
    Icon: Mountain,
  },
];
type SceneController = {
  setFocused: (index: number) => void;
  setPaused: (paused: boolean) => void;
  setIntensity: (intensity: number) => void;
  reset: () => void;
  destroy: () => void;
};

export default function App() {
  const mount = useRef<HTMLDivElement>(null);
  const engine = useRef<SceneController | null>(null);
  const [focused, setFocused] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [settings, setSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [fps, setFps] = useState(0);
  const focusedRef = useRef(-1);
  const pausedRef = useRef(false);
  const intensityRef = useRef(1);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/elements-scene.js')
      .then(({ createElementsScene }) => {
        if (cancelled || !mount.current) return;
        try {
          engine.current = createElementsScene(mount.current, {
            onReady: () => setReady(true),
            onFps: (value: number) => setFps(value),
            onSelect: (index: number) => {
              focusedRef.current = index;
              setFocused(index);
            },
            onError: (message: string) => setError(message),
          });
          engine.current.setFocused(focusedRef.current);
          engine.current.setIntensity(intensityRef.current);
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            pausedRef.current = true;
            setPaused(true);
          }
          engine.current.setPaused(pausedRef.current);
        } catch {
          setError(
            'The 3D scene needs WebGL 2. Enable hardware acceleration in your browser, then reload.',
          );
        }
      })
      .catch(() =>
        setError('The 3D scene could not load. Please reload to try again.'),
      );
    return () => {
      cancelled = true;
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);
  function select(index: number) {
    focusedRef.current = index;
    setFocused(index);
    engine.current?.setFocused(index);
  }
  function togglePause() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    engine.current?.setPaused(pausedRef.current);
  }
  function reset() {
    engine.current?.reset();
    select(-1);
    intensityRef.current = 1;
    setIntensity(1);
    engine.current?.setIntensity(1);
  }
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        select(-1);
        setSettings(false);
        return;
      }
      if (
        (event.target as HTMLElement).closest(
          'input, [role="slider"], [contenteditable="true"]',
        )
      )
        return;
      if ('1234'.includes(event.key) && event.key.length === 1)
        select(Number(event.key) - 1);
      if (
        event.code === 'Space' &&
        !(event.target as HTMLElement).closest('button')
      ) {
        event.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, []);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
    } catch {
      /* Fullscreen is optional; the scene remains usable. */
    }
  }
  const current = focused >= 0 ? elements[focused] : null;
  return (
    <main
      className={`observatory ${focused >= 0 ? 'is-focused' : ''}`}
      style={
        {
          '--element-color': current?.color ?? '#d4cbb9',
        } as React.CSSProperties
      }
    >
      <header className="masthead">
        <button
          className="brand"
          onClick={() => select(-1)}
          aria-label="Elemental home"
        >
          <span className="brand-mark">✳</span>
          <span>
            ELEMENTAL<span className="brand-dot">.</span>
          </span>
        </button>
        <span className="masthead-caption">AN INTERACTIVE STUDY OF NATURE</span>
        <div className="header-actions">
          <span className="live-status">
            <i />
            LIVE EXPERIENCE
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="icon-button fullscreen-button"
            onClick={fullscreen}
            aria-label="Toggle fullscreen"
          >
            <Expand size={17} />
          </Button>
        </div>
      </header>
      <div className="intro">
        <div>
          <div className="eyebrow">
            <span className="short-rule" />
            FOUR ELEMENTS. INFINITE POSSIBILITIES.
          </div>
          <h1>
            The essence of <em>everything.</em>
          </h1>
        </div>
        <p>
          Four primal forces.
          <br />
          One extraordinary balance.
          <br />
          <span>Explore nature in motion.</span>
        </p>
      </div>
      <section className="experience" aria-label="Interactive 3D elements">
        <div
          ref={mount}
          className="scene-mount"
          aria-label="Animated 3D fire, air, water and earth. Drag to orbit and scroll to zoom."
        />
        <div className="scene-vignette" />
        <div className="scene-topline">
          <span>EXPERIMENT 001 — THE CLASSICAL ELEMENTS</span>
          <span className="dimension-label">REAL-TIME / THREE DIMENSIONS</span>
        </div>
        {!ready && !error && (
          <div className="loading-state">
            <span className="loading-orbit" />
            Awakening the elements…
          </div>
        )}
        {error && (
          <div role="alert" className="error-state">
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload experience
            </Button>
          </div>
        )}
        {current && (
          <div className="focus-description" key={current.name}>
            <button className="back-button" onClick={() => select(-1)}>
              <ArrowLeft size={15} />
              All elements
            </button>
            <div className="focus-latin">
              0{focused + 1} / {current.latin}
            </div>
            <h2>
              {current.name}
              <span>.</span>
            </h2>
            <h3>{current.word}</h3>
            <p>{current.description}</p>
            <span className="focus-tip">
              <Move size={14} />
              Drag to explore every angle
            </span>
          </div>
        )}
        <div className="scene-bottomline">
          <span className="interaction-hint">
            <Move size={14} />
            DRAG TO ORBIT<span className="hint-separator">·</span>SCROLL TO ZOOM
          </span>
          <span className="scene-coordinate">
            {focused >= 0
              ? `0${focused + 1} / ${current?.latin}`
              : '01 — 04 / IN EQUILIBRIUM'}
          </span>
        </div>
      </section>
      <section className="element-index" aria-label="Choose an element">
        {elements.map(({ name, latin, word, color, Icon }, index) => (
          <button
            key={name}
            className={`element-card ${focused === index ? 'selected' : ''}`}
            style={{ '--card-color': color } as React.CSSProperties}
            onClick={() => select(focused === index ? -1 : index)}
            aria-pressed={focused === index}
          >
            <span className="card-top">
              <span className="element-number">0{index + 1}</span>
              <span className="element-latin">{latin}</span>
              <ArrowUpRight size={17} className="card-arrow" />
            </span>
            <span className="element-title">
              <Icon size={23} strokeWidth={1.35} />
              <span>{name}</span>
            </span>
            <span className="element-caption">{word}</span>
          </button>
        ))}
      </section>
      <footer className="control-bar">
        <div className="footer-title">
          <span className="small-asterisk">✳</span>
          <span>A little closer to nature.</span>
        </div>
        <div className="playback-controls">
          <Button
            variant="ghost"
            className="text-control"
            onClick={togglePause}
            aria-label={paused ? 'Play animation' : 'Pause animation'}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
            <span>{paused ? 'Play' : 'Pause'}</span>
          </Button>
          <span className="control-divider" />
          <Button
            variant="ghost"
            className="text-control reset-control"
            onClick={reset}
            aria-label="Reset view"
          >
            <RotateCcw size={15} />
            <span>Reset view</span>
          </Button>
          <Button
            variant="ghost"
            className={`text-control ${settings ? 'active' : ''}`}
            onClick={() => setSettings(!settings)}
            aria-expanded={settings}
            aria-controls="scene-settings"
          >
            <SlidersHorizontal size={15} />
            <span>Atmosphere</span>
          </Button>
          {focused >= 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="icon-button"
              onClick={() => select(-1)}
              aria-label="Show all elements"
            >
              <Grid2X2 size={16} />
            </Button>
          )}
        </div>
        <span className="render-status">
          <i />
          <span>
            {ready ? (paused ? 'PAUSED' : `${fps || '—'} FPS`) : 'LOADING'}
          </span>
          <span className="render-status-divider">/</span>WEBGL 2
        </span>
        {settings && (
          <div className="settings-panel" id="scene-settings">
            <div className="settings-heading">
              <span>Set the atmosphere</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close atmosphere settings"
                onClick={() => setSettings(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <label id="intensity-label">
              Element intensity<span>{intensity.toFixed(1)}×</span>
            </label>
            <Slider
              aria-labelledby="intensity-label"
              min={0.3}
              max={2}
              step={0.1}
              value={[intensity]}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value;
                intensityRef.current = next;
                setIntensity(next);
                engine.current?.setIntensity(next);
              }}
            />
            <div className="slider-labels">
              <span>Subtle</span>
              <span>Untamed</span>
            </div>
            <p>Keyboard: 1–4 to focus · Space to pause · Esc to return</p>
          </div>
        )}
      </footer>
    </main>
  );
}
