// Metin tanıma (Tesseract) dosyalarını public/tesseract altına kopyalar.
// Böylece uygulama dış CDN'e ihtiyaç duymaz ve PWA olarak çevrimdışı da çalışabilir.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const out = 'public/tesseract'
mkdirSync(out, { recursive: true })

const tjs = dirname(require.resolve('tesseract.js/package.json'))
const core = dirname(require.resolve('tesseract.js-core/package.json'))
const tur = dirname(require.resolve('@tesseract.js-data/tur/package.json'))

copyFileSync(join(tjs, 'dist/worker.min.js'), join(out, 'worker.min.js'))
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) {
  copyFileSync(join(core, f), join(out, f))
}
copyFileSync(join(tur, '4.0.0_best_int/tur.traineddata.gz'), join(out, 'tur.traineddata.gz'))
console.log('OCR dosyaları kopyalandı →', out)
