import type { LicenseInfo, LicenseActivationResult } from '../types';

const STORAGE_VIP_TOKEN = 'localvault_vip_token_v1';
const STORAGE_DAILY_USAGE = 'localvault_daily_usage_v1';
const STORAGE_DEVICE_SEED = 'localvault_device_seed_v1';
const DEFAULT_DAILY_QUOTA = 5;

/**
 * Generate a persistent hardware-anchored device fingerprint (SHA-256)
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    // 1. Persistent seed stored in localStorage
    let seed = localStorage.getItem(STORAGE_DEVICE_SEED);
    if (!seed) {
      const randomBytes = new Uint8Array(16);
      crypto.getRandomValues(randomBytes);
      seed = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(STORAGE_DEVICE_SEED, seed);
    }

    // 2. Hardware specs: WebGL Renderer & Vendor
    let glInfo = 'no-gl';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
          const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
          glInfo = `${vendor}::${renderer}`;
        }
      }
    } catch {
      // Fallback
    }

    // 3. Platform & Screen components
    const platform =
      // @ts-expect-error userAgentData may exist on modern Chromium
      navigator.userAgentData?.platform || navigator.platform || 'unknown-platform';
    const screenSpec = `${screen.width}x${screen.height}x${screen.colorDepth || 24}`;
    const cores = navigator.hardwareConcurrency || 4;
    const lang = navigator.language || 'id';

    const rawString = `${seed}|${glInfo}|${platform}|${screenSpec}|${cores}|${lang}`;

    // 4. Hash using browser native Web Crypto API (SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Gagal membuat hardware fingerprint, fallback ke UUID:', err);
    return 'fp-' + (localStorage.getItem(STORAGE_DEVICE_SEED) || 'device-default');
  }
}

/**
 * Retrieve current user license and daily quota status
 */
export function getLicenseInfo(): LicenseInfo {
  // Check VIP Token
  try {
    const rawToken = localStorage.getItem(STORAGE_VIP_TOKEN);
    if (rawToken) {
      const parsed = JSON.parse(rawToken);
      if (parsed && parsed.isVip && parsed.code) {
        return {
          isVip: true,
          code: parsed.code,
          activatedAt: parsed.activatedAt,
          deviceFingerprint: parsed.deviceFingerprint,
          deviceCount: parsed.deviceCount || 1,
          maxDevices: parsed.maxDevices || 2,
          dailyQuotaRemaining: 999999,
          dailyQuotaTotal: 999999,
        };
      }
    }
  } catch {
    // Corrupted token, treat as free
  }

  // Free Tier Daily Quota Counter
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  let usedToday = 0;

  try {
    const rawUsage = localStorage.getItem(STORAGE_DAILY_USAGE);
    if (rawUsage) {
      const parsed = JSON.parse(rawUsage);
      if (parsed && parsed.date === today && typeof parsed.count === 'number') {
        usedToday = parsed.count;
      }
    }
  } catch {
    usedToday = 0;
  }

  const remaining = Math.max(0, DEFAULT_DAILY_QUOTA - usedToday);

  return {
    isVip: false,
    dailyQuotaRemaining: remaining,
    dailyQuotaTotal: DEFAULT_DAILY_QUOTA,
  };
}

/**
 * Consume 1 quota for conversion. Returns true if allowed, false if quota exhausted.
 */
export function consumeConversionQuota(): boolean {
  const current = getLicenseInfo();
  if (current.isVip) {
    return true; // VIP has unlimited access
  }

  if (current.dailyQuotaRemaining <= 0) {
    return false; // Quota exhausted
  }

  const today = new Date().toISOString().slice(0, 10);
  const usedToday = DEFAULT_DAILY_QUOTA - current.dailyQuotaRemaining + 1;

  try {
    localStorage.setItem(
      STORAGE_DAILY_USAGE,
      JSON.stringify({
        date: today,
        count: usedToday,
      })
    );
  } catch {
    // Storage quota warning
  }

  return true;
}

/**
 * Activate a license code against Supabase RPC
 */
export async function activateLicenseWithSupabase(
  inputCode: string
): Promise<LicenseActivationResult> {
  const cleanCode = inputCode.trim().toUpperCase();

  if (!cleanCode) {
    return {
      success: false,
      message: 'Silakan masukkan kode lisensi yang valid.',
    };
  }

  // Developer / Local testing demo key
  if (cleanCode === 'LV-DEMO-2026') {
    const fingerprint = await getDeviceFingerprint();
    const token = {
      isVip: true,
      code: cleanCode,
      deviceFingerprint: fingerprint,
      activatedAt: Date.now(),
      deviceCount: 1,
      maxDevices: 2,
    };
    localStorage.setItem(STORAGE_VIP_TOKEN, JSON.stringify(token));
    return {
      success: true,
      message: 'Kode Demo Developer berhasil diaktifkan! Akses VIP aktif.',
      deviceCount: 1,
      maxDevices: 2,
    };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      message:
        'Konfigurasi Supabase (VITE_SUPABASE_URL) belum diisi pada berkas .env. Untuk pengujian lokal gunakan kode demo: LV-DEMO-2026',
    };
  }

  try {
    const fingerprint = await getDeviceFingerprint();
    const isWindows = navigator.platform.includes('Win');
    const isMac = navigator.platform.includes('Mac');
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const platformLabel = isWindows
      ? 'Windows'
      : isMac
        ? 'macOS'
        : isMobile
          ? 'Smartphone'
          : 'Perangkat Desktop';
    const browserLabel = navigator.userAgent.includes('Edg')
      ? 'Edge'
      : navigator.userAgent.includes('Chrome')
        ? 'Chrome'
        : 'Browser';
    const deviceName = `${platformLabel} (${browserLabel})`;

    // Native lightweight fetch to Supabase RPC endpoint (0 KB added bundle size)
    const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/activate_license`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_code: cleanCode,
        p_device_fingerprint: fingerprint,
        p_device_name: deviceName,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase RPC Error:', errText);
      return {
        success: false,
        message: 'Gagal menghubungi server validasi. Pastikan koneksi internet aktif.',
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Kode lisensi tidak valid atau sudah mencapai batas perangkat.',
      };
    }

    // Success: store persistent local VIP token
    const token = {
      isVip: true,
      code: cleanCode,
      deviceFingerprint: fingerprint,
      activatedAt: Date.now(),
      deviceCount: data.device_count || 1,
      maxDevices: data.max_devices || 2,
    };
    localStorage.setItem(STORAGE_VIP_TOKEN, JSON.stringify(token));

    return {
      success: true,
      message: data.message || 'Selamat! Akses VIP Seumur Hidup berhasil diaktifkan.',
      deviceCount: data.device_count || 1,
      maxDevices: data.max_devices || 2,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      message: `Terjadi kendala saat aktivasi: ${error.message || 'Koneksi gagal'}`,
    };
  }
}

/**
 * Reset / revoke local VIP status (e.g. for testing or transfer)
 */
export function removeLocalLicense(): void {
  localStorage.removeItem(STORAGE_VIP_TOKEN);
}

/**
 * Get the payment / purchase link (Lynk.id / Mayar / custom)
 */
export function getPurchaseUrl(): string {
  return (
    import.meta.env.VITE_PURCHASE_URL ||
    'https://lynk.id/' // Replace with actual Lynk.id / Mayar link
  );
}

