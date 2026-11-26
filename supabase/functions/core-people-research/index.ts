import { createHandler } from "./handler.mjs";

Deno.serve(createHandler({
  supabaseUrl: Deno.env.get("SUPABASE_URL")!,
  anonKey: Deno.env.get("SUPABASE_ANON_KEY")!,
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  allowedOrigins: (Deno.env.get("CORE_ALLOWED_ORIGINS") || "https://cowboys-core-library.perhardt7686.chatgpt.site").split(",").map(s=>s.trim()).filter(Boolean),
}));
