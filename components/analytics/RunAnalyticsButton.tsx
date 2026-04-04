'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RunAnalyticsButton({ brandId }: { brandId: string }) {
    const [isRunning, setIsRunning] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const router = useRouter()

    const handleSync = async () => {
        setIsRunning(true)
        setIsSuccess(false)
        setErrorMessage(null)
        setStatusMessage(null)

        try {
            const response = await fetch('/api/run-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'analytics',
                    brandId
                })
            })

            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload.error || 'Failed to run analytics')
            }

            const importedPosts = Number(payload.importedPosts || 0)
            const snapshotsCreated = Number(payload.snapshotsCreated || 0)
            const platformImports = Array.isArray(payload.platformImports) ? payload.platformImports : []

            if (platformImports.length === 0) {
                setStatusMessage('No connected platforms found yet.')
            } else if (importedPosts === 0 && snapshotsCreated === 0) {
                setStatusMessage('Connected platforms found, but no posts were imported or refreshed.')
            } else {
                setStatusMessage(`Imported ${importedPosts} posts and refreshed ${snapshotsCreated} snapshots.`)
            }

            setIsSuccess(true)
            setTimeout(() => {
                setIsSuccess(false)
                router.refresh()
            }, 3000)
        } catch (err) {
            console.error(err)
            setErrorMessage(err instanceof Error ? err.message : 'Analytics sync failed')
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={handleSync}
                disabled={isRunning}
                data-testid="analytics-sync-button"
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

            {statusMessage && !errorMessage && (
                <p className="max-w-sm text-right text-xs text-zinc-400">{statusMessage}</p>
            )}

            {errorMessage && (
                <p className="max-w-sm text-right text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                </p>
            )}
        </div>
    )
}
