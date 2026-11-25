---
description: Yeni bir geliştirme adımı başlat (dal aç, planlayıcıya kapsam yazdır)
argument-hint: "NN-ad (örn. 01-masaustu-kabugu)"
---

Yeni adım: $ARGUMENTS

1. `git status` temiz mi bak; değilse dur ve kullanıcıya söyle.
2. `main`'den `adim/$ARGUMENTS` dalını aç.
3. `planlayici` ajanını çağır: `docs/PLAN.md` içindeki ilgili faz için `docs/adimlar/$ARGUMENTS.md` dosyasını yazsın.
4. Dosyanın özetini göster ve kullanıcının onayını bekle. Onaydan önce kod yazma.
