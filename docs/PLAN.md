# curingmyadhd: kısa plan

Tam plan (tablolar, mimari şema, riskler, kaynaklar) Claude Docs belgesindedir: "curingmyadhd Proje Planı". Bu dosya ajanların depoda okuyacağı kısa özettir; ikisi ayrışırsa belge doğru kabul edilir ve bu dosya güncellenir.

## Kararlar (25 Kasım 2026)
- Önce macOS; Windows ve Linux ileride.
- Müzik: Spotify ve Apple Music; ileride diğerleri. Faz 5'te önce macOS'ta iki uygulamanın kendi komutları, sonra Spotify API'si, sonra Apple Music.
- Sohbet: Claude ilk sağlayıcı; kullanıcı kendi sağlayıcısını seçebilmeli.
- Takvim: ilk sürümde yerel; sonra Google Takvim, sonra diğerleri (`CalendarProvider`).
- Notlar Markdown.
- Ad: uygulama ve depo `curingmyadhd`.
- Genel takvimde her şey takip edilir: etkinlik, günlük sayı ve ölçüm. `Kayit` ad, değer ve birim alanları taşır.
- Tek bilgisayar ile başla; eşleme altyapısı (kalıcı kimlik, güncellenme zamanı, cihaz kimliği, silinme izi) baştan veri modelinde bulunur. Sunucu sonra.
- Geliştirme sırasında ücretli API çağrısı yok; sahte sağlayıcılar kullanılır. Gerçek anahtarlar kullanıcıyla birlikte, ilgili fazın sonunda denenir.

- Apple Developer hesabı yok: Apple Music yalnızca macOS komut yoluyla desteklenir.
- Yardımcı araçlar: Playwright, Context7 (anahtarsız) ve Superpowers Faz 0'da; Matt Pocock skills ve Anthropic skills Faz 1'den sonra, ihtiyaç olursa. Ayrıntı plan belgesinde "Yardımcı araçlar" bölümünde.

## Fazlar
| Faz | Sürüm | Kapsam |
| --- | --- | --- |
| 0. Depo ve taşıma | 0.1.0 | Git deposu, `kaynak/v0.1-tarayici.html` kodunun modüllere bölünmesi, yazı tipinin yerel paketlenmesi, ekran görüntülü test betiği. Görünüm ve davranış değişmez |
| 1. Masaüstü kabuğu | 0.2.0 | macOS'ta Electron penceresi, tam ekran, solda sahne, sağda açılır panel, pencere durumunu hatırlama, JSON depo, eşlemeye hazır veri modeli |
| 2. Notlar ve işler | 0.3.0 | İş sekmeleri, adım listesi ve tikler, Markdown not, plan bağlama |
| 3. Takvim | 0.4.0 | Genel ve işe özel takvim, sprint, ay/hafta/gün, yan panel ve tam ekran, yerel `CalendarProvider` |
| 4. Yapay zekâ sohbeti | 0.5.0 | Sohbet balonu, `ChatProvider` ve `MockChatProvider`, güvenli anahtar girişi, akışlı cevap; gerçek anahtar sonda |
| 5. Müzik | 0.6.0 | `MusicProvider`, önceki/sonraki ve liste, macOS komutları, sonra Spotify, sonra Apple Music |
| 6. Cilalama ve paketleme | 1.0.0 | macOS kurulum dosyası, yedek ve dışa aktarma, performans ölçümü, gökyüzü çeşitliliği |
