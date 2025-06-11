import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, fullName, role } = await req.json();

    if (!email || !password || !fullName || !role) {
      throw new Error("Missing required fields: email, password, full name, and role are all required.");
    }

    // Step 1: Create the user in Supabase Auth.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // User will need to confirm their email.
      user_metadata: { full_name: fullName, role: role },
    });

    if (authError) throw authError;

    const newUserId = authData.user.id;

    // Step 2: Create the user's profile.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: newUserId, full_name: fullName, role: role });

    if (profileError) {
      // If profile creation fails, delete the auth user to prevent orphaned accounts.
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Step 3: If the user is a parent or admin, create a family for them.
    if (role === 'parent' || role === 'admin') {
      const { data: familyData, error: familyError } = await supabaseAdmin
        .from('families')
        .insert({ family_name: `${fullName}'s Family` })
        .select()
        .single();
      
      if (familyError) {
        // Attempt to clean up if family creation fails.
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw new Error(`Failed to create family: ${familyError.message}`);
      }

      // Step 4: Link the new family to the user's profile.
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ family_id: familyData.id })
        .eq('id', newUserId);
      
      if (updateProfileError) {
        // Attempt to clean up if the final update fails.
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw new Error(`Failed to link profile to family: ${updateProfileError.message}`);
      }
    }
    
    return new Response(JSON.stringify({ message: 'User created successfully! Please check email for confirmation.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Use 400 for client-side errors, 500 for server
    });
  }
});