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

    const { email, password, fullName, role, family_id } = await req.json();

    if (!family_id) throw new Error("The inviting user's family ID is missing.");
    
    // Step 1: Create the user's login. The trigger will automatically create their basic profile.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: role },
    });

    if (authError) throw authError;

    // Step 2: Now, I'll just update the profile created by the trigger to add the family_id.
    // This avoids the "duplicate key" error.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ family_id: family_id })
      .eq('id', authData.user.id);
    
    if (profileError) {
      // If the update fails, I'll delete the user to prevent orphan accounts.
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to update profile for invited user: ${profileError.message}`);
    }
    
    return new Response(JSON.stringify({ message: 'User invited successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in invite-member function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});