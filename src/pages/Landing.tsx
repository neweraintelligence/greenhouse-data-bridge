import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateSessionCode, isValidSessionCode } from '../lib/sessionCodes';
import { useSessionStore } from '../store/sessionStore';
import { seedSession } from '../lib/seedSession';

export function Landing() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-emerald-100 p-3 rounded-full">
            <Leaf className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Greenhouse Data Bridge
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Bridge manual inputs with real-time decisions
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder="Enter your name"
              disabled={!!code}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or resume with code</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Session Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors font-mono text-center text-lg tracking-widest"
              placeholder="ABC123"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (!name.trim() && !code.trim())}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading...
              </span>
            ) : code ? (
              'Resume Session'
            ) : (
              'Start New Session'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Big Marble Greenhouses Demo Application
        </p>
      </div>
    </div>
  );
}
