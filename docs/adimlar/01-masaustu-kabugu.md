# Adım 01: Masaüstü kabuğu (Faz 1, hedef sürüm 0.2.0)

Dal: `adim/01-masaustu-kabugu`. Başlangıç: `v0.1.0`. `kaynak/v0.1-tarayici.html` dosyasına yine dokunulmaz.

## 1. Amaç
Taşınan uygulamayı macOS'ta güvenli bir Electron penceresinde açmak: solda her zaman görünen sahne, sağda açılır bir panel kabuğu, hatırlanan pencere durumu ve localStorage yerine ana süreçteki, eşlemeye hazır JSON depo.

## 2. Kapsam
Her madde ayrı commit olarak denenebilir. Sıra önemli: önce kabuk ve güvenlik sınırı, sonra depo, sonra düzen, en son testler ve görüntüler.

### 2.1 Electron iskeleti
- Electron ve entegrasyon aracı kurulur (bkz. Soru 1). Kurmadan önce Context7 ile Electron, seçilen entegrasyon aracı ve Vite 8 uyumu için güncel belgeye bakılır. `package-lock.json` commit edilir.
- Klasör düzeni:
  - `src/main/`: ana süreç (pencere, IPC, depo).
  - `src/preload/`: köprü.
  - `src/renderer/`: mevcut arayüz kodu (`plan`, `scene`, `ui`, `styles`, `main.ts`, `state.ts`, `index.html`). Taşıma `git mv` ile, içerik değişmeden, ayrı bir commit olarak yapılır.
  - `src/shared/`: veri modeli, IPC kanal adları ve tipleri. Ana süreç ile arayüz ikisi de kullanır.
  - `src/platform/macos/`: bkz. 2.9.
- Ana süreç `app.whenReady()` ile tek pencere açar. Dock simgesine tıklanınca pencere yoksa yeniden açılır. macOS'ta son pencere kapanınca uygulama çıkmaz (`window-all-closed`).
- Tek örnek kilidi (`requestSingleInstanceLock`): ikinci açılış var olan pencereyi öne getirir. İki örnek aynı JSON dosyasına yazmasın diye.
- Kontrol: `npm run dev` Electron penceresini açar, taşınan uygulama içinde çalışır. `npm run build` hatasız biter.

