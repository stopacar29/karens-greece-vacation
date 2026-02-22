import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Spacing } from '@/constants/Theme';
import { PDF_PARSER_URL } from '@/constants/config';
import { useTrip } from '@/context/TripContext';
import type { TripData } from '@/types/trip';
import { parseImportedText } from '@/utils/parseImportedText';

const PDF_SERVER_STORAGE_KEY = 'pdfParserUrl';

// Allow any file type; we handle PDF, images, and text in pickAndImport
const PICKER_TYPE = '*/*';

async function parsePdfViaServer(
  baseUrl: string,
  pdfBase64: string,
  fileName: string
): Promise<Partial<TripData> | null> {
  const url = `${baseUrl.replace(/\/$/, '')}/parse`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64, fileName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'PDF parser request failed');
  }
  const parsed = (await res.json()) as Partial<TripData>;
  return parsed;
}

async function parseImageViaServer(
  baseUrl: string,
  imageBase64: string,
  mimeType: string
): Promise<Partial<TripData> | null> {
  const url = `${baseUrl.replace(/\/$/, '')}/ocr`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'OCR request failed');
  }
  const parsed = (await res.json()) as Partial<TripData>;
  return parsed;
}

function readFileAsBase64Web(file: Blob & { type?: string }): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) resolve({ base64: match[2], mime: match[1] });
      else reject(new Error('Could not read file'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ImportScreen() {
  const { mergeFromImport, tripData } = useTrip();
  const [status, setStatus] = useState<'idle' | 'picking' | 'processing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pdfServerUrl, setPdfServerUrl] = useState(PDF_PARSER_URL);

  useEffect(() => {
    AsyncStorage.getItem(PDF_SERVER_STORAGE_KEY).then((stored) => {
      if (stored?.trim()) setPdfServerUrl(stored.trim());
    });
  }, []);

  async function savePdfServerUrl(url: string) {
    const trimmed = url.trim();
    setPdfServerUrl(trimmed || PDF_PARSER_URL);
    await AsyncStorage.setItem(PDF_SERVER_STORAGE_KEY, trimmed || PDF_PARSER_URL);
  }

  async function handlePastedFiles(files: { type: string; name?: string } & Blob[]) {
    if (!files?.length) return;
    const file = files[0];
    const isPdf = file.type === 'application/pdf';
    const isImage = /^image\/(jpeg|jpg|png)$/i.test(file.type);
    if (!isPdf && !isImage) return;
    setStatus('processing');
    setMessage('Reading pasted file…');
    try {
      const { base64, mime } = await readFileAsBase64Web(file as Blob & { type: string });
      if (isPdf) {
        const parsed = await parsePdfViaServer(pdfServerUrl, base64, file.name ?? 'pasted.pdf');
        if (parsed) {
          mergeFromImport(parsed);
          setStatus('done');
          setMessage('Trip data updated from pasted PDF. Check Schedule and Travel tabs.');
        } else setStatus('idle');
      } else {
        const parsed = await parseImageViaServer(pdfServerUrl, base64, mime);
        if (parsed) {
          mergeFromImport(parsed);
          setStatus('done');
          setMessage('Trip data updated from pasted image. Check Schedule and Travel tabs.');
        } else setStatus('idle');
      }
    } catch (err) {
      setStatus('done');
      setMessage(err instanceof Error ? err.message : 'Could not read pasted file.');
    }
  }

  async function pickAndImport() {
    setStatus('picking');
    setMessage('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPE,
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        setStatus('idle');
        return;
      }
      const file = result.assets[0];
      const mime = (file.mimeType ?? '').toLowerCase();
      const name = (file.name ?? '').toLowerCase();

      setStatus('processing');
      setMessage('Reading file…');

      if (mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png') {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const images = tripData.importedImages ?? [];
        mergeFromImport({
          importedImages: [...images, { name: file.name ?? 'image', base64 }],
        });
        try {
          const parsed = await parseImageViaServer(pdfServerUrl, base64, mime);
          if (parsed) {
            mergeFromImport(parsed);
            setStatus('done');
            setMessage(`Added "${file.name}" and updated trip data from image text. Check Schedule and Travel tabs.`);
            return;
          }
        } catch {
          // OCR failed or server not configured; we already added the image
        }
        setStatus('done');
        setMessage(`Added "${file.name}" to imported images. Set PDF server URL and OPENAI_API_KEY to extract text from images.`);
        return;
      }

      if (mime === 'application/pdf' || name.endsWith('.pdf')) {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        try {
          const parsed = await parsePdfViaServer(pdfServerUrl, base64, file.name ?? 'document.pdf');
          if (parsed) {
            mergeFromImport(parsed);
            setStatus('done');
            setMessage('Trip data updated from PDF. Check Schedule and Travel tabs.');
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setStatus('done');
          setMessage(
            `PDF could not be read: ${errMsg}. Make sure the PDF parser server is running (see server/README). You can also paste the PDF text below and tap "Import pasted text".`
          );
        }
        return;
      }

      let text = '';
      try {
        text = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch {
        setStatus('done');
        setMessage(
          'Could not read that file as text. Try pasting the content below and tap "Import pasted text", or use a .txt file.'
        );
        return;
      }

      processText(text);
    } catch (e) {
      setStatus('error');
      const err = e instanceof Error ? e.message : String(e);
      setMessage(err);
      if (Platform.OS !== 'web') Alert.alert('Import failed', err);
    }
  }

  function processText(text: string) {
    const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const content = stripped.length > 0 ? stripped : text;
    const parsed = parseImportedText(content);
    const hasData =
      parsed.tripStartDate ||
      parsed.tripEndDate ||
      (parsed.flights && Object.keys(parsed.flights).length > 0);
    if (hasData) {
      mergeFromImport(parsed);
      setStatus('done');
      setMessage('Trip data updated. Check Schedule and Travel tabs.');
    } else {
      setStatus('done');
      setMessage(
        'No trip dates or flight info was detected in the text. You can still add details in the Travel and Schedule tabs.'
      );
    }
  }

  function importPasted() {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setMessage(
        'Paste or type text in the box above, or use "Choose file" for PDFs and other files.'
      );
      setStatus('error');
      return;
    }
    setStatus('processing');
    setMessage('');
    try {
      processText(trimmed);
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Import from this phone</Text>
      <Text style={styles.intro}>
        Choose a file (PDF, HTML, JPEG, PNG, or text) or paste content below. PDFs and images are sent to the server to extract text and fill trip data. On web you can also paste an image or PDF into the box.
      </Text>

      <Text style={styles.pdfServerLabel}>PDF server URL (for Choose file)</Text>
      <TextInput
        style={styles.pdfServerInput}
        value={pdfServerUrl}
        onChangeText={setPdfServerUrl}
        onBlur={() => savePdfServerUrl(pdfServerUrl)}
        placeholder="http://YOUR_MAC_IP:3000"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Text style={styles.pdfServerHint}>
        On your phone: use your computer's IP (e.g. http://192.168.1.5:3000). On your Mac, run the server in Terminal: cd server && npm start
      </Text>

      <TouchableOpacity
        style={[styles.button, (status === 'processing' || status === 'picking') && styles.buttonDisabled]}
        onPress={pickAndImport}
        disabled={status === 'processing' || status === 'picking'}
      >
        {status === 'processing' || status === 'picking' ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Choose file</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.pasteLabel}>Or paste text, or paste an image/PDF (web)</Text>
      <TextInput
        style={styles.pasteInput}
        value={pastedText}
        onChangeText={setPastedText}
        onPaste={
          Platform.OS === 'web'
            ? (e: any) => {
                const files = e?.clipboardData?.files;
                if (files?.length) {
                  e.preventDefault();
                  handlePastedFiles(files);
                }
              }
            : undefined
        }
        placeholder="Paste trip details, flight info, or any text here… (Web: you can also paste an image or PDF)"
        placeholderTextColor={Colors.textMuted}
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity style={styles.pasteButton} onPress={importPasted}>
        <Text style={styles.buttonText}>Import pasted text</Text>
      </TouchableOpacity>

      {message ? (
        <View style={[styles.messageBox, status === 'error' ? styles.messageError : styles.messageSuccess]}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.sea, marginBottom: Spacing.sm },
  intro: { fontSize: 14, color: Colors.textMuted, lineHeight: 21, marginBottom: Spacing.lg },
  pdfServerLabel: { fontSize: 14, fontWeight: '600', color: Colors.sea, marginBottom: 4 },
  pdfServerInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 4,
  },
  pdfServerHint: { fontSize: 12, color: Colors.textMuted, lineHeight: 16, marginBottom: Spacing.lg },
  button: {
    backgroundColor: Colors.sea,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  pasteLabel: { fontSize: 15, fontWeight: '600', color: Colors.sea, marginBottom: Spacing.sm },
  pasteInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: Spacing.sm,
  },
  pasteButton: {
    backgroundColor: Colors.olive,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  messageBox: { padding: Spacing.md, borderRadius: 12 },
  messageError: { backgroundColor: '#fde8e8' },
  messageSuccess: { backgroundColor: '#e8f5e9' },
  messageText: { fontSize: 14, color: Colors.text },
});
