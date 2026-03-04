import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, RotateCcw, Upload, X } from "lucide-react";
import {
  keyboardShortcuts,
  formatKeyComboDisplay,
  type ShortcutCategory,
  type ShortcutDefinition,
} from "../../services/keyboard-shortcuts";
import { Button, Input, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@openreel/ui";

type CaptureState = {
  shortcutId: string;
} | null;

function normalizeCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push("cmd");
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");

  const key = e.key.toLowerCase();

  // Ignore modifier-only presses
  if (["meta", "control", "alt", "shift"].includes(key)) {
    return "";
  }

  parts.push(key);
  return parts.join("+");
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const KeyboardShortcutsSettings: React.FC = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ShortcutCategory | "all">("all");
  const [capture, setCapture] = useState<CaptureState>(null);
  const [tick, setTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const all = useMemo(() => {
    // tick forces refresh after updates
    void tick;
    return keyboardShortcuts.getAllShortcuts();
  }, [tick]);

  const categories = useMemo(() => {
    return ["all" as const, ...keyboardShortcuts.getCategories()];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((s) => (category === "all" ? true : s.category === category))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [all, query, category]);

  useEffect(() => {
    if (!capture) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setCapture(null);
        return;
      }

      const combo = normalizeCombo(e);
      if (!combo) return;

      const conflict = keyboardShortcuts.findConflict(combo, capture.shortcutId);
      if (conflict) {
        // Simple conflict resolution: do nothing (user can choose another)
        // We avoid adding new UI copy/comments per project rules.
        return;
      }

      const ok = keyboardShortcuts.setShortcut(capture.shortcutId, combo);
      if (ok) {
        setTick((t) => t + 1);
      }
      setCapture(null);
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [capture]);

  const exportCustomizations = () => {
    const customizations: Record<string, string> = {};
    for (const s of keyboardShortcuts.getAllShortcuts()) {
      if (s.currentKey !== s.defaultKey) {
        customizations[s.id] = s.currentKey;
      }
    }
    downloadJson("openreel-shortcuts.json", {
      version: 1,
      preset: keyboardShortcuts.getActivePreset(),
      customizations,
    });
  };

  const importCustomizations = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as {
      customizations?: Record<string, string>;
      preset?: string;
    };

    if (parsed.preset && typeof parsed.preset === "string") {
      keyboardShortcuts.applyPreset(parsed.preset);
    }

    if (parsed.customizations && typeof parsed.customizations === "object") {
      for (const [id, key] of Object.entries(parsed.customizations)) {
        if (typeof key !== "string") continue;
        keyboardShortcuts.setShortcut(id, key);
      }
    }

    setTick((t) => t + 1);
  };

  const resetAll = () => {
    keyboardShortcuts.resetAllShortcuts();
    setTick((t) => t + 1);
  };

  const renderRow = (s: ShortcutDefinition) => {
    const display = formatKeyComboDisplay(s.currentKey);
    const isCapturing = capture?.shortcutId === s.id;

    return (
      <div
        key={s.id}
        className="flex items-center justify-between gap-3 py-2 border-b border-border"
      >
        <div className="min-w-0">
          <div className="text-xs text-text-primary font-medium truncate">{s.name}</div>
          <div className="text-[10px] text-text-muted truncate">{s.description}</div>
          <div className="text-[10px] text-text-muted/70 truncate">{s.id}</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            className={
              "px-2 py-1 rounded border text-xs font-mono transition-colors " +
              (isCapturing
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background-tertiary text-text-secondary hover:text-text-primary hover:bg-background-elevated")
            }
            onClick={() => setCapture({ shortcutId: s.id })}
            title={isCapturing ? "Press keys… (Esc to cancel)" : "Click to rebind"}
          >
            {isCapturing ? "Press keys…" : display || "Unassigned"}
          </button>

          <button
            className="p-1.5 rounded hover:bg-background-elevated text-text-muted hover:text-text-primary transition-colors"
            onClick={() => {
              keyboardShortcuts.resetShortcut(s.id);
              setTick((t) => t + 1);
            }}
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-medium text-text-primary">Keyboard Shortcuts</div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCustomizations}>
            <Download size={14} />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await importCustomizations(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shortcuts…"
          className="h-9"
        />

        <Select
          value={category}
          onValueChange={(v) => setCategory(v as any)}
        >
          <SelectTrigger className="h-9 w-[160px] bg-background-tertiary border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-background-secondary border-border">
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all" ? "All" : keyboardShortcuts.getCategoryName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {capture && (
          <button
            className="ml-auto inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
            onClick={() => setCapture(null)}
          >
            <X size={14} />
            Cancel
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 border border-border rounded-lg bg-background-secondary">
        <ScrollArea className="h-full">
          <div className="p-3">
            {filtered.map(renderRow)}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
