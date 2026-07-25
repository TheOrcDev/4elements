import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { GithubStars } from "@/components/github-stars";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import "./styles.css";

const REPO = "TheOrcDev/4elements";

type ModelName =
  | "opus-5"
  | "kimi-k3"
  | "grok-4.5"
  | "fable-5"
  | "sol-ultra"
  | "terra-ultra"
  | "luna-extra-high"
  | "gpt-5.5";

type ModelProvider = "openai" | "anthropic" | "grok" | "other";

interface ProviderOption {
  label: string;
  value: ModelProvider;
}

const providerOptions: readonly ProviderOption[] = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Grok", value: "grok" },
  { label: "Other", value: "other" },
] as const;

interface ModelOption {
  controls: string;
  /** Wall-clock time the model took to produce its app. */
  duration: string;
  /** Highest reasoning setting the model offers, and what it is called there. */
  effort: string;
  effortDetail: string;
  label: string;
  provider: ModelProvider;
  summary: string;
  value: ModelName;
}

const modelOptions: readonly ModelOption[] = [
  {
    label: "Opus 5",
    value: "opus-5",
    provider: "anthropic",
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
    provider: "other",
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
    provider: "grok",
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
    provider: "anthropic",
    effort: "Max",
    effortDetail: "Thinking effort: max",
    duration: "16m",
    summary:
      "One interactive scene for all four elements, built on custom GLSL shaders, GPU particles and bloom post-processing.",
    controls:
      "Keys 1–4 or click an element to summon it, 0 or Esc for the full view, drag to orbit, scroll to zoom.",
  },
  {
    label: "Sol Ultra",
    value: "sol-ultra",
    provider: "openai",
    effort: "Ultra",
    effortDetail: "Effort tier: ultra",
    duration: "25m",
    summary:
      "A field-guide study of the four elements, each with its own bloom-lit Three.js composition, reached from a guide along the bottom of the frame.",
    controls:
      "Keys 1–4 or the field guide to select an element, arrow keys to move between them, Esc or O for the overview, drag to orbit, scroll to zoom.",
  },
  {
    label: "Terra Ultra",
    value: "terra-ultra",
    provider: "openai",
    effort: "Ultra",
    effortDetail: "Effort tier: ultra",
    duration: "8m 41s",
    summary:
      "A sanctum giving each element its own procedural form: ascending embers over a pulsing core, orbiting wind ribbons, a refractive sapphire orb ringed by waves, and levitating faceted stone veined with crystal.",
    controls: "Drag to orbit, scroll to zoom, and use the element controls.",
  },
  {
    label: "Luna Extra High",
    value: "luna-extra-high",
    provider: "openai",
    effort: "Extra High",
    effortDetail: "Effort tier: extra high",
    duration: "8m 46s",
    summary:
      "A field-guide atlas holding all four specimens in one grid, each its own live geometry, with a side panel selecting the active force and reading out its state, energy and range.",
    controls:
      "Select a force from the panel to change specimen, drag to orbit, scroll to zoom, reset view to recentre.",
  },
  {
    label: "GPT 5.5",
    value: "gpt-5.5",
    provider: "openai",
    effort: "Extra High",
    effortDetail: "Effort tier: extra high",
    duration: "9m 59s",
    summary:
      "Four plinths strung along one lit path, each holding an element built from custom shader materials and instanced point systems, composited through an unreal bloom pass.",
    controls: "Pick an element to focus it, drag to orbit, scroll to zoom.",
  },
] as const;

const defaultModel: ModelName = "opus-5";

function isModelName(value: string): value is ModelName {
  return modelOptions.some((model) => model.value === value);
}

function isModelProvider(value: string): value is ModelProvider {
  return providerOptions.some((provider) => provider.value === value);
}

function getModelProvider(model: ModelName): ModelProvider {
  return (
    modelOptions.find((option) => option.value === model)?.provider ?? "other"
  );
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
  // Follows the selected model, so a deep link opens on the right provider tab,
  // but can be moved on its own to browse other providers.
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(() =>
    getModelProvider(selectedModel)
  );
  const filteredModelOptions = modelOptions.filter(
    (model) => model.provider === selectedProvider
  );

  const sceneUrl = `${import.meta.env.BASE_URL}models/${selectedModel}/index.html`;

  const loadModel = (model: string) => {
    if (isModelName(model)) {
      setIsSceneReady(false);
      setModelQuery(model);
      setSelectedProvider(getModelProvider(model));
    }
  };

  const filterByProvider = (provider: string) => {
    if (isModelProvider(provider)) {
      setSelectedProvider(provider);
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
          <Tabs onValueChange={filterByProvider} value={selectedProvider}>
            <TabsList aria-label="Model provider filter">
              {providerOptions.map((provider) => (
                <TabsTrigger key={provider.value} value={provider.value}>
                  {provider.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
            {filteredModelOptions.map((model) => (
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
