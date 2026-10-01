import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://akwdzwrkhpyhrrcyvkpx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EjqnCcOPSh6uoT9y-g2OFw_ACj0byDo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function bulkUpdateHours1() {
  console.log('Fetching all accounts from Supabase...');
  const { data: accounts, error } = await supabase.from('accounts').select('*');
  if (error) {
    console.error('Error fetching accounts:', error);
    process.exit(1);
  }

  console.log(`Found ${accounts.length} accounts. Updating 1-hour rate (hours1) to 80 for all accounts...`);

  let updatedCount = 0;
  for (const acc of accounts) {
    const accountData = acc.data || {};
    const oldHours1 = accountData.pricing?.hours1;
    
    accountData.pricing = {
      ...(accountData.pricing || {}),
      hours1: 80
    };

    const { error: updateError } = await supabase
      .from('accounts')
      .upsert({ id: acc.id, data: accountData });

    if (updateError) {
      console.error(`Failed to update account ${acc.id} (${accountData.name}):`, updateError);
    } else {
      console.log(`Updated [${acc.id}] "${accountData.name}": 1h was ₹${oldHours1} -> now ₹80`);
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount}/${accounts.length} accounts to ₹80/hour!`);

  // Verify by fetching again
  console.log('\n--- VERIFICATION ---');
  const { data: verified, error: verifyError } = await supabase.from('accounts').select('*');
  if (!verifyError && verified) {
    for (const v of verified) {
      console.log(`ID: ${v.id} | Name: ${v.data?.name} | hours1: ₹${v.data?.pricing?.hours1}`);
    }
  }
}

bulkUpdateHours1();