### 2.2 Güvenlik sınırı
- `BrowserWindow` ayarları: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity` açık (varsayılan). `webviewTag` kapalı.
- Arayüze yalnızca preload'daki `contextBridge.exposeInMainWorld('cma', ...)` geçer. `ipcRenderer` ya da Node nesneleri doğrudan açılmaz; preload yalnızca adlandırılmış fonksiyonlar verir (bkz. 2.4).
- Gezinme kilidi: `will-navigate` uygulama dışı her adresi engeller; `setWindowOpenHandler` her isteği reddeder. Yeni pencere ya da dış bağlantı yok.
- İçerik güvenlik politikası (CSP), `index.html` içinde meta etiketiyle verilir: `default-src 'self'`; betik yalnızca `'self'`; dış alan adı yok. Mevcut kod öznitelikle satır içi stil yazıyorsa `style-src` için `'unsafe-inline'` gerekçesiyle eklenir; betik için asla eklenmez. Geliştirme sunucusunun ihtiyacı (HMR) yalnızca geliştirme modunda açılır.
- Geliştirici araçları yalnızca geliştirme modunda açılır.
- IPC'de ana süreç her gelen veriyi doğrular: tip, uzunluk, sayı sınırları (60 blok, 20 kayıtlı plan, ad uzunluğu). Geçersiz veri reddedilir ve yazılmaz. Dosya yolu ya da dosya adı arayüzden **alınmaz**; hangi dosyaya yazılacağını yalnızca ana süreç bilir.

### 2.3 Veri modeli ve eşleme alanları (`src/shared/model.ts`)
- Her kayıtta:
  - `id`: `crypto.randomUUID()`.
  - `guncellendi`: milisaniye cinsinden zaman (`number`). Her değişiklikte ve silmede güncellenir.
  - `cihazId`: kaydı en son değiştiren cihazın kimliği.
  - `silindi`: `boolean`. Silme gerçek silme değildir; kayıt `silindi: true` ile kalır, listede görünmez.
- Cihaz kimliği ilk açılışta bir kez üretilir ve `cihaz.json` dosyasında saklanır. Sonraki açılışlarda değişmez.
- Bu adımın kayıt türleri:
  - `KayitliPlan`: `ad`, `plan` (plan metni, ör. `O25 K5 ...`) ve eşleme alanları.
  - `Ayarlar` (tek belge): `otomatik`, `basaDon` ve `guncellendi`, `cihazId`.
  - `AktifPlan` (tek belge): `plan` (metin) ve `guncellendi`, `cihazId`.
- Her dosyanın kökünde şema sürümü bulunur: `{ "surum": 1, ... }`. İleride biçim değişirse buna göre taşınır.
- Zamanlayıcı durumu (`idx`, `endAt` vb.) bugünkü gibi saklanmaz. Davranış değişmez.

### 2.4 JSON depo (ana süreç)
- Depo arayüzü `src/shared/repository.ts`:
  - Listeler için: `list()` (silinmemişler), `get(id)`, `put(kayit)`, `remove(id)` (silinme izi bırakır).
  - Tek belgeler için: `read()`, `write(deger)`.
- Uygulaması `src/main/storage/jsonRepository.ts`. Klasör ana süreçten verilir; testte geçici klasör verilebilir. Böylece Vitest ile Electron'suz denenir.
- Dosyalar `app.getPath('userData')/veri/` altında: `planlar.json`, `ayarlar.json`, `aktif-plan.json`, `cihaz.json`.
- Yazma güvenliği:
  - Atomik yazma: önce `*.tmp` dosyasına yazılır, sonra `rename` ile asıl dosyanın yerine konur.
  - Plan metni her tuşta değiştiği için yazma ana süreçte kısa süre (varsayılan 300 ms) birleştirilir. Uygulama kapanırken (`before-quit`) bekleyen yazma diske işlenir.
  - Bozuk ya da okunamayan dosya **üzerine yazılmaz**. Önce `<ad>.bozuk-<zaman>.json` adıyla kenara alınır, sonra varsayılan değerle devam edilir.
- İlk açılışta, hiç dosya yoksa, varsayılanlar yazılır: "Klasik 4'lü" ve "Derin odak" planları, varsayılan plan, `otomatik: true` ve `basaDon: false`.
- IPC (preload'un verdiği `window.cma`):
  - `cma.veri.yukle()`: açılışta tek çağrıyla aktif plan, ayarlar ve kayıtlı planları döner.
  - `cma.veri.aktifPlanYaz(metin)`, `cma.veri.ayarlarYaz(ayarlar)`.
  - `cma.veri.planKaydet(ad, metin)`: aynı ad varsa üzerine yazar; bugünkü davranış korunur.
  - `cma.veri.planSil(id)`.
  - Kanal adları `src/shared/ipc.ts` içinde tek yerde tanımlanır. Ana süreç `ipcMain.handle` kullanır.
- Arayüz tarafı:
  - `src/renderer/storage/local.ts`, aynı dışa açık fonksiyonları koruyan bir IPC deposuyla değiştirilir. Böylece `ui/` modülleri değişmez ya da çok az değişir.
  - Açılış artık eşzamansız olur: `main.ts`, `cma.veri.yukle()` sonucunu bekledikten sonra `setBlock(0)` ve ilk çizimleri yapar.
- Kontrol (Vitest, geçici klasörde):
  - Kayıt-okuma gidiş dönüşü.
  - `remove` kaydı listeden çıkarır ama dosyada `silindi: true` ile bırakır; `guncellendi` artar.
  - `cihazId` iki açılışta aynı kalır.
  - Bozuk dosya kenara alınır ve silinmez.
  - Yarıda kesilen yazma eski dosyayı bozmaz (`.tmp` kalsa da asıl dosya sağlam).
  - Doğrulama: 61 blokluk plan, 21. kayıtlı plan ve tipi yanlış ayar reddedilir.

### 2.5 localStorage'dan tek seferlik taşıma
- Electron penceresinin localStorage'ında `yp-plan`, `yp-set` ya da `yp-saved` varsa ve JSON depo henüz taşıma görmediyse, arayüz bunları bir kez okur ve `cma.veri.tasi(...)` ile ana sürece yollar.
- Ana süreç doğrular, yeni modele çevirir (`n` → `ad`, `p` → `plan`, `auto` → `otomatik`, `loop` → `basaDon`) ve yazar. Ardından `cihaz.json` içine `tasindi: <zaman>` işaretini koyar.
- localStorage silinmez. Geri dönüş gerekirse veri hâlâ orada durur.
- Not: Kullanıcının tarayıcıdaki eski verisi Electron'a kendiliğinden gelmez, çünkü Electron'un localStorage'ı ayrıdır (bkz. Riskler).
- Kontrol: Playwright, localStorage'ı tohumlayıp uygulamayı açar ve JSON'da aynı planları görür. İkinci açılışta taşıma tekrar çalışmaz; localStorage değiştirilse bile JSON değişmez.

### 2.6 Düzen: solda sahne, sağda panel
- Pencere iki bölgeye ayrılır: sol bölge sahne, sağ bölge panel. Panel kapalıyken sahne tüm pencereyi kaplar.
- Sahne sol bölgenin tamamını doldurur. Gökyüzü, zemin ve sis kenarlara kadar uzar; geniş pencerede 430 px'lik sütun ve yanlardaki sert sınır kalkar (FIKIRLER, adım 00).
  - Perspektif sabitleri (`YH`, `YB`, `K`, `X0`, `DX`) ve penguenin yolu değişmez. Yol, sol bölgenin ortasında kalır.
  - 430 px genişlikte, panel kapalıyken sahne v0.1.0 ile aynı görünür (bkz. 2.10).
- Süre, şerit ve dock sahnenin içinde, bugünkü yerlerinde kalır. Kimlikler (`#toggle`, `#gear`, `#time` vb.) değişmez.
- Ayar düğmesi (`#gear`) sağ paneli açar ve kapatır. Panel açılıp kapanırken sahne yeniden boyutlanır; penguen panelin altında **kalmaz** (FIKIRLER: "panel açılınca penguen kapanıyor").
- Panel genişliği sabittir: varsayılan 360 px (bkz. Soru 6).
  - Sahne bölgesi en az 430 px kalır.
  - Pencere panel için dar ise panel açılırken pencere sağa doğru genişler. Ekranda yer yoksa sola kayar. Tam ekranda zaten yer vardır.
