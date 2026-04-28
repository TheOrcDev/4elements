import {
  benchmarkPrompts,
  benchmarkSpecs,
  type ElementName,
} from "@elementbench/benchmarks";
import { type RenderStats, SceneRenderer } from "@elementbench/renderer";
import { Download } from "lucide-react";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
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

function App() {
  const [elementQuery, setElementQuery] = useQueryState("element", {
    defaultValue: "Fire",
    clearOnDefault: false,
  });
  const selectedElement = isElementName(elementQuery) ? elementQuery : "Fire";
  const [activeElement, setActiveElement] = useState(() => getInitialElement());
  const spec = benchmarkSpecs[activeElement];
  const [stats, setStats] = useState<RenderStats>({
    fps: 0,
    objects: 0,
    triangles: 0,
  });

  useEffect(() => {
    setActiveElement(selectedElement);
  }, [selectedElement]);

  const loadElement = (element: ElementName) => {
    setElementQuery(element);
    setActiveElement(element);
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
          <span className="eyebrow">4 Elements</span>
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

        <section className="sidebar-section metrics-section">
          <div className="metrics">
            <span>{stats.objects} objects</span>
            <span>{stats.triangles.toLocaleString()} triangles</span>
          </div>
        </section>

        <Button
          className="export-button"
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
        <Badge className="fps-overlay" variant="secondary">
          {stats.fps.toFixed(0)} FPS
        </Badge>
        <SceneRenderer onStats={setStats} spec={spec} />
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
