import JSZip from 'jszip';
import heic2any from 'heic2any';

export interface ImageConvertOptions {
  targetFormat: 'image/webp' | 'image/jpeg' | 'image/png';
  quality: number; // 0.1 to 1.0
  resizeWidth?: number;
  resizeHeight?: number;
}

export interface ImageProgressCallback {
  (current: number, total: number, message: string): void;
}

/**
 * Convert HEIC / HEIF file to universal JPEG Blob offline via WebAssembly
 */
export async function convertHeicToUniversalBlob(file: File | Blob): Promise<Blob> {
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

/**
 * Transcode single image using browser native HTML5 Canvas
 */
export async function transcodeImage(
  file: File,
  options: ImageConvertOptions
): Promise<{ blob: Blob; filename: string }> {
  // Decode image (supports JPG, PNG, WebP, and HEIC/HEIF)
  let sourceFile: File | Blob = file;
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  ) {
    sourceFile = await convertHeicToUniversalBlob(file);
  }

  const bitmap = await createImageBitmap(sourceFile);

  const canvas = document.createElement('canvas');
  let targetWidth = bitmap.width;
  let targetHeight = bitmap.height;

  if (options.resizeWidth && options.resizeHeight) {
    targetWidth = options.resizeWidth;
    targetHeight = options.resizeHeight;
  } else if (options.resizeWidth) {
    const ratio = options.resizeWidth / bitmap.width;
    targetWidth = options.resizeWidth;
    targetHeight = Math.round(bitmap.height * ratio);
  } else if (options.resizeHeight) {
    const ratio = options.resizeHeight / bitmap.height;
    targetHeight = options.resizeHeight;
    targetWidth = Math.round(bitmap.width * ratio);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D context not available');
  }

  // If output is JPEG, fill white background to prevent black transparent areas
  if (options.targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const quality = options.targetFormat === 'image/png' ? undefined : options.quality;

  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Image transcoding failed'))),
      options.targetFormat,
      quality
    );
  });

  // Cleanup canvas
  canvas.width = 0;
  canvas.height = 0;

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = options.targetFormat === 'image/webp' ? 'webp' : options.targetFormat === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `${baseName}.${ext}`;

  return { blob: outputBlob, filename };
}

/**
 * Compress an image to meet a strict maximum target KB (e.g. < 200KB or exactly <= 195KB)
 */
