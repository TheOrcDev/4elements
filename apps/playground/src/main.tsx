import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { GithubStars } from "@/components/github-stars";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import "./styles.css";

const REPO = "TheOrcDev/4elements";

type ModelName = "opus-5" | "kimi-k3" | "grok-4.5" | "fable-5";

interface ModelOption {
  controls: string;
  /** Wall-clock time the model took to produce its app. */
  duration: string;
  /** Highest reasoning setting the model offers, and what it is called there. */
  effort: string;
  effortDetail: string;
  label: string;
  summary: string;
  value: ModelName;
}

const modelOptions: readonly ModelOption[] = [
  {
    label: "Opus 5",
    value: "opus-5",
    effort: "Max",
    effortDetail: "Thinking effort: max",
    duration: "47m",
    summary:
      "Fire, water, earth and air share one stage, each on its own custom GLSL shader — a volumetric raymarched flame, a refracting swell, ridged terrain with magma in the cracks, and 50k particles integrating a curl field.",
    controls: "Drag to orbit, scroll to zoom, click an element to fly to it.",
  },
  {
    label: "Kimi K3",
    value: "kimi-k3",
    effort: "Max",
    effortDetail: "reasoning_effort: max",
    duration: "70m",
    summary:
      "Four procedural elemental worlds you move between, each with its own shaders, GPU particles and bloom pass.",
    controls: "Nav buttons or keys 1–4 / ← →, drag to orbit, scroll to zoom.",
  },
  {
    label: "Grok 4.5",
    value: "grok-4.5",
    effort: "High",
    effortDetail: "reasoning_effort: high",
    duration: "5m 37s",
    summary:
      "One stage holding GPU particle flames, a vortex field with wind ribbons, a multi-wave water surface with caustics, and displaced rock with crystal spikes — finished with unreal bloom and ACES tone mapping.",
    controls:
      "Nav buttons or click an element to focus, drag to orbit, scroll to zoom.",
  },
  {
    label: "Fable 5",
    value: "fable-5",
    effort: "Max",
    effortDetail: "Thinking effort: max",
    duration: "16m",
    summary:
      "One interactive scene for all four elements, built on custom GLSL shaders, GPU particles and bloom post-processing.",
    controls:
      "Keys 1–4 or click an element to summon it, 0 or Esc for the full view, drag to orbit, scroll to zoom.",
  },
] as const;

const defaultModel: ModelName = "opus-5";

function isModelName(value: string): value is ModelName {
  return modelOptions.some((model) => model.value === value);
}

function App() {
  const [modelQuery, setModelQuery] = useQueryState("model", {
    defaultValue: defaultModel,
    clearOnDefault: false,
  });
  const selectedModel = isModelName(modelQuery) ? modelQuery : defaultModel;
  const activeModel =
    modelOptions.find((model) => model.value === selectedModel) ??
    modelOptions[0];
  const [isSceneReady, setIsSceneReady] = useState(false);

  const sceneUrl = `${import.meta.env.BASE_URL}models/${selectedModel}/index.html`;

  const loadModel = (model: string) => {
    if (isModelName(model)) {
      setIsSceneReady(false);
      setModelQuery(model);
    }
  };

  return (
    <main className="grid min-h-dvh w-full grid-cols-1 bg-background text-foreground md:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
      <aside className="flex h-auto min-h-[42dvh] flex-col gap-5 overflow-auto border-border border-b bg-card p-6 text-card-foreground md:h-dvh md:border-r md:border-b-0">
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading font-semibold text-3xl leading-none tracking-normal">
              4 Elements
            </h1>
            <span className="font-bold text-muted-foreground text-xs uppercase tracking-normal">
              3D scene benchmark
            </span>
          </div>
          <GithubStars repo={REPO} />
        </header>

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-sm">Model</h2>
          <ToggleGroup
            aria-label="Model selector"
            className="grid w-full grid-cols-2"
            data-model={selectedModel}
            onValueChange={loadModel}
            size="sm"
            spacing={2}
            type="single"
            value={selectedModel}
            variant="outline"
          >
            {modelOptions.map((model) => (
              <ToggleGroupItem
                className="w-full min-w-0 shrink truncate px-2 normal-case tracking-normal"
                key={model.value}
                value={model.value}
              >
                {model.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <dt className="font-bold text-muted-foreground text-xs uppercase tracking-normal">
                Reasoning
              </dt>
              <dd
                className="font-medium text-sm"
                title={activeModel.effortDetail}
              >
                {activeModel.effort}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="font-bold text-muted-foreground text-xs uppercase tracking-normal">
                Time to build
              </dt>
              <dd className="font-medium text-sm">{activeModel.duration}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground text-sm">{activeModel.summary}</p>
        </section>

        <Separator />

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-sm">Controls</h2>
          <p className="text-muted-foreground text-sm">
            {activeModel.controls}
          </p>
        </section>

        <Button asChild className="mt-auto w-full" variant="outline">
          <a href={sceneUrl} rel="noopener" target="_blank">
            <ArrowSquareOutIcon aria-hidden="true" data-icon="inline-start" />
            Open {activeModel.label} full screen
          </a>
        </Button>
      </aside>

      <section
        aria-label="Interactive 3D scene viewport"
        className="relative h-[58dvh] min-w-0 bg-background md:h-dvh"
        data-scene-stage
      >
        {/* Each model app draws its own title and HUD, so the shell stays out
            of the viewport apart from the load state. */}
        {isSceneReady ? null : (
          <p
            aria-live="polite"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-muted-foreground text-sm"
          >
            Loading {activeModel.label}…
          </p>
        )}
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: onLoad here is the frame's resource-load event, not a user interaction. */}
        <iframe
          className="h-full w-full border-0"
          key={selectedModel}
          onLoad={() => setIsSceneReady(true)}
          src={sceneUrl}
          title={`${activeModel.label} four elements scene`}
        />
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