- Panel tam yükseklikte ve kendi içinde kaydırılır. Bu, adım 00'daki "panel yukarı büyüyüp şeridin üstüne biniyor, kayıtlı planlar kesiliyor" bulgusunu da kapatır.
- Pencere çubuğu: `titleBarStyle: 'hiddenInset'`. Sahne pencerenin üstüne kadar uzar; trafik ışıkları gökyüzünün üstünde durur. Süre ve düğmeler trafik ışıklarıyla çakışmaz (bkz. Soru 7).
- Açık ve koyu tema bugünkü gibi sistem temasını (`prefers-color-scheme`) izler. Tema seçme düğmesi yok.

### 2.7 React ve panel kabuğu
- React ve React DOM, Vite'ın React eklentisiyle kurulur. Kurmadan önce Context7 ile belgeye bakılır.
- Yalnızca sağ panel kabuğu React ile yazılır: `src/renderer/panels/PanelShell.tsx`.
  - Kapatma düğmesi ve sekme başlığı alanı.
  - Kaydırılabilir içerik.
  - Sekme listesi veriden gelir. Bu adımda tek sekme var: **Plan**.
  - Notlar, Takvim, Müzik ve Sohbet sekmeleri kendi fazlarında eklenir. Boş ya da "yakında" sekmesi gösterilmez.
