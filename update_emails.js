require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function updateEmails() {
  let page = 1;
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error(error);
      break;
    }
    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      if (user.email.includes("@bimbel.com") || user.email.includes("@alhanif.com")) {
        let newEmail = user.email.replace("@bimbel.com", "@alhanif.online").replace("@alhanif.com", "@alhanif.online");
        const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
          email: newEmail,
          email_confirm: true // keep them confirmed
        });
        if (updateError) {
          console.log(`Failed to update ${user.email} -> ${newEmail}: ${updateError.message}`);
        } else {
          console.log(`Updated ${user.email} -> ${newEmail}`);
        }
      }
    }
    if (users.length < 100) break;
    page++;
  }
  console.log("Done.");
}

updateEmails();
