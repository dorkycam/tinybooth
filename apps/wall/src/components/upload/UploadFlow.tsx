'use client';

import { useUploadFlow } from '../../hooks/useUploadFlow';
import { WelcomeScreen } from './WelcomeScreen';
import { CapturePicker } from './CapturePicker';
import { PreviewPanel } from './PreviewPanel';
import { SuccessScreen } from './SuccessScreen';

export interface UploadBranding {
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

interface UploadFlowProps {
  eventId: string;
  eventName: string;
  eventSlug: string;
  webApiBase: string;
  branding?: UploadBranding;
}

/** State machine view: WELCOME → CAPTURE → PREVIEW → UPLOADING → SUCCESS. */
export function UploadFlow({
  eventId,
  eventName,
  eventSlug,
  webApiBase,
  branding,
}: UploadFlowProps): JSX.Element {
  const flow = useUploadFlow({ eventId, eventSlug, webApiBase });

  switch (flow.state) {
    case 'WELCOME':
      return (
        <WelcomeScreen eventName={eventName} branding={branding} onConfirm={flow.confirmWelcome} />
      );
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
          primaryColor={branding?.primaryColor}
        />
      );
    case 'SUCCESS':
      return <SuccessScreen onAnother={flow.reset} />;
  }
}
