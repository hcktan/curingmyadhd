# Adım 00: Depo ve taşıma (Faz 0, hedef sürüm 0.1.0)

Dal: `adim/00-depo-ve-tasima`. Referans: `kaynak/v0.1-tarayici.html` (1026 satır, tek dosya). **Bu dosyaya dokunulmaz**; karşılaştırma referansı olarak kalır.

## 1. Amaç
Tarayıcı sürümünü görünümü ve davranışı değiştirmeden, modüllere bölünmüş bir Vite + TypeScript projesine taşımak. Taşınan sürüm, kaynakla aynı ekran görüntülerini vermeli ve aynı tıklama testlerinden geçmeli.

## 2. Kapsam
Her madde ayrı commit olarak denenebilir. Sıra önemli: önce testler kaynağa karşı kurulur, sonra taşıma yapılır.

### 2.1 Proje iskeleti
- Vite'ın `vanilla-ts` şablonuyla proje kurulur. Paket adı `curingmyadhd`, TypeScript `strict: true`. Electron yok, React yok. React Faz 1'de paneller için gelir.
- Ortam Node 26 ve npm 11. Vite, Vitest ve Playwright'ın güncel kararlı sürümleri kurulur ve `package-lock.json` commit edilir. Kurmadan önce Context7 ile güncel kurulum belgesine bakılır.
- `.gitignore`: `node_modules/`, `dist/`, `test-results/`, `playwright-report/`.
- Kontrol: `npm run dev` boş sayfayı açar, `npm run build` hatasız biter.

### 2.2 Kaynağa karşı Playwright düzeni (taşımadan önce)
- Playwright proje bağımlılığı olarak kurulur. Yalnızca Chromium tarayıcısı indirilir (`npx playwright install chromium`; ücretsiz, tek seferlik indirme).
- Kaynak HTML `file://` yoluyla, hiç değiştirilmeden açılır.
- Kaynak, Jost'u Google Fonts'tan yüklüyor (satır 4: `<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500">`). Testte ağa çıkılmaz: `page.route` ile `fonts.googleapis.com` ve `fonts.gstatic.com` istekleri yakalanır ve projedeki yerel Jost dosyalarıyla cevaplanır. Böylece iki sürüm de aynı yazı tipi dosyasıyla çizilir.
- Sahte saat: sayfa açılmadan önce `page.clock.install()` çağrılır. Kaynak `Date.now`, `setInterval(tick, 250)`, `setTimeout` ve `requestAnimationFrame` kullanıyor; dördü de sahte saatle yönetilir. İki sayfaya aynı saat komutları aynı sırayla uygulanır.
- Kararlı görüntü için ekran görüntüsü `animations: 'disabled'` ile alınır ve öncesinde `document.fonts.ready` beklenir. Rastgelelik zaten sabit tohumlu (`rng(11)`, `feTurbulence seed=3`).
- Pencere boyutu 430x860 (uygulamanın en geniş hali) ve 1280x800 (masaüstü tarayıcı, ortalanmış sütun).
- Tema `page.emulateMedia({ colorScheme })` ile seçilir: `light` ve `dark`.

### 2.3 Ekran durumları
Her durum, iki tema ve iki boyutta, hem kaynak hem taşınan sürüm için çekilir. Süreler varsayılan plana göredir: `O25 K5 O25 K5 O25 K5 O25 U15`, toplam 130 dk.

