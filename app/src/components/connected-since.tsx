// componenta care arata de cand este conectat utilizatorul

"use client";
import { useEffect, useState } from "react";

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${hh}h ${mm}m ${ss}s`;
  if (mm > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

interface ConnectedSinceProps {
  active: boolean; // porneste timerul doar când sheet-ul e deschis
}

export function ConnectedSince({ active }: ConnectedSinceProps) {
  const [loginAt, setLoginAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const syncLoginAt = () => {
      const saved = Number(localStorage.getItem("loginAt"));
      const valid =
        Number.isFinite(saved) && saved > 0 && saved <= Date.now();

      setLoginAt(valid ? saved : null);
      setNow(Date.now());
    };

    syncLoginAt();
    window.addEventListener("loginAtChanged", syncLoginAt);

    return () => window.removeEventListener("loginAtChanged", syncLoginAt);
  }, []);

  // on/off timer doar pe client
  useEffect(() => {
    if (!active || loginAt == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, loginAt]);

  if (loginAt == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return <span className="font-mono">{fmt(now - loginAt)}</span>;
}
