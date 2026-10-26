/**
 * Google Drive Service
 * Menghubungkan Google Picker API & Google Identity Services (GIS)
 * Mengunduh berkas langsung ke peramban (client-side) tanpa melalui backend pihak ketiga.
 */

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

let isGapiLoaded = false;
let isGisLoaded = false;
let tokenClient: any = null;
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export const isGoogleDriveConfigured = (): boolean => {
  return Boolean(CLIENT_ID && API_KEY && CLIENT_ID.trim() !== '' && API_KEY.trim() !== '');
};

/**
 * Memuat skrip gapi & gis secara dinamis hanya saat dibutuhkan
 */
export const loadGoogleLibraries = async (): Promise<void> => {
  if (!navigator.onLine) {
    throw new Error('Koneksi internet diperlukan untuk menghubungkan ke Google Drive.');
  }

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Gagal memuat pustaka Google dari ${src}`));
      document.body.appendChild(script);
    });
  };

  const promises: Promise<void>[] = [];

  if (!isGapiLoaded) {
    promises.push(
      loadScript('https://apis.google.com/js/api.js').then(() => {
        return new Promise<void>((res, rej) => {
          if (!window.gapi) {
            rej(new Error('Pustaka Google API (gapi) gagal diinisialisasi'));
            return;
          }
          window.gapi.load('picker', () => {
            isGapiLoaded = true;
            res();
          });
        });
      })
    );
  }

  if (!isGisLoaded) {
    promises.push(
      loadScript('https://accounts.google.com/gsi/client').then(() => {
        if (!window.google?.accounts?.oauth2) {
          throw new Error('Google Identity Services gagal diinisialisasi');
        }
        isGisLoaded = true;
      })
    );
  }

  await Promise.all(promises);
};

/**
 * Mendapatkan token akses OAuth 2.0 menggunakan Google Identity Services
 */
const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
      resolve(cachedAccessToken);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services belum siap'));
      return;
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(`Akses Google Drive ditolak: ${tokenResponse.error_description || tokenResponse.error}`));
          return;
        }
        cachedAccessToken = tokenResponse.access_token;
        const expiresInSec = Number(tokenResponse.expires_in) || 3600;
        tokenExpiresAt = Date.now() + expiresInSec * 1000;
        resolve(tokenResponse.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: '' });
  });
};

export interface GoogleDrivePickerOptions {
  onProgressMessage?: (msg: string) => void;
  allowedMimeTypes?: string;
}

/**
 * Membuka Google Picker Modal dan mengembalikan array berkas File standar
 */
export const openGoogleDrivePicker = async (
  options?: GoogleDrivePickerOptions
): Promise<File[]> => {
  if (!isGoogleDriveConfigured()) {
    throw new Error('Google Client ID atau API Key belum diisi di file .env');
  }

  if (!navigator.onLine) {
    throw new Error('Koneksi internet diperlukan untuk mengakses Google Drive.');
  }

  options?.onProgressMessage?.('Menyiapkan Google Drive Picker...');
  await loadGoogleLibraries();

  options?.onProgressMessage?.('Memverifikasi akun Google...');
  const accessToken = await getAccessToken();

  return new Promise((resolve, reject) => {
    try {
      const pickerCallback = async (data: any) => {
        const action = data[window.google.picker.Response.ACTION];

        if (action === window.google.picker.Action.CANCEL) {
          resolve([]);
          return;
        }

        if (action === window.google.picker.Action.PICKED) {
          const documents = data[window.google.picker.Response.DOCUMENTS] || [];
          if (documents.length === 0) {
            resolve([]);
            return;
          }

          options?.onProgressMessage?.(`Mengunduh ${documents.length} berkas dari Google Drive...`);

          try {
            const downloadedFiles: File[] = [];

            for (let i = 0; i < documents.length; i++) {
              const doc = documents[i];
              const fileId = doc.id;
              let fileName = doc.name || `gdrive_file_${fileId}`;
              let mimeType = doc.mimeType || 'application/octet-stream';

              options?.onProgressMessage?.(`Mengunduh (${i + 1}/${documents.length}): ${fileName}...`);

              let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
              let isExport = false;

              // Tangani format dokumen asli Google Workspace (Docs, Sheets, Slides)
              if (mimeType === 'application/vnd.google-apps.document') {
                downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
                fileName = fileName.replace(/\.[^/.]+$/, '') + '.pdf';
                mimeType = 'application/pdf';
                isExport = true;
              } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
                downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
                fileName = fileName.replace(/\.[^/.]+$/, '') + '.xlsx';
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                isExport = true;
              } else if (mimeType === 'application/vnd.google-apps.presentation') {
                downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
                fileName = fileName.replace(/\.[^/.]+$/, '') + '.pdf';
                mimeType = 'application/pdf';
                isExport = true;
              }

              const response = await fetch(downloadUrl, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!response.ok) {
                throw new Error(
                  `Gagal mengunduh "${doc.name}" dari Google Drive (Status: ${response.status} ${response.statusText})`
                );
              }

              const blob = await response.blob();
              const downloadedFile = new File([blob], fileName, {
                type: isExport ? mimeType : blob.type || mimeType,
                lastModified: Date.now(),
              });

              downloadedFiles.push(downloadedFile);
            }

            resolve(downloadedFiles);
          } catch (err: any) {
            reject(new Error(err?.message || 'Gagal mengunduh berkas dari Google Drive.'));
          }
        }
      };

      // Siapkan view picker
      const docsView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const appId = CLIENT_ID.split('-')[0];

      const pickerBuilder = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .enableFeature(window.google.picker.Feature.SUPPORT_DRIVES)
        .setAppId(appId)
        .setOAuthToken(accessToken)
        .addView(docsView)
        .addView(window.google.picker.ViewId.DOCS_IMAGES)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .setTitle('Pilih Berkas dari Google Drive');

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    } catch (err: any) {
      reject(new Error(err?.message || 'Gagal membuka Google Drive Picker'));
    }
  });
};
