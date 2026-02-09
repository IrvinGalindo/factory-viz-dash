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

    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("No autenticado");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Solo los administradores pueden modificar usuarios");
    }

    const { profile_id, inspector_name, emp_id, phone, email, role } = await req.json();

    if (!profile_id || !inspector_name || !role) {
      throw new Error("Campos obligatorios: profile_id, inspector_name, role");
    }

    // Update profile
    const { error: profileError } = await adminClient
      .from("profile")
      .update({
        inspector_name,
        emp_id: emp_id || null,
        phone: phone || null,
        email,
        role,
      })
      .eq("id", profile_id);
    if (profileError) throw profileError;

    // Find auth user by email to update role
    const { data: profileData } = await adminClient
      .from("profile")
      .select("email")
      .eq("id", profile_id)
      .single();

    if (profileData?.email) {
      const { data: { users } } = await adminClient.auth.admin.listUsers();
      const authUser = users?.find((u: any) => u.email === profileData.email);
      
      if (authUser) {
        // Delete old role and insert new one
        await adminClient.from("user_roles").delete().eq("user_id", authUser.id);
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: authUser.id, role });
        if (roleError) throw roleError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
