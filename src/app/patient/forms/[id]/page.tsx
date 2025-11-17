import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { FillFormClient } from "@/components/fill-form-client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FillFormPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get form with questions
  const { data: form, error: formError } = await supabase
    .from("form")
    .select(`
      *,
      doctor:doctor_id(name)
    `)
    .eq("id", id)
    .eq("patient_id", user.id)
    .single()

  if (formError || !form) {
    notFound()
  }

  // Get questions
  const { data: questions } = await supabase
    .from("question")
    .select("*")
    .eq("form_id", id)
    .order("question_order", { ascending: true })

  // Get existing answers
  const { data: answers } = await supabase
    .from("answer")
    .select("*")
    .eq("form_id", id)

  return (
    <FillFormClient
      form={form}
      questions={questions || []}
      existingAnswers={answers || []}
    />
  )
}

