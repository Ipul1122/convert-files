import type { ToolType } from '../types';

export interface RouteConfig {
  path: string;
  tool: ToolType;
  title: string;
  metaDesc: string;
}

export const TOOL_ROUTES: Record<ToolType, RouteConfig> = {
  'smart': {
    path: '/',
    tool: 'smart',
    title: 'Konverter Berkas & PDF Universal — LocalVault',
    metaDesc: 'Konversi PDF, Gambar, Excel, Word, dan PPT secara offline. 100% privat dan aman tanpa server luar.',
  },
  'img-to-pdf': {
    path: '/img-to-pdf',
    tool: 'img-to-pdf',
    title: 'Konversi Gambar ke PDF — LocalVault',
    metaDesc: 'Konversi gambar JPG, PNG, dan WebP menjadi dokumen PDF berurutan secara offline.',
  },
  'pdf-to-jpg': {
    path: '/pdf-to-jpg',
    tool: 'pdf-to-jpg',
    title: 'Konversi PDF ke JPG — LocalVault',
    metaDesc: 'Ekstrak halaman PDF menjadi gambar JPG beresolusi tinggi secara offline.',
  },
  'pdf-to-png': {
    path: '/pdf-to-png',
    tool: 'pdf-to-png',
    title: 'Konversi PDF ke PNG — LocalVault',
    metaDesc: 'Konversi PDF menjadi gambar PNG tajam tanpa kompresi secara privat.',
  },
  'pdf-to-webp': {
    path: '/pdf-to-webp',
    tool: 'pdf-to-webp',
    title: 'Konversi PDF ke WebP — LocalVault',
    metaDesc: 'Konversi PDF ke format gambar WebP modern yang ringan untuk web.',
  },
  'img-to-webp': {
    path: '/img-to-webp',
    tool: 'img-to-webp',
    title: 'Konversi Gambar ke WebP — LocalVault',
    metaDesc: 'Konversi kumpulan gambar JPG dan PNG ke format WebP efisien secara offline.',
  },
  'webp-to-img': {
    path: '/webp-to-img',
    tool: 'webp-to-img',
    title: 'Konversi WebP ke Gambar — LocalVault',
    metaDesc: 'Kembalikan berkas WebP ke format PNG atau JPG untuk kompatibilitas aplikasi lain.',
  },
  'merge-pdf': {
    path: '/merge-pdf',
    tool: 'merge-pdf',
    title: 'Gabung Dokumen PDF — LocalVault',
    metaDesc: 'Gabungkan beberapa dokumen PDF menjadi satu berkas dengan urutan kustom tanpa upload cloud.',
  },
  'split-pdf': {
    path: '/split-pdf',
    tool: 'split-pdf',
    title: 'Pisah & Ekstrak Halaman PDF — LocalVault',
    metaDesc: 'Pilih dan centang halaman PDF secara visual dengan pratinjau langsung untuk mengekstrak halaman pilihan.',
  },
  'word-to-pdf': {
    path: '/word-to-pdf',
    tool: 'word-to-pdf',
    title: 'Konversi Word ke PDF — LocalVault',
    metaDesc: 'Ubah dokumen Microsoft Word (.docx) menjadi berkas PDF berkualitas rapi secara lokal offline.',
  },
  'word-to-html': {
    path: '/word-to-html',
    tool: 'word-to-html',
    title: 'Konversi Word ke HTML — LocalVault',
    metaDesc: 'Ubah dokumen Word (.docx) menjadi kode HTML semantik untuk web.',
  },
  'word-to-txt': {
    path: '/word-to-txt',
    tool: 'word-to-txt',
    title: 'Ekstrak Teks Word — LocalVault',
    metaDesc: 'Ekstrak seluruh teks polos dari berkas Word (.docx) tanpa pemformatan rumit.',
  },
  'excel-to-pdf': {
    path: '/excel-to-pdf',
    tool: 'excel-to-pdf',
    title: 'Konversi Excel ke PDF — LocalVault',
    metaDesc: 'Ubah spreadsheet Excel (.xlsx, .xls, .csv) menjadi lembar PDF bergaris tabel rapi.',
  },
  'excel-to-csv': {
    path: '/excel-to-csv',
    tool: 'excel-to-csv',
    title: 'Konversi Excel ke CSV — LocalVault',
    metaDesc: 'Ekspor lembar kerja Excel ke format teks tabel CSV standar.',
  },
  'csv-to-excel': {
    path: '/csv-to-excel',
    tool: 'csv-to-excel',
    title: 'Konversi CSV ke Excel — LocalVault',
    metaDesc: 'Ubah berkas CSV menjadi format spreadsheet Excel (.xlsx) siap diolah.',
  },
  'pptx-to-pdf': {
    path: '/pptx-to-pdf',
    tool: 'pptx-to-pdf',
    title: 'Konversi PowerPoint ke PDF — LocalVault',
    metaDesc: 'Ekstrak slide presentasi PowerPoint (.pptx) menjadi halaman dokumen PDF.',
  },
  'pdf-to-docx': {
    path: '/pdf-to-docx',
    tool: 'pdf-to-docx',
    title: 'Konversi PDF ke Word (.docx) — LocalVault',
    metaDesc: 'Ekstrak teks dan struktur PDF ke dokumen Microsoft Word (.docx) 100% offline.',
  },
  'pdf-to-xlsx': {
    path: '/pdf-to-xlsx',
    tool: 'pdf-to-xlsx',
    title: 'Konversi PDF ke Excel (.xlsx) — LocalVault',
    metaDesc: 'Ekstrak tabel dan data spreadsheet PDF ke Microsoft Excel (.xlsx) secara offline.',
  },
  'pdf-to-pptx': {
    path: '/pdf-to-pptx',
    tool: 'pdf-to-pptx',
    title: 'Konversi PDF ke PowerPoint (.pptx) — LocalVault',
    metaDesc: 'Ubah lembaran PDF menjadi slide presentasi Microsoft PowerPoint (.pptx) secara offline.',
  },
  'pdf-to-txt': {
    path: '/pdf-to-txt',
    tool: 'pdf-to-txt',
    title: 'Ekstrak Teks PDF ke TXT — LocalVault',
    metaDesc: 'Ekstrak seluruh teks dokumen PDF menjadi berkas teks UTF-8 murni secara offline.',
  },
  'compress-pdf': {
    path: '/compress-pdf',
    tool: 'compress-pdf',
    title: 'Kompres Ukuran PDF — LocalVault',
    metaDesc: 'Kecilkan ukuran dokumen PDF offline agar sesuai batas unggahan CPNS, email, dan instansi.',
  },
  'heic-to-img': {
    path: '/heic-to-img',
    tool: 'heic-to-img',
    title: 'Konversi HEIC ke JPG/PNG — LocalVault',
    metaDesc: 'Ubah foto Apple iPhone HEIC menjadi JPG atau PNG universal secara offline.',
  },
  'pasfoto': {
    path: '/pasfoto',
    tool: 'pasfoto',
    title: 'Pasfoto Studio AI (Ganti Latar & Auto-Crop) — LocalVault',
    metaDesc: 'Ganti latar merah/biru pasfoto via AI WebAssembly, auto-crop 2x3, 3x4, 4x6, dan kunci target KB.',
  },
  'watermark': {
    path: '/watermark',
    tool: 'watermark',
    title: 'Watermark Pengaman KTP & Dokumen — LocalVault',
    metaDesc: 'Beri cap teks pengaman anti-penyalahgunaan pinjol dan penipuan pada scan KTP atau PDF.',
  },
  'office-media': {
    path: '/office-media',
    tool: 'office-media',
    title: 'Ekstrak Gambar & Media Dokumen — LocalVault',
    metaDesc: 'Ekstrak seluruh foto, diagram, dan gambar yang tertanam di dalam dokumen Word atau PPTX ke file ZIP.',
  },
  'vault': {
    path: '/vault',
    tool: 'vault',
    title: 'Riwayat Konversi — LocalVault',
    metaDesc: 'Kelola dan unduh berkas hasil konversi yang tersimpan aman di database lokal IndexedDB browser Anda.',
  },
};

