import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleConfirmation, type ConfirmationPorts } from './handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const database = () => createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const ports: ConfirmationPorts = {
  identity: async req => {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    const {data, error} = await database().auth.getUser(token);
    return error ? null : data.user;
  },
  appointment: async id => {
    const {data, error} = await database().from('appointments').select('id,specialist_id,patient_name,patient_email,appointment_date,appointment_time,status').eq('id', id).maybeSingle();
    if (error) throw new Error('Appointment unavailable');
    return data;
  },
  ownsSpecialist: async (userId, specialistId) => {
    const {data, error} = await database().from('specialists').select('id').eq('id', specialistId).eq('user_id', userId).maybeSingle();
    return !error && !!data;
  },
  claim: async id => {
    const {error} = await database().from('appointment_delivery_claims').insert({appointment_id: id, channel: 'patient_confirmation_email'});
    if (error?.code === '23505') return false;
    if (error) throw new Error('Claim unavailable');
    return true;
  },
  deliver: async (email, name, html) => {
    const key = Deno.env.get('BREVO_API_KEY');
    if (!key) return false;
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'api-key': key},
      body: JSON.stringify({sender: {email: 'info@doktorumol.com.tr', name: 'Doktorumol'}, to: [{email, name}], subject: 'Randevu kaydınız oluşturuldu', htmlContent: html}),
    });
    await response.body?.cancel();
    return response.ok;
  },
  mark: async (id, status) => {
    const {error} = await database().from('appointment_delivery_claims').update({status, updated_at: new Date().toISOString()}).eq('appointment_id', id).eq('channel', 'patient_confirmation_email');
    if (error) throw new Error('Claim status unavailable');
  },
};
serve(req => handleConfirmation(req, ports, corsHeaders));
