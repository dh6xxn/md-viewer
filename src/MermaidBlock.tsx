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

    await mermaid.parse(source);
    return mermaid.render(renderId, source);
  });

  renderQueue = job.then(() => undefined, () => undefined);
  return job;
}

export default function MermaidBlock({ chart, dark }: Props) {
  // React owns the outer elements. Mermaid is allowed to mutate only this
  // dedicated inner element, preventing React/Mermaid DOM reconciliation
  // conflicts that can blank the entire preview.
  const svgRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const target = svgRef.current;
    const source = chart.trim();
    const renderId = createRenderId();

    if (target) target.innerHTML = '';
    setError(null);
    setRendering(true);

    if (!source) {
      setRendering(false);
      setError('The Mermaid code block is empty.');
      return () => undefined;
    }

    void renderQueued(source, dark, renderId)
      .then(({ svg }) => {
        if (cancelled || !svgRef.current) return;
        svgRef.current.innerHTML = svg;
        setRendering(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (svgRef.current) svgRef.current.innerHTML = '';
        setRendering(false);
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      if (target) target.innerHTML = '';
    };
  }, [chart, dark]);

  return (
    <div
      className={`mermaid-diagram${rendering ? ' rendering' : ''}`}
      role="img"
      aria-label="Mermaid diagram"
      aria-busy={rendering}
    >
      {error ? (
        <div className="mermaid-error">
          <div className="mermaid-error-title">Mermaid diagram could not be rendered</div>
          <pre>{error}</pre>
          <details>
            <summary>Show Mermaid source</summary>
            <pre>{chart}</pre>
          </details>
        </div>
      ) : (
        <>
          {rendering && <span className="mermaid-loading">Rendering diagram…</span>}
          <div ref={svgRef} className="mermaid-svg-container" />
        </>
      )}
    </div>
  );
}
