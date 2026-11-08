import type { ToolType, SourceFile } from '../types';

export interface TargetOption {
  id: string;
  label: string;
  badge?: string;
  description: string;
  toolType: Exclude<ToolType, 'vault' | 'smart'>;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  targetImageFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Menentukan target konversi yang tersedia secara dinamis berdasarkan file yang diunggah.
 */
export function getAvailableTargets(files: SourceFile[]): TargetOption[] {
  if (files.length === 0) {
    return [];
  }

  const hasWord = files.some(f => /\.docx$/i.test(f.name));
  const hasExcel = files.some(f => /\.(xlsx|xls)$/i.test(f.name));
  const hasCsv = files.some(f => /\.csv$/i.test(f.name));
  const hasPpt = files.some(f => /\.pptx$/i.test(f.name));
  const hasHeic = files.some(
    f => f.file.type === 'image/heic' || f.file.type === 'image/heif' || /\.(heic|heif)$/i.test(f.name)
  );
  const hasPdf = files.some(
    f => f.file.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  );
  const hasImage = files.some(
    f =>
      f.file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)
  );

  // Kasus 1: Dokumen Word (.docx)
  if (hasWord) {
    return [
      {
        id: 'word-to-pdf',
        label: '.PDF',
        badge: 'DOKUMEN',
        description: 'Konversi dokumen Word ke berkas PDF rapi siap cetak',
        toolType: 'word-to-pdf',
      },
      {
        id: 'word-to-html',
        label: '.HTML',
        badge: 'WEB',
        description: 'Ekspor dokumen Word ke format halaman web HTML interaktif',
        toolType: 'word-to-html',
      },
      {
        id: 'word-to-txt',
        label: '.TXT',
        badge: 'TEKS MURNI',
        description: 'Ekstrak seluruh teks dokumen ke berkas teks UTF-8',
        toolType: 'word-to-txt',
      },
      {
        id: 'word-media',
        label: '.IMAGES',
        badge: 'EKSTRAK ZIP',
        description: 'Ekstrak semua foto dan gambar yang ada di dalam Word ke berkas ZIP',
        toolType: 'office-media',
      },
    ];
  }

  // Kasus 2: Lembar Kerja Excel (.xlsx, .xls)
  if (hasExcel) {
    return [
      {
        id: 'excel-to-pdf',
        label: '.PDF',
        badge: 'TABEL PDF',
        description: 'Cetak seluruh tabel lembar kerja Excel ke dokumen PDF mendatar',
        toolType: 'excel-to-pdf',
      },
      {
        id: 'excel-to-csv',
        label: '.CSV',
        badge: 'DATA CSV',
        description: 'Ekspor data lembar kerja ke format CSV universal (ZIP jika banyak sheet)',
        toolType: 'excel-to-csv',
      },
    ];
  }

  // Kasus 3: Berkas CSV
  if (hasCsv) {
    return [
      {
        id: 'csv-to-excel',
        label: '.XLSX',
        badge: 'EXCEL',
        description: 'Konversi berkas CSV menjadi lembar kerja Excel .xlsx modern',
        toolType: 'csv-to-excel',
      },
      {
        id: 'excel-to-pdf',
        label: '.PDF',
        badge: 'TABEL PDF',
        description: 'Cetak tabel CSV ke dokumen PDF yang rapi',
        toolType: 'excel-to-pdf',
      },
    ];
  }

  // Kasus 4: Presentasi PowerPoint (.pptx)
  if (hasPpt) {
    return [
      {
        id: 'pptx-to-pdf',
        label: '.PDF',
        badge: 'SLIDE PDF',
        description: 'Konversi slide presentasi PowerPoint ke dokumen PDF landscape',
        toolType: 'pptx-to-pdf',
      },
      {
        id: 'ppt-media',
        label: '.IMAGES',
        badge: 'EKSTRAK ZIP',
        description: 'Ekstrak seluruh gambar dan aset grafis dari slide PPTX ke ZIP',
        toolType: 'office-media',
      },
    ];
  }