- Plan sekmesi bugünkü plan editörünü içerir: plan metni, taşlar, düzenleme çubuğu, ekleme düğmeleri, otomatik/elle ve baştan/dur ayarları, kayıtlı planlar.
  - Bu kod React'e yeniden yazılmaz. Mevcut DOM modülleri (`ui/sheet.ts`, `ui/settings.ts`, `ui/saved.ts`) React bileşeninin içindeki bir kaba (`ref`) bağlanır.
  - Kimlikler (`#plan-text`, `#chips`, `#tb`, `#adds`, `#set-auto`, `#set-loop`, `#save-name`, `#save-btn`, `#saved`) aynen kalır.
- Sahne React'e girmez; saf SVG/CSS modülü olarak kalır.
- Panelin cam görünümü korunur. Yalnızca konumu, yüksekliği ve genişliği değişir.

### 2.8 Pencere durumunu hatırlama
- Ana süreç `pencere.json` dosyasını `userData` altında tutar: `x`, `y`, `genislik`, `yukseklik`, `tamEkran`, `buyutulmus`, `panelAcik`.
  - Bu dosya cihaza özeldir; eşleme alanları yoktur ve eşlenmez.
- Kaydetme zamanı: `resize`, `move`, `enter-full-screen` ve `leave-full-screen` olaylarında birleştirilerek (varsayılan 500 ms) ve kapanışta.
- Panelin açık ya da kapalı olduğu bilgisi arayüzden `cma.pencere.panelDurumu(acik)` ile gelir. Açılışta `cma.veri.yukle()` bu bilgiyi de döner ve panel aynı halde açılır.
- Açılışta kayıtlı konum hiçbir ekranın içinde değilse (ör. dış ekran çıkarıldıysa) pencere ana ekranda ortalanır. Bu karar saf bir fonksiyondur (`fitToDisplays(bounds, displays)`), Vitest ile denenir.
- İlk açılışta varsayılan boyut 1280x800, ekranda ortalı. En küçük boyut 430x640.
- Tam ekran:
  - macOS'un yerel tam ekranı kullanılır (yeşil düğme ve Görünüm menüsündeki `togglefullscreen`, kısayol Ctrl+Cmd+F).
  - Tam ekranda kapanan uygulama yeniden tam ekran açılır.
  - Tam ekrandan çıkınca pencere tam ekran öncesi boyutuna döner.

### 2.9 `src/platform/macos/`
- `menu.ts`: en küçük macOS menüsü. Uygulama menüsünde Hakkında, Gizle ve Çık; Düzen menüsünde geri al, kes, kopyala, yapıştır, tümünü seç (bunlar olmadan metin alanında Cmd+C/V çalışmaz); Görünüm menüsünde tam ekran (geliştirmede ek olarak yeniden yükle ve geliştirici araçları); Pencere menüsü. Menü metinleri Türkçe.
- `window.ts`: macOS'a özel pencere seçenekleri (`titleBarStyle`, `trafficLightPosition`, `vibrancy` yok).
- Ana süreç bunları `process.platform === 'darwin'` ise kullanır. Başka sistemler için kod yazılmaz.
- Paketleme, imzalama, simge ve kurulum dosyası **yok** (Faz 6).

