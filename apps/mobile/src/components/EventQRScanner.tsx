/**
 * QR scanner surface backed by `expo-camera`.
 *
 * The native module is required at runtime via a string variable so the
 * component compiles + tests cleanly even when the package is absent. When
 * the module is missing (Vitest, dev without native build) we render a
 * harmless placeholder telling the dev to enter the slug manually.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface EventQRScannerProps {
  onScan: (payload: string) => void;
  onCancel: () => void;
}

interface CameraModule {
  CameraView: React.ComponentType<{
    style?: unknown;
    barcodeScannerSettings?: { barcodeTypes: string[] };
    onBarcodeScanned?: (event: { data: string }) => void;
  }>;
  useCameraPermissions(): [
    { granted: boolean } | null,
    () => Promise<{ granted: boolean } | null>,
  ];
}

/**
 * Render a full-screen camera viewfinder. Calls `onScan` with the raw QR
 * payload exactly once; ignores subsequent reads until the parent unmounts.
 */
export function EventQRScanner({ onScan, onCancel }: EventQRScannerProps): JSX.Element {
  const [mod, setMod] = useState<CameraModule | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const moduleName = 'expo-camera';
        const loaded = (await import(/* @vite-ignore */ moduleName)) as CameraModule;
        if (!cancelled) setMod(loaded);
      } catch {
        if (!cancelled) setMod(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mod) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Camera module unavailable. Enter the event slug manually.
        </Text>
        <Pressable onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <CameraSurface
      mod={mod}
      onScan={(payload) => {
        if (scanned) return;
        setScanned(true);
        onScan(payload);
      }}
      onCancel={onCancel}
    />
  );
}

interface CameraSurfaceProps {
  mod: CameraModule;
  onScan: (payload: string) => void;
  onCancel: () => void;
}

function CameraSurface({ mod, onScan, onCancel }: CameraSurfaceProps): JSX.Element {
  const [permission, requestPermission] = mod.useCameraPermissions();

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Camera access required to scan.</Text>
        <Pressable onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const Camera = mod.CameraView;
  return (
    <View style={styles.root}>
      <Camera
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(event) => onScan(event.data)}
      />
      <Pressable onPress={onCancel} style={[styles.cancelBtn, styles.cancelOverlay]}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  camera: { flex: 1 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FBF7EE',
  },
  fallbackText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1F2937',
  },
  cancelOverlay: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
  },
  cancelText: { color: '#FBF7EE', fontWeight: '600' },
});
