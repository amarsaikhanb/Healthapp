"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Send, Mic, Square } from "lucide-react"
import Link from "next/link"
import { submitFormAnswers } from "@/app/actions/forms"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"

interface Form {
  id: string
  title: string
  created_at: string
  submitted_at: string | null
  doctor: {
    name: string
  } | null
}

interface Question {
  id: string
  question_text: string
  question_order: number
}

interface Answer {
  id: string
  question_id: string
  answer_text: string | null
}

interface FillFormClientProps {
  form: Form
  questions: Question[]
  existingAnswers: Answer[]
}

export function FillFormClient({ form, questions, existingAnswers }: FillFormClientProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    existingAnswers.forEach((answer) => {
      initial[answer.question_id] = answer.answer_text || ""
    })
    return initial
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const recognitionRef = useRef<any>(null)
  const shouldStopRef = useRef(false)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let interimText = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += transcript + ' '
          } else {
            interimText += transcript
          }
        }

        // Show interim results in real-time
        if (interimText) {
          setInterimTranscript(interimText)
          console.log('Interim:', interimText)
        }

        // Add final results to the answer
        if (finalText && recordingQuestionId) {
          console.log('Final transcribed:', finalText)
          setAnswers((prev) => ({
            ...prev,
            [recordingQuestionId]: (prev[recordingQuestionId] || '') + finalText
          }))
          setInterimTranscript('') // Clear interim after final
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        // Treat most errors as non-fatal warnings; only surface real problems
        if (event.error === 'not-allowed') {
          console.error('Speech recognition error:', event.error)
          setError('Microphone access denied. Please allow microphone access in your browser.')
          setIsListening(false)
          setRecordingQuestionId(null)
          shouldStopRef.current = true
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, but continuing...')
          // Don't stop on no-speech, just continue
        } else if (event.error === 'aborted') {
          // This often happens when we intentionally stop or switch questions.
          // Log as a debug message but do NOT treat as an error.
          console.log('Speech recognition aborted (expected when stopping or switching questions)')
        } else {
          console.log(`Speech recognition warning: ${event.error}`)
          // Other errors are non-fatal; keep going
        }
      }

      recognitionRef.current.onend = () => {
        console.log('Recognition ended, shouldStop:', shouldStopRef.current)
        // Only auto-restart if we didn't manually stop
        if (!shouldStopRef.current && isListening && recordingQuestionId) {
          console.log('Auto-restarting recognition...')
          setTimeout(() => {
            try {
              if (!shouldStopRef.current) {
                recognitionRef.current?.start()
              }
            } catch (err) {
              console.error('Auto-restart failed:', err)
              setIsListening(false)
            }
          }, 100)
        } else {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [recordingQuestionId])

  const startVoiceInput = async (questionId: string) => {
    if (!recognitionRef.current) {
      setError('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      shouldStopRef.current = false // Reset stop flag
      setRecordingQuestionId(questionId)
      setIsListening(true)
      setError(null)
      
      try {
        recognitionRef.current.start()
        console.log('Started recognition for question:', questionId)
      } catch (err) {
        console.error('Recognition start error:', err)
        // If already started, that's okay
        if ((err as any).message?.includes('already started')) {
          console.log('Recognition already started, continuing...')
        } else {
          throw err
        }
      }
    } catch (err) {
      console.error('Microphone error:', err)
      setError('Microphone access denied. Please allow microphone access in your browser settings.')
      setIsListening(false)
      setRecordingQuestionId(null)
      shouldStopRef.current = true
    }
  }

  const stopVoiceInput = () => {
    console.log('Stopping voice input manually')
    shouldStopRef.current = true // Set flag to prevent auto-restart
    
    // Save any remaining interim transcript before stopping
    if (interimTranscript && recordingQuestionId) {
      console.log('Saving interim transcript:', interimTranscript)
      setAnswers((prev) => ({
        ...prev,
        [recordingQuestionId]: (prev[recordingQuestionId] || '') + interimTranscript + ' '
      }))
    }
    
    setIsListening(false)
    setRecordingQuestionId(null)
    setInterimTranscript('')
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    } catch (err) {
      console.error('Stop recognition error:', err)
    }
  }

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const answersArray = Object.entries(answers).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }))

      const result = await submitFormAnswers(form.id, answersArray)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/patient/dashboard")
        }, 2000)
      } else {
        setError(result.error || "Failed to submit form")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const isReadOnly = form.submitted_at !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/patient/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{form.title}</h1>
            <p className="text-muted-foreground">
              {form.doctor ? `From Dr. ${form.doctor.name}` : 'From your doctor'}
            </p>
          </div>
          {form.submitted_at && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Submitted
            </Badge>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    Form submitted successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Please answer all questions</CardTitle>
            <CardDescription>
              {isReadOnly
                ? "This form has been submitted. You can view your answers below."
                : "Your responses will be shared with your doctor"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id} className="text-base">
                    {index + 1}. {question.question_text}
                  </Label>
                  <div className="relative">
                    <Textarea
                      id={question.id}
                      value={
                        recordingQuestionId === question.id && interimTranscript
                          ? (answers[question.id] || "") + interimTranscript
                          : (answers[question.id] || "")
                      }
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      placeholder="Type your answer or use the microphone..."
                      disabled={loading || isReadOnly}
                      rows={4}
                      className="resize-none pr-12"
                    />
                    {!isReadOnly && (
                      <div className="absolute right-2 bottom-2">
                        {recordingQuestionId === question.id && isListening ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            onClick={stopVoiceInput}
                            className="h-8 w-8 rounded-full animate-pulse"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => startVoiceInput(question.id)}
                            disabled={loading}
                            className="h-8 w-8 rounded-full"
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {recordingQuestionId === question.id && isListening && (
                    <div className="space-y-1">
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        {interimTranscript ? 'Hearing you...' : 'Listening... (speak clearly)'}
                      </p>
                      {interimTranscript && (
                        <p className="text-xs text-green-600 font-medium">
                          Currently hearing: "{interimTranscript}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        💡 Speak clearly and click stop when finished
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-destructive underline"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {!isReadOnly && (
                <div className="flex justify-end gap-2">
                  <Link href="/patient/dashboard">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Form
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isReadOnly && (
                <div className="flex justify-end">
                  <Link href="/patient/dashboard">
                    <Button variant="outline">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