### 2.10 Testler: Playwright ile Electron
- Playwright'ın Electron desteği (`_electron.launch`) ile derlenmiş uygulama açılır. Kurmadan önce Context7 ile belgeye bakılır.
- Her test kendi geçici `userData` klasörüyle açılır. Gerçek kullanıcı verisine dokunulmaz. Yöntem belgeyle doğrulanır: komut satırı argümanı ya da yalnızca test için okunan bir değişken. Bu bir anahtar değildir; anahtar, ortam değişkeninden okunmaz.
- Sahte saat (`page.clock.install`) ilk pencerede, sayfa betikleri çalışmadan önce kurulur. Electron'da çalıştığı ilk iş olarak doğrulanır (bkz. Riskler).
- Tema ve azaltılmış hareket `page.emulateMedia` ile seçilir. Electron'da işlemezse `nativeTheme.themeSource` testten ana sürece verilerek seçilir.
- Tıklama testleri: `davranis.spec.ts` Electron hedefinde çalışır; seçiciler aynı kalır. Kalıcılık testi sayfayı yeniden yüklemek yerine uygulamayı kapatıp aynı `userData` ile yeniden açar.
- Yeni tıklama testleri:
  - Panel: `#gear` paneli açar ve kapatır.
    - Panel açıkken penguenin kutusu (`getBoundingClientRect`) sahne bölgesinin içinde kalır ve panelin kutusuyla kesişmez.
    - Bu denetim 430x860, 1280x800 ve 1512x982 (tam ekran boyutu) için yapılır.
  - Pencere durumu:
    - Boyut ve konum değiştirilip uygulama kapatılıp açılınca aynı gelir.
    - Panel açık bırakılınca açık gelir.
  - Depo: `userData/veri/*.json` dosyaları beklenen biçimde (şema sürümü, eşleme alanları) yazılır.
  - Taşıma: 2.5'teki kontrol.
  - Güvenlik:
    - Arayüzde `require`, `process` ve `module` tanımsız.
    - `window.cma` yalnızca belgelenen fonksiyonları verir.
    - `window.open` ve dış adrese gezinme engellenir.
    - Açılışta dış alan adına sıfır istek gider; Jost yerelden yüklenir.
- Görüntüler (bkz. Soru 8):
  - **Kaynakla birebir karşılaştırma yalnızca sahnede, panel kapalıyken ve 430x860'ta sürer.** Durumlar: `bos`, `odak-orta`, `duraklat`, `kisa-mola`, `uzun-mola`, `bitti`, `elle-durdu`, `azaltilmis`; iki temada. Karşılaştırma `tests/shots/kaynak/` altındaki dondurulmuş v0.1.0 görüntüleriyle yapılır. Eşik aynı: `threshold: 0`, `maxDiffPixelRatio: 0.002`. Bu, sahnenin Electron'a geçişte bozulmadığını gösterir.
  - **Bilerek bırakılanlar**: `panel*` durumlarının ve 1280x800 boyutunun kaynakla karşılaştırması. Düzen bilerek değişti (panel sağa geçti, sahne genişledi); bu karşılaştırmalar artık geçemez.
  - **Yerine gelen yeni temel görüntüler**: `tests/shots/electron/<durum>-<tema>-<boyut>.png`.
    - Boyutlar: 430x860, 1280x800 ve 1512x982.
    - Durumlar: `bos`, `odak-orta`, `bitti`, `panel`, `panel-basladi`, `panel-secili`, `panel-hata`.
    - Temeller ilk kez kullanıcı gözle onayladıktan sonra yazılır (`--update-snapshots`). Sonraki çalıştırmalar bunlarla karşılaştırılır.
  - `tasinan` Playwright projesi (Vite önizlemesi, tarayıcı) kaldırılır. `kaynak` projesi silinmez ama `npm run shot` içinde çalışmaz; kaynak görüntüleri dondurulmuş referanstır. Gerekirse `npm run shot:kaynak` ile yeniden üretilir.
- Electron testleri gerçek pencere açar; aynı anda tek işçi (`workers: 1`) ile çalışır.

### 2.11 Komutlar ve belgeler
- `package.json` betikleri:
  - `dev`: Electron'u geliştirme modunda, arayüz için HMR ile açar.
  - `build`: TypeScript denetimi (ana süreç, preload ve arayüz) ve derleme.
  - `start`: derlenmiş uygulamayı açar.
  - `test`: Vitest.
  - `shot`: derler ve Playwright Electron testlerini çalıştırır.
  - `shot:kaynak`: kaynak görüntülerini yeniden üretir; elle kullanılır.
