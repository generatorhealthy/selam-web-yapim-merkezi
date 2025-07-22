import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log(`${req.method} request received at ${new Date().toISOString()}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user making the request is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the user has admin role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role, is_approved')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin' || !userProfile.is_approved) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, userId, userData } = requestBody;

    if (action === 'updateUser') {
      // Update user in auth.users table
      const updateData: any = {}
      
      if (userData.email) {
        updateData.email = userData.email
      }
      
      if (userData.password && userData.password.length >= 6) {
        updateData.password = userData.password
      }

      // Update auth user
      if (Object.keys(updateData).length > 0) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        )

        if (authUpdateError) {
          console.error('Auth update error:', authUpdateError)
          return new Response(
            JSON.stringify({ error: `Auth update failed: ${authUpdateError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Update user profile
      const profileUpdateData: any = {}
      if (userData.role) profileUpdateData.role = userData.role
      if (typeof userData.is_approved === 'boolean') profileUpdateData.is_approved = userData.is_approved
      if (userData.email) profileUpdateData.email = userData.email

      if (Object.keys(profileUpdateData).length > 0) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from('user_profiles')
          .update(profileUpdateData)
          .eq('user_id', userId)

        if (profileUpdateError) {
          console.error('Profile update error:', profileUpdateError)
          return new Response(
            JSON.stringify({ error: `Profile update failed: ${profileUpdateError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ message: 'User updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'deleteUser') {
      // Delete user from auth.users table (this will cascade to user_profiles due to foreign key)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('User deletion error:', deleteError)
        return new Response(
          JSON.stringify({ error: `User deletion failed: ${deleteError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'User deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})