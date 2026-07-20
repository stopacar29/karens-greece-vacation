import { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';

type ImageItem = { url: string };

function apiBase(): string {
  return '';
}

// Netlify Functions reject request bodies over ~6MB (and base64 encoding
// inflates them), so anything bigger than this gets resized before upload.
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const DIRECTLY_SUPPORTED = /^image\/(jpeg|png|gif|webp)$/i;

async function decodeImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Fall back to an <img> element (handles formats createImageBitmap won't)
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('unreadable'));
      };
      img.src = url;
    });
  }
}

/**
 * Returns a blob safe to upload. Photos that are already small enough and in
 * a supported format pass through untouched; everything else (large photos,
 * HEIC from iPhones, etc.) is downscaled and re-encoded as JPEG.
 */
async function prepareForUpload(file: File): Promise<{ blob: Blob; name: string }> {
  if (DIRECTLY_SUPPORTED.test(file.type) && file.size <= MAX_UPLOAD_BYTES) {
    return { blob: file, name: file.name };
  }
  let source: HTMLImageElement | ImageBitmap;
  try {
    source = await decodeImage(file);
  } catch {
    throw new Error(`"${file.name}" isn't a photo format this browser can read.`);
  }
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
  if (!width || !height) throw new Error(`"${file.name}" couldn't be read as a photo.`);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process the photo in this browser.');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ('close' in source) source.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error(`"${file.name}" couldn't be converted for upload.`);
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return { blob, name };
}

function filenameFromUrl(url: string, index: number): string {
  const last = url.split('/').pop() || '';
  const ext = (last.split('.').pop() || 'jpg').toLowerCase();
  return `greece-photo-${index + 1}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function fullSrc(url: string): string {
  return url.startsWith('http') ? url : `${apiBase()}${url}`;
}

export default function FamilyGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/api/gallery`);
      if (!res.ok) throw new Error('Failed to load gallery');
      const data = await res.json();
      setImages(Array.isArray(data.images) ? data.images : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load photos');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Close the full-size viewer with the Escape key.
  useEffect(() => {
    if (!viewerUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerUrl]);

  const uploadOne = async (file: File): Promise<string> => {
    const { blob, name } = await prepareForUpload(file);
    const form = new FormData();
    form.append('photo', blob, name);
    const res = await fetch(`${apiBase()}/api/gallery/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `"${file.name}" failed to upload.`);
    }
    const data = await res.json();
    if (!data.url) throw new Error(`"${file.name}" failed to upload.`);
    return data.url as string;
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    const failures: string[] = [];
    let done = 0;
    for (const file of files) {
      setUploadProgress(files.length > 1 ? `Uploading photo ${done + 1} of ${files.length}…` : 'Uploading…');
      try {
        const url = await uploadOne(file);
        setImages((prev) => [{ url }, ...prev]);
      } catch (err) {
        failures.push(err instanceof Error ? err.message : `"${file.name}" failed to upload.`);
      }
      done += 1;
    }
    setUploading(false);
    setUploadProgress('');
    const uploaded = files.length - failures.length;
    if (failures.length > 0) {
      setError(
        (uploaded > 0 ? `${uploaded} photo${uploaded === 1 ? '' : 's'} uploaded, but some failed: ` : '') +
          failures.join(' ')
      );
    } else if (uploaded > 1) {
      setNotice(`${uploaded} photos uploaded.`);
    }
  };

  const toggleSelected = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const downloadUrls = async (urls: string[]) => {
    if (urls.length === 0) return;
    setDownloading(true);
    setError(null);
    setNotice(null);
    try {
      if (urls.length === 1) {
        setDownloadProgress('Downloading photo…');
        const res = await fetch(fullSrc(urls[0]));
        if (!res.ok) throw new Error('Could not download the photo.');
        triggerDownload(await res.blob(), filenameFromUrl(urls[0], 0));
      } else {
        const zip = new JSZip();
        for (let i = 0; i < urls.length; i++) {
          setDownloadProgress(`Preparing photo ${i + 1} of ${urls.length}…`);
          const res = await fetch(fullSrc(urls[i]));
          if (!res.ok) throw new Error(`Could not download photo ${i + 1}.`);
          zip.file(filenameFromUrl(urls[i], i), await res.blob());
        }
        setDownloadProgress('Creating zip file…');
        const blob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(blob, 'greece-trip-photos.zip');
      }
      setSelectMode(false);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  // Deletes only the specific photos the user picked, after an explicit
  // confirmation — never a bulk wipe (see .cursor/rules/preserve-trip-data.mdc).
  const deleteUrls = async (urls: string[]) => {
    if (urls.length === 0) return;
    const message =
      urls.length === 1
        ? 'Delete this photo for everyone? This cannot be undone.'
        : `Delete these ${urls.length} photos for everyone? This cannot be undone.`;
    if (!window.confirm(message)) return;
    setDeleting(true);
    setError(null);
    setNotice(null);
    const failed: string[] = [];
    for (const url of urls) {
      try {
        const res = await fetch(fullSrc(url), { method: 'DELETE' });
        if (!res.ok) throw new Error();
        setImages((prev) => prev.filter((img) => img.url !== url));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
        if (viewerUrl === url) setViewerUrl(null);
      } catch {
        failed.push(url);
      }
    }
    setDeleting(false);
    if (failed.length > 0) {
      setError(`${failed.length} photo${failed.length === 1 ? '' : 's'} could not be deleted. Please try again.`);
    } else {
      setNotice(urls.length === 1 ? 'Photo deleted.' : `${urls.length} photos deleted.`);
      setSelectMode(false);
      setSelected(new Set());
    }
  };

  const busy = uploading || downloading || deleting;

  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Family Gallery</h2>
        <p className="hint">
          Share your trip memories here. Upload your photos below—everyone with this link can add and view them.
          You can pick several photos at once, and large photos are automatically resized so they upload reliably.
          Tap any photo to see it full size.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <label style={{ display: 'inline-block' }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFiles}
              disabled={busy}
              style={{ display: 'none' }}
            />
            <span
              className="btn btnPrimary"
              style={{ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}
            >
              {uploading ? uploadProgress || 'Uploading…' : 'Choose photos to upload'}
            </span>
          </label>
          {images.length > 0 && (
            <>
              <button
                className="btn btnSecondary"
                disabled={busy}
                style={{ marginLeft: 0, cursor: busy ? 'wait' : 'pointer' }}
                onClick={() => downloadUrls(images.map((img) => img.url))}
              >
                {downloading ? downloadProgress || 'Downloading…' : `Download all (${images.length})`}
              </button>
              {!selectMode ? (
                <button
                  className="btn btnSecondary"
                  disabled={busy}
                  style={{ marginLeft: 0 }}
                  onClick={() => {
                    setSelectMode(true);
                    setSelected(new Set());
                  }}
                >
                  Select photos…
                </button>
              ) : (
                <>
                  <button
                    className="btn btnSecondary"
                    disabled={busy || selected.size === 0}
                    style={{ marginLeft: 0, opacity: selected.size === 0 ? 0.6 : 1 }}
                    onClick={() => downloadUrls(images.map((img) => img.url).filter((u) => selected.has(u)))}
                  >
                    Download selected ({selected.size})
                  </button>
                  <button
                    className="btn"
                    disabled={busy || selected.size === 0}
                    style={{
                      marginLeft: 0,
                      background: '#b3402e',
                      color: '#fff',
                      opacity: selected.size === 0 ? 0.6 : 1,
                    }}
                    onClick={() => deleteUrls(images.map((img) => img.url).filter((u) => selected.has(u)))}
                  >
                    {deleting ? 'Deleting…' : `Delete selected (${selected.size})`}
                  </button>
                  <button
                    className="btn btnSecondary"
                    disabled={busy}
                    style={{ marginLeft: 0 }}
                    onClick={() => {
                      setSelectMode(false);
                      setSelected(new Set());
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
        </div>
        {selectMode && (
          <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
            Tap photos below to select them, then press “Download selected” or “Delete selected”.
          </p>
        )}
        {error && <p style={{ color: '#a00', marginTop: 12, fontSize: 14 }}>{error}</p>}
        {notice && <p style={{ color: '#1b5e20', marginTop: 12, fontSize: 14 }}>{notice}</p>}
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#1a4d6d' }}>Photos</h3>
        {loading ? (
          <p style={{ color: '#5c5c5c' }}>Loading…</p>
        ) : images.length === 0 ? (
          <p style={{ color: '#5c5c5c' }}>No photos yet. Upload one above!</p>
        ) : (
          // Masonry-style columns: photos keep their natural shape, so
          // nothing gets cropped out of the frame.
          <div style={{ columns: '3 200px', columnGap: 12 }}>
            {images.map((img, i) => {
              const isSelected = selected.has(img.url);
              return (
                <div
                  key={img.url + i}
                  onClick={() => (selectMode ? toggleSelected(img.url) : setViewerUrl(img.url))}
                  style={{
                    breakInside: 'avoid',
                    marginBottom: 12,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#eee',
                    position: 'relative',
                    cursor: 'pointer',
                    outline: isSelected ? '3px solid #1a4d6d' : 'none',
                    outlineOffset: -3,
                  }}
                >
                  <img
                    src={fullSrc(img.url)}
                    alt=""
                    style={{
                      width: '100%',
                      display: 'block',
                      opacity: selectMode && !isSelected ? 0.75 : 1,
                    }}
                    loading="lazy"
                  />
                  {selectMode && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: isSelected ? '#1a4d6d' : 'rgba(255,255,255,0.85)',
                        border: '2px solid #1a4d6d',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewerUrl && (
        <div
          onClick={() => setViewerUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            gap: 14,
          }}
        >
          <img
            src={fullSrc(viewerUrl)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100% - 80px)',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btnSecondary" style={{ marginLeft: 0 }} disabled={busy} onClick={() => downloadUrls([viewerUrl])}>
              {downloading ? 'Downloading…' : 'Download'}
            </button>
            <button
              className="btn"
              style={{ background: '#b3402e', color: '#fff' }}
              disabled={busy}
              onClick={() => deleteUrls([viewerUrl])}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button className="btn btnSecondary" style={{ marginLeft: 0 }} onClick={() => setViewerUrl(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
