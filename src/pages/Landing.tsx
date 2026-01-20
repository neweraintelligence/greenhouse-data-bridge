import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Hash, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateSessionCode, isValidSessionCode } from '../lib/sessionCodes';
import { useSessionStore } from '../store/sessionStore';
import { seedSession } from '../lib/seedSession';

const DEMO_SESSION_CODE = 'DEMO26';

export function Landing() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);

  const handleJoinDemo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if DEMO26 session exists
      const { data: existingSession, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', DEMO_SESSION_CODE)
        .single();

      if (fetchError || !existingSession) {
        throw new Error('Demo session not found. Please contact workshop organizer.');
      }

      // Update last_active_at
      await supabase
        .from('sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('code', DEMO_SESSION_CODE);

      setSession({ code: DEMO_SESSION_CODE, name: existingSession.name });
      navigate('/flowchart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let sessionCode = code.toUpperCase().trim();

      if (sessionCode) {
        // Resume existing session
        if (!isValidSessionCode(sessionCode)) {
          throw new Error('Invalid session code format');
        }

        const { data: existingSession, error: fetchError } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', sessionCode)
          .single();

        if (fetchError || !existingSession) {
          throw new Error('Session not found');
        }

        // Update last_active_at
        await supabase
          .from('sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('code', sessionCode);

        setSession({ code: sessionCode, name: existingSession.name });
      } else {
        // Create new session
        if (!name.trim()) {
          throw new Error('Please enter your name');
        }

        sessionCode = generateSessionCode();

        const { error: insertError } = await supabase.from('sessions').insert({
          code: sessionCode,
          name: name.trim(),
        });

        if (insertError) {
          // Handle unique constraint violation (rare collision)
          if (insertError.code === '23505') {
            sessionCode = generateSessionCode();
            await supabase.from('sessions').insert({
              code: sessionCode,
              name: name.trim(),
            });
          } else {
            throw insertError;
          }
        }

        // Seed the session with demo data
        await seedSession(sessionCode);

        setSession({ code: sessionCode, name: name.trim() });
      }

      navigate('/flowchart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-bmf-blue items-center justify-center p-12">
        <div className="max-w-md text-center">
          <img
            src="/bmf-logo.png"
            alt="Big Marble Farms"
            className="h-20 w-auto mx-auto mb-8 brightness-0 invert"
          />
          <h1 className="text-4xl font-bold text-white mb-4">
            Greenhouse Data Bridge
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            AI-powered pipeline automation for seamless data reconciliation
          </p>
          <div className="flex items-center justify-center gap-3 text-blue-200 text-sm">
            <span>Powered by</span>
            <img
              src="/nei-logo.png"
              alt="New Era Intelligence"
              className="h-6 w-auto brightness-0 invert opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/bmf-logo.png"
              alt="Big Marble Farms"
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-xl font-bold text-gray-800">
              Greenhouse Data Bridge
            </h1>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome
            </h2>
            <p className="text-gray-500 mb-6">
              Enter your name to start or use a code to resume
            </p>

            {/* Quick Demo Banner */}
            <div className="mb-6 bg-gradient-to-r from-bmf-blue/10 to-purple-100 rounded-xl p-4 border border-bmf-blue/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-bmf-blue mt-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Workshop Attendee?
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Join the live demo session with pre-loaded data
                  </p>
                  <button
                    onClick={handleJoinDemo}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-bmf-blue hover:bg-bmf-blue-dark text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Join Demo Session</span>
                        <span className="font-mono font-bold tracking-wider">({DEMO_SESSION_CODE})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-3 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-gray-400 text-sm">
                  or create your own session
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={!!code}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-shadow"
                  />
                </div>
              </div>

              {/* Session code input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Session Code (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Have a different session code? Enter it here to resume
                </p>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue focus:border-transparent font-mono text-center text-lg tracking-widest transition-shadow"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || (!name.trim() && !code.trim())}
                className="w-full py-3 px-4 bg-bmf-blue hover:bg-bmf-blue-dark text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{code ? 'Resume Session' : 'Start Session'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Big Marble Farms Workshop Demo
          </p>
        </div>
      </div>
    </div>
  );
}
