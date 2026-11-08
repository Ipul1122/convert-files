-- ====================================================================
-- LOCALVAULT CONVERTER - SUPABASE DATABASE SETUP & LICENSE SCHEMA
-- ====================================================================
-- Petunjuk:
-- 1. Buka Supabase Dashboard Anda (https://supabase.com/dashboard)
-- 2. Masuk ke project Anda -> Klik menu "SQL Editor" di sidebar kiri
-- 3. Paste seluruh isi script ini, lalu klik "RUN"
-- ====================================================================

-- 1. TABEL UTAMA: license_codes (Menyimpan daftar voucher / lisensi)
CREATE TABLE IF NOT EXISTS license_codes (
    code VARCHAR(24) PRIMARY KEY,        -- Format: 'LV-XXXX-XXXX'
    status VARCHAR(15) DEFAULT 'UNUSED', -- 'UNUSED', 'ACTIVE', 'BLOCKED'
    max_devices INT DEFAULT 2,           -- Batas maksimal perangkat (default: 2)
    device_count INT DEFAULT 0,          -- Jumlah perangkat yang sudah mengaktifkan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE
);

-- 2. TABEL PERANGKAT: license_devices (Mencatat perangkat pembeli - Anti Sharing)
CREATE TABLE IF NOT EXISTS license_devices (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(24) REFERENCES license_codes(code) ON DELETE CASCADE,
    device_fingerprint VARCHAR(64) NOT NULL, -- SHA-256 sidik jari hardware
    device_name VARCHAR(60),                 -- Contoh: "Windows (Chrome)"
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat index untuk pencarian instan
CREATE INDEX IF NOT EXISTS idx_license_devices_code ON license_devices(code);
CREATE INDEX IF NOT EXISTS idx_license_devices_fp ON license_devices(device_fingerprint);

-- 3. FUNGSI RPC SERVER-SIDE: activate_license (Aman dari manipulasi client)
CREATE OR REPLACE FUNCTION activate_license(
    p_code TEXT,
    p_device_fingerprint TEXT,
    p_device_name TEXT DEFAULT 'Perangkat Tidak Dikenal'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Berjalan dengan hak akses database internal, aman dari intipan publik
AS $$
DECLARE
    v_clean_code TEXT;
    v_license RECORD;
    v_existing_device RECORD;
    v_current_devices INT;
BEGIN
    -- Rapikan format kode (hilangkan spasi, ubah ke huruf kapital)
    v_clean_code := UPPER(TRIM(p_code));

    -- Cari kode di tabel
    SELECT * INTO v_license FROM license_codes WHERE code = v_clean_code;

    -- Skenario 1: Kode tidak terdaftar
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Kode lisensi tidak ditemukan. Pastikan Anda memasukkan kode dengan benar.'
        );
    END IF;

    -- Skenario 2: Kode diblokir / dibatalkan
    IF v_license.status = 'BLOCKED' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Kode lisensi ini telah dinonaktifkan.'
        );
    END IF;

    -- Skenario 3: Cek apakah perangkat ini SUDAH PERNAH terdaftar untuk kode ini
    SELECT * INTO v_existing_device 
    FROM license_devices 
    WHERE code = v_clean_code AND device_fingerprint = p_device_fingerprint;

    IF FOUND THEN
        -- Perangkat yang sama membuka kembali -> langsung izinkan (re-login aman)
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Lisensi aktif di perangkat ini.',
            'device_count', v_license.device_count,
            'max_devices', v_license.max_devices
        );
    END IF;

    -- Skenario 4: Hitung jumlah perangkat yang sudah terdaftar
    SELECT COUNT(*) INTO v_current_devices FROM license_devices WHERE code = v_clean_code;

    -- Jika jatah perangkat sudah habis (>= max_devices) -> TOLAK! (Anti-sharing)
    IF v_current_devices >= v_license.max_devices THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Kode lisensi ini sudah aktif di ' || v_license.max_devices || ' perangkat lain. Berbagi kode tidak diizinkan.'
        );
    END IF;

    -- Skenario 5: Jatah masih ada -> Daftarkan perangkat baru
    INSERT INTO license_devices (code, device_fingerprint, device_name)
    VALUES (v_clean_code, p_device_fingerprint, p_device_name);

    -- Perbarui status tabel license_codes
    UPDATE license_codes 
    SET 
        status = 'ACTIVE',
        device_count = v_current_devices + 1,
        activated_at = COALESCE(activated_at, NOW())
    WHERE code = v_clean_code;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Aktivasi berhasil! Akses VIP Seumur Hidup kini aktif di perangkat ini.',
        'device_count', v_current_devices + 1,
        'max_devices', v_license.max_devices
    );
END;
$$;

-- 4. KEAMANAN RLS (Row Level Security): Kunci tabel dari akses langsung publik
ALTER TABLE license_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_devices ENABLE ROW LEVEL SECURITY;

-- Berikan izin akses publik (anon) HANYA untuk menjalankan RPC fungsi activate_license
GRANT EXECUTE ON FUNCTION activate_license(TEXT, TEXT, TEXT) TO anon, authenticated;


-- ====================================================================
-- 5. BATCH CODE GENERATOR (OPSIONAL: Jalankan kapan pun butuh kode baru)
-- ====================================================================
-- Contoh: Membuat 100 Kode Lisensi Acak Berformat LV-XXXX-XXXX
-- Setiap kode bisa dipakai di maksimal 2 perangkat (Laptop + HP)
-- ====================================================================
INSERT INTO license_codes (code, status, max_devices)
SELECT 
    'LV-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 5, 4)),
    'UNUSED',
    2
FROM generate_series(1, 100)
ON CONFLICT (code) DO NOTHING;

-- Periksa hasil kode yang baru dibuat
SELECT code, status, max_devices, created_at FROM license_codes WHERE status = 'UNUSED' LIMIT 20;

