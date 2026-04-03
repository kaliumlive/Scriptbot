'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, Zap, Activity, Clock, User, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentLog {
    id: string
    agent_name: string
    status: 'running' | 'complete' | 'failed'
    started_at: string
}

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AgentSidebar({ brandId }: { brandId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [logs, setLogs] = useState<AgentLog[]>([])
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Initial greeting
    useEffect(() => {
         if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "Hey, I'm your Agency Lead. How can I help you scale today?"
            }])
         }
    }, [messages.length])

    // Fetch logs periodically
    useEffect(() => {
        const fetchLogs = async () => {
            const res = await fetch(`/api/run-agent/logs?brandId=${brandId}&limit=5`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.logs || [])
            }
        }
        fetchLogs()
        const interval = setInterval(fetchLogs, 10000)
        return () => clearInterval(interval)
    }, [brandId])

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return

        const userMsg = inputValue.trim()
        setInputValue('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsTyping(true)

        try {
            const res = await fetch('/api/agency-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    message: userMsg,
                    history: messages.slice(-5) // Keep context manageable
                })
            })

            if (!res.ok) throw new Error('API Error')
            const data = await res.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        } catch (error) {
            console.error('Chat Error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I lost connection to the agency mainframes. Try again later." }])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 z-50 border border-white/20 group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    <MessageSquare className="w-6 h-6 text-white" />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-indigo-600 scale-75 animate-pulse" />
                </motion.button>
            )}

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-96 bg-[#09090b]/95 backdrop-blur-3xl border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.4)] z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                                    <Bot className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Agency Office</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Lead Agent Online</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Recent Activity Ticker */}
                        <div className="bg-zinc-900/40 p-4 border-b border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Heartbeat</span>
                            </div>
                            <div className="space-y-2">
                                {logs.length > 0 ? logs.map(log => (
                                    <div key={log.id} className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <span className="capitalize">{log.agent_name.replace('-', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded uppercase font-bold text-[8px] bg-indigo-500/20 text-indigo-400",
                                                log.status === 'running' && "bg-amber-500/10 text-amber-500",
                                                log.status === 'failed' && "bg-rose-500/10 text-rose-500"
                                            )}>
                                                {log.status}
                                            </span>
                                            <Clock className="w-3 h-3 text-zinc-600" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-[10px] text-zinc-600 italic">No recent background activity...</div>
                                )}
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            {messages.map((msg, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-3",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                        msg.role === 'user' ? "bg-zinc-800" : "bg-indigo-600 shadow-lg shadow-indigo-600/20"
                                    )}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Bot className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed",
                                        msg.role === 'user' 
                                            ? "bg-indigo-600/10 text-indigo-100 border border-indigo-500/20" 
                                            : "bg-white/[0.03] text-zinc-300 border border-white/5"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white/[0.03] rounded-2xl px-4 py-3 border border-white/5 flex gap-1.5 items-center">
                                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-6 pt-2 border-t border-white/5">
                            <div className="relative group">
                                <div className="absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
                                <div className="flex items-center gap-2 p-2 bg-white/[0.03] border border-white/10 rounded-2xl focus-within:border-indigo-500/50 transition-all">
                                    <input 
                                        type="text" 
                                        placeholder="Ask your agency lead..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-zinc-600 px-2 h-10"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={!inputValue.trim() || isTyping}
                                        className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:grayscale transition-all hover:bg-indigo-500 active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between px-1">
                                    <div className="flex gap-3">
                                        <button className="text-[10px] font-bold text-zinc-600 uppercase hover:text-indigo-400 transition-colors flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> Ideate
                                        </button>
                                        <button className="text-[10px] font-bold text-zinc-600 uppercase hover:text-indigo-400 transition-colors flex items-center gap-1">
                                            <Terminal className="w-3 h-3" /> Status
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-zinc-700 font-medium">Shift + Enter for new line</span>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    )
}
