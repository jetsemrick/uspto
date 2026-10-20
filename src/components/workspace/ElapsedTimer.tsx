"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
};

export function ElapsedTimer({ label }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.floor((now - startedAt) / 1000);
  const elapsed = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <span role="status" className="text-[11px] text-slate-600">
      {label} · {elapsed} elapsed. Grok reasons before it writes, so results can take a minute
      or more to appear.
    </span>
  );
}
