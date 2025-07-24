import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/button';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormData) => void;
  peerUsername?: string;
  duration: number;
  rageQuitDetected: boolean;
}

export interface FeedbackFormData {
  overallRating: number;
  factChecking: number;
  strawmanning: number;
  civility: number;
  comment: string;
}

export default function FeedbackModal({
  open,
  onClose,
  onSubmit,
  peerUsername,
  duration,
  rageQuitDetected
}: FeedbackModalProps) {
  const [formData, setFormData] = useState<FeedbackFormData>({
    overallRating: 5,
    factChecking: 5,
    strawmanning: 5,
    civility: 5,
    comment: ''
  });

  const handleChange = (field: keyof FeedbackFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: typeof value === 'string' ? Number(value) : value }));
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <Dialog.Panel className="bg-background border border-border shadow-lg rounded-xl p-6 max-w-lg w-full">
        <Dialog.Title className="text-lg font-bold mb-4">Rate your conversation with {peerUsername || 'your peer'}</Dialog.Title>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Duration: {Math.round(duration / 1000)} seconds</p>
          {rageQuitDetected && <p className="text-sm text-red-500">⚠️ This conversation may have ended early.</p>}

          {['overallRating', 'factChecking', 'strawmanning', 'civility'].map(key => (
            <div key={key}>
              <label className="block text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData[key as keyof FeedbackFormData]}
                onChange={(e) => handleChange(key as keyof FeedbackFormData, e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{formData[key as keyof FeedbackFormData]}</p>
            </div>
          ))}

          <textarea
            placeholder="Any comments?"
            value={formData.comment}
            onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            className="w-full mt-2 p-2 border border-border rounded-md bg-muted text-sm"
          />
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(formData)}>Submit</Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
