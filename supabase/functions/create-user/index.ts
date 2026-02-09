import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("No autenticado");

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Solo los administradores pueden crear usuarios");
    }

    const { email, password, inspector_name, emp_id, phone, role } = await req.json();

    if (!email || !password || !inspector_name || !role) {
      throw new Error("Campos obligatorios: email, password, inspector_name, role");
    }

    // Create auth user with email confirmed (no verification needed)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;

    // Create profile
    const { error: profileError } = await adminClient
      .from("profile")
      .insert({
        inspector_name,
        emp_id: emp_id || null,
        phone: phone || null,
        email,
        role,
      });
    if (profileError) throw profileError;

    // Assign role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: newUser.user!.id,
        role,
      });
    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user!.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
