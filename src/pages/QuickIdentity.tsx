import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Briefcase, ArrowRight } from 'lucide-react';

export function QuickIdentity() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect') || '/';
  const suggestedName = searchParams.get('name') || '';
  const suggestedRole = searchParams.get('role') || '';

  const [name, setName] = useState(suggestedName);
  const [role, setRole] = useState(suggestedRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    // Store identity in sessionStorage (workshop session)
    sessionStorage.setItem('user_identity', JSON.stringify({
      name: name.trim(),
      role: role.trim() || 'Team Member',
      joinedAt: new Date().toISOString(),
    }));

    // Navigate to redirect destination
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bmf-blue to-bmf-blue-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/bmf-logo.png" alt="Big Marble Farms" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Quick Sign-In
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your name to participate in the workshop demo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Devin"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-bmf-blue focus:ring-2 focus:ring-bmf-blue/20 outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Your Role (Optional)
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., COO, Ops Manager"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-bmf-blue focus:ring-2 focus:ring-bmf-blue/20 outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-4 rounded-xl bg-bmf-blue hover:bg-bmf-blue-dark text-white font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          For workshop demo only. Data deleted after session.
        </p>
      </div>
    </div>
  );
}
