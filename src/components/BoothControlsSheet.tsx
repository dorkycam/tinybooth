/**
 * Booth controls sheet.
 *
 * Bottom sheet hidden behind a gear icon on the live camera screen so guests
 * can't accidentally exit the booth. Contains:
 *   - Flash on/off toggle (in-place)
 *   - Inline layout picker (swap strip layouts without leaving the booth)
 *   - "Exit booth" with two-tap confirm -> back to home
 *
 * Library-style: receives current state + callbacks, owns no global state.
 */
import type { JSX } from 'react';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { StripLayout } from '../lib/layouts';
import { LayoutPicker } from './LayoutPicker';
import { useTheme } from '../theme/useTheme';

interface BoothControlsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  flash: boolean;
  onFlashChange: (next: boolean) => void;
  /** Current strip layout selected for this session. */
  layout: StripLayout;
  /** Swap to a different layout in place. Resets any in-progress capture. */
  onLayoutChange: (next: StripLayout) => void;
  /** Exit the booth and return to home. Two-tap confirm. */
  onExit: () => void;
}

/**
 * Bottom sheet of in-session controls. Exit takes two taps to fire.
 */
export function BoothControlsSheet({
  visible,
  onDismiss,
  flash,
  onFlashChange,
  layout,
  onLayoutChange,
  onExit,
}: BoothControlsSheetProps): JSX.Element {
  const theme = useTheme('dark');
  const [confirmExit, setConfirmExit] = useState(false);

  function dismiss(): void {
    setConfirmExit(false);
    onDismiss();
  }

  function requestExit(): void {
    onDismiss();
    setTimeout(() => onExit(), 50);
  }

  function handleLayoutChange(next: StripLayout): void {
    if (next === layout) return;
    onLayoutChange(next);
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={dismiss}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close booth controls"
        onPress={dismiss}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityRole="none"
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { color: theme.colors.fg }]}>Booth controls</Text>

            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: theme.colors.fg }]}>Flash</Text>
              <Switch value={flash} onValueChange={onFlashChange} />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.colors.subtle }]}>Layout</Text>
              <LayoutPicker value={layout} onChange={handleLayoutChange} />
            </View>

            <View style={styles.exitBlock}>
              {confirmExit ? (
                <Pressable
                  onPress={requestExit}
                  accessibilityRole="button"
                  style={[styles.danger, { backgroundColor: theme.colors.highlight }]}
                >
                  <Text style={styles.dangerText}>Tap again to exit the booth</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setConfirmExit(true)}
                  accessibilityRole="button"
                  style={[styles.dangerOutline, { borderColor: theme.colors.highlight }]}
                >
                  <Text style={[styles.dangerOutlineText, { color: theme.colors.highlight }]}>
                    Exit booth
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable onPress={dismiss} accessibilityRole="button" style={styles.cancel}>
              <Text style={[styles.cancelText, { color: theme.colors.subtle }]}>Close</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 0,
    maxHeight: '85%',
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '500',
  },
  dangerOutline: {
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
  },
  dangerOutlineText: {
    fontSize: 17,
    fontWeight: '700',
  },
  exitBlock: {
    gap: 10,
  },
  danger: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  dangerText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
