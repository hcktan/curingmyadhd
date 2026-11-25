# Fikirler

Kapsam dışı kalan fikirler buraya yazılır; uygulanmaz.

## Adım 00 sırasında fark edilenler (düzeltilmedi)
- Sayfada `lang` özniteliği yok. `text-transform: uppercase` bu yüzden Türkçe kurala uymuyor: "Yeniden" düğmesi "YENIDEN" olarak görünüyor ("YENİDEN" olmalı). Plan metni alanı da aynı şekilde etkileniyor. `<html lang="tr">` eklemek görünümü değiştirir; ayrı bir düzeltme adımında yapılmalı.
- Vite'ın CSS küçültücüsü `backdrop-filter` ile `-webkit-backdrop-filter` çiftini yalnızca `-webkit-` bildirimine indiriyor ve Chromium'da cam bulanıklığı kayboluyor. Şimdilik `cssMinify: false`. Electron'a geçince `-webkit-` satırları silinebilir ve küçültme yeniden açılabilir.
