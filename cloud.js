const SUPABASE_URL = "https://qoffylaknlkadkryyfqq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wKjWbotyB74WxGk1NVBm0w_I4Fox1Fn";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

async function sendCloudReport(name) {
    if (!name || name.trim() === "" || !supabaseClient) return;
    const cleanName = name.trim();
    
    let cleanEmail = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    cleanEmail = cleanEmail.replace(/(inc|bv|ltd)$/, '');
    const autoMail = `privacy@${cleanEmail || 'spambank'}.com`;

    const { data: existing } = await supabaseClient.from('shame_list').select('*').eq('name', cleanName).maybeSingle();

    if (existing) {
        const newReports = parseInt(existing.reports || 0) + 1;
        await supabaseClient.from('shame_list').update({ reports: newReports }).eq('id', existing.id);
    } else {
        await supabaseClient.from('shame_list').insert([{ name: cleanName, reports: 1, email: autoMail }]);
    }
}
window.sendCloudReport = sendCloudReport;
