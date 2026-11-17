// Hukuki markdown dosyalarını (tek doğru kaynak, SHA256SUMS ile korunur) uygulamanın
// içe aktarabileceği bir TS modülüne yazar. Önizleme .md?raw içe aktarımını bazen JS
// olarak ayrıştırıp boş ekran verdiği için sayfa bu modülü kullanır.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LEGAL_TEXT_SOURCES = {
  disclosure: 'src/content/legal/2026-11-13-yayin-v10/aydinlatma-metni.md',
  consent: 'src/content/legal/2026-11-12-yayin-v9/acik-riza.md',
  call: 'src/content/legal/2026-11-12-yayin-v9/cagri-merkezi.md',
};
export const OUTPUT = 'src/content/legal/legalTexts.generated.ts';

export function renderLegalTexts(base = root) {
  const lines = ['// Bu dosya scripts/build-legal-texts.mjs tarafından üretilir; elle düzenlemeyin.', ''];
  for (const [key, file] of Object.entries(LEGAL_TEXT_SOURCES)) {
    lines.push(`// ${file}`);
    lines.push(`export const ${key} = ${JSON.stringify(readFileSync(resolve(base, file), 'utf8'))};`);
  }
  return lines.join('\n') + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(resolve(root, OUTPUT), renderLegalTexts());
  console.log('wrote', OUTPUT);
}
