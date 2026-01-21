import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Loader2, Users, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function MobileJoinSession() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  // Set mobile viewport
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    }
  }, []);

  // Fetch participant count and subscribe to updates
  useEffect(() => {
    if (!sessionCode) return;

    const fetchCount = async () => {
      const { count } = await supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_code', sessionCode);

      if (count !== null) {
        setParticipantCount(count);
      }
    };

    fetchCount();

    // Subscribe to new participants
    const channel = supabase
      .channel(`join-count-${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_code=eq.${sessionCode}`,
        },
        () => {
          setParticipantCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  const handleJoin = async () => {
    if (!name.trim() || !sessionCode) return;

    setIsJoining(true);
    setError(null);

    try {
      const trimmedName = name.trim();

      // Check if participant already exists in this session
      const { data: existing } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_code', sessionCode)
        .eq('participant_name', trimmedName)
        .maybeSingle();

      if (existing) {
        // Already joined - just show success
        setHasJoined(true);
        return;
      }

      // New participant - insert
      const { error: insertError } = await supabase
        .from('session_participants')
        .insert({
          session_code: sessionCode,
          participant_name: trimmedName,
        });

      if (insertError) {
        throw insertError;
      }

      setHasJoined(true);
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (!sessionCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Invalid session link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 flex flex-col items-center justify-center p-6">
      {/* Logo/Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 shadow-sm mb-4">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0066CC] to-[#2E7D32]" />
          <span className="text-sm font-semibold text-gray-700">BMF Pipeline Demo</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <span>Session:</span>
          <span className="font-mono font-bold text-lg text-[#0066CC] tracking-wider">{sessionCode}</span>
        </div>
      </div>

      {!hasJoined ? (
        /* Join Form */
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Join the Session
          </h1>
          <p className="text-gray-500 text-center text-sm mb-6">
            Enter your name to participate
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Smith"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0066CC] focus:border-transparent outline-none transition-all text-lg"
                autoFocus
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    handleJoin();
                  }
                }}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={!name.trim() || isJoining}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #0066CC, #2E7D32)',
              }}
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </span>
              ) : (
                'Join Session'
              )}
            </button>
          </div>

          {/* Participant count */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Users className="w-4 h-4" />
            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''} joined</span>
          </div>
        </div>
      ) : (
        /* Success State */
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#2E7D32] to-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're In!
          </h1>

          <p className="text-gray-600 mb-6">
            Welcome, <span className="font-semibold text-gray-900">{name}</span>
          </p>

          <div className="bg-gradient-to-r from-[#0066CC]/10 to-[#2E7D32]/10 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-[#0066CC] mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Stay on this screen</span>
            </div>
            <p className="text-sm text-gray-600">
              You'll be notified when activities begin. Keep your phone handy!
            </p>
          </div>

          {/* Live participant count */}
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''} connected</span>
          </div>
        </div>
      )}
    </div>
  );
}
