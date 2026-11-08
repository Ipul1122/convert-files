import type { ToolType } from '../types';

export interface SupportedFormatItem {
  ext: string; // e.g. 'JPG', 'PNG', 'PDF'
  label: string; // e.g. 'Foto KTP / Scan'
  mime: string; // e.g. 'image/jpeg'
  colorClass: string; // styling for badge
}

export interface ToolMetadata {
  id: ToolType;
  title: string;
  subtitle: string;
  badge: string;
  outputFormat: string;
  formats: SupportedFormatItem[];
  acceptAttribute: string;
  description: string;
  usageTips: string[];
  maxFilesText: string;
  isMultiFile: boolean;
  isValidFile: (file: File) => boolean;
}

const COMMON_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];

export const TOOL_METADATA_MAP: Record<ToolType, ToolMetadata> = {
  'smart': {
    id: 'smart',
    title: 'Konverter Berkas Universal',
    subtitle: 'Smart Hub — Deteksi Format Otomatis',
    badge: 'ALL-IN-ONE OFFLINE',
    outputFormat: 'PDF, Word, Excel, Gambar, ZIP',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
      { ext: 'JPG / PNG', label: 'Foto / Gambar', mime: 'image/jpeg,image/png', colorClass: 'text-purple-400 border-purple-900/60 bg-purple-950/30' },
      { ext: 'WEBP', label: 'Gambar Web', mime: 'image/webp', colorClass: 'text-yellow-400 border-yellow-900/60 bg-yellow-950/30' },
      { ext: 'HEIC / HEIF', label: 'Foto iPhone iOS', mime: 'image/heic,image/heif', colorClass: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/30' },
      { ext: 'DOCX', label: 'Microsoft Word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
      { ext: 'XLSX / CSV', label: 'Excel Spreadsheet', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv', colorClass: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/30' },
      { ext: 'PPTX', label: 'PowerPoint Slide', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', colorClass: 'text-orange-400 border-orange-900/60 bg-orange-950/30' },
    ],
    acceptAttribute: 'application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.docx,.xlsx,.xls,.csv,.pptx',
    description: 'Bisa membaca semua format dokumen, gambar, foto iPhone HEIC, dan spreadsheet secara otomatis.',
    usageTips: [
      'Tarik berkas apa saja, sistem akan otomatis menentukan opsi konversi terbaik',
      'Mendukung konversi massal (batch) sekaligus',
      '100% diproses langsung di browser tanpa kirim data ke server luar',
    ],
    maxFilesText: 'Mendukung multi-berkas sekaligus',
    isMultiFile: true,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return (
        file.type === 'application/pdf' ||
        file.type.startsWith('image/') ||
        ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'docx', 'xlsx', 'xls', 'csv', 'pptx'].includes(ext)
      );
    },
  },

  'watermark': {
    id: 'watermark',
    title: 'Watermark Pengaman KTP & Dokumen',
    subtitle: 'Proteksi Anti-Penyalahgunaan Pinjol & Penipuan',
    badge: 'KEAMANAN & PRIVASI',
    outputFormat: 'PDF (jika input PDF) atau JPG / PNG (jika input gambar)',
    formats: [
      { ext: 'JPG / JPEG', label: 'Foto Scan KTP / KK / SIM', mime: 'image/jpeg', colorClass: 'text-purple-400 border-purple-900/60 bg-purple-950/30' },
      { ext: 'PNG', label: 'Gambar Scan Resolusi Tinggi', mime: 'image/png', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
      { ext: 'WEBP', label: 'Gambar Format Ringan', mime: 'image/webp', colorClass: 'text-yellow-400 border-yellow-900/60 bg-yellow-950/30' },
      { ext: 'PDF', label: 'Dokumen PDF Multi-halaman', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf',
    description: 'Mendukung berkas foto Gambar (JPG, PNG, WebP) dan Dokumen PDF. Bubuhkan cap teks pengaman diagonal atau berulang (tiled grid) pada scan KTP, KK, SIM, NPWP, atau dokumen PDF.',
    usageTips: [
      'Bisa unggah foto KTP (JPG/PNG) atau berkas scan PDF multi-halaman',
      'Pilih gaya watermark 1 baris tengah atau pola kisi berulang (tiled) di seluruh permukaan',
      'Atur kepekatan teks (transparansi), rotasi sudut, dan warna teks putih / abu-abu',
      'Semua proses selesai di RAM laptop/ponsel Anda, KTP Anda dijamin 100% aman',
    ],
    maxFilesText: 'Mendukung multi-berkas (dapat memproses banyak KTP / PDF sekaligus)',
    isMultiFile: true,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return (
        file.type === 'application/pdf' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/webp' ||
        ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)
      );
    },
  },

  'pasfoto': {
    id: 'pasfoto',
    title: 'Pasfoto Studio AI',
    subtitle: 'Hapus & Ganti Latar Belakang Otomatis + Auto-Crop',
    badge: 'AI ONNX CLIENT-SIDE',
    outputFormat: 'JPG / PNG / WEBP Pasfoto Berwarna',
    formats: [
      { ext: 'JPG / JPEG', label: 'Foto Kamera / Pasfoto Digital', mime: 'image/jpeg', colorClass: 'text-purple-400 border-purple-900/60 bg-purple-950/30' },
      { ext: 'PNG', label: 'Foto Studio Kualitas Asli', mime: 'image/png', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
      { ext: 'WEBP', label: 'Foto Web Terkompresi', mime: 'image/webp', colorClass: 'text-yellow-400 border-yellow-900/60 bg-yellow-950/30' },
    ],
    acceptAttribute: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    description: 'Mendukung format gambar JPG, PNG, dan WebP. Gunakan foto portrait setengah badan menghadap ke depan untuk hasil segmentasi AI terbaik.',
    usageTips: [
      'Ganti warna latar: Merah (#D32F2F) untuk tahun kelahiran ganjil, Biru (#1976D2) untuk tahun genap, atau Putih',
      'Pilihan crop pasfoto standar: 2x3 cm, 3x4 cm, 4x6 cm, atau pertahankan rasio asli',
      'Kunci batas ukuran KB (misal target 195 KB untuk portal SSCASN BKN CPNS)',
      'AI berjalan lokal via WebAssembly tanpa mengirim wajah Anda ke server',
    ],
    maxFilesText: '1 berkas foto per proses (hasil presisi maksimal)',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return (
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/webp' ||
        COMMON_IMAGE_EXTS.includes(ext)
      );
    },
  },

  'compress-pdf': {
    id: 'compress-pdf',
    title: 'Kompres Ukuran PDF',
    subtitle: 'Kecilkan Ukuran PDF Presisi & Kunci Target KB',
    badge: 'OPTIMASI UKURAN',
    outputFormat: 'PDF Terkompresi (Tepat di Bawah Target KB)',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF Standar / Formulir', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf) semua versi. Dirancang khusus untuk mematuhi batas ukuran ketat portal instansi pemerintah seperti SSCASN CPNS, BKN, email, dan visa.',
    usageTips: [
      'Tersedia tombol pintas instan: 195 KB (BKN CPNS), 290 KB (SSCASN 300KB), dan 480 KB (Batas 500KB)',
      'Algoritma multi-pass iterative memastikan ukuran hasil tidak akan melampaui batas yang diminta',
      'Struktur teks PDF dan ketajaman dokumen tetap terjaga',
    ],
    maxFilesText: '1 berkas PDF per proses kompresi presisi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'pdf-to-docx': {
    id: 'pdf-to-docx',
    title: 'PDF ke Word (.docx)',
    subtitle: 'Ekstrak Teks & Layout PDF ke Microsoft Word',
    badge: 'OFFICE TRANSCODER',
    outputFormat: 'Microsoft Word (.docx) Siap Edit',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF Berisi Teks / Laporan', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Mengekstrak aliran teks per halaman dengan koordinat layout dan menyusunnya menjadi dokumen Microsoft Word (.docx) murni.',
    usageTips: [
      'Hasil berkas Word (.docx) dapat dibuka dan diedit di Microsoft Word, Google Docs, atau LibreOffice',
      'Tidak memerlukan koneksi internet ataupun Microsoft Office terpasang',
      'Cocok untuk PDF yang memuat teks digital (bukan foto hasil scan buram)',
    ],
    maxFilesText: '1 berkas PDF per proses konversi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'pdf-to-xlsx': {
    id: 'pdf-to-xlsx',
    title: 'PDF ke Excel (.xlsx)',
    subtitle: 'Ekstrak Tabel & Data PDF ke Spreadsheet Excel',
    badge: 'OFFICE SPREADSHEET',
    outputFormat: 'Microsoft Excel (.xlsx)',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF Berisi Tabel / Data', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Mendeteksi baris, kolom, dan angka tabel dalam PDF dan menyusunnya menjadi file Microsoft Excel (.xlsx) siap olah formula.',
    usageTips: [
      'Tiap halaman PDF dikelompokkan ke dalam sheet terpisah di dalam workbook Excel',
      'Format angka dan teks dipisahkan secara otomatis untuk memudahkan kalkulasi',
      '100% diproses di browser Anda tanpa upload data sensitif ke cloud',
    ],
    maxFilesText: '1 berkas PDF per proses konversi tabel',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'pdf-to-pptx': {
    id: 'pdf-to-pptx',
    title: 'PDF ke PowerPoint (.pptx)',
    subtitle: 'Ubah Halaman PDF Menjadi Slide Presentasi PowerPoint',
    badge: 'OFFICE PRESENTATION',
    outputFormat: 'Microsoft PowerPoint (.pptx)',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF / Slide Presentasi', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Setiap halaman dirender menjadi slide presentasi PowerPoint (.pptx) beresolusi tinggi dengan rasio layar yang disesuaikan secara otomatis.',
    usageTips: [
      'Menjaga tata letak, grafik, diagram, dan font halaman 100% identik dengan PDF asli',
      'Teks halaman otomatis disimpan ke dalam catatan presenter (speaker notes) tiap slide',
      'Bisa langsung dibuka dan dipresentasikan di Microsoft PowerPoint atau Google Slides',
    ],
    maxFilesText: '1 berkas PDF per proses konversi presentasi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'pdf-to-txt': {
    id: 'pdf-to-txt',
    title: 'Ekstrak Teks PDF ke TXT',
    subtitle: 'Ambil Teks Murni UTF-8 dari PDF',
    badge: 'TEXT EXTRACTOR',
    outputFormat: 'Berkas Teks Polos (.txt)',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF Berisi Teks', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Mengekstrak semua teks dari dokumen PDF menjadi teks murni UTF-8 untuk pengolahan data atau AI.',
    usageTips: [
      'Menghilangkan gambar dan pemformatan rumit untuk mendapatkan teks bersih',
      'Sangat ringan dan cepat selesai dalam hitungan detik',
    ],
    maxFilesText: '1 berkas PDF per proses ekstraksi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'heic-to-img': {
    id: 'heic-to-img',
    title: 'Konverter Apple HEIC',
    subtitle: 'Konversi Foto iPhone iOS (.heic / .heif) ke JPG / PNG',
    badge: 'APPLE ECOSYSTEM',
    outputFormat: 'JPG / PNG Universal atau Dokumen PDF',
    formats: [
      { ext: 'HEIC', label: 'High Efficiency Image Format (Apple)', mime: 'image/heic', colorClass: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/30' },
      { ext: 'HEIF', label: 'High Efficiency Image Container', mime: 'image/heif', colorClass: 'text-cyan-400 border-cyan-900/60 bg-cyan-950/30' },
    ],
    acceptAttribute: 'image/heic,image/heif,.heic,.heif',
    description: 'Mendukung foto berkas kamera Apple iPhone/iPad (.heic, .heif). Ubah menjadi JPG/PNG universal agar bisa dibuka di Windows, Android, dan website.',
    usageTips: [
      'Bisa mengonversi banyak foto HEIC sekaligus ke JPG atau PNG',
      'Dapat digabungkan langsung menjadi dokumen PDF',
      'Transcoding dilakukan secara lokal melalui WebAssembly decoding',
    ],
    maxFilesText: 'Mendukung multi-berkas (bisa banyak foto HEIC sekaligus)',
    isMultiFile: true,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'image/heic' || file.type === 'image/heif' || ext === 'heic' || ext === 'heif';
    },
  },

  'img-to-pdf': {
    id: 'img-to-pdf',
    title: 'Konversi Gambar ke PDF',
    subtitle: 'Satukan Banyak Foto & Scan ke Satu Berkas PDF',
    badge: 'DOKUMEN PDF',
    outputFormat: 'Berkas PDF Berurutan (.pdf)',
    formats: [
      { ext: 'JPG / JPEG', label: 'Foto Kamera / Scan Berwarna', mime: 'image/jpeg', colorClass: 'text-purple-400 border-purple-900/60 bg-purple-950/30' },
      { ext: 'PNG', label: 'Gambar Scan / Dokumen Tajam', mime: 'image/png', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
      { ext: 'WEBP', label: 'Gambar Web Ringan', mime: 'image/webp', colorClass: 'text-yellow-400 border-yellow-900/60 bg-yellow-950/30' },
      { ext: 'HEIC', label: 'Foto iPhone iOS', mime: 'image/heic', colorClass: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/30' },
    ],
    acceptAttribute: 'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif',
    description: 'Mendukung berkas gambar JPG, JPEG, PNG, WebP, dan HEIC. Susun urutan halaman secara bebas lalu jadikan dokumen PDF rapi.',
    usageTips: [
      'Pilih ukuran kertas: Pas Ukuran Asli (Fit), A4, atau US Letter',
      'Atur orientasi (Tegak/Portrait atau Mendatar/Landscape) dan margin halaman',
      'Dapat mengubah urutan posisi gambar dengan tombol atas/bawah',
    ],
    maxFilesText: 'Mendukung banyak gambar sekaligus (tanpa batasan jumlah)',
    isMultiFile: true,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return (
        file.type.startsWith('image/') ||
        ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext)
      );
    },
  },

  'pdf-to-jpg': {
    id: 'pdf-to-jpg',
    title: 'Konversi PDF ke JPG',
    subtitle: 'Ekstrak Tiap Halaman PDF Menjadi Gambar JPG',
    badge: 'EKSTRAK GAMBAR',
    outputFormat: 'Gambar JPG (atau ZIP jika multi-halaman)',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF Multi-halaman', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Setiap halaman dirender menjadi gambar JPG berkualitas tinggi dengan resolusi yang bisa Anda pilih.',
    usageTips: [
      'Pilihan resolusi: 1x Standar (72 DPI), 2x Tajam (144 DPI), 3x Cetak (300 DPI)',
      'Bisa mengekstrak halaman tertentu saja (contoh: 1, 3-5)',
      'Dokumen banyak halaman akan otomatis diunduh dalam kemasan file ZIP',
    ],
    maxFilesText: '1 berkas PDF per sesi ekstraksi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'pdf-to-png': {
    id: 'pdf-to-png',
    title: 'Konversi PDF ke PNG',
    subtitle: 'Ekstrak Tiap Halaman PDF ke PNG Tanpa Kompresi Buram',
    badge: 'LOSSLESS PNG',
    outputFormat: 'Gambar PNG Tajam (atau ZIP)',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF Teks / Grafis', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Mengekstrak halaman PDF menjadi gambar format PNG berkualitas lossless yang tajam untuk teks dan diagram.',
    usageTips: [
      'Format PNG menjaga ketajaman garis dan teks agar tidak blur',
      'Pilihan resolusi hingga 300 DPI untuk kebutuhan presentasi atau cetak',
    ],
    maxFilesText: '1 berkas PDF per sesi ekstraksi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'pdf-to-webp': {
    id: 'pdf-to-webp',
    title: 'Konversi PDF ke WebP',
    subtitle: 'Ekstrak Halaman PDF ke Format WebP Ringan',
    badge: 'WEB MODERN',
    outputFormat: 'Gambar WebP Ringan (atau ZIP)',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Menghasilkan gambar WebP yang jauh lebih ringan untuk website atau pengiriman cepat.',
    usageTips: [
      'Ukuran file WebP 30-50% lebih kecil dibanding JPG pada kualitas visual yang sama',
    ],
    maxFilesText: '1 berkas PDF per sesi ekstraksi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'img-to-webp': {
    id: 'img-to-webp',
    title: 'Kompresi Gambar ke WebP',
    subtitle: 'Ubah JPG & PNG ke WebP Efisien Ukuran Kecil',
    badge: 'OPTIMASI WEB',
    outputFormat: 'Gambar WebP (.webp)',
    formats: [
      { ext: 'JPG / JPEG', label: 'Gambar Format Standar', mime: 'image/jpeg', colorClass: 'text-purple-400 border-purple-900/60 bg-purple-950/30' },
      { ext: 'PNG', label: 'Gambar Format PNG', mime: 'image/png', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
    ],
    acceptAttribute: 'image/jpeg,image/png,.jpg,.jpeg,.png',
    description: 'Mendukung format gambar JPG, JPEG, dan PNG. Kompres gambar ke format WebP untuk mempercepat loading website tanpa mengurangi kejernihan.',
    usageTips: [
      'Atur slider kualitas WebP dari 50% hingga 100%',
      'Mendukung konversi banyak gambar sekaligus dalam antrean',
    ],
    maxFilesText: 'Mendukung banyak gambar sekaligus (batch convert)',
    isMultiFile: true,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return (
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        ['jpg', 'jpeg', 'png'].includes(ext)
      );
    },
  },

  'webp-to-img': {
    id: 'webp-to-img',
    title: 'Konversi WebP ke Gambar',
    subtitle: 'Kembalikan WebP ke Format JPG atau PNG Universal',
    badge: 'KOMPATIBILITAS',
    outputFormat: 'Gambar JPG atau PNG',
    formats: [
      { ext: 'WEBP', label: 'Berkas Gambar WebP', mime: 'image/webp', colorClass: 'text-yellow-400 border-yellow-900/60 bg-yellow-950/30' },
    ],
    acceptAttribute: 'image/webp,.webp',
    description: 'Mendukung berkas gambar WebP (.webp). Ubah kembali ke PNG atau JPG agar dapat dibuka di aplikasi desktop lama atau software yang belum mendukung WebP.',
    usageTips: [
      'Pilih output PNG untuk mempertahankan transparansi dan detail tinggi',
      'Pilih output JPG untuk ukuran file standar yang mudah dibagikan',
    ],
    maxFilesText: 'Mendukung banyak berkas WebP sekaligus',
    isMultiFile: true,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'image/webp' || ext === 'webp';
    },
  },

  'merge-pdf': {
    id: 'merge-pdf',
    title: 'Gabungkan Dokumen PDF',
    subtitle: 'Satukan Beberapa File PDF Menjadi Satu Dokumen',
    badge: 'PENGGABUNGAN DOKUMEN',
    outputFormat: 'Satu Berkas PDF Terpadu (.pdf)',
    formats: [
      { ext: 'PDF', label: 'Dua atau Lebih Berkas PDF', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung minimal 2 berkas dokumen PDF (.pdf). Gabungkan ijazah, transkrip, surat lamaran, atau berkas kontrak menjadi satu file PDF utuh.',
    usageTips: [
      'Minimal unggah 2 dokumen PDF untuk dapat digabungkan',
      'Gunakan tombol panah atas/bawah untuk menyusun urutan dokumen sebelum digabung',
      '100% cepat dan tanpa batasan jumlah halaman',
    ],
    maxFilesText: 'Minimal 2 berkas PDF (tanpa batas maksimal)',
    isMultiFile: true,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'split-pdf': {
    id: 'split-pdf',
    title: 'Pisah & Ekstrak Halaman PDF',
    subtitle: 'Pilih & Centang Halaman PDF Secara Visual',
    badge: 'ORGANISASI HALAMAN',
    outputFormat: 'Berkas PDF Baru Berisi Halaman Terpilih',
    formats: [
      { ext: 'PDF', label: 'Dokumen PDF Multi-halaman', mime: 'application/pdf', colorClass: 'text-red-400 border-red-900/60 bg-red-950/30' },
    ],
    acceptAttribute: 'application/pdf,.pdf',
    description: 'Mendukung dokumen PDF (.pdf). Menampilkan pratinjau thumbnail dari seluruh halaman secara langsung sehingga Anda dapat memilih halaman yang ingin diambil dengan satu klik.',
    usageTips: [
      'Klik halaman untuk memilih atau membatalkan pilihan',
      'Tersedia tombol aksi cepat: Pilih Semua, Kosongkan, Halaman Ganjil, atau Halaman Genap',
      'Klik ikon mata pada kartu untuk melihat pratinjau halaman ukuran penuh',
    ],
    maxFilesText: '1 berkas PDF per sesi pemisahan',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return file.type === 'application/pdf' || ext === 'pdf';
    },
  },

  'word-to-pdf': {
    id: 'word-to-pdf',
    title: 'Konversi Word ke PDF',
    subtitle: 'Ubah Dokumen Microsoft Word ke Format PDF Siap Cetak',
    badge: 'MICROSOFT WORD',
    outputFormat: 'Berkas Dokumen PDF (.pdf)',
    formats: [
      { ext: 'DOCX', label: 'Dokumen Microsoft Word Modern', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
    ],
    acceptAttribute: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Mendukung dokumen Microsoft Word (.docx). Mengonversi teks, pemformatan paragraf, dan tabel menjadi dokumen PDF siap cetak.',
    usageTips: [
      'Gunakan berkas format .docx (Microsoft Word 2007 ke atas)',
      'Jika berkas Anda masih bertipe .doc lama, simpan ulang sebagai .docx terlebih dahulu',
    ],
    maxFilesText: '1 berkas Word (.docx) per proses',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    },
  },

  'word-to-html': {
    id: 'word-to-html',
    title: 'Konversi Word ke HTML',
    subtitle: 'Ubah Dokumen Word ke Kode HTML Semantik Bersih',
    badge: 'WEB EXPORT',
    outputFormat: 'Berkas Kode HTML (.html)',
    formats: [
      { ext: 'DOCX', label: 'Dokumen Microsoft Word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
    ],
    acceptAttribute: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Mendukung dokumen Microsoft Word (.docx). Mengekspor dokumen Word ke kode HTML bersih untuk artikel website atau blog.',
    usageTips: [
      'Menghasilkan struktur HTML yang rapi dengan tag semantik standar',
    ],
    maxFilesText: '1 berkas Word (.docx) per proses',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    },
  },

  'word-to-txt': {
    id: 'word-to-txt',
    title: 'Ekstrak Teks Word ke TXT',
    subtitle: 'Ekstrak Teks Murni dari Dokumen Word',
    badge: 'TEXT MINE',
    outputFormat: 'Berkas Teks Polos (.txt)',
    formats: [
      { ext: 'DOCX', label: 'Dokumen Microsoft Word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
    ],
    acceptAttribute: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Mendukung dokumen Microsoft Word (.docx). Mengambil seluruh teks polos dari dokumen Word tanpa format visual.',
    usageTips: [
      'Sangat cepat dan berguna untuk menyalin konten ke prompt AI atau database teks',
    ],
    maxFilesText: '1 berkas Word (.docx) per proses',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    },
  },

  'excel-to-pdf': {
    id: 'excel-to-pdf',
    title: 'Konversi Excel ke PDF',
    subtitle: 'Ubah Spreadsheet Excel Menjadi Lembar Tabel PDF Rapi',
    badge: 'SPREADSHEET',
    outputFormat: 'Berkas Dokumen PDF (.pdf)',
    formats: [
      { ext: 'XLSX', label: 'Microsoft Excel Modern', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', colorClass: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/30' },
      { ext: 'XLS', label: 'Microsoft Excel Legacy', mime: 'application/vnd.ms-excel', colorClass: 'text-teal-400 border-teal-900/60 bg-teal-950/30' },
      { ext: 'CSV', label: 'Tabel Teks Comma-Separated', mime: 'text/csv', colorClass: 'text-cyan-400 border-cyan-900/60 bg-cyan-950/30' },
    ],
    acceptAttribute: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv',
    description: 'Mendukung berkas spreadsheet Excel (.xlsx, .xls) dan CSV (.csv). Mengonversi tabel data dan formula menjadi lembaran dokumen PDF rapi bergaris.',
    usageTips: [
      'Render semua lembar sheet atau data spreadsheet ke halaman PDF berurutan',
      'Garis tabel dan penataan kolom disesuaikan secara otomatis',
    ],
    maxFilesText: '1 berkas spreadsheet per sesi konversi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return (
        ['xlsx', 'xls', 'csv'].includes(ext) ||
        file.type === 'text/csv' ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel')
      );
    },
  },

  'excel-to-csv': {
    id: 'excel-to-csv',
    title: 'Konversi Excel ke CSV',
    subtitle: 'Ekspor Lembar Kerja Excel ke Format Teks Tabel CSV',
    badge: 'DATA EXPORT',
    outputFormat: 'Berkas Teks CSV (.csv)',
    formats: [
      { ext: 'XLSX', label: 'Microsoft Excel Modern', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', colorClass: 'text-emerald-400 border-emerald-900/60 bg-emerald-950/30' },
      { ext: 'XLS', label: 'Microsoft Excel Legacy', mime: 'application/vnd.ms-excel', colorClass: 'text-teal-400 border-teal-900/60 bg-teal-950/30' },
    ],
    acceptAttribute: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    description: 'Mendukung berkas Microsoft Excel (.xlsx, .xls). Mengekspor data spreadsheet menjadi berkas teks CSV standar yang mudah diimpor ke sistem database.',
    usageTips: [
      'Format CSV universal dapat dibuka di semua bahasa pemrograman dan platform analitik',
    ],
    maxFilesText: '1 berkas Excel per sesi ekspor',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ['xlsx', 'xls'].includes(ext) || file.type.includes('spreadsheet') || file.type.includes('excel');
    },
  },

  'csv-to-excel': {
    id: 'csv-to-excel',
    title: 'Konversi CSV ke Excel (.xlsx)',
    subtitle: 'Ubah Berkas Teks Tabel CSV Menjadi Spreadsheet Excel',
    badge: 'DATA TO SHEET',
    outputFormat: 'Berkas Microsoft Excel (.xlsx)',
    formats: [
      { ext: 'CSV', label: 'Berkas Teks Comma Separated', mime: 'text/csv', colorClass: 'text-cyan-400 border-cyan-900/60 bg-cyan-950/30' },
    ],
    acceptAttribute: '.csv,text/csv',
    description: 'Mendukung berkas data teks tabel CSV (.csv). Mengubahnya menjadi dokumen spreadsheet Excel modern (.xlsx) siap diolah formula dan grafik.',
    usageTips: [
      'Memformat kolom dan baris data secara otomatis tanpa error encoding koma/titik-koma',
    ],
    maxFilesText: '1 berkas CSV per sesi konversi',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ext === 'csv' || file.type === 'text/csv';
    },
  },

  'pptx-to-pdf': {
    id: 'pptx-to-pdf',
    title: 'Konversi PowerPoint ke PDF',
    subtitle: 'Ekstrak Slide Presentasi PowerPoint Menjadi Lembar PDF',
    badge: 'PRESENTASI PPT',
    outputFormat: 'Berkas Dokumen PDF (.pdf)',
    formats: [
      { ext: 'PPTX', label: 'Microsoft PowerPoint Modern', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', colorClass: 'text-orange-400 border-orange-900/60 bg-orange-950/30' },
    ],
    acceptAttribute: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    description: 'Mendukung presentasi Microsoft PowerPoint (.pptx). Mengubah slide demi slide menjadi lembaran dokumen PDF siap dibagikan.',
    usageTips: [
      'Gunakan format presentasi .pptx (Microsoft PowerPoint 2007 ke atas)',
      'Slide presentasi akan disusun secara urut di dalam dokumen PDF hasil',
    ],
    maxFilesText: '1 berkas PowerPoint (.pptx) per proses',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ext === 'pptx' || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    },
  },

  'office-media': {
    id: 'office-media',
    title: 'Ekstrak Media & Gambar Dokumen',
    subtitle: 'Ambil Semua Foto & Gambar dari Dalam Word / PowerPoint',
    badge: 'ASSET EXTRACTOR',
    outputFormat: 'Arsip ZIP Berisi Semua Gambar Asli',
    formats: [
      { ext: 'DOCX', label: 'Dokumen Microsoft Word', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', colorClass: 'text-blue-400 border-blue-900/60 bg-blue-950/30' },
      { ext: 'PPTX', label: 'Presentasi Microsoft PowerPoint', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', colorClass: 'text-orange-400 border-orange-900/60 bg-orange-950/30' },
    ],
    acceptAttribute: '.docx,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    description: 'Mendukung berkas Microsoft Word (.docx) dan PowerPoint (.pptx). Mengekstrak semua gambar, diagram, dan foto asli yang tertanam di dalam dokumen tanpa penurunan kualitas.',
    usageTips: [
      'Mengambil gambar resolusi asli yang tertanam di dalam dokumen',
      'Hasil seluruh gambar dikemas ke dalam 1 berkas ZIP siap unduh',
    ],
    maxFilesText: '1 berkas dokumen per sesi ekstraksi media',
    isMultiFile: false,
    isValidFile: (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ['docx', 'pptx'].includes(ext);
    },
  },

  'vault': {
    id: 'vault',
    title: 'Riwayat Konversi',
    subtitle: 'Brankas Penyimpanan Hasil Konversi di Browser',
    badge: 'INDEXEDDB LOKAL',
    outputFormat: 'Berkas Unduhan',
    formats: [
      { ext: 'SEMUA FORMAT', label: 'Berkas Hasil Konversi Anda', mime: '*/*', colorClass: 'text-accent-solid border-accent-solid/40 bg-accent-solid/10' },
    ],
    acceptAttribute: '',
    description: 'Menyimpan riwayat berkas hasil konversi Anda secara lokal di dalam memori IndexedDB browser Anda. 100% offline dan privat.',
    usageTips: [
      'Unduh ulang berkas hasil konversi kapan saja tanpa perlu konversi ulang',
      'Pin berkas favorit agar tidak terhapus saat pembersihan otomatis',
      'Atur kapasitas memori penyimpanan lokal sesuai keinginan Anda',
    ],
    maxFilesText: 'Sesuai kapasitas kuota memori browser Anda',
    isMultiFile: false,
    isValidFile: () => true,
  },
};

/**
 * Get metadata for a specific tool
 */
export function getToolMetadata(tool: ToolType): ToolMetadata {
  return TOOL_METADATA_MAP[tool] || TOOL_METADATA_MAP['smart'];
}

/**
 * Filter files based on tool requirements
 */
export function filterFilesForTool(files: File[], tool: ToolType): { valid: File[]; rejected: File[] } {
  const meta = getToolMetadata(tool);
  const valid: File[] = [];
  const rejected: File[] = [];

  for (const f of files) {
    if (meta.isValidFile(f)) {
      valid.push(f);
    } else {
      rejected.push(f);
    }
  }

  return { valid, rejected };
}

/**
 * Generate human-readable rejection explanation
 */
export function getFormatRejectionMessage(rejectedFiles: File[], tool: ToolType): string {
  const meta = getToolMetadata(tool);
  const names = rejectedFiles.map(f => `"${f.name}"`).slice(0, 3).join(', ') +
    (rejectedFiles.length > 3 ? ` dan ${rejectedFiles.length - 3} berkas lainnya` : '');
  const acceptedList = meta.formats.map(f => f.ext).join(', ');

  return `Berkas ${names} tidak didukung untuk ${meta.title}. Format yang didukung: ${acceptedList}.`;
}
