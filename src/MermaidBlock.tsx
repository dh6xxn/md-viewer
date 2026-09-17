import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

type Props = {
  chart: string;
  dark: boolean;
};

let renderCounter = 0;

function createRenderId() {
  renderCounter += 1;
  return `mdv-mermaid-${Date.now()}-${renderCounter}`;
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

    const renderDiagram = async () => {
      try {
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

        const result = await mermaid.render(renderId, source);
        if (cancelled || !containerRef.current) return;

        containerRef.current.replaceChildren();
        containerRef.current.insertAdjacentHTML('afterbegin', result.svg);
        result.bindFunctions?.(containerRef.current);
        setRendering(false);
      } catch (err) {
        if (cancelled) return;
        if (containerRef.current) containerRef.current.replaceChildren();
        setRendering(false);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    if (source) void renderDiagram();
    else {
      setRendering(false);
      setError('The Mermaid code block is empty.');
    }

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
    <div className={`mermaid-diagram${rendering ? ' rendering' : ''}`} ref={containerRef} role="img" aria-label="Mermaid diagram">
      {rendering && <span className="mermaid-loading">Rendering diagram…</span>}
    </div>
  );
}
