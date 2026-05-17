import { getServerOrigin } from "@/lib/serverOrigin";
import type { OntologyInspectorPayload } from "@/lib/crossMarket";

export default async function OntologyInspectorPage() {
  const origin = await getServerOrigin();
  const res = await fetch(`${origin}/api/ontology/inspector`, { cache: "no-store" });
  const payload = (res.ok ? await res.json() : null) as OntologyInspectorPayload | null;

  if (!payload) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-foreground">本体调试台</h1>
        <p className="text-sm text-muted-foreground mt-2">无法加载 /api/ontology/inspector（检查后端与代理）。</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold text-foreground">本体调试台</h1>
        <p className="text-sm text-muted-foreground mt-1">对象、关系、模式与最近推理 trace（来自 FastAPI）。</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-primary">Objects ({payload.objects.length})</h2>
        <ul className="text-sm text-muted-foreground font-mono flex flex-wrap gap-2">
          {payload.objects.map((o) => (
            <li key={o} className="px-2 py-1 rounded-md bg-card border border-border">
              {o}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-primary">Relations ({payload.relations.length})</h2>
        <ul className="text-sm text-muted-foreground font-mono space-y-1">
          {payload.relations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-primary">Patterns ({payload.patterns.length})</h2>
        <ul className="text-sm text-muted-foreground font-mono flex flex-wrap gap-2">
          {payload.patterns.map((p) => (
            <li key={p} className="px-2 py-1 rounded-md bg-card border border-border">
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-primary">Recent traces ({payload.recent_traces.length})</h2>
        <div className="space-y-3">
          {payload.recent_traces.map((t) => (
            <article key={t.trace_id} className="rounded-lg border border-border bg-card/50 p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2 text-muted-foreground text-xs">
                <span className="font-mono">{t.trace_id}</span>
                <span>{t.created_at}</span>
              </div>
              <p className="mt-2 text-foreground/90">{t.query}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                source={t.source} · pattern={t.matched_pattern ?? "—"}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
