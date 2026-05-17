"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Package,
  Link2,
  Cog,
  ChevronDown,
  ChevronRight,
  Zap,
  Network,
} from "lucide-react";
import { fetchOntologyObjects, fetchOntologyPatterns } from "@/lib/crossMarket";

interface OntologyObjectRow {
  id: string;
  type: string;
  name: string;
  active?: boolean;
}

interface OntologyLinkRow {
  id: string;
  from: string;
  relation: string;
  to: string;
  status?: "verified" | "inferred";
  note?: string;
}

export function OntologyInspector() {
  const [expandedSections, setExpandedSections] = useState({
    objects: true,
    links: true,
    stats: true,
  });
  const [objects, setObjects] = useState<OntologyObjectRow[]>([]);
  const [links, setLinks] = useState<OntologyLinkRow[]>([]);
  const [patternTitles, setPatternTitles] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [objRes, patRes] = await Promise.all([
          fetchOntologyObjects(),
          fetchOntologyPatterns(),
        ]);
        if (cancelled) return;
        const objs: OntologyObjectRow[] = objRes.objects.map((name, i) => ({
          id: `o-${i}`,
          type: "Object",
          name,
          active: i < 4,
        }));
        setObjects(objs);
        setPatternTitles(patRes.patterns ?? []);
        const linkRows: OntologyLinkRow[] = objs.slice(0, 8).map((o, i) => ({
          id: `l-${i}`,
          from: o.name,
          relation: "loads_from",
          to: "ontology_registry",
          status: "verified",
        }));
        setLinks(linkRows);
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "加载 Ontology 失败");
          setObjects([]);
          setLinks([]);
          setPatternTitles([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const stats = {
    subAgents: patternTitles.length > 0 ? Math.min(3, patternTitles.length) : 0,
    actions: objects.length,
    pattern: patternTitles[0] ?? "—",
    lookups: objects.length,
    tokens: 0,
  };

  return (
    <aside className="w-[350px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Ontology Inspector</h2>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">后端 /api/ontology/objects · /patterns</p>
        {loadError ? <p className="text-[10px] text-destructive mt-1">{loadError}</p> : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="rounded-lg border border-border bg-card/30 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("objects")}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-foreground">
                  Objects ({objects.length})
                </span>
              </div>
              {expandedSections.objects ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.objects && (
              <div className="px-3 pb-3 space-y-1">
                {objects.map((obj) => (
                  <div
                    key={obj.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 font-mono text-[11px]"
                  >
                    <span className="text-muted-foreground">{obj.type}:</span>
                    <span
                      className={cn("truncate", obj.active ? "text-primary" : "text-foreground")}
                    >
                      {obj.name}
                    </span>
                    {obj.active ? <Zap className="w-3 h-3 text-primary flex-shrink-0" /> : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card/30 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("links")}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-foreground">
                  Links / Patterns ({links.length + patternTitles.length})
                </span>
              </div>
              {expandedSections.links ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.links && (
              <div className="px-3 pb-3 space-y-1.5">
                {patternTitles.slice(0, 12).map((pid, i) => (
                  <div
                    key={`p-${pid}-${i}`}
                    className="p-1.5 rounded hover:bg-muted/30 font-mono text-[10px] leading-relaxed"
                  >
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-blue-400">Pattern</span>
                      <span className="text-muted-foreground">--</span>
                      <span className="text-primary">id</span>
                      <span className="text-muted-foreground">--&gt;</span>
                      <span className="text-purple-400">{pid}</span>
                      <span className="text-green-500 ml-1">✓</span>
                    </div>
                  </div>
                ))}
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="p-1.5 rounded hover:bg-muted/30 font-mono text-[10px] leading-relaxed"
                  >
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-blue-400">{link.from}</span>
                      <span className="text-muted-foreground">--</span>
                      <span className="text-primary">{link.relation}</span>
                      <span className="text-muted-foreground">--&gt;</span>
                      <span className="text-purple-400">{link.to}</span>
                      {link.status === "verified" ? <span className="text-green-500 ml-1">✓</span> : null}
                    </div>
                    {link.note ? (
                      <span className="text-muted-foreground ml-2">({link.note})</span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card/30 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("stats")}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cog className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-foreground">Ontology 元数据</span>
              </div>
              {expandedSections.stats ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.stats && (
              <div className="px-3 pb-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pattern 数量:</span>
                  <span className="text-purple-400">{patternTitles.length} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Object 类型数:</span>
                  <span className="text-blue-400">{stats.actions} 个</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">首个 Pattern:</span>
                  <span className="text-primary text-right text-[10px] max-w-[140px]">
                    {stats.pattern}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Links (示意):</span>
                  <span className="text-foreground">{links.length} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token 消耗:</span>
                  <span className="text-muted-foreground">N/A（本地 Agent）</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="w-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Network className="w-4 h-4 mr-2" />
          可视化推理图谱
        </Button>
      </div>
    </aside>
  );
}
