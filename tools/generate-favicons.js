#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';
import pngToIco from 'png-to-ico';

const projectRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const srcPath = path.join(projectRoot, 'assets', 'icons', 'icone.png');
const outRoot = projectRoot;
const outIconsDir = path.join(projectRoot, 'assets', 'icons');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generate() {
  if (!fs.existsSync(srcPath)) {
    console.error(`Erro: arquivo fonte não encontrado em ${srcPath}. Coloque seu icone como assets/icons/icone.png`);
    process.exit(1);
  }

  await ensureDir(outIconsDir);

  try {
    const image = await Jimp.read(srcPath);

    // tamanhos a gerar
    const sizes = [16, 32, 48, 180];
    const buffers = [];

    for (const s of sizes) {
      const copy = image.clone();
      copy.cover(s, s); // cover preserva proporção e preenche
      const outPath = path.join(outIconsDir, `favicon-${s}x${s}.png`);
      await copy.writeAsync(outPath);
      console.log(`Gerado: ${outPath}`);
      buffers.push(fs.readFileSync(outPath));
    }

    // Gerar favicon.ico a partir dos PNGs 16/32/48
    const icoBuffer = await pngToIco([
      path.join(outIconsDir, 'favicon-16x16.png'),
      path.join(outIconsDir, 'favicon-32x32.png'),
      path.join(outIconsDir, 'favicon-48x48.png')
    ]);

    const icoPath = path.join(outRoot, 'favicon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`Gerado: ${icoPath}`);

    // copiar apple icon para raiz (opcional)
    const applePath = path.join(outRoot, 'apple-touch-icon.png');
    fs.copyFileSync(path.join(outIconsDir, 'favicon-180x180.png'), applePath);
    console.log(`Gerado: ${applePath}`);

    console.log('\nTodos os ícones foram gerados com sucesso. Atualize o cache do navegador (Ctrl+F5) para ver as alterações.');
  } catch (err) {
    console.error('Erro ao gerar ícones:', err);
    process.exit(1);
  }
}

generate();