  // Kasus 5: Dokumen PDF
  if (hasPdf && !hasImage) {
    const isMultiPdf = files.length > 1;

    const targets: TargetOption[] = [
      {
        id: 'pdf-to-docx',
        label: '.DOCX',
        badge: 'WORD EDITABLE',
        description: 'Ekstrak teks dan susunan dokumen PDF ke Microsoft Word (.docx) langsung di peramban',
        toolType: 'pdf-to-docx',
      },
      {
        id: 'pdf-to-xlsx',
        label: '.XLSX',
        badge: 'EXCEL TABEL',
        description: 'Ekstrak tabel dan data spreadsheet PDF ke Microsoft Excel (.xlsx) per sheet halaman',
        toolType: 'pdf-to-xlsx',
      },
      {
        id: 'pdf-to-pptx',
        label: '.PPTX',
        badge: 'POWERPOINT',
        description: 'Ubah lembaran PDF menjadi slide presentasi Microsoft PowerPoint (.pptx) beresolusi tinggi',
        toolType: 'pdf-to-pptx',
      },
      {
        id: 'compress-pdf',
        label: 'KOMPRES',
        badge: 'HEMAT RUANG',
        description: 'Kecilkan ukuran PDF agar sesuai batas unggah CPNS, BKN, lamaran kerja, atau email',
        toolType: 'compress-pdf',
      },
      {
        id: 'pdf-watermark',
        label: 'WATERMARK',
        badge: 'PENGAMAN KTP',
        description: 'Beri cap teks pengaman diagonal / berulang pada seluruh halaman PDF',
        toolType: 'watermark',
      },
      {
        id: 'pdf-to-txt',
        label: '.TXT',
        badge: 'TEKS MURNI',
        description: 'Ekstrak seluruh konten teks PDF menjadi berkas teks UTF-8 murni',
        toolType: 'pdf-to-txt',
      },
      {
        id: 'pdf-to-jpg',
        label: '.JPG',
        badge: 'POPULER',
        description: 'Ekspor halaman PDF ke gambar JPG resolusi tinggi (arsip ZIP jika banyak halaman)',
        toolType: 'pdf-to-jpg',
        format: 'image/jpeg',
      },
      {
        id: 'pdf-to-png',
        label: '.PNG',
        badge: 'JERNIH',
        description: 'Ekspor halaman PDF ke gambar PNG tanpa kompresi pecah (arsip ZIP)',
        toolType: 'pdf-to-png',
        format: 'image/png',
      },
      {
        id: 'pdf-to-webp',
        label: '.WEBP',
        badge: 'WEB ASSET',
        description: 'Ekspor halaman PDF ke format gambar WebP ringan langsung di RAM',
        toolType: 'pdf-to-webp',
        format: 'image/webp',
      },
      {
        id: 'split-pdf',
        label: 'SPLIT',
        badge: 'PILIH HALAMAN',
        description: 'Pilih dan centang halaman mana saja yang ingin diekstrak dengan pratinjau visual',
        toolType: 'split-pdf',
      },
    ];

    if (isMultiPdf) {
      targets.push({
        id: 'merge-pdf',
        label: 'MERGE',
        badge: `${files.length} DOKUMEN`,
        description: `Gabungkan ${files.length} berkas PDF menjadi satu dokumen berurutan`,
        toolType: 'merge-pdf',
      });
    }

    return targets;
  }

