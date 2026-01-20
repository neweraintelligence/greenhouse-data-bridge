import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Hash, ArrowRight, Loader2 } from 'lucide-react';
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-bmf-blue to-bmf-blue-dark items-center justify-center p-12">
        <div className="max-w-lg">
          <img
            src="/bmf-logo.png"
            alt="Big Marble Farms"
            className="h-16 w-auto mb-6 brightness-0 invert"
          />
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Greenhouse Data Bridge
          </h1>
          <p className="text-blue-50 text-lg leading-relaxed mb-8">
            Transform complex data workflows into intelligent, automated pipelines. Seamless reconciliation powered by AI.
          </p>
          <div className="flex items-center gap-3 text-blue-100">
            <div className="h-px flex-1 bg-blue-300/30"></div>
            <img
              src="/nei-logo.png"
              alt="New Era Intelligence"
              className="h-5 w-auto brightness-0 invert opacity-70"
            />
            <div className="h-px flex-1 bg-blue-300/30"></div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img
              src="/bmf-logo.png"
              alt="Big Marble Farms"
              className="h-14 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Greenhouse Data Bridge
            </h1>
            <p className="text-gray-500 text-sm">
              Intelligent workflow automation
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Quick Demo Banner */}
            <div className="bg-bmf-blue px-8 py-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Workshop Demo
                </h3>
                <p className="text-blue-100 text-sm mb-4">
                  Access pre-configured demo session
                </p>
                <button
                  onClick={handleJoinDemo}
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-white hover:bg-gray-50 text-bmf-blue font-semibold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Join Session</span>
                      <span className="font-mono tracking-wider">{DEMO_SESSION_CODE}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main form */}
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Create New Session
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Start fresh or resume an existing session
              </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={!!code}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  />
                </div>
              </div>

              {/* Session code input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Resume Session
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter session code"
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bmf-blue/20 focus:border-bmf-blue font-mono tracking-widest transition-all"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || (!name.trim() && !code.trim())}
                className="w-full py-3.5 px-6 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{code ? 'Resume Session' : 'Start New Session'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
              </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-8">
            Powered by Big Marble Farms & New Era Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
