/**
 * VAPI Client for outbound calls
 * Docs: https://docs.vapi.ai
 */

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY
const VAPI_PUBLIC_KEY = process.env.VAPI_PUBLIC_KEY
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID
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
  // Your VAPI phone number (from VAPI dashboard) - optional if VAPI_PHONE_NUMBER_ID is set
  phoneNumberId?: string
  // The customer being called
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

  if (!VAPI_PHONE_NUMBER_ID) {
    throw new Error('VAPI_PHONE_NUMBER_ID is not configured. Please add it to your environment variables.')
  }

  // Ensure phoneNumberId is set
  const callRequest = {
    ...request,
    phoneNumberId: request.phoneNumberId || VAPI_PHONE_NUMBER_ID,
  }

  const response = await fetch(`${VAPI_API_URL}/call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(callRequest),
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
  doctorName: string,
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

  const systemPrompt = `You are LiveAD, a friendly medical assistant calling ${patientName} on behalf of Dr. ${doctorName} for a daily check-in.

Your task:
1. If they confirm it's a good time, proceed with the check-in questions
2. If not, politely ask when would be a better time or mention they can fill this out online
3. Ask each question one at a time and wait for their response
4. Listen carefully and acknowledge their answers naturally
5. If an answer is unclear, politely ask for clarification
6. Keep the conversation brief and focused

Check-in questions:
${questionsText}

Guidelines:
- Be warm, caring, and professional
- Speak clearly at a comfortable pace
- Show empathy if they mention any concerns
- Keep your responses brief and conversational
- Don't rush - this is about their wellbeing
- If they mention anything urgent or concerning, acknowledge it and let them know their doctor will be notified

After completing the check-in:
1. Thank the patient and confirm their answers were logged
2. If they mentioned any concerning symptoms or worsening conditions, acknowledge this specifically and assure them you'll alert Dr. ${doctorName}
3. Remind them to contact their care team if anything gets worse
4. End with a warm closing and remind them about their next check-in tomorrow

Example closing: "Thank you, ${patientName}. I've logged your answers. [If concerns mentioned: Since [specific concern] today, I'll alert Dr. ${doctorName} so they can review your symptoms.] If anything gets worse, please contact your care team. Have a good rest of your day, and don't forget — your next check-in is tomorrow."`

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
    firstMessage: `Hi ${patientName}, this is LiveAD calling on behalf of Dr. ${doctorName}. We noticed you missed today's check-in. I'll ask you a few quick questions to help us track your recovery. Let's begin.`,
  }

  // Add server configuration for webhooks
  // This tells VAPI to send end-of-call-report to our webhook endpoint
  if (callbackUrl) {
    // Extract base URL from callback URL (remove /api/forms/vapi-submit)
    const baseUrl = callbackUrl.replace('/api/forms/vapi-submit', '')
    
    assistant.server = {
      url: `${baseUrl}/api/webhooks/vapi`,
      // Optional: Add a secret for webhook verification
      // secret: process.env.VAPI_WEBHOOK_SECRET
    }
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

