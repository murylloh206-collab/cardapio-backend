const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://acbydgxfeejppogdulcw.supabase.co';
const supabaseKey = 'sb_publishable_8hv1iq5wsRvjb25TP7jndQ_iGTeVhYJ';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;