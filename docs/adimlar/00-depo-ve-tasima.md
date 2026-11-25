# Adım 00: Depo ve taşıma (Faz 0, hedef sürüm 0.1.0)

Bu dosya `planlayici` ajanı yazana kadar ilk adımın elle yazılmış taslağıdır; ajan isterse yeniden yazar.

## Amaç
Tarayıcı sürümünü (`kaynak/v0.1-tarayici.html`) git deposuna, aynı görünüm ve davranışla, modüllere bölünmüş bir Vite + TypeScript projesi olarak taşımak.

## Kapsam
- `npm create vite` ile TypeScript projesi; Electron henüz yok.
- Tek dosyayı böl: `src/scene/` (SVG sahne, penguen, kar, zemin), `src/plan/` (plan modeli, ayrıştırma, zaman mantığı), `src/ui/` (şerit, dock, ayar paneli), `src/storage/` (localStorage; `yp-plan`, `yp-set`, `yp-saved` anahtarları aynen kalır).
- Jost yazı tipini yerel paketle (internetten yükleme).
- Vitest: plan ayrıştırma (`O25 KM5 UM15` biçimleri), `editStart` kuralı, yolculuk ilerlemesi.
- Playwright: açık ve koyu tema ekran görüntüsü (sahne boş, odak ortası, mola); sahte saat kullan.
- `CLAUDE.md` içindeki "Komutlar" bölümünü gerçek komutlarla güncelle.

- Yardımcı araçlar: `.mcp.json` (Context7) hazır gelir, Claude Code onay sorarsa onayla. Playwright'ı proje bağımlılığı olarak kur.
- Superpowers'ı kurmak için kullanıcıya şu iki komutu göster; kendin kurma: `/plugin marketplace add obra/superpowers-marketplace` ve `/plugin install superpowers@superpowers-marketplace`. Kurduktan sonra `/plugin` ile içeriğine bakılır.

## Kapsam dışı
Electron, yeni özellik, tasarım değişikliği.

## Bitti sayılır
- Taşınan sürüm, `kaynak/v0.1-tarayici.html` ile aynı ekran görüntüsünü verir (gözle karşılaştır).
- Plan yazma, kayıtlı planlar, otomatik/elle geçiş, döngü ve atla/geri çalışır.
- Testler geçer; `v0.1.0` etiketi atılır.

## Sorular
- Ad kararlaştı: `curingmyadhd` (paket adı, depo, pencere başlığı).
