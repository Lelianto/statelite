"use client";

import { useState } from "react";
import type { ReactNode } from "react";

const installCommand = "npm install @antihero/statelite";

const coreCode = `import { createStatelite } from '@antihero/statelite'

const counter = createStatelite({
  count: 0,
  label: 'Counter',
})

counter.subscribe(
  state => state.count,
  (count, previous) => {
    console.log(previous, '→', count)
  }
)

counter.setState(
  state => ({ count: state.count + 1 }),
  { action: 'counter/increment' }
)`;

const persistCode = `import {
  createWebStorage,
  persistStore,
} from '@antihero/statelite'

const persistence = persistStore(counter, {
  key: 'counter',
  storage: createWebStorage('localStorage'),
  version: 1,
  partialize: state => ({ count: state.count }),
})

await persistence.rehydrate()`;

const quickStartSteps = [
  {
    id: "install",
    number: "1",
    title: "Install the package",
    copy: "Add one dependency. There are no peer dependencies.",
    label: "Terminal",
    code: `npm install @antihero/statelite`,
  },
  {
    id: "create",
    number: "2",
    title: "Create your store",
    copy: "Start with any object. Types are inferred from the initial state.",
    label: "store.ts",
    code: `import { createStatelite } from '@antihero/statelite'

export const counter = createStatelite({
  count: 0,
  label: 'Counter',
})`,
  },
  {
    id: "subscribe",
    number: "3",
    title: "Read, update, subscribe",
    copy: "Use the store directly or bridge it to your framework's reactive primitive.",
    label: "counter.ts",
    code: `const stop = counter.subscribe(
  state => state.count,
  (count, previousCount) => {
    console.log(previousCount, '→', count)
  }
)

counter.setState(
  state => ({ count: state.count + 1 }),
  { action: 'counter/increment' }
)

stop()`,
  },
];

const reactCode = `import { useSyncExternalStore } from 'react'

export function useCounter() {
  return useSyncExternalStore(
    counter.subscribe,
    counter.getState,
    counter.getInitialState
  )
}`;

const frameworkIntegrations = [
  {
    name: "React",
    integration: "useSyncExternalStore",
    label: "useCounter.ts",
    code: reactCode,
  },
  {
    name: "Vue",
    integration: "shallowRef + onScopeDispose",
    label: "useCounter.ts",
    code: `import { onScopeDispose, shallowRef } from 'vue'

export function useCounter() {
  const state = shallowRef(counter.getState())
  const unsubscribe = counter.subscribe(next => {
    state.value = next
  })

  onScopeDispose(unsubscribe)
  return state
}`,
  },
  {
    name: "Svelte",
    integration: "Readable store contract",
    label: "counter.svelte.ts",
    code: `export const svelteCounter = {
  subscribe(run) {
    run(counter.getState())

    return counter.subscribe(state => {
      run(state)
    })
  },
}`,
  },
  {
    name: "Angular",
    integration: "Signal bridge",
    label: "counter.service.ts",
    code: `import { signal } from '@angular/core'

const state = signal(counter.getState())

counter.subscribe(next => {
  state.set(next)
})

export const counterSignal = state.asReadonly()`,
  },
  {
    name: "Solid",
    integration: "Fine-grained signal bridge",
    label: "counter.ts",
    code: `import { createSignal, onCleanup } from 'solid-js'

export function useCounter() {
  const [state, setState] = createSignal(counter.getState())
  const unsubscribe = counter.subscribe(setState)

  onCleanup(unsubscribe)
  return state
}`,
  },
  {
    name: "Vanilla",
    integration: "Direct subscription",
    label: "counter.ts",
    code: `const output = document.querySelector('#count')

counter.subscribe(state => {
  output.textContent = String(state.count)
})

document.querySelector('#increment').onclick = () => {
  counter.setState(state => ({
    count: state.count + 1,
  }))
}`,
  },
];

