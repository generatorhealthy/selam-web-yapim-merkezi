import { supabase } from '@/integrations/supabase/client';
import { PRIVATE_FILE_URL_TTL, privateStoragePath, type PrivateBucket } from './privateStoragePath';

export async function privateFileUrl(value: string, bucket: PrivateBucket): Promise<string> {
  const origin = import.meta.env.VITE_SUPABASE_URL;
  const path = privateStoragePath(value, bucket, origin);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Belgeyi açmak için giriş yapmalısınız.');
  // Storage validates the current user's RLS before signing; no service-role bypass.
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, PRIVATE_FILE_URL_TTL);
  if (error || !data?.signedUrl) throw new Error('Belgeye erişim izni doğrulanamadı.');
  return data.signedUrl;
}