# curingmyadhd (çalışma adı: Yürüyen Penguen)

Uygulama ve depo adı: `curingmyadhd`. Ciddi tonlu bir pomodoro uygulaması: zamanlayıcı çalışırken penguen arkadan görünüp ufka yürür, durunca dinlenir. Esin: Herzog'un "Encounters at the End of the World" filmindeki penguen. Hedef: macOS masaüstü uygulaması (Electron); solda sahne, sağda Notlar / Takvim / Müzik / Sohbet panelleri.

Ayrıntılı plan: `docs/PLAN.md`. Tarayıcı sürümü (v0.1, başlangıç noktası): `kaynak/v0.1-tarayici.html`.

## Çalışma kuralları
- Dil: kullanıcıyla ve arayüz metinlerinde Türkçe. Kod, dosya ve değişken adları İngilizce olabilir.
- Her adım ayrı bir git dalında yürür (`adim/NN-ad`). `main`'e doğrudan commit atma.
- Bir seferde yalnızca o adımın dosyası `docs/adimlar/NN-*.md` içindeki kapsamı yap. Kapsam dışı fikri `docs/FIKIRLER.md` dosyasına yaz, uygulama.
- Küçük ve sık commit at; mesaj Türkçe ve ne yaptığını söylesin.
- Bir adım bitince: testler geçer, `gorsel-kontrol` ajanı çalışır, sürüm etiketi atılır (örn. `v0.2.0`). Etiketi kullanıcı onaylamadan atma.
- Sürüm numarası: her faz 0.N.0, küçük düzeltme 0.N.1, ilk tam sürüm 1.0.0.

## Masraf kuralı (önemli)
- Geliştirme sırasında hiçbir ücretli API'ye gerçek çağrı yapma. Sohbet, müzik ve takvim servisleri için önce arayüzü ve **sahte (mock) sağlayıcıyı** yaz; gerçek sağlayıcı kodu yazılabilir ama anahtar olmadan çalışmaz ve test edilmez.
- `ANTHROPIC_API_KEY` ya da başka bir anahtarı ortam değişkenine, koda, `.env` dosyasına veya git'e koyma. Anahtarlar yalnızca uygulamanın ayar ekranından girilir ve `safeStorage` ile saklanır.
- Gerçek anahtarla deneme, kullanıcı "şimdi deneyelim" dediğinde yapılır.

## Mimari ilkeler
- Electron + TypeScript + Vite. Paneller React, sahne ayrı bir modülde saf SVG/CSS.
- Dış servis çağrıları yalnızca Electron ana sürecinden yapılır; arayüze (renderer) anahtar ya da token geçmez.
- Sağlayıcı arayüzleri: `MusicProvider` (Spotify, Apple Music, ileride diğerleri), `ChatProvider` (Claude ilk; kullanıcı kendi sağlayıcısını seçebilir), `CalendarProvider` (yerel ilk; sonra Google, sonra diğerleri). Her birinin `Mock*` sürümü olur.
- Veriler kullanıcı veri klasöründe JSON; bir "depo" (repository) arayüzü arkasında. Notlar Markdown.
- Eşleme altyapısı: her kayıtta kalıcı kimlik (`id`), `guncellendi` zamanı, `cihazId` ve silinme izi (`silindi`). Sunucu ilk sürümde yok.
- İşletim sistemine özel kod (medya komutları, paketleme) `src/platform/<sistem>/` altında kalır; önce yalnızca `macos`.
- Yazı tipi (Jost) yerel paketlenir; ağdan yüklenmez.

## Tasarım ilkeleri (sahne ve arayüz)
- Soğuk mavi-gri palet, tek sıcak vurgu (`--patch`). Düz ve yumuşak; keskin köşe, gölge ya da parlak renk yok.
- Arayüz sahneyi kapatmaz; süre küçük, köşede. Penguen her zaman görünür kalır.
- Açık (gün doğumu) ve koyu (yıldızlı gece) tema ikisi de bozulmadan çalışır.
- Yazı ekleme: sahne "neredeyim" sorusunu yazısız cevaplar.

## Yardımcı araçlar
- Context7 (MCP, `.mcp.json` içinde, anahtarsız): Electron, Vite, React, Spotify gibi hızlı değişen kütüphanelerde kod yazmadan önce güncel belgeyi bununla çek. İstem sonuna `use context7` yazmak gerekmez, bu kuralı uygula.
- Superpowers (eklenti, kullanıcı kurar): uygulama için test odaklı geliştirme ve hata ayıklama skill'lerini kullan. Plan ve kapsamı `planlayici`, görsel ve güvenlik denetimini `gorsel-kontrol` ve `guvenlik-kontrol` yapar; Superpowers bunların yerine geçmez.
- Matt Pocock skills ve Anthropic skills şimdilik kurulu değil. Kullanıcı istemeden başka eklenti, MCP ya da skill kurma.
- Hiçbir araç ücretli API anahtarı isteyemez; isterse dur ve kullanıcıya sor.

## Test
- Vitest: plan ayrıştırma ve zaman mantığı. Playwright: ekran görüntüsü ve tıklama testi (sahte saat ile). Faz 1'den sonra Electron penceresi Playwright'ın Electron desteğiyle açılır.
- Arayüz değişince açık ve koyu temada ekran görüntüsü alınır ve incelenir.

## Komutlar
- `npm install` ve bir kez `npx playwright install chromium` (yalnızca `shot:kaynak` için): kurulum.
- `npm run dev`: Electron'u geliştirme modunda açar (electron-vite, arayüzde HMR).
- `npm run build`: TypeScript denetimi (`tsconfig.node.json`: ana süreç, preload, ortak; `tsconfig.web.json`: arayüz; `tsconfig.json`: e2e testleri) ve `out/` altına derleme.
- `npm start`: derlenmiş uygulamayı açar.
- `npm test`: Vitest, tek seferlik (`tests/unit/`; depo testleri geçici klasörde, Electron'suz).
- `npm run shot`: derler ve Playwright'ın Electron desteğiyle `tests/e2e/electron/` testlerini çalıştırır (tek işçi, gerçek pencere, her test geçici veri klasörü). Sahne, aynı Electron'da açılan `kaynak/v0.1-tarayici.html` ile piksel piksel karşılaştırılır; panel ve geniş pencere `tests/shots/electron/` temel görüntüleriyle. Temel görüntüleri bilerek yenilemek için: `npx playwright test --project=electron --update-snapshots` (önce kullanıcıya göster).
- `npm run shot:kaynak`: kaynak sürümün tarayıcı görüntülerini (`tests/shots/kaynak/`, dondurulmuş v0.1.0 referansı) yeniden üretir; elle kullanılır.