  // Kasus 6: Berkas Gambar (JPG, PNG, WebP, HEIC)
  if (hasImage && !hasPdf) {
    const isMultiImage = files.length > 1;
    const isAllWebp = files.every(
      f => f.file.type === 'image/webp' || /\.webp$/i.test(f.name)
    );
    const isAllJpeg = files.every(
      f => f.file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(f.name)
    );
    const isAllPng = files.every(
      f => f.file.type === 'image/png' || /\.png$/i.test(f.name)
    );

    const targets: TargetOption[] = [];

    // Jika berkas HEIC terdeteksi, prioritaskan ekspor ke JPG universal & PNG
    if (hasHeic) {
      targets.push({
        id: 'heic-to-jpg',
        label: '.JPG',
        badge: 'UNIVERSAL',
        description: 'Konversi foto HEIC Apple ke format JPEG universal yang kompatibel di semua perangkat',
        toolType: 'heic-to-img',
        targetImageFormat: 'image/jpeg',
      });
      targets.push({
        id: 'heic-to-png',
        label: '.PNG',
        badge: 'LOSSLESS',
        description: 'Konversi foto HEIC Apple ke format PNG jernih tanpa artefak kompresi',
        toolType: 'heic-to-img',
        targetImageFormat: 'image/png',
      });
      targets.push({
        id: 'heic-to-webp',
        label: '.WEBP',
        badge: 'HEMAT RUANG',
        description: 'Konversi foto HEIC Apple ke format gambar WebP ringan modern',
        toolType: 'heic-to-img',
        targetImageFormat: 'image/webp',
      });
    }

    // Pasfoto AI Studio (Ganti Latar & Auto-Crop)
    targets.push({
      id: 'img-pasfoto',
      label: 'PASFOTO',
      badge: 'AI STUDIO',
      description: 'Ganti latar merah/biru via AI WebAssembly, auto-crop 2x3/3x4/4x6, & kunci target KB',
      toolType: 'pasfoto',
    });

    // Watermark Pengaman KTP / Dokumen
    targets.push({
      id: 'img-watermark',
      label: 'WATERMARK',
      badge: 'PENGAMAN KTP',
      description: 'Pasang cap pengaman anti-penyalahgunaan pada scan foto KTP, KK, atau SIM',
      toolType: 'watermark',
    });

    // PDF selalu menjadi opsi unggulan untuk gambar
    targets.push({
      id: 'img-to-pdf',
      label: '.PDF',
      badge: isMultiImage ? `GABUNG ${files.length}` : 'DOKUMEN',
      description: isMultiImage
        ? `Gabungkan ${files.length} gambar menjadi satu dokumen PDF terstruktur`
        : 'Konversi gambar menjadi berkas dokumen PDF siap cetak',
      toolType: 'img-to-pdf',
    });

    if (!isAllWebp && !hasHeic) {
      targets.push({
        id: 'img-to-webp',
        label: '.WEBP',
        badge: 'UKURAN KECIL',
        description: 'Konversi gambar ke format WebP efisiensi tinggi dengan kompresi optimal',
        toolType: 'img-to-webp',
        targetImageFormat: 'image/webp',
      });
    }

    if (!isAllPng && !hasHeic) {
      targets.push({
        id: 'transcode-to-png',
        label: '.PNG',
        badge: 'JERNIH',
        description: 'Konversi gambar ke format PNG lossless dengan dukungan transparansi',
        toolType: 'webp-to-img',
        targetImageFormat: 'image/png',
      });
    }

    if (!isAllJpeg && !hasHeic) {
      targets.push({
        id: 'transcode-to-jpg',
        label: '.JPG',
        badge: 'UNIVERSAL',
        description: 'Konversi gambar ke format JPG standar universal dengan pengaturan kualitas',
        toolType: 'webp-to-img',
        targetImageFormat: 'image/jpeg',
      });
    }

    return targets;
  }

  // Default: Gabungkan ke PDF
  return [
    {
      id: 'img-to-pdf',
      label: '.PDF',
      badge: 'UNIFIKASI',
      description: 'Satukan semua berkas yang dimuat ke dalam satu dokumen PDF',
      toolType: 'img-to-pdf',
    },
  ];
}

/**
 * Ringkasan tipe input untuk label UI
 */
export function getInputTypeSummary(files: SourceFile[]): {
  typeLabel: string;
  countLabel: string;
} {
  if (files.length === 0) {
    return { typeLabel: 'KOSONG', countLabel: '0 file' };
  }

  const hasWord = files.some(f => /\.docx$/i.test(f.name));
  const hasExcel = files.some(f => /\.(xlsx|xls)$/i.test(f.name));
  const hasCsv = files.some(f => /\.csv$/i.test(f.name));
  const hasPpt = files.some(f => /\.pptx$/i.test(f.name));
  const hasPdf = files.some(
    f => f.file.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  );
  const hasHeic = files.some(
    f => f.file.type === 'image/heic' || f.file.type === 'image/heif' || /\.(heic|heif)$/i.test(f.name)
  );
  const hasWebp = files.some(
    f => f.file.type === 'image/webp' || /\.webp$/i.test(f.name)
  );
  const hasJpg = files.some(
    f => f.file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(f.name)
  );
  const hasPng = files.some(
    f => f.file.type === 'image/png' || /\.png$/i.test(f.name)
  );

  let typeLabel = 'DOKUMEN';
  if (hasWord) {
    typeLabel = 'WORD';
  } else if (hasExcel) {
    typeLabel = 'EXCEL';
  } else if (hasCsv) {
    typeLabel = 'CSV';
  } else if (hasPpt) {
    typeLabel = 'POWERPOINT';
  } else if (hasHeic) {
    typeLabel = 'HEIC FOTO';
  } else if (hasPdf && !hasWebp && !hasJpg && !hasPng) {
    typeLabel = 'PDF';
  } else if (!hasPdf && hasJpg && !hasPng && !hasWebp) {
    typeLabel = 'JPEG';
  } else if (!hasPdf && !hasJpg && hasPng && !hasWebp) {
    typeLabel = 'PNG';
  } else if (!hasPdf && !hasJpg && !hasPng && hasWebp) {
    typeLabel = 'WEBP';
  } else if (!hasPdf && (hasJpg || hasPng || hasWebp)) {
    typeLabel = 'GAMBAR';
  } else {
    typeLabel = 'BERKAS';
  }

  const countLabel = files.length === 1 ? '1 file' : `${files.length} file`;
  return { typeLabel, countLabel };
}
