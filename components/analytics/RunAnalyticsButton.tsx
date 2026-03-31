'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RunAnalyticsButton({ brandId }: { brandId: string }) {
    const [isRunning, setIsRunning] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    const handleSync = async () => {
        setIsRunning(true)
        setIsSuccess(false)

        try {
            const response = await fetch('/api/run-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentType: 'analytics',
                    data: { brandId }
                })
            })

            if (!response.ok) throw new Error('Failed to run analytics')

            setIsSuccess(true)
            setTimeout(() => {
                setIsSuccess(false)
                router.refresh()
            }, 3000)
        } catch (err) {
            console.error(err)
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <button
            onClick={handleSync}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSuccess
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                }`}
        >
            {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
                <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isRunning ? 'Syncing...' : isSuccess ? 'Synced' : 'Sync Platforms'}
        </button>
    )
}
