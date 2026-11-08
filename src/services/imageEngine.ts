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
 * Quick probe to check if canvas corners/edges already possess true alpha transparency
 */
function checkHasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const points: [number, number][] = [
    [2, 2],
    [Math.max(0, w - 3), 2],
    [Math.floor(w / 2), 2],
    [2, Math.floor(h * 0.25)],
    [Math.max(0, w - 3), Math.floor(h * 0.25)],
  ];
  for (const [x, y] of points) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] < 128) return true;
  }
  return false;
}

/**
 * High-Precision Studio Matting & Background Swap Engine
 * 100% Client-Side, Zero Network Dependencies
 * Automatically detects original backdrop (red, blue, white, neutral), protects skin & face,
 * and seamlessly transforms background to target color or transparency with smooth anti-aliased edges.
 */
export function applySmartPortraitMatting(
  canvas: HTMLCanvasElement,
  targetHexColor: string | null
): void {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || width === 0 || height === 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Parse target color components
  let targetR = 0;
  let targetG = 0;
  let targetB = 0;
  if (targetHexColor) {
    const clean = targetHexColor.replace('#', '');
    if (clean.length === 3) {
      targetR = parseInt(clean[0] + clean[0], 16);
      targetG = parseInt(clean[1] + clean[1], 16);
      targetB = parseInt(clean[2] + clean[2], 16);
    } else {
      targetR = parseInt(clean.slice(0, 2), 16);
      targetG = parseInt(clean.slice(2, 4), 16);
      targetB = parseInt(clean.slice(4, 6), 16);
    }
  }

  // 2. Sample outer perimeter to determine dominant background color
  const sampleTopH = Math.max(8, Math.floor(height * 0.08));
  const sampleSideW = Math.max(8, Math.floor(width * 0.12));
  const sampleSideH = Math.max(16, Math.floor(height * 0.45));

  // Coarse brightness check to filter out dark hair strands touching borders
  let prelimLum = 0;
  let prelimCount = 0;
  for (let x = 0; x < width; x += 4) {
    const idx = x * 4;
    prelimLum += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    prelimCount++;
  }
  const avgBorderLum = prelimCount > 0 ? prelimLum / prelimCount : 128;
  const isLightBackdrop = avgBorderLum > 90;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sampleCount = 0;

  // Collect samples from top border
  for (let y = 0; y < sampleTopH; y += 2) {
    for (let x = 0; x < width; x += 3) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isLightBackdrop && r + g + b < 90) continue; // Filter dark hair
      sumR += r;
      sumG += g;
      sumB += b;
      sampleCount++;
    }
  }

  // Collect samples from upper left & right side borders
  for (let y = sampleTopH; y < sampleSideH; y += 2) {
    for (let x = 0; x < sampleSideW; x += 3) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isLightBackdrop && r + g + b < 90) continue;
      sumR += r;
      sumG += g;
      sumB += b;
      sampleCount++;
    }
    for (let x = width - sampleSideW; x < width; x += 3) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (isLightBackdrop && r + g + b < 90) continue;
      sumR += r;
      sumG += g;
      sumB += b;
      sampleCount++;
    }
  }

  if (sampleCount === 0) return;

  const bgR = Math.round(sumR / sampleCount);
  const bgG = Math.round(sumG / sampleCount);
  const bgB = Math.round(sumB / sampleCount);

  // Background classification
  const isRedBg = bgR > 110 && bgR > 1.3 * bgG && bgR > 1.3 * bgB;
  const isBlueBg = bgB > 95 && bgB > 1.15 * bgR && bgB > 1.15 * bgG;
  const isWhiteBg =
    bgR > 180 &&
    bgG > 180 &&
    bgB > 180 &&
    Math.abs(bgR - bgG) < 30 &&
    Math.abs(bgR - bgB) < 30;
  const isDarkBg = bgR < 70 && bgG < 70 && bgB < 70;

  // Tolerance thresholds
  let baseTol = 48;
  if (isRedBg) baseTol = 62;
  else if (isBlueBg) baseTol = 58;
  else if (isWhiteBg) baseTol = 46;
  else if (isDarkBg) baseTol = 20; // Tight tolerance on dark backdrops to prevent eating black suits/hair

  const featherSpan = isDarkBg ? 10 : 22;

  // Robust human skin detection (protects face, ears, neck across ethnicities)
  function isSkin(r: number, g: number, b: number): boolean {
    if (r <= g || g <= b) return false;
    if (r < 75 || g < 40 || b < 25) return false;
    const diffRG = r - g;
    const diffRB = r - b;
    if (diffRG < 12 || diffRB < 25) return false;
    if (r > 165 && g < 65 && b < 65) return false; // Red studio backdrop
    return true;
  }

  function matchesBgSeed(pIdx: number): boolean {
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];
    if (!isWhiteBg && isSkin(r, g, b)) return false;
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    const dist = Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
    if (dist <= baseTol) return true;
    if (isRedBg && r > 1.25 * g && r > 1.25 * b && r > 95) return true;
    if (isBlueBg && b > 1.15 * r && b > 1.15 * g && b > 75) return true;
    if (isWhiteBg && r > 175 && g > 175 && b > 175 && Math.abs(r - g) < 30) return true;
    return false;
  }

  // BFS Queue & Connected Mask
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels); // 0=unvisited, 1=subject, 2=bg, 3=feather
  const mask = new Float32Array(totalPixels);  // 1.0=pure bg, 0.0=pure subject, (0..1)=feather
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  // Seed outer perimeter: top edge and upper left/right edges
  for (let x = 0; x < width; x++) {
    if (matchesBgSeed(x * 4)) {
      visited[x] = 2;
      mask[x] = 1.0;
      queue[tail++] = x;
    }
  }
  for (let y = 1; y < sampleSideH; y++) {
    const idxL = y * width;
    const idxR = y * width + (width - 1);
    if (visited[idxL] === 0 && matchesBgSeed(idxL * 4)) {
      visited[idxL] = 2;
      mask[idxL] = 1.0;
      queue[tail++] = idxL;
    }
    if (visited[idxR] === 0 && matchesBgSeed(idxR * 4)) {
      visited[idxR] = 2;
      mask[idxR] = 1.0;
      queue[tail++] = idxR;
    }
  }

  // Flood fill propagation
  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const cr = data[curr * 4];
    const cg = data[curr * 4 + 1];
    const cb = data[curr * 4 + 2];

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const n = neighbors[i];
      if (n === -1 || visited[n] !== 0) continue;

      const pIdx = n * 4;
      const nr = data[pIdx];
      const ng = data[pIdx + 1];
      const nb = data[pIdx + 2];

      const nx = n % width;
      const ny = Math.floor(n / width);

      // Anatomical guards for portrait photos:
      // 1. Strictly protect chest, suit lapels, tie, and clothing (lower-central torso region)
      if (ny > height * 0.46 && nx > width * 0.16 && nx < width * 0.84) {
        visited[n] = 1;
        continue;
      }

      // 2. Strictly protect chin, jawline shadow, and neck
      if (ny > height * 0.28 && ny <= height * 0.46 && nx > width * 0.30 && nx < width * 0.70) {
        if (isDarkBg || isSkin(nr, ng, nb) || nr + ng + nb < 160) {
          visited[n] = 1;
          continue;
        }
      }

      // Protect subject skin
      if (!isWhiteBg && isSkin(nr, ng, nb)) {
        visited[n] = 1;
        continue;
      }

      // Perceptual distance to global background color
      const dr = nr - bgR;
      const dg = ng - bgG;
      const db = nb - bgB;
      const dist = Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);

      // Local step distance to parent pixel (adapts to subtle lighting gradients)
      const sdr = nr - cr;
      const sdg = ng - cg;
      const sdb = nb - cb;
      const stepDist = Math.sqrt(0.299 * sdr * sdr + 0.587 * sdg * sdg + 0.114 * sdb * sdb);

      // Chroma matching boost
      let isChromaMatch = false;
      if (isRedBg && nr > 1.25 * ng && nr > 1.25 * nb && nr > 95) {
        isChromaMatch = true;
      } else if (isBlueBg && nb > 1.15 * nr && nb > 1.15 * ng && nb > 75) {
        isChromaMatch = true;
      } else if (isWhiteBg && nr > 175 && ng > 175 && nb > 175 && Math.abs(nr - ng) < 30) {
        isChromaMatch = true;
      }

      const isCoreBg =
        dist <= baseTol ||
        isChromaMatch ||
        (stepDist < 12 && dist <= baseTol * 1.35);

      if (isCoreBg) {
        visited[n] = 2;
        mask[n] = 1.0;
        queue[tail++] = n;
      } else if (dist < baseTol + featherSpan) {
        visited[n] = 3;
        const w = (baseTol + featherSpan - dist) / featherSpan;
        mask[n] = Math.max(0, Math.min(1, w));
      } else {
        visited[n] = 1; // Subject
      }
    }
  }

  // Decontaminate & Apply Target Background
  for (let i = 0; i < totalPixels; i++) {
    const w = mask[i];
    if (w === 0) continue; // Pure foreground subject unchanged

    const pIdx = i * 4;
    if (w === 1.0) {
      // Pure background
      if (targetHexColor === null) {
        data[pIdx + 3] = 0; // 100% Transparent
      } else {
        data[pIdx] = targetR;
        data[pIdx + 1] = targetG;
        data[pIdx + 2] = targetB;
        data[pIdx + 3] = 255;
      }
    } else {
      // Feather border (hair tips, silhouette edge)
      const fgWeight = 1 - w;
      // Decontaminate color spill from original background
      let fgR = (data[pIdx] - w * bgR) / fgWeight;
      let fgG = (data[pIdx + 1] - w * bgG) / fgWeight;
      let fgB = (data[pIdx + 2] - w * bgB) / fgWeight;
      fgR = Math.max(0, Math.min(255, fgR));
      fgG = Math.max(0, Math.min(255, fgG));
      fgB = Math.max(0, Math.min(255, fgB));

      if (targetHexColor === null) {
        data[pIdx] = Math.round(fgR);
        data[pIdx + 1] = Math.round(fgG);
        data[pIdx + 2] = Math.round(fgB);
        data[pIdx + 3] = Math.round(fgWeight * 255);
      } else {
        data[pIdx] = Math.round(fgWeight * fgR + w * targetR);
        data[pIdx + 1] = Math.round(fgWeight * fgG + w * targetG);
        data[pIdx + 2] = Math.round(fgWeight * fgB + w * targetB);
        data[pIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * AI Pasfoto Studio: Background removal (WebAssembly/ONNX) + High-Precision Studio Matting + Smart auto-crop + Color swap + Target KB
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

  onProgress?.(2, 4, 'Menghilangkan latar belakang via AI WebAssembly...');
  let transparentBlob: Blob = sourceBlob;
  try {
    const { removeBackground } = await import('@imgly/background-removal');
    transparentBlob = await removeBackground(sourceBlob, {
      model: 'isnet_quint8',
      output: {
        format: 'image/png',
        quality: 0.95,
      },
      progress: (key: string, current: number, total: number) => {
        if (key.startsWith('fetch')) {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          onProgress?.(2, 4, `Mengunduh model AI (${pct}%)...`);
        } else if (key === 'compute:decode') {
          onProgress?.(2, 4, 'Mendekode gambar...');
        } else if (key === 'compute:inference') {
          onProgress?.(2, 4, 'Menjalankan AI segmentasi objek...');
        } else if (key === 'compute:mask') {
          onProgress?.(2, 4, 'Menyempurnakan tepi rambut & pakaian...');
        } else {
          onProgress?.(2, 4, 'Menghilangkan latar belakang via AI...');
        }
      },
    });
  } catch (err) {
    console.warn('AI Background Removal notice, applying high-precision studio matting:', err);
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
  } else {
    // If asli, cap max dimension to 1600px to ensure fluid performance and optimal memory
    const maxDim = Math.max(finalWidth, finalHeight);
    if (maxDim > 1600) {
      const scale = 1600 / maxDim;
      finalWidth = Math.round(finalWidth * scale);
      finalHeight = Math.round(finalHeight * scale);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

  // Draw portrait bitmap directly onto canvas
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

  // Inspect if image already has transparent background (e.g. from neural net or transparent PNG)
  const isAlreadyTransparent = checkHasTransparency(ctx, finalWidth, finalHeight);

  if (isAlreadyTransparent) {
    if (hexColor) {
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = hexColor;
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      ctx.globalCompositeOperation = 'source-over';
    }
  } else {
    // Opaque photo: execute High-Precision Studio Matting & Background Replacement
    onProgress?.(3, 4, 'Menerapkan Studio AI Matting & penggantian warna latar...');
    applySmartPortraitMatting(canvas, hexColor);
  }

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