- `package.json` sürümü adım sonunda `0.2.0` olur.
- `CLAUDE.md` içinde yalnızca "Komutlar" bölümü bu gerçek komutlarla güncellenir.
- `docs/FIKIRLER.md`: çözülen iki bulgu (penguenin kapanması, 430 px sütun) ve kendiliğinden kapanan panel taşması "Faz 1'de çözüldü" diye işaretlenir. Yeni kapsam dışı fikirler oraya yazılır.

## 3. Kapsam dışı
- Notlar, Takvim, Müzik ve Sohbet panelleri ya da sekmeleri (Faz 2-5). Panel kabuğu yalnızca Plan sekmesini taşır.
- Plan editörünü, sahneyi ya da dock'u React'e yeniden yazmak.
- `safeStorage`, anahtar giriş ekranı, herhangi bir dış servis ya da ağ çağrısı. Ücretli API yok, sahte sağlayıcı da gerekmiyor; bu adımda sağlayıcı arayüzü yok.
- Eşleme sunucusu, eşleme mantığı ve çakışma çözümü. Yalnızca alanlar ve silinme izi gelir.
- Tarayıcıdaki eski localStorage verisini (Chrome, `file://`) Electron'a getirmek. Kullanıcı gerekirse plan metnini elle kopyalar.
- Paketleme, imzalama, simge, otomatik güncelleme, kurulum dosyası (Faz 6). Windows ve Linux.
- Adım 00 bulgularından düzen dışındakiler: `lang="tr"` ve "YENİDEN" sorunu, gölgeler, ikinci sıcak renk, odak çerçevesi, soluk metinler, metin alanı ile taşların farklı içeriği, kar karesi test notu. Bunlar FIKIRLER'de kalır.
- `cssMinify: false` ve `-webkit-backdrop-filter` temizliği (bkz. Soru 9).
- Tema seçme düğmesi, yeni metin, yeni özellik.
- Matt Pocock skills, Anthropic skills ya da başka araç kurulumu.

## 4. Bitti sayılır

### Otomatik
- `npm run build` hatasız biter; ana süreç, preload ve arayüz `strict` TypeScript ile denetlenir.
- `npm test`:
  - Adım 00'ın Vitest testleri geçer.
  - Yeni testler de geçer: 2.4 (depo), 2.8 (`fitToDisplays`), taşıma çevirisi (`n/p/auto/loop` → yeni model) ve IPC doğrulama fonksiyonları.
- `npm run shot`:
  - Tıklama testlerinin hepsi Electron'da geçer, 2.10'daki yeni testler dahil.
  - Sahne karşılaştırması 430x860, panel kapalı, iki tema: kaynakla fark eşiğin altında.
  - `tests/shots/electron/` temel görüntüleriyle fark eşiğin altında.
  - Dış alan adına sıfır istek.

### Elle
- `npm run dev` ve `npm start` ile:
  - Pencere açılır, sahne solda ve panel sağda.
  - Panel açılıp kapanınca penguen görünür kalır.
  - Yeşil düğmeyle tam ekrana girilir ve çıkılır.
  - Pencere taşınıp boyutlandırılıp kapatılınca aynı yerde açılır.
  - Uygulama kapatılıp açılınca planlar ve ayarlar gelir.
  - Cmd+C/V plan metninde çalışır.
  - Blok sonunda ses çalar.
