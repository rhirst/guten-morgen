import { supabase } from "@/lib/supabase";

export async function signInWithGoogle() {
  const basename = import.meta.env.VITE_BASENAME || "";
  const redirectTo = `${window.location.origin}${basename}/dashboard`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
