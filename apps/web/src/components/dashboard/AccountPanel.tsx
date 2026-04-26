'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { trpcMutation, trpcQuery } from '../../lib/dashboardApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface MeResponse {
  userId: string;
  email: string | null;
  ownedEvents: number;
}

interface DeleteResult {
  ok: true;
  deletedEvents: number;
  deletedPhotoBlobs: number;
  storageErrors: number;
}

/**
 * Account page body. Two-step delete confirmation per Apple's
 * Guideline 5.1.1(v) requirement (account deletion since June 2022).
 */
export function AccountPanel(): JSX.Element {
  const auth = useDashboardAuth();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.loading || !auth.userId) return;
    let cancelled = false;
    void trpcQuery<undefined, MeResponse>('account.me', undefined, auth)
      .then((next) => {
        if (!cancelled) setMe(next);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  async function handleDelete(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      await trpcMutation<undefined, DeleteResult>('account.delete', undefined, auth);
      await auth.signOut();
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <h3 className="text-lg font-bold mb-2">Profile</h3>
        {me ? (
          <ul className="text-sm text-graphite flex flex-col gap-1">
            <li>User id: <span className="font-mono">{me.userId}</span></li>
            <li>Email: {me.email ?? <em>not set</em>}</li>
            <li>Events owned: {me.ownedEvents}</li>
          </ul>
        ) : (
          <p className="text-graphite text-sm">Loading...</p>
        )}
      </Card>

      <Card className="border-coral">
        <h3 className="text-lg font-bold mb-2">Delete account</h3>
        <p className="text-sm text-graphite mb-4">
          Removes your account, every event you own, and the associated photos
          (guest uploads and booth strips). This is permanent. Required by
          Apple App Review since June 2022.
        </p>
        {confirmStep === 0 ? (
          <Button type="button" onClick={() => setConfirmStep(1)}>
            Delete my account
          </Button>
        ) : null}
        {confirmStep === 1 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              You are about to delete your TinyBooth account and every event tied
              to it. There is no undo. Continue?
            </p>
            <div className="flex gap-2">
              <Button type="button" onClick={() => setConfirmStep(2)}>
                Yes, continue
              </Button>
              <button
                type="button"
                className="text-sm text-graphite underline"
                onClick={() => setConfirmStep(0)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {confirmStep === 2 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-coral">
              Last confirmation. Tap delete to permanently remove the account.
            </p>
            <div className="flex gap-2">
              <Button type="button" disabled={submitting} onClick={() => void handleDelete()}>
                {submitting ? 'Deleting...' : 'Delete forever'}
              </Button>
              <button
                type="button"
                className="text-sm text-graphite underline"
                onClick={() => setConfirmStep(0)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-coral text-sm">{error}</p> : null}
      </Card>
    </div>
  );
}