- Penguenin yürüme ve dinlenme animasyonu, ayak izleri ve kar, gerçek saatle geniş pencerede ve tam ekranda gözle denenir.
- `userData/veri/` altındaki JSON dosyaları açılıp gözle bakılır: eşleme alanları var, silinen plan `silindi: true` ile duruyor.
- `gorsel-kontrol` ajanı, `tests/shots/electron/` görüntüleri üzerinde iki temada "temiz" raporu verir. Özellikle bakılacaklar: penguen panelle kapanmıyor; geniş sahnede kenar sınırı yok; trafik ışıkları süreyle çakışmıyor.
- `guvenlik-kontrol` ajanı preload, IPC, CSP ve `BrowserWindow` ayarları üzerinde "temiz" raporu verir.
- `CLAUDE.md` "Komutlar" bölümündeki komutlar temiz bir klonda çalışır.
- Kullanıcı onayından sonra `v0.2.0` etiketi atılır. Onay yoksa etiket yok.

## 5. Riskler
- **Masraf**: Yok. Ücretli API ya da dış servis yok. Tek ağ işi npm paketleri ve Electron ikili dosyasının indirilmesi; ikisi de ücretsiz.
- **Veri kaybı**:
  - Electron'un localStorage'ı tarayıcınınkinden ayrıdır; eski tarayıcı verisi gelmez. Kayıp yok, yalnızca taşınmaz.
  - JSON yazarken çökme ya da bozuk dosya veri kaybettirebilir. Atomik yazma, bozuk dosyayı kenara alma ve kapanışta bekleyen yazmayı işleme bu riski azaltır.
  - Testler gerçek `userData` klasörüne yazarsa kullanıcı verisini ezebilir. Bu yüzden her test geçici klasör kullanır; bu, ilk yazılan testte doğrulanır.
- **Güvenlik**:
  - Preload'dan fazla yetki sızması ya da doğrulanmayan IPC girdisi. Önlemler: yalnızca adlandırılmış fonksiyonlar, ana süreçte doğrulama, arayüzden dosya yolu almama, gezinme kilidi, CSP, sandbox.
  - `esc` kaçışı ve `innerHTML` kuralları (adım 00) aynen korunur.
  - `guvenlik-kontrol` denetimi zorunlu.
- **Araç uyumu**: Vite 8, TypeScript 7 ve Node 26 çok yeni. Entegrasyon aracı (electron-vite ya da vite-plugin-electron) Vite 8'i henüz desteklemeyebilir. Bu durumda Soru 1'deki sıraya göre bir sonrakine geçilir. Node ya da Vite sürümü kullanıcıya sorulmadan değiştirilmez.
- **Sahte saat ve Electron**: `page.clock` ve `emulateMedia` Electron penceresinde tarayıcıdaki gibi çalışmayabilir. İlk iş olarak küçük bir deneme testiyle doğrulanır. Çalışmazsa durulur ve kullanıcıya seçenekler sunulur; sahte saat olmadan görüntü testi yazılmaz.
- **Görüntü farkı**: Gerçek pencerede `deviceScaleFactor` Retina ekranda 2 olabilir. Kaynak görüntüler 1x. Test penceresi 1x zorlanır ya da sahne karşılaştırması ölçeklenerek yapılır; eşik gevşetilmez. Cam bulanıklığı gürültüsü (FIKIRLER) panel görüntülerinde sürer.
- **Performans**: Geniş sahne ve tam ekranda kare başına çizim alanı büyür; sis ve bulanıklık GPU yükünü artırabilir. Tam ekranda animasyon gözle akıcı olmalı. Ölçüm Faz 6'da; belirgin takılma olursa FIKIRLER'e yazılır.
- **Test süresi**: Electron testleri gerçek pencere açar ve tek işçiyle çalışır; `npm run shot` adım 00'dan yavaş olur.
- **Açılış**: Eşzamansız veri yükleme ilk karede boş sahne gösterebilir. Arka plan rengi CSS'ten gelir; veri gelmeden zamanlayıcı başlamaz.

## 6. Sorular (varsayılan cevaplarıyla)
1. **Electron ile Vite nasıl birleşir?**
   - *Varsayılan: `electron-vite`*: ana süreç, preload ve arayüz için tek yapılandırma, HMR, hazır klasör düzeni.
   - Context7 belgesinde Vite 8 desteği yoksa `vite-plugin-electron` denenir. O da yoksa elle kurulur: arayüz için Vite, ana süreç ve preload için ayrı bir Vite kütüphane derlemesi, `dev` betiğinde ikisini birlikte açan küçük bir betik.
