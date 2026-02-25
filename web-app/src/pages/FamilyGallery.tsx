import { useState, useEffect, useCallback } from 'react';

type ImageItem = { url: string };

function apiBase(): string {
  return '';
}

export default function FamilyGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${apiBase()}/api/gallery/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      if (data.url) {
        setImages((prev) => [{ url: data.url }, ...prev]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="card">
        <h2 className="sectionLabel">Family Gallery</h2>
        <p className="hint">
          Share your trip memories here. Upload your photos below—everyone with this link can add and view them.
        </p>
        <label style={{ display: 'inline-block', marginTop: 12 }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={onFile}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <span className="btn btnSecondary" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? 'Uploading…' : 'Choose photo to upload'}
          </span>
        </label>
        {error && (
          <p style={{ color: '#a00', marginTop: 12, fontSize: 14 }}>{error}</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#1a4d6d' }}>Photos</h3>
        {loading ? (
          <p style={{ color: '#5c5c5c' }}>Loading…</p>
        ) : images.length === 0 ? (
          <p style={{ color: '#5c5c5c' }}>No photos yet. Upload one above!</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {images.map((img, i) => (
              <div
                key={img.url + i}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#eee',
                }}
              >
                <img
                  src={img.url.startsWith('http') ? img.url : `${apiBase()}${img.url}`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
