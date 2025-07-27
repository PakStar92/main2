const PhotoOxyRealFix = require('./photooxy-enhanced');

async function testRealFix() {
    console.log('🧪 Testing PhotoOxy Real Fix...\n');
    
    const effectUrl = 'https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html';
    const text = 'HELLO WORLD';
    
    try {
        const photoOxy = new PhotoOxyRealFix(effectUrl);
        photoOxy.setText([text]);
        
        const result = await photoOxy.execute();
        
        console.log('\n🎉 RESULT:');
        console.log('=========');
        console.log('Status:', result.status);
        console.log('Image URL:', result.imageUrl);
        console.log('Message:', result.message);
        
        if (result.contentType) {
            console.log('Content Type:', result.contentType);
            console.log('File Size:', result.contentLength, 'bytes');
        }
        
        if (result.isLikelyGenerated !== undefined) {
            console.log('Likely Generated:', result.isLikelyGenerated ? '✅ YES' : '❌ NO');
        }
        
        if (result.warning) {
            console.log('Warning:', result.warning);
        }
        
        if (result.debugInfo) {
            console.log('\n🔍 DEBUG INFO:');
            console.log('All images found:', result.debugInfo.allImages?.length || 0);
            if (result.debugInfo.allImages) {
                result.debugInfo.allImages.forEach((img, i) => {
                    console.log(`  ${i + 1}. ${img.fullSrc}`);
                });
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    }
}

// Also test with a simpler effect
async function testSimpleEffect() {
    console.log('\n🧪 Testing with simpler effect...\n');
    
    const simpleEffectUrl = 'https://photooxy.com/logo-and-text-effects/butterfly-text-with-reflection-effect-183.html';
    const text = 'TEST';
    
    try {
        const photoOxy = new PhotoOxyRealFix(simpleEffectUrl);
        photoOxy.setText([text]);
        
        const result = await photoOxy.execute();
        
        console.log('\n🎉 SIMPLE EFFECT RESULT:');
        console.log('========================');
        console.log('Status:', result.status);
        console.log('Image URL:', result.imageUrl);
        console.log('Likely Generated:', result.isLikelyGenerated ? '✅ YES' : '❌ NO');
        
        return result;
        
    } catch (error) {
        console.error('❌ Simple effect test failed:', error.message);
        return null;
    }
}

// Run tests
async function runAllTests() {
    try {
        console.log('🚀 Starting comprehensive PhotoOxy tests...\n');
        
        // Test 1: Main effect
        const result1 = await testRealFix();
        
        // Test 2: Simple effect
        const result2 = await testSimpleEffect();
        
        console.log('\n📊 SUMMARY:');
        console.log('===========');
        console.log('Main effect success:', result1.status ? '✅' : '❌');
        console.log('Simple effect success:', result2?.status ? '✅' : '❌');
        
        if (result1.isLikelyGenerated || result2?.isLikelyGenerated) {
            console.log('\n🎉 SUCCESS: At least one test generated a custom image!');
        } else {
            console.log('\n⚠️  WARNING: Both tests may have returned template images');
            console.log('This suggests PhotoOxy may have changed their submission process');
        }
        
    } catch (error) {
        console.error('\n💥 All tests failed:', error.message);
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = { testRealFix, testSimpleEffect };
