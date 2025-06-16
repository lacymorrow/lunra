#!/usr/bin/env node

const readline = require('readline');

async function resetDatabase() {
  console.log('🔄 Database Reset Tool');
  console.log('⚠️  This will delete ALL data in your database!');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('Are you sure you want to reset the database? Type "RESET_DATABASE" to confirm: ', async (answer) => {
      rl.close();

      if (answer !== 'RESET_DATABASE') {
        console.log('❌ Reset cancelled');
        resolve(false);
        return;
      }

            try {
        console.log('🔄 Calling reset API...');

        // Try common ports
        const ports = ['3001', '3000'];
        let response = null;
        let lastError = null;

        for (const port of ports) {
          const url = `http://localhost:${port}/api/dev/reset-database`;
          console.log(`🔗 Trying ${url}...`);

          try {
            response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ confirm: 'RESET_DATABASE' }),
            });

            // If we get a response (even if error), break out of loop
            if (response) {
              break;
            }
          } catch (fetchError) {
            lastError = fetchError;
            console.log(`❌ Port ${port} failed: ${fetchError.message}`);
          }
        }

        if (!response) {
          console.error('❌ Could not connect to any port. Make sure the dev server is running.');
          console.error('❌ Last error:', lastError?.message);
          resolve(false);
          return;
        }

        const text = await response.text();
        console.log(`📄 Response status: ${response.status}`);
        console.log(`📄 Response text: ${text}`);

        let result;
        try {
          result = JSON.parse(text);
        } catch (jsonError) {
          console.error('❌ Reset failed - invalid JSON response:');
          console.error('📄 Raw response:', text);
          resolve(false);
          return;
        }

        if (response.ok) {
          console.log('✅', result.message);
          console.log('');
          console.log('🔧 Next steps:');
          console.log('1. If you need to recreate the schema, run your SQL scripts through Supabase dashboard or CLI');
          console.log('2. Your existing schema should still be intact - only data was cleared');
          console.log('3. You can now sign up and start using the app with a clean database');
        } else {
          console.error('❌ Reset failed:', result.error || result.message);
        }

        resolve(response.ok);
      } catch (error) {
        console.error('❌ Error calling reset API:', error.message);
        resolve(false);
      }
    });
  });
}

// Check if we're in development
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Database reset is not allowed in production');
  process.exit(1);
}

resetDatabase().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
