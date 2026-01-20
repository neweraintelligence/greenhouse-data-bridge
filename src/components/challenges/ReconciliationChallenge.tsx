import { useState, useEffect } from 'react';
import { BillingChallenge } from './BillingChallenge';
import { PriceCheckChallenge } from './PriceCheckChallenge';
import { Loader2 } from 'lucide-react';

interface ReconciliationChallengeProps {
  sessionCode: string;
  participantName: string;
  onComplete: (result: { isCorrect: boolean; timeTaken: number; rank?: number }) => void;
}

type ChallengeType = 'quantity' | 'price';

export function ReconciliationChallenge({ sessionCode, participantName, onComplete }: ReconciliationChallengeProps) {
  const [challengeType, setChallengeType] = useState<ChallengeType | null>(null);

  // Randomly select challenge type on mount
  useEffect(() => {
    const types: ChallengeType[] = ['quantity', 'price'];
    const selected = types[Math.floor(Math.random() * types.length)];
    setChallengeType(selected);
  }, []);

  if (!challengeType) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-bmf-blue animate-spin" />
      </div>
    );
  }

  if (challengeType === 'quantity') {
    return (
      <BillingChallenge
        sessionCode={sessionCode}
        participantName={participantName}
        onComplete={onComplete}
      />
    );
  }

  return (
    <PriceCheckChallenge
      sessionCode={sessionCode}
      participantName={participantName}
      onComplete={onComplete}
    />
  );
}
