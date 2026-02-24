const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kqxkbzwbcggwdcvkmx.supabase.co';
const supabaseKey = 'sb_publishable_EoYaLZeO3oX44My-vSfbpw_iqVPsh4X';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;