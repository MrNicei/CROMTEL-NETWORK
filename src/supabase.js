import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iocuukawaklxwzoohhdc.supabase.co';

const supabasePublishableKey = 'sb_publishable_vc4PZgf31O3oSPK3m5o8UA_pd2D-hB6';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
