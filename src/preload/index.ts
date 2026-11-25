/* Köprü: arayüze yalnızca adlandırılmış fonksiyonlar geçer. ipcRenderer ve Node nesneleri açılmaz. */

import { contextBridge, ipcRenderer } from 'electron';
import { KANAL, type CmaApi } from '../shared/ipc';

const api: CmaApi = {
  veri: {
    yukle: () => ipcRenderer.invoke(KANAL.yukle),
    aktifPlanYaz: (metin) => ipcRenderer.invoke(KANAL.aktifPlanYaz, metin),
    ayarlarYaz: (ayarlar) => ipcRenderer.invoke(KANAL.ayarlarYaz, ayarlar),
    planKaydet: (ad, metin) => ipcRenderer.invoke(KANAL.planKaydet, ad, metin),
    planSil: (id) => ipcRenderer.invoke(KANAL.planSil, id),
    tasi: (eski) => ipcRenderer.invoke(KANAL.tasi, eski),
  },
  pencere: {
    panelDurumu: (acik) => ipcRenderer.invoke(KANAL.panelDurumu, acik),
    tamEkranDegisti: (cb) => {
      const dinleyici = (_e: unknown, tamEkran: unknown) => cb(tamEkran === true);
      ipcRenderer.on(KANAL.tamEkran, dinleyici);
      return () => {
        ipcRenderer.removeListener(KANAL.tamEkran, dinleyici);
      };
    },
  },
};

contextBridge.exposeInMainWorld('cma', api);
