import React from "react";
import { createRoot } from "react-dom/client";
import { Download, RotateCcw } from "lucide-react";
import { SceneRenderer, type RenderStats } from "@elementbench/renderer";
import { benchmarkSpecs, benchmarkPrompts, type ElementName } from "@elementbench/benchmarks";
import { sceneSpecSchema, type SceneSpec } from "@elementbench/scene-schema";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import "./styles.css";

const elementOrder: ElementName[] = ["Fire", "Air", "Earth", "Water"];

function parseSceneSpec(text: string) {
  try {
    const parsed = JSON.parse(text);
    const result = sceneSpecSchema.safeParse(parsed);
    if (!result.success) {
      return {
        spec: null,
        error: result.error.issues
          .map((issue) => `${issue.path.join(".") || "scene"}: ${issue.message}`)
          .join("\n")
      };
    }
    return { spec: result.data, error: "" };
  } catch (error) {
    return {
      spec: null,
      error: error instanceof Error ? error.message : "Invalid JSON"
    };
  }
}

function formatSpec(spec: SceneSpec) {
  return JSON.stringify(spec, null, 2);
}

function App() {
  const [selectedElement, setSelectedElement] = React.useState<ElementName>("Air");
  const [specText, setSpecText] = React.useState(() => formatSpec(benchmarkSpecs.Air));
  const [stats, setStats] = React.useState<RenderStats>({
    fps: 0,
    triangles: 0,
    objects: 0
  });
  const parsed = React.useMemo(() => parseSceneSpec(specText), [specText]);

  const loadElement = (element: ElementName) => {
    setSelectedElement(element);
    setSpecText(formatSpec(benchmarkSpecs[element]));
  };

  const resetCurrent = () => {
    setSpecText(formatSpec(benchmarkSpecs[selectedElement]));
  };

  const exportScreenshot = () => {
    const canvas = document.querySelector<HTMLCanvasElement>(".scene-stage canvas");
    if (!canvas) return;
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
          <Tabs value={selectedElement} onValueChange={(value) => loadElement(value as ElementName)}>
            <TabsList aria-label="Element selector">
            {elementOrder.map((element) => (
              <TabsTrigger
                key={element}
                value={element}
              >
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
            <Button variant="ghost" size="icon" onClick={resetCurrent} type="button" title="Reset sample">
              <RotateCcw aria-hidden="true" size={16} />
            </Button>
          </div>
          <Textarea
            spellCheck={false}
            value={specText}
            onChange={(event) => setSpecText(event.target.value)}
            aria-label="Scene JSON editor"
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

        <Button className="export-button" onClick={exportScreenshot} disabled={!parsed.spec} type="button">
          <Download aria-hidden="true" size={17} />
          Export screenshot
        </Button>
      </aside>

      <section className="scene-stage" aria-label="Interactive 3D scene viewport">
        {parsed.spec ? (
          <SceneRenderer spec={parsed.spec} onStats={setStats} />
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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
