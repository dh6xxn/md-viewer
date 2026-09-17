import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let mermaidCounter = 0;

function nextId() {
  mermaidCounter += 1;
  return `mdv-mermaid-${mermaidCounter}`;
}

type Props = {
  chart: string;
  dark: boolean;
};

export default function MermaidBlock({ chart, dark }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(nextId());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      setError(null);
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: dark ? 'dark' : 'default',
          flowchart: { htmlLabels: true, useMaxWidth: true },
        });

        const { svg, bindFunctions } = await mermaid.render(idRef.current, chart.trim());
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = svg;
        bindFunctions?.(containerRef.current);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    void renderDiagram();
    return () => {
      cancelled = true;
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

  return <div ref={containerRef} className="mermaid-diagram" role="img" aria-label="Mermaid diagram" />;
}
