import {
  benchmarkPrompts,
  benchmarkSpecs,
  type ElementName,
} from "@elementbench/benchmarks";
import { type RenderStats, SceneRenderer } from "@elementbench/renderer";
import { type SceneSpec, sceneSpecSchema } from "@elementbench/scene-schema";
import { Download, RotateCcw } from "lucide-react";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/react";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import "./styles.css";

const elementOrder: ElementName[] = ["Fire", "Air", "Earth", "Water"];

function isElementName(value: string): value is ElementName {
  return elementOrder.includes(value as ElementName);
}

function getInitialElement() {
  if (typeof window === "undefined") {
    return "Fire";
  }
  const element = new URLSearchParams(window.location.search).get("element");
  return element && isElementName(element) ? element : "Fire";
}

function parseSceneSpec(text: string) {
  try {
    const parsed = JSON.parse(text);
    const result = sceneSpecSchema.safeParse(parsed);
    if (!result.success) {
      return {
        spec: null,
        error: result.error.issues
          .map(
            (issue) => `${issue.path.join(".") || "scene"}: ${issue.message}`
          )
          .join("\n"),
      };
    }
    return { spec: result.data, error: "" };
  } catch (error) {
    return {
      spec: null,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}

function formatSpec(spec: SceneSpec) {
  return JSON.stringify(spec, null, 2);
}

function App() {
  const [elementQuery, setElementQuery] = useQueryState("element", {
    defaultValue: "Fire",
    clearOnDefault: false,
  });
  const selectedElement = isElementName(elementQuery) ? elementQuery : "Fire";
  const [specText, setSpecText] = useState(() =>
    formatSpec(benchmarkSpecs[getInitialElement()])
  );
  const [stats, setStats] = useState<RenderStats>({
    fps: 0,
    triangles: 0,
    objects: 0,
  });
  const parsed = useMemo(() => parseSceneSpec(specText), [specText]);

  useEffect(() => {
    setSpecText(formatSpec(benchmarkSpecs[selectedElement]));
  }, [selectedElement]);

  const loadElement = (element: ElementName) => {
    setElementQuery(element);
    setSpecText(formatSpec(benchmarkSpecs[element]));
  };

  const resetCurrent = () => {
    setSpecText(formatSpec(benchmarkSpecs[selectedElement]));
  };

  const exportScreenshot = () => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".scene-stage canvas"
    );
    if (!canvas) {
      return;
    }
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `elementbench-${selectedElement.toLowerCase()}-${Date.now()}.png`;
    link.click();
  };

  return (
    <main className="app">
      <aside className="control-panel">
        <header className="sidebar-header">
          <span className="eyebrow">ElementBench</span>
          <h1>3D scene benchmark</h1>
        </header>

        <Separator />

        <section className="sidebar-section">
          <div className="section-heading">
            <h2>Benchmark</h2>
          </div>
          <Tabs
            onValueChange={(value) => loadElement(value as ElementName)}
            value={selectedElement}
          >
            <TabsList aria-label="Element selector">
              {elementOrder.map((element) => (
                <TabsTrigger key={element} value={element}>
                  {element}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="prompt">{benchmarkPrompts[selectedElement]}</p>
        </section>

        <section className="sidebar-section editor-section">
          <div className="section-heading">
            <h2>Scene JSON</h2>
            <Button
              onClick={resetCurrent}
              size="icon"
              title="Reset sample"
              type="button"
              variant="ghost"
            >
              <RotateCcw aria-hidden="true" size={16} />
            </Button>
          </div>
          <Textarea
            aria-label="Scene JSON editor"
            onChange={(event) => setSpecText(event.target.value)}
            spellCheck={false}
            value={specText}
          />
        </section>

        <section className="sidebar-section validation-section">
          <div className="status-row">
            <Badge variant={parsed.spec ? "success" : "destructive"}>
              {parsed.spec ? "Valid schema" : "Invalid schema"}
            </Badge>
            <Badge variant="secondary">{stats.fps.toFixed(0)} FPS</Badge>
          </div>
          <div className="metrics">
            <span>{stats.objects} objects</span>
            <span>{stats.triangles.toLocaleString()} triangles</span>
          </div>
          {parsed.error ? <pre className="errors">{parsed.error}</pre> : null}
        </section>

        <Button
          className="export-button"
          disabled={!parsed.spec}
          onClick={exportScreenshot}
          type="button"
        >
          <Download aria-hidden="true" size={17} />
          Export screenshot
        </Button>
      </aside>

      <section
        aria-label="Interactive 3D scene viewport"
        className="scene-stage"
      >
        {parsed.spec ? (
          <SceneRenderer onStats={setStats} spec={parsed.spec} />
        ) : (
          <div className="empty-state">
            <h2>Scene paused</h2>
            <p>Fix the JSON validation issue to render the scene.</p>
          </div>
        )}
      </section>
    </main>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>
);
