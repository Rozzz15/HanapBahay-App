/**
 * Ultimate Cloud Test
 * Actually tries to upload a small file to verify Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.log("❌ Missing Supabase credentials in .env.local");
        return;
    }

    const supabase = createClient(url, key);
    const testFileName = `test-${Date.now()}.txt`;

    console.log("📤 Attempting real upload to 'property-images'...");

    const { data, error } = await supabase.storage
        .from('property-images')
        .upload(testFileName, 'Hello Cloud!', {
            contentType: 'text/plain'
        });

    if (error) {
        console.log("❌ UPLOAD FAILED!");
        console.log("Error:", error.message);
        if (error.message.includes('not found')) {
            console.log("💡 Double check that your bucket name is exactly 'property-images'");
        }
    } else {
        console.log("✅ UPLOAD SUCCESSFUL!");
        console.log("Path:", data.path);

        const { data: urlData } = supabase.storage
            .from('property-images')
            .getPublicUrl(testFileName);

        console.log("🔗 Public URL:", urlData.publicUrl);
        console.log("\n🎊 Your app is 100% READY for the cloud!");

        // Cleanup
        await supabase.storage.from('property-images').remove([testFileName]);
    }
}

test();
