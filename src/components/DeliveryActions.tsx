/**
 * Delivery action row for the Preview screen.
 *
 * Renders the four captioned circular actions a guest uses to deliver a strip:
 * Print (the single primary action), Save, Share, and Redo. Built entirely from
 * the shared {@link IconButton} so there is one circular-button implementation.
 *
 * The whole row dims and disables while a delivery action is running so guests
 * cannot fire two at once. Sizing scales up for tablets via the `size` prop.
 */
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from './IconButton';
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
  /** True once the strip has been saved, so the Save caption can confirm it. */
  saved: boolean;
  /** Disable the whole row while a delivery action runs. */
  disabled: boolean;
  /** Circle diameter in px. Phone ~56, tablet ~72. */
  size: number;
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
  saved,
  disabled,
  size,
}: DeliveryActionsProps): JSX.Element {
  const theme = useTheme();
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
        testID="preview-print"
      />
      <IconButton
        icon="download-outline"
        label={saved ? 'Saved' : 'Save'}
        accessibilityLabel="Save strip to photos"
        size={size}
        glass
        onPress={onSave}
        disabled={disabled || saved}
        testID="preview-save"
      />
      <IconButton
        icon="share-outline"
        label="Share"
        accessibilityLabel="Share strip"
        size={size}
        glass
        onPress={onShare}
        disabled={disabled}
        testID="preview-share"
      />
      <IconButton
        icon="refresh"
        label="Redo"
        accessibilityLabel="Reshoot session"
        size={size}
        glass
        onPress={onRedo}
        disabled={disabled}
        testID="preview-redo"
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
