'use client';

import { Button } from '../ui/Button';

interface SuccessScreenProps {
  onAnother: () => void;
}

/** Shown after a successful submission. Drives the "post another" loop. */
export function SuccessScreen({ onAnother }: SuccessScreenProps): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-paper">
      <h2 className="text-3xl font-bold text-mint">Posted!</h2>
      <p className="text-graphite">It should appear on the TV in a couple seconds.</p>
      <div className="mt-4">
        <Button onClick={onAnother}>Post another</Button>
      </div>
    </div>
  );
}
