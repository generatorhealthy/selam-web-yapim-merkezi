// Temporary script to trigger sitemap update
import { supabase } from './src/integrations/supabase/client.js';

const updateSitemap = async () => {
  try {
    console.log('Triggering sitemap update...');
    
    const { data, error } = await supabase.functions.invoke('generate-sitemap', {
      body: { trigger: 'manual_update' }
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Sitemap updated successfully:', data);
  } catch (error) {
    console.error('Failed to update sitemap:', error);
  }
};

updateSitemap();