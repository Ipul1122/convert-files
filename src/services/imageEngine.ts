import JSZip from 'jszip';

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
 * Transcode single image using browser native HTML5 Canvas
 */
export async function transcodeImage(
  file: File,
  options: ImageConvertOptions
): Promise<{ blob: Blob; filename: string }> {
  // Decode image (supports JPG, PNG, WebP)
  const bitmap = await createImageBitmap(file);

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