| Kod | Durum | Nasıl | Beklenen |
| --- | --- | --- | --- |
| `bos` | Başlamadan önce | Aç | `25:00`, "Başlat", penguen dinlenir |
| `odak-orta` | Odak ortası | Başlat, 12 dk 30 sn ilerlet | `12:30`, "Duraklat", şeritte ilk blok yarı dolu, penguen ilerlemiş, sis azalmış |
| `duraklat` | Duraklatılmış | `odak-orta` sonrası Duraklat | "Devam et", penguen dinlenir |
| `kisa-mola` | Kısa mola | Başlat, 27 dk ilerlet | K bloğu, `03:00`, penguen dinlenir |
| `uzun-mola` | Uzun mola | Başlat, 120 dk ilerlet | U bloğu, `10:00` |
| `bitti` | Plan bitti | Başlat, 131 dk ilerlet | `00:00`, "Yeniden", ileri düğmesi pasif, penguen ufukta |
| `elle-durdu` | Elle geçiş | Ayarda "Elle" seç, başlat, 25 dk ilerlet | 2. blokta durur, "Başlat" |
| `panel` | Ayar paneli, plan başlamamış | Ayar düğmesi | Taşlar kilitsiz, ipucu yok, kayıtlı iki plan görünür |
| `panel-basladi` | Ayar paneli, plan başlamış | `odak-orta` sonrası ayar düğmesi | Geçmiş taşlar kilitli, "Plan başladı..." ipucu |
| `panel-secili` | Taş seçili | Panelde 3. taşa tıkla | Düzenleme çubuğu (−5/−1/dakika/+1/+5, tür, taşı, sil) |
| `panel-hata` | Hatalı plan metni | Metne `O25 X9` yaz | "Anlaşılmadı: X9" |
| `azaltilmis` | Azaltılmış hareket | `reducedMotion: 'reduce'` ile aç (yalnızca açık tema, 430x860) | Kar taneleri sahneye dağılmış, animasyon yok |

### 2.4 Kaynağa karşı tıklama testleri
Aynı test dosyası iki hedefte çalışır (kaynak ve taşınan). Kimlikler (`#toggle`, `#prev`, `#next`, `#reset`, `#gear`, `#strip`, `#plan-text`, `#chips`, `#tb`, `#adds`, `#set-auto`, `#set-loop`, `#save-name`, `#save-btn`, `#saved`, `#time`) değişmeyeceği için seçiciler ortak kullanılır.
- Başlat, Duraklat ve Devam et döngüsü. Boşluk tuşu da aynı işi yapar, ama düğme ya da metin alanı odaktayken çalışmaz.
- İleri, geri ve baştan başlat. Geri düğmesinin 3 saniye kuralı: blok 3 saniyeden fazla ilerlemişse aynı bloğun başına, değilse önceki bloğa döner.
- Şerit parçasına tıklayınca o bloğa atlar.
- Plan metni yazılınca şeritteki parça sayısı değişir. Plan başladıktan sonra yalnızca sıradaki bloklar değişir.
- Taş düzenleme: süre değiştirme, tür değiştirme, sola/sağa taşıma, silme. Son kalan blok silinemez.
- "+ Odak", "+ Kısa mola" ve "+ Uzun mola" eklenir (60 blok sınırı).
- Kayıtlı planlar: kaydet, aynı adla üzerine yaz, yükle, sil (20 plan sınırı). Ad girilmezse "Plan N" verilir.
- Kalıcılık: sayfa yeniden yüklenince `yp-plan`, `yp-set` ve `yp-saved` geri gelir. İlk açılışta "Klasik 4'lü" ve "Derin odak" planları yazılır.
- "Baştan" ayarı: plan bitince ilk bloğa döner ve sürmeye devam eder. "Dur" ayarında plan biter.

### 2.5 Yerel Jost
- Jost'un 300, 400 ve 500 ağırlıkları `latin` ve `latin-ext` alt kümeleriyle yerel paketlenir. Türkçe ş, ğ, ı, İ harfleri `latin-ext` içindedir. OFL lisans dosyası da pakete girer.
- `--font-display` ve `--font-ui` yazı tipi yığınları aynen kalır.
- Kontrol: Playwright testi, sayfa açılırken dış alan adına hiç istek gitmediğini doğrular (`page.on('request')`). Ayrıca `document.fonts.check('300 16px Jost')` doğru döner.

### 2.6 Kodu bölme
CSS ve SVG işaretlemesi birebir taşınır. JS mantığı TypeScript'e çevrilir; davranış aynı kalır. Zaman mantığı, `Date.now()` yerine `now` parametresi alan saf fonksiyonlara ayrılır ki Vitest ile denenebilsin.

