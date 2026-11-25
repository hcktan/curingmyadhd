/* Sahne düzeni: sahne her zaman yüksekliğe göre ölçeklenir, alta ve ortaya hizalanır.
   Sütundan dar pencerede kaynak sürümdeki gibi yanlar kırpılır (slice); daha geniş pencerede
   sahne yanlara uzar (meet + sütun dışındaki öğeler). 430x860'ta kaynakla birebir aynıdır. */

const ORAN = 430 / 860;

export function sahneDuzeni(app: HTMLElement): void {
  const svg = document.getElementById('scene')!;
  const vig = document.getElementById('vig-genis')!;
  const grain = document.getElementById('grain-genis')!;
  const uygula = () => {
    const w = app.clientWidth;
    const h = app.clientHeight;
    if (!w || !h) return;
    const genis = w / h > ORAN + 1e-6;
    svg.setAttribute('preserveAspectRatio', genis ? 'xMidYMax meet' : 'xMidYMax slice');
    app.classList.toggle('wide', genis);
    if (genis) {
      // Kenar gölgesi ve doku, sütuna değil görünen alanın tamamına göre çizilir.
      const gw = (w / h) * 860;
      const x = ((430 - gw) / 2).toFixed(1);
      for (const r of [vig, grain]) {
        r.setAttribute('x', x);
        r.setAttribute('width', gw.toFixed(1));
      }
    }
  };
  new ResizeObserver(uygula).observe(app);
  uygula();
}
