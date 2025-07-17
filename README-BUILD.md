
# Hostinger'a Deploy Etme Rehberi

## Yöntem 1: Publish Butonu (En Kolay)
1. Lovable'da sağ üstteki **"Publish"** butonuna tıklayın
2. Otomatik build yapılacak
3. Size verilen URL'den dosyaları indirin

## Yöntem 2: GitHub Üzerinden
1. Projeyi GitHub'a gönderin
2. Local bilgisayarınızda:
   ```bash
   git clone [repository-url]
   cd [project-name]
   npm install
   npm run build
   ```

## Yöntem 3: Manuel Build
1. Bu projeyi ZIP olarak indirin
2. Local bilgisayarınızda:
   ```bash
   npm install
   node build.js
   ```

## Hostinger'a Yükleme
1. `dist` klasörü oluştuktan sonra
2. Hostinger File Manager'da `public_html` klasörüne yükleyin
3. `.htaccess` dosyasının da yüklendiğinden emin olun

## Önemli Dosyalar
- `index.html` - Ana sayfa
- `.htaccess` - Routing için gerekli
- `assets/` - CSS, JS dosyaları
