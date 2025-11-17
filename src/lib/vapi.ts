/**
 * VAPI Client for outbound calls
 * Docs: https://docs.vapi.ai
 */

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY
const VAPI_PUBLIC_KEY = process.env.VAPI_PUBLIC_KEY
const VAPI_API_URL = 'https://api.vapi.ai'

/**
 * Format phone number to E.164 format
 * E.164: +[country code][subscriber number including area code]
 * Example: +14155552671
 */
export function formatPhoneNumberE164(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '')
  
  // If it already starts with country code (11+ digits and starts with 1), add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // If it's 10 digits (US number without country code), add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  // If it already has country code but missing +, add it
  if (cleaned.length > 10) {
    return `+${cleaned}`
  }
  
  // If it's less than 10 digits, something is wrong
  throw new Error(`Invalid phone number format: ${phoneNumber}. Expected 10+ digits.`)
}

export interface VapiCallRequest {
  phoneNumberId?: string
  customer?: {
    number: string
    name?: string
  }
  assistantId?: string
  assistant?: {
    name: string
    model: {
      provider: string
      model: string
      messages: Array<{
        role: string
        content: string
      }>
    }
    voice: {
      provider: string
      voiceId: string
    }
    serverUrl?: string
    serverUrlSecret?: string
  }
  metadata?: Record<string, any>
}

export interface VapiCallResponse {
  id: string
  status: string
  phoneNumber: string
  createdAt: string
}

/**
 * Create an outbound call via VAPI
 */
export async function createVapiCall(request: VapiCallRequest): Promise<VapiCallResponse> {
  if (!VAPI_PRIVATE_KEY) {
    throw new Error('VAPI_PRIVATE_KEY is not configured')
  }

  const response = await fetch(`${VAPI_API_URL}/call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`VAPI API error: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Build assistant instructions for form collection
 */
export function buildFormAssistant(
  patientName: string,
  formTitle: string,
  questions: Array<{ id: string; question_text: string }>,
  callbackUrl?: string
) {
  const questionsText = questions
    .map((q, i) => `${i + 1}. ${q.question_text}`)
    .join('\n')

  const questionsWithIds = questions
    .map((q) => `Question ID: ${q.id}\nQuestion: ${q.question_text}`)
    .join('\n\n')

  const systemPrompt = `You are a friendly medical assistant calling ${patientName} to collect health information.

Your task:
1. Introduce yourself: "Hi ${patientName}, this is a health assessment call from your doctor's office regarding the ${formTitle}."
2. Ask each question one at a time
3. Listen carefully to their answers
4. Confirm each answer before moving to the next question
5. Thank them at the end

Questions to ask:
${questionsText}

Guidelines:
- Be warm and professional
- Speak clearly and at a moderate pace
- If they don't understand, rephrase the question
- If they ask to reschedule, politely let them know they can fill out the form online instead
- Keep responses brief and natural

After collecting all answers, say: "Thank you for your time! Your responses have been recorded and your doctor will review them. Have a great day!"

IMPORTANT: At the end of the call, you MUST send a server message with the collected answers using this exact format:
{
  "questions": [
    ${questionsWithIds}
  ],
  "instruction": "After collecting all answers, send them to the server in JSON format with this structure: {\"answers\": [{\"question_id\": \"<question-id>\", \"answer_text\": \"<patient-response>\"}]}"
}`

  const assistant: any = {
    name: `Form: ${formTitle}`,
    model: {
      provider: 'openai',
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
    },
    voice: {
      provider: 'playht',
      voiceId: 'jennifer', // Professional female voice
    },
  }

  // Add server callback if provided
  if (callbackUrl) {
    assistant.serverUrl = callbackUrl
  }

  return assistant
}

/**
 * Get call details
 */
export async function getCallDetails(callId: string) {
  if (!VAPI_PRIVATE_KEY) {
    throw new Error('VAPI_PRIVATE_KEY is not configured')
  }

  const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
    headers: {
      'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get call details')
  }

  return response.json()
}

