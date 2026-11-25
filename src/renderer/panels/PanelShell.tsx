/* Sağ panel kabuğu. Sekme listesi veriden gelir; bu adımda tek sekme var: Plan.
   Sekme içeriği React'e yeniden yazılmaz: mevcut DOM öğesi kabın içine yerleştirilir. */

import { useEffect, useRef, useState } from 'react';

export interface Sekme {
  id: string;
  ad: string;
  /** Sekmenin DOM içeriği (ör. plan editörü #sheet). */
  icerik: HTMLElement;
}

export function PanelShell({ sekmeler, onKapat }: { sekmeler: Sekme[]; onKapat: () => void }) {
  const [secili, setSecili] = useState(sekmeler[0]?.id);
  const kap = useRef<HTMLDivElement>(null);
  const aktif = sekmeler.find((s) => s.id === secili) ?? sekmeler[0];

  useEffect(() => {
    const k = kap.current;
    if (!k || !aktif) return;
    k.replaceChildren(aktif.icerik);
  }, [aktif]);

  return (
    <section className="panel" aria-label="Paneller">
      <header className="panel-ust">
        <div className="sekmeler" role="tablist">
          {sekmeler.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              className="sekme"
              aria-selected={s.id === aktif?.id}
              onClick={() => setSecili(s.id)}
            >
              {s.ad}
            </button>
          ))}
        </div>
        <button type="button" id="panel-kapat" className="round" aria-label="Paneli kapat" onClick={onKapat}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>
      <div className="panel-icerik" role="tabpanel" ref={kap} />
    </section>
  );
}
