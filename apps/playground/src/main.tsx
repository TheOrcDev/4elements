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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      "[data-scene-stage] canvas"
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
    <main className="grid min-h-dvh w-full grid-cols-1 bg-background text-foreground md:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
      <aside className="flex h-auto min-h-[42dvh] flex-col gap-5 overflow-auto border-border border-b bg-card p-6 text-card-foreground md:h-dvh md:border-r md:border-b-0">
        <header className="flex flex-col gap-1">
          <span className="font-bold text-muted-foreground text-xs uppercase tracking-normal">
            4 Elements
          </span>
          <h1 className="max-w-48 font-heading font-semibold text-3xl leading-none tracking-normal">
            3D scene benchmark
          </h1>
        </header>

        <Separator />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-sm">Benchmark</h2>
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
          <p className="text-muted-foreground text-sm">
            {benchmarkPrompts[selectedElement]}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <div
            className="flex items-center justify-between gap-3 text-muted-foreground text-sm"
            data-metrics
          >
            <span>{stats.objects} objects</span>
            <span>{stats.triangles.toLocaleString()} triangles</span>
          </div>
        </section>

        <Button
          className="w-full"
          onClick={exportScreenshot}
          type="button"
        >
          <Download aria-hidden="true" data-icon="inline-start" />
          Export screenshot
        </Button>
      </aside>

      <section
        aria-label="Interactive 3D scene viewport"
        className="relative min-h-[58dvh] min-w-0 bg-background md:min-h-dvh"
        data-scene-stage
      >
        <Badge className="absolute top-4 right-4 z-10 shadow-sm" variant="secondary">
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
