/**
 * Delivery action row for the Preview screen.
 *
 * Renders the captioned circular actions a guest uses to finish a strip: Print
 * (the single primary action), Save, Share, Redo, and Done. Save and Share are
 * optional and can be hidden per the operator's Settings. Built entirely from the
 * shared {@link IconButton} so there is one circular-button implementation.
 *
 * The delivery actions (Print, Save, Share, Redo) dim and disable while one is
 * running so guests cannot fire two at once. Done is the escape hatch and stays
 * enabled throughout, mirroring the old top-right Close. Sizing scales up for
 * tablets via the `size` prop.
 */
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from './IconButton';
import type { ThemeMode } from '@/theme/theme';
import { useTheme } from '@/theme/useTheme';

/** Props for {@link DeliveryActions}. */
export interface DeliveryActionsProps {
  /** Print the composed strip via the OS print dialog. */
  onPrint: () => void;
  /** Save the composed strip to the device photo library. */
  onSave: () => void;
  /** Open the OS share sheet for the composed strip. */
  onShare: () => void;
  /** Reshoot the session. */
  onRedo: () => void;
  /** Discard the session and return to Start. The always-enabled escape hatch. */
  onDone: () => void;
  /** True once the strip has been saved, so the Save caption can confirm it. */
  saved: boolean;
  /** Disable the delivery actions while one runs. Done is never disabled. */
  disabled: boolean;
  /** Show the Save action. Defaults to true. */
  showSave?: boolean;
  /** Show the Share action. Defaults to true. */
  showShare?: boolean;
  /** Circle diameter in px. Phone ~56, tablet ~72. */
  size: number;
  /** Force a theme mode so the row matches a forced-dark screen. */
  scheme?: ThemeMode;
}

/**
 * A centered row of captioned circular delivery actions.
 *
 * @returns The rendered action row.
 */
export function DeliveryActions({
  onPrint,
  onSave,
  onShare,
  onRedo,
  onDone,
  saved,
  disabled,
  showSave = true,
  showShare = true,
  size,
  scheme,
}: DeliveryActionsProps): JSX.Element {
  const theme = useTheme(scheme);
  return (
    <View style={[styles.row, { gap: theme.spacing.lg }]}>
      <IconButton
        icon="print"
        label="Print"
        accessibilityLabel="Print strip"
        variant="primary"
        size={size}
        onPress={onPrint}
        disabled={disabled}
        scheme={scheme}
        testID="preview-print"
      />
      {showSave ? (
        <IconButton
          icon="download-outline"
          label={saved ? 'Saved' : 'Save'}
          accessibilityLabel="Save strip to photos"
          size={size}
          glass
          onPress={onSave}
          disabled={disabled || saved}
          scheme={scheme}
          testID="preview-save"
        />
      ) : null}
      {showShare ? (
        <IconButton
          icon="share-outline"
          label="Share"
          accessibilityLabel="Share strip"
          size={size}
          glass
          onPress={onShare}
          disabled={disabled}
          scheme={scheme}
          testID="preview-share"
        />
      ) : null}
      <IconButton
        icon="refresh"
        label="Redo"
        accessibilityLabel="Reshoot session"
        size={size}
        glass
        onPress={onRedo}
        disabled={disabled}
        scheme={scheme}
        testID="preview-redo"
      />
      <IconButton
        icon="checkmark"
        label="Done"
        accessibilityLabel="Done"
        size={size}
        glass
        onPress={onDone}
        scheme={scheme}
        testID="preview-done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
