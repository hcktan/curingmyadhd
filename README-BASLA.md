# Başlangıç

1. Bu klasörü bilgisayarında bir yere aç (örn. `~/Projeler/curingmyadhd`).
2. Terminalde klasöre gir ve şunları çalıştır:

       git init -b main
       git add .
       git commit -m "Başlangıç: plan, ajanlar ve v0.1 kaynağı"

3. GitHub'da boş bir depo aç, sonra:

       git remote add origin <depo-adresi>
       git push -u origin main

4. Aynı klasörde `claude` yaz (Claude Code açılır), Claude hesabınla giriş yap.
5. Claude Code içinde şu iki komutu çalıştır (Superpowers eklentisi):

       /plugin marketplace add obra/superpowers-marketplace
       /plugin install superpowers@superpowers-marketplace

   Klasördeki `.mcp.json` Context7'yi getirir; Claude Code onay sorarsa onayla. Başka eklenti kurma.
6. İlk mesaj: `/yeni-adim 00-depo-ve-tasima`
7. Ajanın yazdığı `docs/adimlar/00-depo-ve-tasima.md` dosyasını oku, uygunsa "onaylıyorum, uygula" de.
8. Adım bitince uygulamayı elle dene, sonra "etiketi at" de ve bir sonraki adıma geç.
