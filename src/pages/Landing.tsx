import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Hash, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateSessionCode, isValidSessionCode } from '../lib/sessionCodes';
import { useSessionStore } from '../store/sessionStore';
import { seedSession } from '../lib/seedSession';
import { GlassPanel, GlassButton, GlassInput } from '../components/design-system';

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
    <div className="min-h-screen flex items-center justify-center gradient-bg-animated relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-bmf-blue/20 rounded-full blur-2xl" />
      </div>

      <GlassPanel variant="heavy" className="max-w-md w-full mx-4 p-8 relative z-10">
        {/* Logos */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex flex-col items-center">
            <img
              src="/bmf-logo.png"
              alt="Big Marble Farms"
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
          </div>
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
          <div className="flex flex-col items-center">
            <img
              src="/nei-logo.png"
              alt="New Era Intelligence"
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Greenhouse Data Bridge
          </h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-ai-purple" />
            <span>AI-powered pipeline automation</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <GlassInput
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            disabled={!!code}
            icon={<User className="w-4 h-4" />}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/50 text-gray-500 rounded-full text-xs backdrop-blur-sm">
                or resume with code
              </span>
            </div>
          </div>

          <GlassInput
            label="Session Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            icon={<Hash className="w-4 h-4" />}
            className="font-mono text-center text-lg tracking-widest"
          />

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200/50">
              {error}
            </div>
          )}

          <GlassButton
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!name.trim() && !code.trim()}
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            className="w-full"
          >
            {code ? 'Resume Session' : 'Start New Session'}
          </GlassButton>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200/30">
          <p className="text-xs text-gray-500 text-center">
            Big Marble Farms Workshop Demo
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Powered by New Era Intelligence
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
