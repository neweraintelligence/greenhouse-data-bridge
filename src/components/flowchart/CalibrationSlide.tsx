import { memo, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, CheckCircle2, Smartphone, Play, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Participant {
  id: string;
  participant_name: string;
  joined_at: string;
}

interface CalibrationSlideProps {
  sessionCode: string;
  onProceed: () => void;
}

function CalibrationSlideComponent({ sessionCode, onProceed }: CalibrationSlideProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [recentJoin, setRecentJoin] = useState<string | null>(null);

  // Fetch existing participants and subscribe to new ones
  useEffect(() => {
    if (!sessionCode) return;

    // Fetch existing participants
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('session_participants')
        .select('id, participant_name, joined_at')
        .eq('session_code', sessionCode)
        .order('joined_at', { ascending: false })
        .limit(20);

      if (data) {
        setParticipants(data);
      }
    };

    fetchParticipants();

    // Subscribe to new participants
    const channel = supabase
      .channel(`calibration-${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_code=eq.${sessionCode}`,
        },
        (payload) => {
          const newParticipant = payload.new as Participant;
          setParticipants(prev => [newParticipant, ...prev.slice(0, 19)]);
          setRecentJoin(newParticipant.participant_name);

          // Clear the recent join highlight after animation
          setTimeout(() => setRecentJoin(null), 2000);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const joinUrl = `${window.location.origin}/join/${sessionCode}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-6xl w-full mx-8 flex gap-12">
        {/* Left side - Instructions & QR */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bmf-blue/10 text-bmf-blue text-sm font-semibold mb-4">
              <Smartphone className="w-4 h-4" />
              <span>GET READY</span>
            </div>
            <h1
              className="text-5xl font-bold text-gray-900 tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Let's Get Everyone Connected
            </h1>
            <p
              className="text-xl text-gray-600 leading-relaxed"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}
            >
              Scan the QR code with your phone to join the session.
              You'll be able to interact with the demo and compete in challenges.
            </p>
          </div>

          {/* QR Code Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <div className="flex items-center gap-8">
              <div className="bg-white p-4 rounded-2xl shadow-inner">
                <QRCodeSVG
                  value={joinUrl}
                  size={180}
                  level="M"
                  includeMargin
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Join</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bmf-blue text-white text-sm font-semibold flex items-center justify-center">1</span>
                    <span className="text-gray-600">Open your phone camera</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bmf-blue text-white text-sm font-semibold flex items-center justify-center">2</span>
                    <span className="text-gray-600">Point at the QR code</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bmf-blue text-white text-sm font-semibold flex items-center justify-center">3</span>
                    <span className="text-gray-600">Tap the link that appears</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nei-green text-white text-sm font-semibold flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <span className="text-gray-600">You're in! Your name will appear here</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Proceed Button */}
          <button
            onClick={onProceed}
            className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-bmf-blue to-nei-green hover:from-bmf-blue-dark hover:to-nei-green-dark text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Let's Begin</span>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right side - Live Participant Feed */}
        <div className="w-[360px] flex flex-col">
          {/* Participant count header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-nei-green/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-nei-green" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="text-3xl font-bold text-gray-900">{participants.length}</p>
                </div>
              </div>
              {participants.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-nei-green/10 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-nei-green animate-pulse" />
                  <span className="text-sm font-medium text-nei-green">Live</span>
                </div>
              )}
            </div>

            {/* Session code display */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm text-gray-500">Session:</span>
              <span className="font-mono font-bold text-lg text-bmf-blue tracking-wider">{sessionCode}</span>
            </div>
          </div>

          {/* Live feed */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">Live Join Feed</span>
            </div>

            {participants.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Smartphone className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">Waiting for participants...</p>
                <p className="text-sm text-gray-400">
                  Scan the QR code to see your name appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {participants.map((participant, idx) => (
                  <div
                    key={participant.id}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500
                      ${participant.participant_name === recentJoin
                        ? 'bg-nei-green/20 scale-105 shadow-lg'
                        : 'bg-gray-50'
                      }
                    `}
                    style={{
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white
                      ${participant.participant_name === recentJoin
                        ? 'bg-gradient-to-r from-nei-green to-emerald-500'
                        : 'bg-gradient-to-r from-bmf-blue to-blue-500'
                      }
                    `}>
                      {participant.participant_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{participant.participant_name}</p>
                      <p className="text-xs text-gray-500">
                        {participant.participant_name === recentJoin ? (
                          <span className="flex items-center gap-1 text-nei-green font-medium">
                            <Sparkles className="w-3 h-3" />
                            Just joined!
                          </span>
                        ) : (
                          new Date(participant.joined_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        )}
                      </p>
                    </div>
                    {participant.participant_name === recentJoin && (
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-nei-green" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const CalibrationSlide = memo(CalibrationSlideComponent);
