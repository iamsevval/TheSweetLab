# 🍰 The Sweet Lab

**The Sweet Lab**, dünya mutfağından seçkin tatlı tariflerini keşfedebileceğiniz, yapay zeka destekli modern bir web platformudur. Fransız kafe kültürünün zarif estetiğinden ilham alan bu proje; kullanıcıların tarifleri incelemesine, kendi tariflerini paylaşmasına, blog yazılarını okumasına ve yapay zeka asistanı ile etkileşime girmesine olanak tanır.

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🌐 Canlı Demo & Linkler

* **GitHub Reposu:** [https://github.com/iamsevval/TheSweetLab](https://github.com/iamsevval/TheSweetLab)
* **Canlı Proje (Render):** [https://thesweetlab-sevval.onrender.com/] (Site açılımı birkaç dakika sürebilir, lütfen bekleyiniz.)

## 🚀 Proje Hakkında

Bu proje, **Web Tasarım ve Programlama** dersi final projesi olarak geliştirilmiştir. Node.js ve Express.js altyapısı üzerine kurulan sistem, dinamik içerik yönetimi (CRUD) ve kullanıcı etkileşimi (Auth, Yorum, Beğeni) özelliklerini barındırır.

### Öne Çıkan Özellikler

* **🔐 Güvenli Kimlik Doğrulama:** Kullanıcı kayıt (Register) ve giriş (Login) işlemleri (`bcrypt` & `session`).
* **🤖 AI Chef Asistanı:** Tarifler hakkında anlık öneriler alabileceğiniz yapay zeka destekli sohbet botu.
* **📝 Tam CRUD Desteği:** Kullanıcılar kendi tariflerini ekleyebilir, düzenleyebilir ve silebilir.
* **❤️ Etkileşim:** Tariflere yorum yapma, beğenme ve favorilere ekleme özelliği.
* **📱 Responsive Arayüz:** Mobil ve masaüstü uyumlu, estetik tasarım (Bootstrap 5).
* **🔍 Gelişmiş Arama:** Kategorilere ve malzemelere göre tarif filtreleme.
* **✍️ Blog Köşesi:** Tatlı yapımıyla ilgili püf noktalarının paylaşıldığı alan.

## 🛠️ Teknolojiler

Proje geliştirme sürecinde aşağıdaki teknoloji yığını (Tech Stack) kullanılmıştır:

**Backend:**
* Node.js
* Express.js
* SQLite (Veritabanı)

**Frontend:**
* EJS (Template Engine)
* HTML5, CSS3
* JavaScript (ES6+)
* Bootstrap 5

**Kütüphaneler & Araçlar:**
* `bcrypt`: Şifreleme
* `express-session`: Oturum Yönetimi
* `multer`: Dosya/Görsel Yükleme
* `dotenv`: Ortam Değişkenleri

## 📂 Proje Sayfaları ve Yapısı

Uygulama, kullanıcı deneyimini kapsayan aşağıdaki temel sayfalardan oluşmaktadır:

1.  **Ana Sayfa (`/`):** Vitrin tarifler, öne çıkanlar ve karşılama ekranı.
2.  **Hakkımızda (`/about`):** The Sweet Lab vizyonu ve geliştirici hakkında bilgi.
3.  **Tarifler (`/recipes`):** Tüm tatlıların listelendiği, filtrelenebilir ana galeri.
4.  **Tarif Detay (`/recipes/:id`):** Tarifin malzemeleri, yapılışı, yorumlar ve beğenilerin yer aldığı sayfa.
5.  **Tarif Ekle (`/add-recipe`):** Kullanıcıların sisteme yeni tatlı eklediği form sayfası.
6.  **Blog (`/blog`):** Tatlı yapımına dair püf noktaları ve yazıların paylaşıldığı bölüm.
7.  **AI Asistanı (`/ai-assistant`):** Yapay zeka ile tarif sohbeti yapılan arayüz.
8.  **Profilim (`/profile`):** Kullanıcı bilgileri ve kullanıcının eklediği tariflerin listesi.
9.  **Favorilerim (`/favorites`):** Kullanıcının beğendiği ve kaydettiği tarifler.
10. **İletişim (`/contact`):** Ziyaretçilerin mesaj gönderebileceği iletişim formu.
11. **Giriş Yap / Kayıt Ol (`/login`, `/register`):** Kullanıcı yetkilendirme sayfaları.

## 💻 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için:

1.  **Projeyi Klonlayın:**
    ```bash
    git clone [https://github.com/iamsevval/TheSweetLab.git](https://github.com/iamsevval/TheSweetLab.git)
    cd TheSweetLab
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Çevresel Değişkenleri Ayarlayın:**
    Ana dizinde `.env` dosyası oluşturun ve gerekli bilgileri girin (Örn: Session Secret, API Keyler).

4.  **Uygulamayı Başlatın:**
    ```bash
    npm start
    ```
    Tarayıcınızda `http://localhost:3000` adresine gidin.

