/* Panel kabuğunu #panel-root içine kurar ve açık/kapalı durumunu yönetir. */

import { createRoot } from 'react-dom/client';
import { PanelShell, type Sekme } from './PanelShell';

export interface Panel {
  acikMi(): boolean;
  ayarla(acik: boolean): void;
}

export function paneliKur(sekmeler: Sekme[], degisti: (acik: boolean) => void): Panel {
  const kok = document.getElementById('panel-root')!;
  const panel: Panel = {
    acikMi: () => !kok.hidden,
    ayarla: (acik) => {
      kok.hidden = !acik;
      degisti(acik);
    },
  };
  createRoot(kok).render(<PanelShell sekmeler={sekmeler} onKapat={() => panel.ayarla(false)} />);
  return panel;
}