| Modül | Kaynaktaki karşılığı (satır) |
| --- | --- |
| `src/plan/model.ts` | `KIND`, `MAXMIN`, `MAXBLOCKS`, `DEFAULT_PLAN`, `clampMin`, `serialize`, `parsePlan`, `fmtMin` (540-562) |
| `src/plan/timer.ts` | Durum (`idx`, `total`, `remaining`, `running`, `endAt`), `curMs`, `setBlock`, `isDone`, `walking`, `editStart`, `focusTotal`, `journeyP` (602-629); `goTo`, `restart`, `toggle` içindeki saat kısmı, `prev`, `tick` döngüsü (764-817); `commitPlan` içindeki plan ve durum kuralı (719-722); `fmtParts` (666-670) |
| `src/scene/perspective.ts` | `YH`, `YB`, `K`, `X0`, `DX`, `PSCALE`, `SEND`, `persp`, `rng` (512-526) |
| `src/scene/build.ts` | `el`, `buildStatic`: zemin çizgileri, yıldızlar, kar taneleri (527-532, 564-589) |
| `src/scene/render.ts` | `placePenguin`, `paintSnow`, sis saydamlığı, `walking`/`resting` sınıfı (646-664, 735-738) |
| `src/scene/flow.ts` | `paintRipple`, `paintPrint`, `clearPrints`, `spawnPrint`, `frame` (819-871) |
| `src/scene/scene.svg` ya da `scene.ts` | SVG işaretlemesi (336-438) |
| `src/scene/scene.css` | Penguen, kar, sis ve yıldız CSS'i, animasyonlar, `prefers-reduced-motion` (299-332) |
| `src/ui/strip.ts` | `buildStrip`, `paintStrip` (672-689) |
| `src/ui/sheet.ts` | `syncText`, `showErr`, `renderChips`, plan metni, taş, düzenleme çubuğu ve ekleme olayları (691-717, 908-959) |
| `src/ui/settings.ts` | `paintSettings`, `set-auto` ve `set-loop` olayları (884-891, 961-972) |
| `src/ui/saved.ts` | `esc`, `renderSaved`, `savePlan`, kayıtlı plan olayları (874-883, 974-1005) |
| `src/ui/dock.ts` | Süre rakamları, belge başlığı, düğme metni (740-752); dock, ayar düğmesi, şerit ve boşluk tuşu olayları (894-906, 1007-1013) |
| `src/ui/sound.ts` | `beep`, `AudioContext` açılışı (631-644, 781-784) |
| `src/storage/local.ts` | `readJSON`, `writeJSON`; anahtarlar `yp-plan`, `yp-set`, `yp-saved` aynen; varsayılan ayarlar ve kayıtlı planlar (533-534, 592-600) |
| `src/styles/tokens.css` | Açık ve koyu palet, `data-theme` kuralları (9-130) |
| `src/styles/app.css` | Satır 1'deki temel stil, düzen, süre, şerit, dock, panel (132-297) |
| `src/main.ts` | Başlangıç: `setBlock(0)`, ilk çizimler, `requestAnimationFrame(frame)`, `setInterval(tick, 250)` (1015-1023) |
| `index.html` | Gövde işaretlemesi, `<title>Yürüyen Penguen</title>` |

### 2.7 Vitest (zaman mantığı ve ayrıştırma)
- `parsePlan`:
  - `O25 KM5 UM15` 3 blok verir. Küçük harf (`o25 k5`) ve Türkçe `İ` ile yazım okunur.
  - Ayraçlar `, ; | > - ·` ve boşluksuz yazım (`O25K5`) okunur.
  - Süre sınırları: `O0` 1 dk'ya, `O999` 180 dk'ya çekilir. En fazla 60 blok alınır.
  - Tanınmayan kısım `bad` alanında döner (`O25 X9` için `X9`).
- `serialize(parsePlan(x).blocks)` gidiş-dönüşü tutarlı.
- `fmtMin`: 45 → `45 dk`, 60 → `1 sa`, 75 → `1 sa 15 dk`. `fmtParts`: 1 ms → `00:01` (yukarı yuvarlar).
- `editStart`: başlamamış plan → `idx`, çalışan ya da yarıda duraklatılmış plan → `idx + 1`, bitmiş plan → `plan.length`.
- Yolculuk ilerlemesi (`journeyP`):
  - Başta 0, ilk odak ortasında 0,125 (100 dk odaktan 12,5 dk).
  - Molalarda ilerlemez. Bitince 1. Hiç odak bloğu yoksa 0.