2. **React bu adımda mı gelir?** *Varsayılan: evet, yalnızca sağ panel kabuğu için.* Plan editörü DOM kodu olarak kabuğun içine bağlanır; React'e çevrilmesi gerekirse Faz 2'de, Notlar paneliyle birlikte yapılır.
3. **Plan editörü nerede yaşar?** *Varsayılan: sağ panelin "Plan" sekmesinde.* Sahnenin üstünde açılan bugünkü sayfa kalkar; ayar düğmesi sağ paneli açar.
4. **Boş sekmeler (Notlar, Takvim, Müzik, Sohbet) şimdiden görünsün mü?** *Varsayılan: hayır.* Her biri kendi fazında eklenir; boş sekme ya da "yakında" metni yok.
5. **Mevcut kod `src/renderer/` altına taşınsın mı?** *Varsayılan: evet,* `git mv` ile, ayrı commit olarak ve içerik değişmeden. Ana süreç ve preload ile karışmasın.
6. **Panel genişliği ve dar pencere:** *Varsayılan: panel 360 px sabit; sahne en az 430 px.* Pencere dar ise panel açılırken pencere genişler; en küçük pencere 430x640. Panel genişliğini sürükleyerek değiştirmek kapsam dışı.
7. **Pencere çubuğu ve başlık:** *Varsayılan: `titleBarStyle: 'hiddenInset'`.* Sahne üste kadar uzar. `document.title` bugünkü gibi güncellenir ("Yürüyen Penguen", çalışırken başında süre); Pencere menüsünde ve Görev Denetimi'nde görünür. Uygulama adı (menü, Dock): `curingmyadhd`.
8. **Görüntü karşılaştırması:** *Varsayılan:*
   - Kaynakla birebir karşılaştırma panel kapalıyken 430x860'ta, yalnızca sahne durumları için sürer.
   - Panel durumları ve 1280x800 kaynakla karşılaştırılmaz; bilerek bırakılır.
   - Yerine `tests/shots/electron/` temel görüntüleri gelir; ilk kez kullanıcı onayıyla yazılırlar.
   - `tasinan` (tarayıcı) projesi kaldırılır.
9. **`cssMinify: false` ve `-webkit-backdrop-filter`:** *Varsayılan: bu adımda dokunulmaz.* Electron Chromium'unda yalnızca standart `backdrop-filter` yetiyorsa temizlik ayrı bir küçük düzeltme (0.2.1) olur. Böylece sahne karşılaştırmasına ikinci bir değişken girmez.
10. **Tarayıcı hedefi (`vite` ile tarayıcıda açma) kalsın mı?** *Varsayılan: hayır.* Tek hedef Electron. `window.cma` yoksa arayüz açık bir hata gösterir; ikinci bir depo (localStorage) bakımı yapılmaz.
11. **Eşleme alanlarının biçimi:** *Varsayılan:* `guncellendi` milisaniye (`number`), `silindi` `boolean`, `id` UUID v4, alan adları Türkçe (`ad`, `plan`, `otomatik`, `basaDon`). Silinen kayıtlar dosyada süresiz kalır; temizleme kuralı eşleme sunucusuyla birlikte konuşulur.
12. **Pencere durumu için hazır paket (`electron-window-state` gibi) kullanılsın mı?** *Varsayılan: hayır.* Elle yazılır: küçük bir iş, bağımlılık eklemez ve ekran dışı konum kuralı saf fonksiyonla test edilir.
13. **Electron sürümü:** *Varsayılan: kurulum günündeki güncel kararlı sürüm,* Context7 ve Electron sürüm notlarıyla doğrulanır. Sürüm `package.json` içinde sabitlenir.
