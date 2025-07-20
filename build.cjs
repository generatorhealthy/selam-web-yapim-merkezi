const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Build işlemi başlıyor...');

// Önce vite build'i çalıştır
console.log('📦 Vite build çalıştırılıyor...');
execSync('npm run build', { stdio: 'inherit' });

// dist klasörü kontrol et
if (!fs.existsSync('dist')) {
  console.error('❌ dist klasörü oluşturulamadı!');
  process.exit(1);
}

// Production için index.html'i düzenle
const distIndexPath = path.join('dist', 'index.html');
if (fs.existsSync(distIndexPath)) {
  let indexContent = fs.readFileSync(distIndexPath, 'utf8');
  
  // Development script tag'ini kaldır
  indexContent = indexContent.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    ''
  );
  
  // dist/assets klasöründe JS dosyasını bul
  const assetsDir = path.join('dist', 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const jsFile = files.find(file => file.startsWith('index.') && file.endsWith('.js'));
    
    if (jsFile) {
      // Production script tag'ini ekle
      const productionScript = `<script type="module" src="/assets/${jsFile}"></script>`;
      indexContent = indexContent.replace(
        '</body>',
        `  ${productionScript}\n  </body>`
      );
      console.log(`✅ Production script eklendi: ${jsFile}`);
    }
  }
  
  fs.writeFileSync(distIndexPath, indexContent);
  console.log('✅ Production index.html düzenlendi');
}

// DİKKAT: Bu dosyalar kök dizinde olmalı
const filesToCopy = [
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
