# Berber Randevu Sistemi

**Berber Randevu Sistemi**, müşterilerin çevrim içi randevu oluşturabildiği, berberlerin kendi randevularını takip edebildiği ve işletme yöneticilerinin randevu süreçlerini yönetebildiği tam kapsamlı bir web uygulamasıdır.

Proje; müşteri arayüzü, yönetici paneli ve berber panelinden oluşmaktadır.

## Proje Özellikleri

## Müşteri İşlemleri

- Çevrim içi randevu oluşturma
- Berber seçimi
- Randevu tarihi ve saati belirleme
- Mevcut randevuları yönetme

## Yönetici Paneli

- Yönetici girişi
- Berber ekleme ve yönetme
- Randevu süreçlerini takip etme
- Çalışma saatlerini yönetme
- Randevu istatistiklerini görüntüleme
- Kullanıcı adı ve şifre değiştirme

## Berber Paneli

- Berber hesabıyla giriş yapma
- Kendisine ait randevuları görüntüleme
- Belirli tarihler için çalışma durumu düzenleme
- Profil bilgilerini yönetme

## Ek Özellikler

- WhatsApp üzerinden otomatik randevu hatırlatma entegrasyonu
- Zamanlanmış hatırlatma işlemleri
- JWT ile kimlik doğrulama
- bcrypt ile şifrelerin güvenli biçimde özetlenmesi
- PostgreSQL veritabanı entegrasyonu

## Kullanılan Teknolojiler

| Katman               | Teknolojiler            |
| -------------------- | ----------------------- |
| Frontend             | React, JavaScript, Vite |
| Backend              | Node.js, Express.js     |
| Veritabanı           | PostgreSQL              |
| Kimlik Doğrulama     | JWT, bcryptjs           |
| Zamanlanmış Görevler | node-cron               |
| Harici Servis        | WhatsApp Cloud API      |
| Versiyon Kontrolü    | Git, GitHub             |


## Kurulum

### Gereksinimler

- Node.js ve npm
- PostgreSQL
- Git
- Hatırlatma özelliği için WhatsApp Cloud API bilgileri

### 1. Projeyi Bilgisayara İndirme

```bash
git clone https://github.com/sefakirkinci/barber-appointment-system.git
cd barber-appointment-system
```

### 2. Backend Kurulumu

```bash
cd backend
npm install
```

`backend/.env.example` dosyasını örnek alarak `backend/.env` dosyasını oluşturun.

Veritabanı bağlantısı, JWT anahtarı ve gerekiyorsa WhatsApp API bilgilerini yapılandırın.

Backend sunucusunu başlatın:

```bash
node server.js
```

### 3. Frontend Kurulumu

Yeni bir terminal açın:

```bash
cd frontend
npm install
npm run dev
```

### 4. Veritabanı Yapılandırması

PostgreSQL üzerinde uygulamanın ihtiyaç duyduğu veritabanı ve tablolar oluşturulmalıdır.

Veritabanı bağlantı bilgileri `.env` dosyasında tanımlanmalıdır.

**Not:** Veritabanı şemasının hazırlanması gerekir. Bu README içerisinde otomatik veritabanı kurulum komutu sunulmamaktadır.

## Güvenlik

Projede aşağıdaki güvenlik yaklaşımları kullanılmaktadır:

- JWT tabanlı kimlik doğrulama
- bcrypt ile şifre özetleme
- Hassas yapılandırma bilgilerinin ortam değişkenlerinde tutulması
- `.env` dosyalarının GitHub'a gönderilmemesi
- Rol bazlı erişim kontrolü

## Projenin Amacı

Bu proje, berber işletmelerindeki randevu süreçlerinin dijital ortamda yönetilmesini kolaylaştırmak amacıyla geliştirilmiştir.

Aynı zamanda aşağıdaki yazılım geliştirme konularının uygulamalı olarak kullanılması hedeflenmiştir:

- Full-stack web geliştirme
- REST API tasarımı
- İlişkisel veritabanı yönetimi
- Kullanıcı kimlik doğrulama
- Randevu ve çalışma saati yönetimi
- Harici API entegrasyonu
- Zamanlanmış arka plan görevleri

## Geliştirici

**Sefa Kırkıncı**

Bilgisayar Mühendisliği Öğrencisi

GitHub: [github.com/sefakirkinci](https://github.com/sefakirkinci)

---

**Proje Durumu:** Bu proje kaynak kodlarını ve geliştirme sürecini sergilemek amacıyla GitHub üzerinde paylaşılmıştır. Aktif olarak yayınlanan bir web hizmeti değildir.
