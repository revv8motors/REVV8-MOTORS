// Lets a signed-in admin update their own email and/or password.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    const admin = createClient(url, service);
    const { data: roleRow } = await admin
      .from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Admins only" }, 403);

    const { email, password, currentPassword } = await req.json();
    if (!email && !password) return json({ error: "Nothing to update" }, 400);
    if (!currentPassword) return json({ error: "Current password required" }, 400);

    // Verify current password
    const verify = createClient(url, anon);
    const { error: signInErr } = await verify.auth.signInWithPassword({
      email: userData.user.email!,
      password: currentPassword,
    });
    if (signInErr) return json({ error: "Current password is incorrect" }, 400);

    const updates: Record<string, unknown> = {};
    if (email) { updates.email = email; updates.email_confirm = true; }
    if (password) updates.password = password;

    const { error } = await admin.auth.admin.updateUserById(userId, updates);
    if (error) return json({ error: error.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
