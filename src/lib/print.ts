/**
 * Print pipeline for TinyBooth strips.
 *
 * Wraps `expo-print` with two safeguards pulled from the user research:
 * 1. A 12-second timeout. If the print sheet stalls (Selphy queue lock),
 *    we surface an error the UI can convert into a "tap to retry" prompt.
 * 2. Every 8 prints we cycle `selectPrinterAsync()` to clear the iOS
 *    print subsystem, per the Selphy queue stall workaround in
 *    `docs/research/users.md` and `docs/plan.md` section 3.7.
 *
 * Counter persistence uses `AsyncStorage` so it survives app relaunches
 * without storing anything sensitive.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';

/** AsyncStorage key holding the lifetime print count for the install. */
export const PRINT_COUNT_STORAGE_KEY = '@tinybooth/print/count';

/** How many prints between forced printer-picker cycles. */
export const PRINT_CYCLE_INTERVAL = 8;

/** How long before we treat a print call as stalled. */
export const PRINT_TIMEOUT_MS = 12_000;

/** Result of a `printStrip` call. */
export interface PrintResult {
  success: boolean;
  canceled: boolean;
  /** True when we deliberately cycled the printer picker before this print. */
  cycledPrinter: boolean;
}

/**
 * Print one strip. Honors the Selphy queue stall workaround.
 *
 * @param uri `file://` URI to the composed JPEG / PDF the user wants to print.
 * @returns Print result. `canceled === true` when the user dismisses the
 *   sheet; `success === false && canceled === false` when the call timed out.
 */
export async function printStrip(uri: string): Promise<PrintResult> {
  const cycledPrinter = await maybeCyclePrinter();
  const printPromise = Print.printAsync({ uri }).then(
    () => ({ success: true, canceled: false, cycledPrinter }),
    (error: unknown) => {
      // expo-print throws a string-ish error containing "cancel" when the user
      // dismisses the print sheet. Treat that as a successful no-op.
      const message = error instanceof Error ? error.message : String(error ?? '');
      if (/cancel/i.test(message)) {
        return { success: false, canceled: true, cycledPrinter };
      }
      throw error;
    },
  );

  const timeoutPromise = new Promise<PrintResult>((resolve) => {
    const timer = setTimeout(() => {
      resolve({ success: false, canceled: false, cycledPrinter });
    }, PRINT_TIMEOUT_MS);
    // Best-effort: if the print resolves first, the timer fires harmlessly.
    void printPromise.finally(() => clearTimeout(timer));
  });

  const result = await Promise.race([printPromise, timeoutPromise]);
  if (result.success) {
    await incrementPrintCount();
  }
  return result;
}

/**
 * Returns the lifetime print count for this install. Used by the queue stall
 * workaround and exposed for diagnostics.
 */
export async function getPrintCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(PRINT_COUNT_STORAGE_KEY);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Reset the print count. Useful for QA. */
export async function resetPrintCount(): Promise<void> {
  await AsyncStorage.removeItem(PRINT_COUNT_STORAGE_KEY);
}

/**
 * If the next print would be the start of a new cycle, force the printer
 * picker to re-init the iOS print subsystem. Returns true when we cycled.
 */
async function maybeCyclePrinter(): Promise<boolean> {
  const count = await getPrintCount();
  if (count === 0 || count % PRINT_CYCLE_INTERVAL !== 0) return false;
  try {
    await Print.selectPrinterAsync();
    return true;
  } catch {
    // selectPrinterAsync rejects when the user dismisses the picker. That's
    // fine. The subsystem still got cycled.
    return true;
  }
}

async function incrementPrintCount(): Promise<void> {
  const next = (await getPrintCount()) + 1;
  await AsyncStorage.setItem(PRINT_COUNT_STORAGE_KEY, String(next));
}