- `tick`:
  - Otomatik geçişte sonraki blok kesintisiz başlar. Elle geçişte sonraki blokta durur.
  - "Baştan" ayarında ilk bloğa döner. "Dur" ayarında plan biter.
  - Uzun bir zaman sıçramasında birden çok blok tek seferde geçilir (en çok 100 adım).
- `prev`: 3 saniye kuralı ve bitmiş planda son bloğa dönüş.
- Plan değişikliği (`commitPlan` kuralı): çalışan bloğun süresi değişmez. Başlamamış blok yeni süreyi alır.

### 2.8 Komutlar ve belgeler
- `package.json` betikleri:
  - `dev`: Vite geliştirme sunucusu.
  - `build`: TypeScript denetimi ve Vite derlemesi.
  - `test`: Vitest, tek seferlik çalıştırma.
  - `shot`: önce derler, sonra `vite preview` üzerinde Playwright'ı çalıştırır. Ekran görüntülerini, karşılaştırmayı ve tıklama testlerini kapsar.
- `CLAUDE.md` içindeki "Komutlar" bölümü bu gerçek komutlarla güncellenir. CLAUDE.md'de başka bölüm değişmez.
- Yardımcı araçlar:
  - Context7 `.mcp.json` içinde hazır; Claude Code onay sorarsa onaylanır.
  - Superpowers **kurulu**; test odaklı geliştirme skill'i 2.6 ve 2.7'de kullanılır.

## 3. Kapsam dışı
- Electron, pencere, `safeStorage`, JSON depo, `src/platform/`. Bunlar Faz 1'e ait.
- React ve sağ paneller (Notlar, Takvim, Müzik, Sohbet).
- Eşleme alanları (`id`, `guncellendi`, `cihazId`, `silindi`) ve yeni veri modeli. localStorage biçimi aynen kalır.
- Yeni özellik, tasarım ya da metin değişikliği, tema seçme düğmesi. Hatalar da düzeltilmez; taşıma sırasında fark edilen hata `docs/FIKIRLER.md` dosyasına yazılır.
- `kaynak/v0.1-tarayici.html` dosyasını düzenlemek.
- Hiçbir ücretli API, anahtar ya da `.env` dosyası. Bu adımda dış servis yok.
- Matt Pocock skills ve Anthropic skills kurulumu.

## 4. Bitti sayılır

### Otomatik
- `npm run build` hatasız biter, TypeScript `strict` uyarısı yok.
- `npm test`: 2.7'deki Vitest testlerinin hepsi geçer.
- `npm run shot`:
  - 2.4'teki tıklama testleri **hem kaynakta hem taşınan sürümde** geçer.
  - 2.3'teki her durum için kaynak ve taşınan görüntüler alınır, iki tema ve iki boyutta. Görüntüler `tests/shots/kaynak/` ve `tests/shots/tasinan/` altına `<durum>-<tema>-<boyut>.png` adıyla yazılır.
  - Her çift Playwright'ın görüntü karşılaştırıcısıyla denetlenir. Fark oranı eşiğin altında kalmalı (varsayılan `maxDiffPixelRatio: 0.002`, bkz. Sorular). Eşiği aşan çift için fark görüntüsü üretilir ve test kırılır.
  - Taşınan sürüm açılırken dış alan adına sıfır istek gider, Jost yerelden yüklenir.

### Elle
- `gorsel-kontrol` ajanı çalıştırılır ve taşınan görüntülerde "temiz" raporu verir.
- Kaynak ve taşınan görüntüler en az `bos`, `odak-orta`, `kisa-mola` ve `bitti` durumlarında, iki temada yan yana gözle karşılaştırılır.
- Gerçek saatle `npm run dev` açılır ve birkaç şey elle denenir: penguenin yürüme ve dinlenme animasyonu, ayak izleri, kar yağışı, blok sonunda çıkan ses. Bunlar sahte saatli görüntüde tam görünmez.
- `CLAUDE.md` "Komutlar" bölümünde yazan komutlar temiz bir klonda çalışır.
- Kullanıcı onayından sonra `v0.1.0` etiketi atılır. Onay yoksa etiket yok.

