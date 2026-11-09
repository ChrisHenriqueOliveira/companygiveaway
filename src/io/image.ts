async function loadBitmap(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  try {
    const bmp = await createImageBitmap(file);
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  } catch {
    // SVG e alguns formatos só carregam via <img>
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth || 640,
      height: img.naturalHeight || 640,
      close: () => URL.revokeObjectURL(url),
    };
  }
}

/** Redimensiona (máx. maxSide) e comprime para WebP (fallback JPEG). Mantém o localStorage leve. */
export async function compressImage(file: File, maxSide = 640, quality = 0.8): Promise<string> {
  const img = await loadBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível.');
  ctx.drawImage(img.source, 0, 0, w, h);
  img.close();
  let url = canvas.toDataURL('image/webp', quality);
  if (!url.startsWith('data:image/webp')) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    url = canvas.toDataURL('image/jpeg', quality);
  }
  return url;
}
