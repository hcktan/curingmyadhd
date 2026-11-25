/* En küçük macOS menüsü. Düzen menüsü olmadan metin alanında Cmd+C/V çalışmaz. */

import { app, Menu, type MenuItemConstructorOptions } from 'electron';

export function macosMenusu(gelistirme: boolean): Menu {
  const gorunum: MenuItemConstructorOptions[] = [{ role: 'togglefullscreen', label: 'Tam Ekran' }];
  if (gelistirme) {
    gorunum.unshift(
      { role: 'reload', label: 'Yeniden Yükle' },
      { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
      { type: 'separator' },
    );
  }
  const sablon: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about', label: app.name + ' Hakkında' },
        { type: 'separator' },
        { role: 'hide', label: app.name + ' Uygulamasını Gizle' },
        { role: 'hideOthers', label: 'Diğerlerini Gizle' },
        { role: 'unhide', label: 'Tümünü Göster' },
        { type: 'separator' },
        { role: 'quit', label: app.name + ' Uygulamasından Çık' },
      ],
    },
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapıştır' },
        { role: 'selectAll', label: 'Tümünü Seç' },
      ],
    },
    { label: 'Görünüm', submenu: gorunum },
    {
      label: 'Pencere',
      role: 'windowMenu',
      submenu: [
        { role: 'minimize', label: 'Küçült' },
        { role: 'zoom', label: 'Büyüt' },
        { type: 'separator' },
        { role: 'front', label: 'Tümünü Öne Getir' },
      ],
    },
  ];
  return Menu.buildFromTemplate(sablon);
}
