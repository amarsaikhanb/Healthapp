/**
 * QStash Client for scheduled jobs
 * Docs: https://upstash.com/docs/qstash
 */

import { Client } from "@upstash/qstash"

const QSTASH_TOKEN = process.env.QSTASH_TOKEN
const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY

if (!QSTASH_TOKEN) {
  console.warn('QStash token not configured')
}

export const qstashClient = new Client({
  token: QSTASH_TOKEN || '',
})

/**
 * Schedule a job to check for overdue forms
 * Runs every hour
 */
export async function scheduleFormCheckJob() {
  if (!QSTASH_TOKEN) {
    throw new Error('QStash not configured')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  
  if (!baseUrl) {
    throw new Error('APP_URL not configured')
  }

  const url = baseUrl.startsWith('http') 
    ? `${baseUrl}/api/cron/check-forms`
    : `https://${baseUrl}/api/cron/check-forms`

  try {
    const result = await qstashClient.schedules.create({
      destination: url,
      cron: "0 * * * *", // Every hour
    })

    console.log('QStash schedule created:', result)
    return result
  } catch (error) {
    console.error('Failed to create QStash schedule:', error)
    throw error
  }
}

/**
 * Verify QStash signature
 */
export async function verifyQStashSignature(
  signature: string,
  body: string
): Promise<boolean> {
  if (!QSTASH_CURRENT_SIGNING_KEY || !QSTASH_NEXT_SIGNING_KEY) {
    console.warn('QStash signing keys not configured, skipping verification')
    return true // In development, skip verification
  }

  try {
    const { Receiver } = await import("@upstash/qstash")
    const receiver = new Receiver({
      currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
    })

    await receiver.verify({
      signature,
      body,
    })

    return true
  } catch (error) {
    console.error('QStash signature verification failed:', error)
    return false
  }
}

/**
 * Schedule a one-time call for a specific form
 */
export async function scheduleFormCall(
  formId: string,
  scheduledFor: Date
): Promise<string> {
  if (!QSTASH_TOKEN) {
    throw new Error('QStash not configured')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  
  if (!baseUrl) {
    throw new Error('APP_URL not configured')
  }

  const url = baseUrl.startsWith('http')
    ? `${baseUrl}/api/jobs/call-form`
    : `https://${baseUrl}/api/jobs/call-form`

  const delaySeconds = Math.floor((scheduledFor.getTime() - Date.now()) / 1000)

  if (delaySeconds <= 0) {
    throw new Error('Scheduled time must be in the future')
  }

  try {
    const result = await qstashClient.publishJSON({
      url,
      body: { formId },
      delay: delaySeconds,
    })

    console.log(`Scheduled call for form ${formId} in ${delaySeconds}s`)
    return result.messageId
  } catch (error) {
    console.error('Failed to schedule form call:', error)
    throw error
  }
}

