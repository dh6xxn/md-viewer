import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

type Props = {
  chart: string;
  dark: boolean;
};

let renderCounter = 0;
let renderQueue: Promise<void> = Promise.resolve();

function createRenderId() {
  renderCounter += 1;
  return `mdv-mermaid-${Date.now()}-${renderCounter}`;
}

function renderQueued(source: string, dark: boolean, renderId: string) {
  const job = renderQueue.then(async () => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: dark ? 'dark' : 'default',
      flowchart: {
        htmlLabels: true,
        useMaxWidth: true,
        curve: 'basis',
      },
    });

    // Validate first. This also prevents a malformed diagram from poisoning
    // the following diagrams in a large Markdown document.
    await mermaid.parse(source, { suppressErrors: false });
    return mermaid.render(renderId, source);
  });

  renderQueue = job.then(() => undefined, () => undefined);
  return job;
}

export default function MermaidBlock({ chart, dark }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    const source = chart.trim();
    const renderId = createRenderId();

    if (container) container.replaceChildren();
    setError(null);
    setRendering(true);

    if (!source) {
      setRendering(false);
      setError('The Mermaid code block is empty.');
      return () => undefined;
    }

    void renderQueued(source, dark, renderId)
      .then(({ svg }) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.replaceChildren();
        containerRef.current.insertAdjacentHTML('afterbegin', svg);
        setRendering(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (containerRef.current) containerRef.current.replaceChildren();
        setRendering(false);
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      if (container) container.replaceChildren();
    };
  }, [chart, dark]);

  if (error) {
    return (
      <div className="mermaid-error">
        <div className="mermaid-error-title">Mermaid diagram could not be rendered</div>
        <pre>{error}</pre>
        <details>
          <summary>Show Mermaid source</summary>
          <pre>{chart}</pre>
        </details>
      </div>
    );
  }

  return (
    <div
      className={`mermaid-diagram${rendering ? ' rendering' : ''}`}
      ref={containerRef}
      role="img"
      aria-label="Mermaid diagram"
      aria-busy={rendering}
    >
      {rendering && <span className="mermaid-loading">Rendering diagram…</span>}
    </div>
  );
}
