import {
  createBrowserClient,
  createServerClient as supabaseServerClient,
} from "@supabase/ssr";
import { cookies } from "next/headers"; // <-- Import cookies

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// For server-side usage
export async function createServerClient() {
  const cookieStore = await cookies();

  return supabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore errors when setting cookies from Server Components
          }
        },
      },
    },
  );
}
