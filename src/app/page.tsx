import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/roles"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Redirect based on user role
  const role = await getUserRole()
  
  if (role === "doctor") {
    redirect("/dashboard")
  } else if (role === "patient") {
    redirect("/patient/dashboard")
  } else {
    // User exists but no role assigned
    redirect("/login?error=no-role")
  }
}

