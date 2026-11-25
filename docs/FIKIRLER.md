# Fikirler

Kapsam dışı kalan fikirler buraya yazılır; uygulanmaz.

## Adım 00 sırasında fark edilenler (düzeltilmedi)
- Sayfada `lang` özniteliği yok. `text-transform: uppercase` bu yüzden Türkçe kurala uymuyor: "Yeniden" düğmesi "YENIDEN" olarak görünüyor ("YENİDEN" olmalı). Plan metni alanı da aynı şekilde etkileniyor. `<html lang="tr">` eklemek görünümü değiştirir; ayrı bir düzeltme adımında yapılmalı.
- Vite'ın CSS küçültücüsü `backdrop-filter` ile `-webkit-backdrop-filter` çiftini yalnızca `-webkit-` bildirimine indiriyor ve Chromium'da cam bulanıklığı kayboluyor. Şimdilik `cssMinify: false`. Electron'a geçince `-webkit-` satırları silinebilir ve küçültme yeniden açılabilir.

## gorsel-kontrol raporu, adım 00 (hepsi kaynakta da var, taşımadan gelmiyor)
- ~~Panel açılınca penguen tamamen kapanıyor.~~ Faz 1'de çözüldü: panel sağda ayrı sütun.
- ~~Panel içeriği uzayınca yukarı büyüyor ve plan şeridinin üstüne biniyor.~~ Faz 1'de çözüldü: panel tam yükseklikte ve kendi içinde kayıyor. Kaydırma ipucu hâlâ yok.
- ~~Geniş pencerede sahne 430 px'lik bir sütun.~~ Faz 1'de çözüldü: sahne yanlara uzuyor.
- Başlat düğmesinde, dock'ta ve panelde yumuşak gölge var ("gölge yok" ilkesi).
- "Sil" ve hata metni ikinci bir sıcak renk; koyu temada odaktaki metin alanının beyaz çerçevesi parlak; açık temada bazı küçük metinler soluk.
- Plan başlamışken metin alanı yalnızca kalan blokları, taşlar ve özet ise tüm planı gösteriyor; kafa karıştırabilir.
- Test notu: `animations: 'disabled'` kar tanelerini başlangıç karesine (üst kenar) döndürüyor; kar normal görüntülerde fiilen denetlenmiyor. Sabit bir animasyon karesinde ayrıca çekilebilir.
- Test notu: panel görüntülerinde cam bulanıklığından gelen birkaç piksellik gürültü var; `npm run shot` her çalıştığında birkaç PNG değişmiş görünebilir.

## Adım 01 sırasında fark edilenler
- Geniş pencerede yan dağlar ana dağların aynalanmış kopyaları; çok geniş pencerede düzenli tekrar fark edilebilir. Ayrı yan dağ çizimleri gökyüzü çeşitliliğiyle (Faz 6) birlikte düşünülebilir.
- Tarayıcıda (Chromium headless) çekilen `tests/shots/kaynak/` görüntüleri Electron'un Chromium'uyla her pikselde 1-2 seviye farklı çiziliyor (renk ve kenar yumuşatma). Bu yüzden Electron'da sahne, aynı Electron içinde açılan kaynak HTML ile karşılaştırılıyor; fark sıfır.
- Electron testleri ekran renk profilini `--force-color-profile=srgb` ile, ölçeği `--force-device-scale-factor=1` ile sabitliyor. 1512x982 görüntüsü ekranı bundan küçük bir bilgisayarda pencereye sığmayabilir.
- Panel kapanınca, açılırken genişleyen pencere eski boyutuna dönmüyor (kapsamda istenmedi).
- Paneli sürükleyerek genişletmek (Soru 6, kapsam dışı).