## 5. Riskler
- **Masraf**: Yok. Ücretli API çağrısı yapılmaz. Tek ağ işi npm paketleri ve Chromium indirmesi, ikisi de ücretsiz.
- **Görüntü farkı (yazı tipi)**: Google'ın sunduğu Jost sürümü ile yerel paket farklı olabilir. Bu yüzden testte kaynağın yazı tipi istekleri yerel dosyaya yönlendirilir. Kaynağın gerçek ağ hali ile birebir eşleşme garanti edilmez.
- **Görüntü farkı (hareket)**: `requestAnimationFrame` her karede zemini kaydırır, ve kare başına ilerleme 0,1 sn ile sınırlı. Sahte saatle uzun ilerletme, iki sayfada aynı komutla yapılırsa aynı sonucu verir. Farklı komut dizisi kullanılırsa sonuç ayrışır. Azaltılmış hareket modu kar tanelerinin rastgele dizisini değiştirir; bu yüzden ayrı durum olarak tutulur.
- **Performans (test süresi)**: 131 dakikalık sahte ilerletme çok sayıda kare çalıştırır. Uzun sürerse `fastForward` ile kare atlanabilir, ama iki hedefte de aynı yöntem kullanılmalı.
- **Davranış kayması**: Zaman mantığını saf fonksiyona çevirirken sıra değişirse sonuç kayabilir; örneğin `tick` içindeki `endAt += total`. Önce kaynağa karşı tıklama testlerinin yazılması bu riski yakalamak için.
- **Veri kaybı**: Anahtarlar aynı kalır, ama localStorage kaynağa (origin) bağlıdır. Kullanıcının eski tarayıcı sürümünde (`file://` ya da başka adres) kaydettiği planlar `localhost` adresine kendiliğinden geçmez. Kayıp yok, yalnızca taşınmaz; gerekirse plan metni elle kopyalanır.
- **Güvenlik**: Kayıtlı plan adları `innerHTML` ile ve `esc` kaçışıyla yazılıyor. Bu kaçış aynen korunmalı. Taş ve şerit metni yalnızca ayrıştırılmış `k` ve `m` değerlerinden geliyor; böyle kalmalı.
- **Node 26**: Çok yeni sürüm. Bir araç uyumsuzluk verirse önce aracın güncel sürümüne bakılır; Node sürümü kullanıcıya sorulmadan değiştirilmez.

## 6. Sorular (varsayılan cevaplarıyla)
1. **Jost'un kaynağı**: `@fontsource/jost` npm paketi (300/400/500, latin ve latin-ext) mi, elle indirilmiş `woff2` dosyaları mı? *Varsayılan: `@fontsource/jost`.*
2. **Satır 1 ve 3'teki barındırma kalıntıları**: Satır 1'de temel stil var (`body` 14px sistem yazı tipi, `img` ve `[hidden]` kuralları), satır 3'te `claude:viewport-fit-sides` meta etiketi. *Varsayılan: temel stil görünüm değişmesin diye aynen `app.css`'e taşınır. Meta etiketi taşınmaz; bu etiket normal tarayıcıda etkisizdir.*
3. **Başlık**: Taslakta pencere başlığı `curingmyadhd` olarak geçiyor. Ama `document.title` şu an "Yürüyen Penguen" ve çalışırken başına kalan süre ekleniyor. *Varsayılan: bu adımda başlık "Yürüyen Penguen" kalır, çünkü davranış değişmesin. Paket adı `curingmyadhd` olur. Pencere başlığı Faz 1'de Electron ile kararlaştırılır.*
4. **Ekran görüntüleri git'e girsin mi?** *Varsayılan: evet. `tests/shots/kaynak/` ve `tests/shots/tasinan/` commit edilir; `test-results/` girmez.*
5. **Karşılaştırma eşiği**: *Varsayılan: `maxDiffPixelRatio: 0.002`. Eşiği aşan fark varsa önce nedeni aranır, eşik gerekçesiz gevşetilmez.*
6. **Tarayıcı**: Yalnızca Chromium mu? *Varsayılan: evet. Electron da Chromium tabanlı; Safari ve Firefox denenmez.*
7. **Pencere boyutları**: 430x860 ve 1280x800 yeterli mi? *Varsayılan: evet. Dar pencere ve tam ekran Faz 1'de Electron ile eklenir.*
