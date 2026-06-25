/**
 * Booth controls sheet.
 *
 * Bottom sheet hidden behind a gear icon on the live camera screen so guests
 * can't accidentally end the host's session. Contains:
 *   - Flash on/off toggle (in-place)
 *   - Inline layout picker (swap strip layouts without leaving the booth)
 *   - "End session" with two-tap confirm -> back to home
 *   - "End event" -> back to home, passcode-protected when one was set
 *
 * Library-style: receives current state + callbacks, owns no global state.
 */
import type { JSX } from 'react';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { StripLayout } from '@tinybooth/api-types';
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
  /** Lighter exit: ends the current session and returns to home. Two-tap confirm. */
  onEndSession: () => void;
  /** Heavier exit: ends the whole event and returns to home. Passcode-protected when set. */
  onEndEvent: () => void;
  /**
   * Optional host passcode. When set, ending the event requires the host to
   * enter this code first so guests can't exit on accident.
   */
  passcode?: string | null;
}

type PasscodeIntent = 'end-event';

/**
 * Bottom sheet of in-session controls. End Session takes two taps to fire.
 */
export function BoothControlsSheet({
  visible,
  onDismiss,
  flash,
  onFlashChange,
  layout,
  onLayoutChange,
  onEndSession,
  onEndEvent,
  passcode,
}: BoothControlsSheetProps): JSX.Element {
  const theme = useTheme('dark');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [passcodeIntent, setPasscodeIntent] = useState<PasscodeIntent | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const isLocked = typeof passcode === 'string' && passcode.length > 0;

  function dismiss(): void {
    setConfirmEnd(false);
    setPasscodeIntent(null);
    setPasscodeInput('');
    setPasscodeError(null);
    onDismiss();
  }

  function requestEndEvent(): void {
    if (isLocked) {
      setPasscodeIntent('end-event');
      setPasscodeInput('');
      setPasscodeError(null);
    } else {
      // Close the sheet before navigating so iOS does not stall the route
      // change while the modal animation is still mid-flight.
      onDismiss();
      setTimeout(() => onEndEvent(), 50);
    }
  }

  function requestEndSession(): void {
    onDismiss();
    setTimeout(() => onEndSession(), 50);
  }

  function handleLayoutChange(next: StripLayout): void {
    if (next === layout) return;
    onLayoutChange(next);
  }

  function submitPasscode(): void {
    if (passcodeInput === passcode) {
      setPasscodeIntent(null);
      setPasscodeInput('');
      setPasscodeError(null);
      onDismiss();
      setTimeout(() => onEndEvent(), 50);
    } else {
      setPasscodeError('Wrong passcode. Ask the host.');
    }
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

            {passcodeIntent ? (
              <View style={styles.passcodeBlock}>
                <Text style={[styles.actionText, { color: theme.colors.fg }]}>
                  Enter the host passcode
                </Text>
                <TextInput
                  value={passcodeInput}
                  onChangeText={(value) => {
                    setPasscodeInput(value.replace(/\D/g, '').slice(0, 8));
                    if (passcodeError) setPasscodeError(null);
                  }}
                  placeholder="••••"
                  placeholderTextColor={theme.colors.subtle}
                  keyboardType="number-pad"
                  secureTextEntry
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submitPasscode}
                  style={[
                    styles.passcodeInput,
                    {
                      color: theme.colors.fg,
                      backgroundColor: theme.colors.bg,
                      borderColor: passcodeError ? theme.colors.highlight : theme.colors.hairline,
                    },
                  ]}
                />
                {passcodeError ? (
                  <Text style={[styles.passcodeError, { color: theme.colors.highlight }]}>
                    {passcodeError}
                  </Text>
                ) : null}
                <Pressable
                  onPress={submitPasscode}
                  accessibilityRole="button"
                  style={[styles.danger, { backgroundColor: theme.colors.highlight }]}
                >
                  <Text style={styles.dangerText}>Unlock + end event</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPasscodeIntent(null);
                    setPasscodeInput('');
                    setPasscodeError(null);
                  }}
                  accessibilityRole="button"
                  style={styles.cancel}
                >
                  <Text style={[styles.cancelText, { color: theme.colors.subtle }]}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.exitBlock}>
                {confirmEnd ? (
                  <Pressable
                    onPress={requestEndSession}
                    accessibilityRole="button"
                    style={[styles.danger, { backgroundColor: theme.colors.highlight }]}
                  >
                    <Text style={styles.dangerText}>Tap again to end the session</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setConfirmEnd(true)}
                    accessibilityRole="button"
                    style={[styles.dangerOutline, { borderColor: theme.colors.highlight }]}
                  >
                    <Text style={[styles.dangerOutlineText, { color: theme.colors.highlight }]}>
                      End session
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={requestEndEvent}
                  accessibilityRole="button"
                  style={[styles.danger, { backgroundColor: theme.colors.highlight }]}
                >
                  <Text style={styles.dangerText}>
                    {isLocked ? 'End event (passcode)' : 'End event'}
                  </Text>
                </Pressable>
              </View>
            )}

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
  actionText: {
    fontSize: 17,
    fontWeight: '600',
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
  passcodeBlock: {
    gap: 12,
  },
  exitBlock: {
    gap: 10,
  },
  passcodeInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
  },
  passcodeError: {
    fontSize: 13,
    textAlign: 'center',
  },
});