export async function compressImageToTargetKB(
  file: File,
  targetMaxKB: number,
  targetFormat: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  onProgress?: (msg: string) => void
): Promise<{ blob: Blob; filename: string; achievedKB: number }> {
  let sourceFile: File | Blob = file;
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  ) {
    sourceFile = await convertHeicToUniversalBlob(file);
  }

  const bitmap = await createImageBitmap(sourceFile);
  const targetBytes = targetMaxKB * 1024;

  let minQuality = 0.15;
  let maxQuality = 0.95;
  let bestBlob: Blob | null = null;
  let currentWidth = bitmap.width;
  let currentHeight = bitmap.height;

  const canvas = document.createElement('canvas');

  for (let iteration = 0; iteration < 8; iteration++) {
    const quality = (minQuality + maxQuality) / 2;
    onProgress?.(`Mencocokkan ukuran (${Math.round(quality * 100)}% kualitas)...`);

    canvas.width = currentWidth;
    canvas.height = currentHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) break;

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, currentWidth, currentHeight);
    } else {
      ctx.clearRect(0, 0, currentWidth, currentHeight);
    }
    ctx.drawImage(bitmap, 0, 0, currentWidth, currentHeight);

    const testBlob = await new Promise<Blob | null>(res => {
      canvas.toBlob(res, targetFormat, quality);
    });

    if (!testBlob) break;

    if (testBlob.size <= targetBytes) {
      bestBlob = testBlob;
      minQuality = quality; // Try higher quality
    } else {
      maxQuality = quality; // Too large, decrease quality
    }

    // If still exceeds target and quality is getting very low, scale down dimensions
    if (iteration >= 3 && (!bestBlob || bestBlob.size > targetBytes)) {
      currentWidth = Math.max(200, Math.round(currentWidth * 0.82));
      currentHeight = Math.max(200, Math.round(currentHeight * 0.82));
      minQuality = 0.25;
      maxQuality = 0.85;
    }
  }

  bitmap.close();
  canvas.width = 0;
  canvas.height = 0;

  if (!bestBlob) {
    const fallback = await transcodeImage(file, { targetFormat, quality: 0.35 });
    bestBlob = fallback.blob;
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = targetFormat === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${baseName}_kunci_${targetMaxKB}kb.${ext}`;

  return {
    blob: bestBlob,
    filename,
    achievedKB: Math.round(bestBlob.size / 1024),
  };
}

export interface PasfotoOptions {
  cropSize: 'asli' | '2x3' | '3x4' | '4x6';
  backgroundColor: 'merah' | 'biru' | 'putih' | 'abu' | 'transparan' | string;
  targetMaxKB?: number;
  quality?: number;
}

/**
 * AI Pasfoto Studio: Background removal (WebAssembly/ONNX) + Smart auto-crop + Color swap + Target KB
 */
export async function processPasfoto(
  file: File,
  options: PasfotoOptions,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ blob: Blob; filename: string; achievedKB: number }> {
  onProgress?.(1, 4, 'Menyiapkan berkas foto untuk proses AI...');
  let sourceBlob: Blob = file;
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  ) {
    sourceBlob = await convertHeicToUniversalBlob(file);
  }

  onProgress?.(2, 4, 'Menghilangkan latar belakang via WebAssembly ONNX AI...');
  let transparentBlob: Blob;
  try {
    const { removeBackground } = await import('@imgly/background-removal');
    transparentBlob = await removeBackground(sourceBlob);
  } catch (err) {
    console.warn('AI Background Removal error, fallback to source:', err);
    transparentBlob = sourceBlob;
  }

  onProgress?.(3, 4, 'Menerapkan auto-crop proporsional & warna latar...');
  const portraitBitmap = await createImageBitmap(transparentBlob);

  let finalWidth = portraitBitmap.width;
  let finalHeight = portraitBitmap.height;
  let srcX = 0;
  let srcY = 0;
  let srcWidth = portraitBitmap.width;
  let srcHeight = portraitBitmap.height;

  if (options.cropSize !== 'asli') {
    let targetAspect = 3 / 4;
    if (options.cropSize === '2x3') targetAspect = 2 / 3;
    if (options.cropSize === '3x4') targetAspect = 3 / 4;
    if (options.cropSize === '4x6') targetAspect = 4 / 6;

    const currentAspect = portraitBitmap.width / portraitBitmap.height;

    if (currentAspect > targetAspect) {
      // Too wide: crop left & right
      srcWidth = Math.round(portraitBitmap.height * targetAspect);
      srcHeight = portraitBitmap.height;
      srcX = Math.round((portraitBitmap.width - srcWidth) / 2);
      srcY = 0;
    } else {
      // Too tall: crop bottom, preserve top head space
      srcWidth = portraitBitmap.width;
      srcHeight = Math.round(portraitBitmap.width / targetAspect);
      srcX = 0;
      const excessY = portraitBitmap.height - srcHeight;
      srcY = Math.max(0, Math.round(excessY * 0.15));
    }

    if (options.cropSize === '2x3') {
      finalWidth = 472;
      finalHeight = 708;
    } else if (options.cropSize === '3x4') {
      finalWidth = 708;
      finalHeight = 944;
    } else if (options.cropSize === '4x6') {
      finalWidth = 944;
      finalHeight = 1416;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

  // Map background color
  let hexColor: string | null = null;
  const bg = options.backgroundColor.toLowerCase();
  if (bg === 'merah' || bg === 'red') hexColor = '#D32F2F'; // Standar Pasfoto Merah KTP / Ganjil
  else if (bg === 'biru' || bg === 'blue') hexColor = '#1976D2'; // Standar Pasfoto Biru KTP / Genap
  else if (bg === 'putih' || bg === 'white') hexColor = '#FFFFFF';
  else if (bg === 'abu' || bg === 'gray') hexColor = '#9E9E9E';
  else if (bg === 'transparan' || bg === 'none') hexColor = null;
  else if (bg.startsWith('#') || bg.startsWith('rgb')) hexColor = options.backgroundColor;
  else hexColor = '#D32F2F';

  if (hexColor) {
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, finalWidth, finalHeight);
  } else {
    ctx.clearRect(0, 0, finalWidth, finalHeight);
  }

  ctx.drawImage(
    portraitBitmap,
    srcX,
    srcY,
    srcWidth,
    srcHeight,
    0,
    0,
    finalWidth,
    finalHeight
  );
  portraitBitmap.close();

  onProgress?.(4, 4, 'Mengompres hasil ke target ukuran...');
  const outputMime = hexColor ? 'image/jpeg' : 'image/png';
  const ext = hexColor ? 'jpg' : 'png';
  let resultBlob: Blob;

  if (options.targetMaxKB && hexColor) {
    const targetBytes = options.targetMaxKB * 1024;
    let minQ = 0.2;
    let maxQ = 0.95;
    let best: Blob | null = null;

    for (let it = 0; it < 6; it++) {
      const q = (minQ + maxQ) / 2;
      const testBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, outputMime, q));
      if (!testBlob) break;
      if (testBlob.size <= targetBytes) {
        best = testBlob;
        minQ = q;
      } else {
        maxQ = q;
      }
    }
    resultBlob = best || (await new Promise<Blob>(r => canvas.toBlob(b => r(b!), outputMime, 0.4)));
  } else {
    resultBlob = await new Promise<Blob>(r =>
      canvas.toBlob(b => r(b!), outputMime, options.quality || 0.9)
    );
  }

  canvas.width = 0;
  canvas.height = 0;

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const cropSuffix = options.cropSize !== 'asli' ? `_${options.cropSize}` : '';
  const bgSuffix = hexColor ? `_${options.backgroundColor}` : '_transparan';
  const filename = `${baseName}_pasfoto${cropSuffix}${bgSuffix}.${ext}`;

  return {
    blob: resultBlob,
    filename,
    achievedKB: Math.round(resultBlob.size / 1024),
  };
}

export interface WatermarkOptions {
  text: string;
  style: 'tiled' | 'single';
  opacity: number; // 0.1 to 1.0 (default 0.3)
  color: 'white' | 'black' | 'red';
  angleDegrees: number; // default -30
}

/**
 * Apply security watermark to ID card or sensitive image (KTP, SIM, Ijazah)
 */
export async function applyWatermarkToImage(
  file: File,
  options: WatermarkOptions,
  onProgress?: (msg: string) => void
): Promise<{ blob: Blob; filename: string }> {
  onProgress?.('Membuka gambar untuk pemberian watermark...');
  let sourceBlob: Blob = file;
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  ) {
    sourceBlob = await convertHeicToUniversalBlob(file);
  }

  const bitmap = await createImageBitmap(sourceBlob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  onProgress?.('Menerapkan watermark pengaman KTP...');
  ctx.save();
  ctx.globalAlpha = Math.max(0.08, Math.min(1.0, options.opacity));

  let textColor = '#FFFFFF';
  let shadowColor = 'rgba(0, 0, 0, 0.8)';
  if (options.color === 'black') {
    textColor = '#111111';
    shadowColor = 'rgba(255, 255, 255, 0.8)';
  } else if (options.color === 'red') {
    textColor = '#DC2626';
    shadowColor = 'rgba(0, 0, 0, 0.6)';
  }

  ctx.fillStyle = textColor;
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = Math.max(2, Math.round(canvas.width / 500));

  const text = options.text.trim() || 'HANYA UNTUK VERIFIKASI DOKUMEN';
  const angleRad = (options.angleDegrees * Math.PI) / 180;

  if (options.style === 'single') {
    const fontSize = Math.max(22, Math.round(canvas.width / 18));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angleRad);
    ctx.fillText(text, 0, 0);
  } else {
    // Tiled repeating grid across the whole surface
    const fontSize = Math.max(16, Math.round(canvas.width / 26));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const diagonal = Math.hypot(canvas.width, canvas.height);
    const stepX = Math.max(200, Math.round(fontSize * 12));
    const stepY = Math.max(80, Math.round(fontSize * 4.5));

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angleRad);

    for (let y = -diagonal; y <= diagonal; y += stepY) {
      for (let x = -diagonal; x <= diagonal; x += stepX) {
        ctx.fillText(text, x, y);
      }
    }
  }

  ctx.restore();

  onProgress?.('Menyimpan gambar hasil watermark...');
  const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const ext = file.type === 'image/png' ? 'png' : 'jpg';

  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Gagal mengekspor gambar'))),
      outputMime,
      0.92
    );
  });

  canvas.width = 0;
  canvas.height = 0;

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${baseName}_watermark.${ext}`;

  return { blob: outputBlob, filename };
}

