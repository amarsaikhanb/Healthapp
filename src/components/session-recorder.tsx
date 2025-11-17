"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { createSession, updateSessionTranscript, endSession } from "@/app/actions/session"
import { useRouter } from "next/navigation"

interface SessionRecorderProps {
  patientId: string
  patientName: string
  autoStart?: boolean
}

export function SessionRecorder({ patientId, patientName, autoStart = true }: SessionRecorderProps) {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isInitializing, setIsInitializing] = useState(autoStart)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasStartedRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up')
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      setError(null)
      setIsInitializing(true)
      
      // Create session in database
      console.log('Creating session for patient:', patientId)
      const sessionResult = await createSession(patientId)
      console.log('Session result:', sessionResult)
      
      if (!sessionResult.success || !sessionResult.data) {
        setError(sessionResult.error || "Failed to create session")
        setIsInitializing(false)
        return
      }
      
      const newSessionId = sessionResult.data.id
      console.log('New session ID:', newSessionId)
      setSessionId(newSessionId)
      sessionIdRef.current = newSessionId

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })
      
      // Check supported MIME types
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      }
      
      console.log('Using MIME type:', mimeType)
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Wait a bit to ensure all data is collected
        setTimeout(async () => {
          await processRecording()
        }, 100)
      }

      // Start recording - request data every 1 second
      mediaRecorder.start(1000)
      
      // Set states
      setIsRecording(true)
      setRecordingTime(0)
      setIsInitializing(false)

      // Start timer immediately
      let elapsed = 0
      timerRef.current = setInterval(() => {
        elapsed += 1
        setRecordingTime(elapsed)
        console.log('Timer tick:', elapsed)
      }, 1000)
      
      console.log('Recording started, timer set')

    } catch (err) {
      console.error("Recording error:", err)
      setError(err instanceof Error ? err.message : "Failed to start recording")
      setIsInitializing(false)
    }
  }
  
  // Auto-start recording on mount if autoStart is true
  useEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      hasStartedRef.current = true
      // Start immediately
      startRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  const stopRecording = () => {
    console.log('Stopping recording')
    
    // Stop timer first
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
      console.log('Timer stopped')
    }
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      console.log('MediaRecorder stopped')
    }
    
    setIsRecording(false)
  }

  const processRecording = async () => {
    console.log('Processing recording, chunks:', audioChunksRef.current.length)
    console.log('Session ID (state):', sessionId)
    console.log('Session ID (ref):', sessionIdRef.current)
    
    const currentSessionId = sessionIdRef.current
    
    if (!currentSessionId) {
      setError("No session ID. Please start a new session.")
      console.error('Session ID is missing')
      return
    }
    
    if (audioChunksRef.current.length === 0) {
      setError("No audio data recorded. Please try again and ensure your microphone is working.")
      return
    }

    setIsProcessing(true)

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      console.log('Audio blob size:', audioBlob.size, 'bytes')
      
      if (audioBlob.size === 0) {
        throw new Error("Audio file is empty")
      }
      
      // Convert to format suitable for OpenAI (mp3 or wav)
      // For now, send webm directly (Whisper supports it)
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      // Send to transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const { transcript: transcriptText } = await response.json()
      setTranscript(transcriptText)

      // Update session with transcript
      await updateSessionTranscript(currentSessionId, transcriptText)

      // End the session
      await endSession(currentSessionId)

      // Success!
      setTimeout(() => {
        router.push(`/dashboard/patients/${patientId}`)
      }, 2000)

    } catch (err) {
      console.error("Processing error:", err)
      setError(err instanceof Error ? err.message : "Failed to process recording")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Recording Controls */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Audio Recording</CardTitle>
          <CardDescription>
            Record your consultation and get an AI-powered transcript
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isRecording && (
                <Badge variant="destructive" className="gap-1 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  Recording
                </Badge>
              )}
              {isProcessing && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing
                </Badge>
              )}
              {transcript && !isProcessing && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Complete
                </Badge>
              )}
            </div>
            
            {isRecording && (
              <div className="text-2xl font-mono font-bold">
                {formatTime(recordingTime)}
              </div>
            )}
          </div>

          {/* Recording Button */}
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            {isInitializing && (
              <>
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Starting session...
                </p>
              </>
            )}

            {!isInitializing && !isRecording && !isProcessing && !transcript && (
              <Button
                size="lg"
                onClick={startRecording}
                className="h-24 w-24 rounded-full"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}

            {isRecording && (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="h-24 w-24 rounded-full"
              >
                <Square className="h-8 w-8" />
              </Button>
            )}

            {isProcessing && (
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}

            {transcript && !isProcessing && (
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            )}

            {!isInitializing && (
              <p className="text-sm text-muted-foreground text-center">
                {!isRecording && !isProcessing && !transcript && "Click to start recording"}
                {isRecording && "Recording in progress - Click stop when finished"}
                {isProcessing && "Transcribing with AI..."}
                {transcript && !isProcessing && "Session saved! Redirecting..."}
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setError(null)
                    setTranscript("")
                    setSessionId(null)
                    audioChunksRef.current = []
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="space-y-2">
              <h3 className="font-semibold">Transcript:</h3>
              <div className="p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Patient</p>
            <p className="text-sm text-muted-foreground">{patientName}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">Session ID</p>
            <p className="text-xs text-muted-foreground font-mono">
              {sessionId ? sessionId.slice(0, 8) + '...' : 'Not started'}
            </p>
          </div>

          {recordingTime > 0 && (
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(recordingTime)}
              </p>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Speak clearly and ensure minimal background noise for best transcription results.
            </p>
            {isInitializing && (
              <p className="text-xs text-blue-600 font-medium">
                📱 Please allow microphone access when prompted
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

