<div align="center">
  <h1>☁️ Cloud Backup Yönetim Paneli</h1>
  <p><strong>Eğitim Amaçlı Bulut Yedekleme Arayüzü</strong></p>
</div>

---

> ⚠️ **Önemli Not:** Bu proje tamamen eğitim ve öğrenim amaçlı geliştirilmiştir. Gerçek bir bulut yedekleme hizmeti sunmamaktadır ve üretim (production) ortamında kullanılması tavsiye edilmez.

Bu proje, React ve Vite modern web teknolojileri kullanılarak geliştirilmiş bir Bulut Yedekleme (Cloud Backup) sisteminin kullanıcı arayüzü ve yönetim paneli simülasyonudur. Proje, modern frontend mimarisini ve Firebase entegrasyonunu öğrenmek/göstermek amacıyla tasarlanmıştır.

## 🚀 Özellikler

- **Gelişmiş Dashboard:** Sistem durumunu ve özet verileri görüntüleme.
- **Dosya Yönetimi (Files):** Yüklenen dosyaların listelendiği ve yönetildiği arayüz.
- **Gerçek Zamanlı Sohbet (Chat):** Kullanıcılar arası etkileşim için mesajlaşma modülü.
- **Sistem Haritası (System Map):** Yedekleme altyapısının görsel haritası.
- **Güvenli Giriş (Login):** Firebase Authentication ile yetkilendirme sistemi.
- **Log Takibi ve Ayarlar:** Sistem kayıtlarının incelenmesi ve kullanıcı tercihlerinin yönetilmesi.

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend Core:** `React.js` (Hooks, Functional Components)
- **Build Aracı:** `Vite` (Hızlı geliştirme deneyimi için)
- **Stil & Tasarım:** `Tailwind CSS`
- **Backend Servisleri:** `Firebase` (Auth, Database simülasyonları için)

---

## 📦 Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz. Bilgisayarınızda Node.js'in kurulu olduğundan emin olun.

### 1. Projeyi klonlayın (veya indirin):
```bash
git clone https://github.com/Bedirhan3428/cloudbackup.git
cd cloudbackup
```

### 2. Bağımlılıkları yükleyin:
```bash
npm install
```

### 3. Firebase Ayarlarını Yapılandırın (Opsiyonel/Gerekli):
Eğer Firebase servislerini aktif kullanacaksanız, Firebase konsolundan aldığınız yapılandırma ayarlarını `src/firebase.js` dosyasına veya oluşturacağınız bir `.env` dosyasına ekleyin.

### 4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```
*Tarayıcıda görüntüleyin: Terminalde beliren adrese (genellikle `http://localhost:5173`) giderek projeyi inceleyebilirsiniz.*

---

## 📂 Proje Yapısı

```text
cloudbackup/
├── src/
│   ├── components/      # Yeniden kullanılabilir UI bileşenleri (Layout vb.)
│   ├── pages/           # Sayfa bileşenleri (Dashboard, Chat, Files, Login vb.)
│   ├── App.jsx          # Ana React bileşeni ve route yapılandırması
│   ├── main.jsx         # React DOM render noktası
│   ├── api.js           # API çağrıları ve simülasyonları
│   ├── firebase.js      # Firebase konfigürasyon ve başlatma ayarları
│   └── index.css        # Global stiller (Tailwind direktifleri)
├── index.html           # Ana HTML şablonu
├── tailwind.config.js   # Tailwind CSS yapılandırması
├── vite.config.js       # Vite yapılandırması
└── package.json         # Proje bağımlılıkları ve scriptler
```

---

## 📜 Lisans

Bu proje eğitim amacıyla açık kaynak olarak paylaşılmıştır. Kendi öğrenim süreçleriniz için dilediğiniz gibi kullanabilir ve modifiye edebilirsiniz.

---
**Geliştirici:** Bedirhan İmer
