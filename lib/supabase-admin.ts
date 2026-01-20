// lib/supabase-admin.ts
// Admin client with service role key for server-side operations

import { createClient } from "@supabase/supabase-js";

// Don't throw errors at import time - use empty strings as fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Create admin client with service role key
export const supabaseAdmin = createClient(
	supabaseUrl || "https://placeholder.supabase.co",
	serviceRoleKey ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTE5MjgwMCwiZXhwIjoxOTYwNzY4ODAwfQ.placeholder",
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);