/**
 * Base URL configuration for GitHub Pages subpath support
 */
const rawBase = import.meta.env.BASE_URL || '/';
export const BASE_PATH = rawBase === './' ? '' : rawBase.replace(/\/+$/, '');

/**
 * Resolve tool type from given URL pathname (including aliases & base path)
 */
export function getToolFromPath(pathname: string): ToolType {
  let clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // Strip subpath base (e.g. /convert-files) if present
  if (BASE_PATH && clean.startsWith(BASE_PATH.toLowerCase())) {
    clean = clean.slice(BASE_PATH.length) || '/';
  }

  for (const config of Object.values(TOOL_ROUTES)) {
    if (clean === config.path) {
      return config.tool;
    }
  }

  // Common aliases & shortcuts
  if (clean === '/' || clean === '/smart' || clean === '/convert' || clean === '/dashboard') {
    return 'smart';
  }
  if (clean === '/history' || clean === '/vault' || clean === '/riwayat') {
    return 'vault';
  }
  if (clean === '/pdf-convert') {
    return 'img-to-pdf';
  }
  if (clean === '/pdf-to-image' || clean === '/pdf-images') {
    return 'pdf-to-jpg';
  }
  if (clean === '/pdf-to-excel' || clean === '/pdf-excel' || clean === '/pdf-excel-convert') {
    return 'pdf-to-xlsx';
  }
  if (clean === '/pdf-to-ppt' || clean === '/pdf-ppt' || clean === '/pdf-powerpoint') {
    return 'pdf-to-pptx';
  }
  if (clean === '/pdf-merge' || clean === '/gabung-pdf') {
    return 'merge-pdf';
  }
  if (clean === '/pdf-split' || clean === '/extract-pdf' || clean === '/pisah-pdf') {
    return 'split-pdf';
  }
  if (clean === '/webp-convert' || clean === '/webp') {
    return 'img-to-webp';
  }

  return 'smart';
}

/**
 * Update browser URL, document title, and meta description
 */
export function navigateToTool(tool: ToolType, replace = false): void {
  const config = TOOL_ROUTES[tool];
  if (!config) return;

  const targetPath = (BASE_PATH || '') + config.path;

  if (window.location.pathname !== targetPath) {
    if (replace) {
      window.history.replaceState({ tool }, '', targetPath);
    } else {
      window.history.pushState({ tool }, '', targetPath);
    }
  }

  document.title = config.title;

  let meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute('content', config.metaDesc);
  }
}

