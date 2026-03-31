import { Key } from 'lucide-react'

const KEYS = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    label: 'Supabase URL',
    description: 'Your Supabase project URL. Found in Project Settings → API.',
    link: 'https://supabase.com/dashboard',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    label: 'Supabase Anon Key',
    description: 'Public anon key for client-side auth. Found in Project Settings → API.',
    link: 'https://supabase.com/dashboard',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    label: 'Supabase Service Role Key',
    description: 'Server-side only. Bypasses RLS. Never expose to the client.',
    link: 'https://supabase.com/dashboard',
  },
  {
    key: 'GEMINI_API_KEY',
    label: 'Google Gemini API Key',
    description: 'Used for trend research and video frame analysis. Free tier: 1,500 req/day.',
    link: 'https://aistudio.google.com/app/apikey',
  },
  {
    key: 'GROQ_API_KEY',
    label: 'Groq API Key',
    description: 'Used for all script writing and caption generation. Free tier: 1,000 req/day.',
    link: 'https://console.groq.com/keys',
  },
  {
    key: 'AGENT_SECRET',
    label: 'Agent Secret',
    description:
      'A random string that secures agent API routes from GitHub Actions. Also set this in GitHub → Settings → Secrets.',
  },
]

export default function ApiKeysPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-50">API Keys</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Add these to your{' '}
          <code className="text-zinc-300 bg-zinc-800 px-1 rounded text-xs">.env.local</code> file
          and as Vercel environment variables
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
        <p className="text-sm text-zinc-300 font-medium mb-1">Setup order</p>
        <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
          <li>Create a Supabase project and get the URL + keys</li>
          <li>Run the SQL migrations in <code className="text-zinc-400">supabase/migrations/</code> via the Supabase SQL editor</li>
          <li>Get Gemini and Groq API keys (both free)</li>
          <li>Generate a random AGENT_SECRET string</li>
          <li>Add all keys to Vercel environment variables before deploying</li>
          <li>Add APP_URL and AGENT_SECRET to GitHub repository secrets for the scheduler</li>
        </ol>
      </div>

      <div className="space-y-3">
        {KEYS.map(k => (
          <div key={k.key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-600" />
                <code className="text-sm text-zinc-200">{k.key}</code>
              </div>
              {k.link && (
                <a
                  href={k.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                >
                  Get key ↗
                </a>
              )}
            </div>
            <p className="text-xs text-zinc-500">{k.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