/**
 * Batch convert images to target format (JPG, PNG, or WebP)
 */
export async function batchConvertImages(
  files: File[],
  options: ImageConvertOptions,
  onProgress?: ImageProgressCallback
): Promise<{
  blob: Blob;
  isZip: boolean;
  count: number;
  outputFiles: { name: string; blob: Blob }[];
}> {
  const total = files.length;
  if (total === 0) {
    throw new Error('Tidak ada berkas yang dipilih untuk konversi gambar.');
  }

  const outputFiles: { name: string; blob: Blob }[] = [];

  for (let i = 0; i < total; i++) {
    const file = files[i];
    onProgress?.(i + 1, total, `Mengonversi gambar ${i + 1} dari ${total}: ${file.name}`);

    const result = await transcodeImage(file, options);
    outputFiles.push({ name: result.filename, blob: result.blob });

    // Yield to UI event loop
    await new Promise(r => setTimeout(r, 0));
  }

  // If single file, return direct blob
  if (outputFiles.length === 1) {
    return {
      blob: outputFiles[0].blob,
      isZip: false,
      count: 1,
      outputFiles,
    };
  }

  // Multiple files: bundle into ZIP archive
  onProgress?.(total, total, 'Compressing images into ZIP bundle...');
  const zip = new JSZip();
  for (const item of outputFiles) {
    zip.file(item.name, item.blob);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    metadata => {
      onProgress?.(
        Math.round((metadata.percent / 100) * total),
        total,
        `Building ZIP: ${Math.round(metadata.percent)}%`
      );
    }
  );

  return {
    blob: zipBlob,
    isZip: true,
    count: total,
    outputFiles,
  };
}
