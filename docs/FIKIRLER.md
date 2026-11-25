# Fikirler

Kapsam dışı kalan fikirler buraya yazılır; uygulanmaz.

## Adım 00 sırasında fark edilenler (düzeltilmedi)
- Sayfada `lang` özniteliği yok. `text-transform: uppercase` bu yüzden Türkçe kurala uymuyor: "Yeniden" düğmesi "YENIDEN" olarak görünüyor ("YENİDEN" olmalı). Plan metni alanı da aynı şekilde etkileniyor. `<html lang="tr">` eklemek görünümü değiştirir; ayrı bir düzeltme adımında yapılmalı.
- Vite'ın CSS küçültücüsü `backdrop-filter` ile `-webkit-backdrop-filter` çiftini yalnızca `-webkit-` bildirimine indiriyor ve Chromium'da cam bulanıklığı kayboluyor. Şimdilik `cssMinify: false`. Electron'a geçince `-webkit-` satırları silinebilir ve küçültme yeniden açılabilir.

## gorsel-kontrol raporu, adım 00 (hepsi kaynakta da var, taşımadan gelmiyor)
- Panel açılınca penguen tamamen kapanıyor ("penguen her zaman görünür" ilkesine aykırı). Faz 1'de paneller sağa taşınınca çözülmeli.
- Panel içeriği uzayınca yukarı büyüyor ve plan şeridinin üstüne biniyor; kayıtlı plan listesi altta kesiliyor ve kaydırılabildiğine dair bir ipucu yok.
- Geniş pencerede sahne 430 px'lik bir sütun; koyu temada yanlarla sert sınır oluşuyor.
- Başlat düğmesinde, dock'ta ve panelde yumuşak gölge var ("gölge yok" ilkesi).
- "Sil" ve hata metni ikinci bir sıcak renk; koyu temada odaktaki metin alanının beyaz çerçevesi parlak; açık temada bazı küçük metinler soluk.
- Plan başlamışken metin alanı yalnızca kalan blokları, taşlar ve özet ise tüm planı gösteriyor; kafa karıştırabilir.
- Test notu: `animations: 'disabled'` kar tanelerini başlangıç karesine (üst kenar) döndürüyor; kar normal görüntülerde fiilen denetlenmiyor. Sabit bir animasyon karesinde ayrıca çekilebilir.
- Test notu: panel görüntülerinde cam bulanıklığından gelen birkaç piksellik gürültü var; `npm run shot` her çalıştığında birkaç PNG değişmiş görünebilir.
