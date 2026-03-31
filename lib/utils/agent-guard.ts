import { NextRequest } from 'next/server'

export function validateAgentRequest(request: NextRequest): boolean {
  const secret = request.headers.get('x-agent-secret')
  return secret === process.env.AGENT_SECRET
}

export function agentUnauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
