const { execSync } = require('child_process');
execSync('npm run build', { stdio: 'inherit' });

const fs = require('fs');
const path = require('path');

console.log('🚀 Build işlemi başlıyor...');

// dist klasörü yoksa oluştur
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// DİKKAT: Bu dosyalar kök dizinde olmalı
const filesToCopy = [
  'index.html',
  'favicon.ico',
  'robots.txt',
  'azadlogo.png',
  'notification-sound.mp3'
];

// Tek tek dosyaları kopyala
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', path.basename(file)));
    console.log(`✅ Dosya kopyalandı: ${file}`);
  } else {
    console.warn(`⚠️ Dosya bulunamadı: ${file}`);
  }
});

// .htaccess özel durum: public klasörünün içinden
const htaccessPath = 'public/.htaccess';
if (fs.existsSync(htaccessPath)) {
  fs.copyFileSync(htaccessPath, 'dist/.htaccess');
  console.log(`✅ .htaccess kopyalandı`);
}

// public klasörünün tamamını dist'e kopyala (stil/js dosyaları için)
if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { recursive: true });
  console.log(`✅ public klasörü tamamı dist'e kopyalandı`);
}

// Klasörleri kopyala (örnek: lovable-uploads, assets vs.)
const foldersToCopy = ['lovable-uploads', 'assets'];

foldersToCopy.forEach(folder => {
  const srcPath = path.join(__dirname, folder);
  const destPath = path.join(__dirname, 'dist', folder);

  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`✅ Klasör kopyalandı: ${folder}`);
  } else {
    console.warn(`⚠️ Klasör bulunamadı: ${folder}`);
  }
});

console.log('\n🎉 Build tamamlandı! dist klasörü hazır.');
