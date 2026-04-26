'use client';

import { useUploadFlow } from '../../hooks/useUploadFlow';
import { WelcomeScreen } from './WelcomeScreen';
import { CapturePicker } from './CapturePicker';
import { PreviewPanel } from './PreviewPanel';
import { SuccessScreen } from './SuccessScreen';

interface UploadFlowProps {
  eventId: string;
  eventName: string;
  eventSlug: string;
  webApiBase: string;
}

/** State machine view: WELCOME → CAPTURE → PREVIEW → UPLOADING → SUCCESS. */
export function UploadFlow({
  eventId,
  eventName,
  eventSlug,
  webApiBase,
}: UploadFlowProps): JSX.Element {
  const flow = useUploadFlow({ eventId, eventSlug, webApiBase });

  switch (flow.state) {
    case 'WELCOME':
      return <WelcomeScreen eventName={eventName} onConfirm={flow.confirmWelcome} />;
    case 'CAPTURE':
      return <CapturePicker onFilesPicked={flow.setFiles} />;
    case 'PREVIEW':
    case 'UPLOADING':
      return (
        <PreviewPanel
          files={flow.files}
          loading={flow.state === 'UPLOADING'}
          error={flow.error}
          onSubmit={flow.submit}
          onBack={flow.back}
        />
      );
    case 'SUCCESS':
      return <SuccessScreen onAnother={flow.reset} />;
  }
}
