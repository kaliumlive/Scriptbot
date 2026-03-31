import { NextRequest } from 'next/server'
import { validateAgentRequest, agentUnauthorized } from '@/lib/utils/agent-guard'

export async function POST(request: NextRequest) {
  if (!validateAgentRequest(request)) return agentUnauthorized()
  // TODO: implement
  return Response.json({ status: 'ok', agent: 'analytics' })
}
