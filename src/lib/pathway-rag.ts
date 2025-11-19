/**
 * Pathway RAG Client for Patient Data
 * Provides interface to query patient-specific medical data using RAG
 */

export interface RAGQuery {
  messages: string;
  patientId: string;
}

export interface RAGResponse {
  result: string;
  sources?: string[];
}

/**
 * Send a query to the Pathway RAG service
 */
export async function queryPatientRAG(
  patientId: string,
  message: string
): Promise<RAGResponse> {
  const PATHWAY_RAG_URL = process.env.NEXT_PUBLIC_PATHWAY_RAG_URL || "http://localhost:8011";
  
  try {
    const response = await fetch(PATHWAY_RAG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: message,
        patientId: patientId,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to query RAG:", error);
    throw error;
  }
}

interface PatientData {
  name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  created_at: string;
}

interface SessionData {
  id: string;
  created_at: string;
  summary?: string;
  transcript?: string;
  inferences?: string[];
  medications?: string[];
}

interface FormData {
  id: string;
  title: string;
  created_at: string;
  submitted_at?: string;
  questions?: Array<{ id: string; question_text: string }>;
  answers?: Array<{ question_id: string; answer_text: string }>;
}

/**
 * Export patient data for RAG indexing
 * This generates a comprehensive document for each patient
 */
export function generatePatientDocument(
  patient: PatientData, 
  sessions: SessionData[], 
  forms: FormData[]
): string {
  console.log("patient", patient);
  console.log("sessions", sessions);
  console.log("forms", forms);
  let document = `Patient Profile:\n`;
  document += `Name: ${patient.name}\n`;
  document += `Email: ${patient.email}\n`;
  document += `Phone: ${patient.phone_number}\n`;
  document += `Date of Birth: ${patient.date_of_birth}\n`;
  document += `Created: ${new Date(patient.created_at).toLocaleDateString()}\n\n`;

  // Add sessions
  if (sessions && sessions.length > 0) {
    document += `\nSession History (${sessions.length} sessions):\n\n`;
    sessions.forEach((session, idx) => {
      document += `Session ${idx + 1} - ${new Date(session.created_at).toLocaleDateString()}:\n`;
      if (session.summary) {
        document += `Summary: ${session.summary}\n`;
      }
      if (session.transcript) {
        document += `Transcript:\n${session.transcript}\n`;
      }
      if (session.inferences && session.inferences.length > 0) {
        document += `Clinical Inferences:\n`;
        session.inferences.forEach((inf: string) => {
          document += `- ${inf}\n`;
        });
      }
      if (session.medications && session.medications.length > 0) {
        document += `Medications Discussed:\n`;
        session.medications.forEach((med: string) => {
          document += `- ${med}\n`;
        });
      }
      document += `\n`;
    });
  }

  // Add forms
  if (forms && forms.length > 0) {
    document += `\nForms (${forms.length} total):\n\n`;
    forms.forEach((form, idx) => {
      document += `Form ${idx + 1}: ${form.title}\n`;
      document += `Created: ${new Date(form.created_at).toLocaleDateString()}\n`;
      if (form.submitted_at) {
        document += `Submitted: ${new Date(form.submitted_at).toLocaleDateString()}\n`;
        if (form.questions && form.answers) {
          document += `Responses:\n`;
          form.questions.forEach((q) => {
            const answer = form.answers?.find((a) => a.question_id === q.id);
            document += `Q: ${q.question_text}\n`;
            document += `A: ${answer?.answer_text || "No answer"}\n`;
          });
        }
      }
      document += `\n`;
    });
  }

  return document;
}