const features = [
  {
    number: "01",
    title: "Framework-agnostic",
    copy: "One external-store contract for React, Vue, Svelte, Angular, Solid, vanilla JavaScript, workers, and SSR.",
  },
  {
    number: "02",
    title: "Reactive selectors",
    copy: "Subscribe to exactly the slice you need. Equality checks keep updates focused and rendering predictable.",
  },
  {
    number: "03",
    title: "Type-safe by default",
    copy: "State, updater functions, selected slices, and listeners are inferred without extra annotations or code generation.",
  },
  {
    number: "04",
    title: "Pluggable persistence",
    copy: "Bring local storage, session storage, IndexedDB, native storage, server storage, or a tiny in-memory adapter.",
  },
  {
    number: "05",
    title: "SSR-safe core",
    copy: "No window, document, cookie, or storage access in the core. Create isolated stores safely for each request.",
  },
  {
    number: "06",
    title: "Zero dependencies",
    copy: "A small surface area that stays easy to audit, tree-shake, test, and carry across frontend stacks.",
  },
];

const apiRows = [
  {
    method: "getState()",
    description: "Read the current readonly state snapshot.",
    detail:
      "Returns the latest state synchronously without creating a subscription.",
    example: "const currentCount = counter.getState().count",
  },
  {
    method: "getInitialState()",
    description: "Read the stable initial snapshot for SSR.",
    detail:
      "Useful as the server snapshot passed to framework hydration APIs.",
    example: "const serverSnapshot = counter.getInitialState()",
  },
  {
    method: "setState(update, options?)",
    description: "Merge or replace state with an optional action label.",
    detail:
      "Accepts a partial object or updater function. Use replace when the complete state should be swapped.",
    example:
      "counter.setState(s => ({ count: s.count + 1 }), { action: 'increment' })",
  },
  {
    method: "reset(action?)",
    description: "Restore the original state.",
    detail:
      "Resets the store to its initial snapshot and notifies subscribers only when state changes.",
    example: "counter.reset('counter/reset')",
  },
  {
    method: "subscribe(listener)",
    description: "Listen to every effective state change.",
    detail:
      "The listener receives current state, previous state, and the optional action label.",
    example:
      "const stop = counter.subscribe((state, previous, action) => {})",
  },
  {
    method: "subscribe(selector, listener)",
    description: "Listen only when a selected slice changes.",
    detail:
      "Selected values use Object.is by default. Pass a custom equality function for structured slices.",
    example:
      "counter.subscribe(s => s.count, (count, previousCount) => {})",
  },
  {
    method: "select(selector)",
    description: "Read a derived value without subscribing.",
    detail:
      "Runs the selector once against the current snapshot and returns its result.",
    example: "const doubled = counter.select(s => s.count * 2)",
  },
  {
    method: "destroy()",
    description: "Remove listeners and stop future updates.",
    detail:
      "Use when a store has a bounded lifecycle and should release every active subscriber.",
    example: "counter.destroy()",
  },
];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function CodeWindow({
  code,
  label = "counter.ts",
  compact = false,
}: {
  code: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={`code-window ${compact ? "code-window-compact" : ""}`}>
      <div className="code-bar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span>{label}</span>
        <span className="code-status">TypeScript</span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CopyInstall() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="install-command" onClick={copy} type="button">
      <span className="prompt">$</span>
      <code>{installCommand}</code>
      <span className="copy-label">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: ReactNode;
  copy: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState("install");
  const [activeFramework, setActiveFramework] = useState("React");
  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const selectedFramework =
    frameworkIntegrations.find(({ name }) => name === activeFramework) ??
    frameworkIntegrations[0];
  const selectedStep =
    quickStartSteps.find(({ id }) => id === activeStep) ?? quickStartSteps[0];

  return (
    <main>
      <header className="site-header">
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Statelite home">
            <span className="wordmark" aria-hidden="true">
              <span className="wordmark-state">state</span>
              <span className="wordmark-lite">lite</span>
            </span>
            <span className="version">v2.0</span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#features">Features</a>
            <a href="#quick-start">Quick start</a>
            <a href="#frameworks">Frameworks</a>
            <a href="#api">API</a>
          </nav>

          <div className="nav-actions">
            <a
              className="nav-link-external"
              href="https://www.npmjs.com/package/@antihero/statelite"
              target="_blank"
              rel="noreferrer"
            >
              npm <ArrowIcon />
            </a>
            <a
              className="button button-dark button-small"
              href="https://github.com/Lelianto/statelite"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ArrowIcon />
            </a>
            <button
              className="menu-button"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#quick-start" onClick={() => setMenuOpen(false)}>
              Quick start
            </a>
            <a href="#frameworks" onClick={() => setMenuOpen(false)}>
              Frameworks
            </a>
            <a href="#api" onClick={() => setMenuOpen(false)}>
              API reference
            </a>
          </nav>
        )}
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />

        <div className="container hero-layout">
          <div className="hero-copy">
            <a
              className="release-pill"
              href="https://github.com/Lelianto/statelite/releases/tag/v2.0.0"
              target="_blank"
              rel="noreferrer"
            >
              <span className="release-dot" />
              Version 2.0 is available
              <span aria-hidden="true">→</span>
            </a>
            <h1>
              State that fits
              <span> anywhere.</span>
            </h1>
            <p className="hero-lead">
              A tiny, type-safe store that stays out of your framework. Build
              predictable state once, then use it everywhere your frontend
              runs.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#quick-start">
                Read the docs <span aria-hidden="true">→</span>
              </a>
              <a
                className="button button-ghost"
                href="https://github.com/Lelianto/statelite"
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub <ArrowIcon />
              </a>
            </div>
            <CopyInstall />
            <div className="hero-proof">
              <span>
                <i className="proof-dot proof-dot-green" /> 0 dependencies
              </span>
              <span>
                <i className="proof-dot proof-dot-indigo" /> TypeScript first
              </span>
              <span>
                <i className="proof-dot proof-dot-violet" /> MIT licensed
              </span>
            </div>
          </div>

          <div className="hero-code-wrap">
            <div className="code-orbit code-orbit-one" aria-hidden="true" />
            <div className="code-orbit code-orbit-two" aria-hidden="true" />
            <CodeWindow code={coreCode} />
            <div className="floating-badge floating-badge-top">
              <span>TS</span>
              Fully inferred
            </div>
            <div className="floating-badge floating-badge-bottom">
              <span className="pulse-dot" />
              Reactive by design
            </div>
          </div>
        </div>

        <div className="container framework-ribbon">
          <span>One store. Every frontend.</span>
          <div className="framework-list">
            {["React", "Vue", "Svelte", "Angular", "Solid", "Vanilla"].map(
              (framework) => (
                <span key={framework}>{framework}</span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="section features-section" id="features">
        <div className="container">
          <SectionHeading
            eyebrow="Built for the long run"
            title={
              <>
                Small core.
                <br />
                Serious capability.
              </>
            }
            copy="Statelite gives you the primitives a real application needs without taking ownership of your architecture."
          />
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <div className="feature-card-top">
                  <span className="feature-number">{feature.number}</span>
                  <span className="feature-status">Included</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section quick-start-section" id="quick-start">
        <div className="container">
          <SectionHeading
            eyebrow="Quick start"
            title="From install to update in minutes."
            copy="The API is intentionally compact. Create a store, subscribe to what matters, and update with plain objects or typed functions."
          />

          <div className="steps-layout">
            <div
              className="steps"
              role="tablist"
              aria-label="Quick start steps"
            >
              {quickStartSteps.map((step) => (
                <button
                  className={`step ${activeStep === step.id ? "active" : ""}`}
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={activeStep === step.id}
                  aria-controls="quick-start-code"
                  onClick={() => setActiveStep(step.id)}
                >
                  <span>{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                    {step.id === "install" && (
                      <code className="step-command">{installCommand}</code>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div id="quick-start-code" role="tabpanel">
              <CodeWindow
                code={selectedStep.code}
                label={selectedStep.label}
                compact
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section persistence-section">
        <div className="container persistence-layout">
          <div className="persistence-copy">
            <span className="eyebrow">Persistence, your way</span>
            <h2>Keep state without coupling the core.</h2>
            <p>
              Persistence is opt-in and adapter-based. Use synchronous or
              asynchronous storage, persist only selected fields, version your
              schema, and migrate safely.
            </p>
            <ul className="check-list">
              <li>
                <span>✓</span> localStorage and sessionStorage helpers
              </li>
              <li>
                <span>✓</span> Async storage adapters
              </li>
              <li>
                <span>✓</span> Versioned migrations
              </li>
              <li>
                <span>✓</span> Partial persistence and custom serialization
              </li>
            </ul>
            <a className="text-link" href="#api">
              Explore the persistence API <span>→</span>
            </a>
          </div>
          <CodeWindow code={persistCode} label="persist.ts" compact />
        </div>
      </section>

      <section className="section frameworks-section" id="frameworks">
        <div className="container">
          <SectionHeading
            eyebrow="Bring your own framework"
            title="The same state. The right integration."
            copy="Statelite exposes a simple snapshot and subscription contract, so every framework can consume it naturally."
          />
          <div className="framework-showcase">
            <div
              className="framework-cards"
              role="tablist"
              aria-label="Framework integration examples"
            >
              {frameworkIntegrations.map(({ name, integration }) => (
                <button
                  className={`framework-card ${
                    activeFramework === name ? "selected" : ""
                  }`}
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={activeFramework === name}
                  aria-controls="framework-code-panel"
                  onClick={() => setActiveFramework(name)}
                >
                  <span className="framework-initial">{name[0]}</span>
                  <div>
                    <h3>{name}</h3>
                    <p>{integration}</p>
                  </div>
                  <span className="framework-select-indicator" aria-hidden="true">
                    {activeFramework === name ? "●" : "○"}
                  </span>
                </button>
              ))}
            </div>
            <div id="framework-code-panel" role="tabpanel">
              <CodeWindow
                code={selectedFramework.code}
                label={selectedFramework.label}
                compact
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section api-section" id="api">
        <div className="container">
          <div className="api-header">
            <SectionHeading
              eyebrow="API reference"
              title="Everything you need. Nothing you don't."
              copy="Eight focused methods cover the full store lifecycle, from the first snapshot to cleanup."
            />
            <a
              className="button button-ghost"
              href="https://github.com/Lelianto/statelite#api-reference"
              target="_blank"
              rel="noreferrer"
            >
              Full reference <ArrowIcon />
            </a>
          </div>
          <div className="api-table" aria-label="Statelite API">
            {apiRows.map(({ method, description, detail, example }) => {
              const isExpanded = expandedApi === method;

              return (
                <div className={`api-item ${isExpanded ? "expanded" : ""}`} key={method}>
                  <button
                    className="api-row"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`api-detail-${method.replace(/\W/g, "")}`}
                    onClick={() => setExpandedApi(isExpanded ? null : method)}
                  >
                    <code>{method}</code>
                    <p>{description}</p>
                    <span className="api-toggle" aria-hidden="true">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>
                  {isExpanded && (
                    <div
                      className="api-detail"
                      id={`api-detail-${method.replace(/\W/g, "")}`}
                    >
                      <p>{detail}</p>
                      <code>{example}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-grid" aria-hidden="true" />
        <div className="container cta-content">
          <span className="eyebrow eyebrow-light">Start small. Scale clearly.</span>
          <h2>Your state layer can be the simplest part of your stack.</h2>
          <p>
            Install Statelite and ship your first framework-independent store
            today.
          </p>
          <div className="cta-actions">
            <a className="button button-light" href="#quick-start">
              Get started <span>→</span>
            </a>
            <a
              className="button button-outline-light"
              href="https://www.npmjs.com/package/@antihero/statelite"
              target="_blank"
              rel="noreferrer"
            >
              View on npm <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div>
            <a className="brand footer-brand" href="#top">
              <span className="wordmark" aria-hidden="true">
                <span className="wordmark-state">state</span>
                <span className="wordmark-lite">lite</span>
              </span>
            </a>
            <p>
              A tiny framework-agnostic TypeScript state store by Lelianto.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <span>Product</span>
              <a href="#features">Features</a>
              <a href="#quick-start">Quick start</a>
              <a href="#api">API reference</a>
            </div>
            <div>
              <span>Resources</span>
              <a
                href="https://github.com/Lelianto/statelite"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://www.npmjs.com/package/@antihero/statelite"
                target="_blank"
                rel="noreferrer"
              >
                npm
              </a>
              <a
                href="https://github.com/Lelianto/statelite/releases"
                target="_blank"
                rel="noreferrer"
              >
                Releases
              </a>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>MIT License · © 2026 Statelite</span>
          <a href="#top">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </footer>
    </main>
  );
}
