const PhotoOxyFinalFix = require('./photooxy-enhanced');

async function testFinal() {
    console.log('🎯 Testing PhotoOxy Final Fix...\n');
    
    const effectUrl = 'https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html';
    const text = 'HELLO WORLD';
    
    try {
        const photoOxy = new PhotoOxyFinalFix(effectUrl);
        photoOxy.setText([text]);
        
        const result = await photoOxy.execute();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 FINAL RESULT');
        console.log('='.repeat(50));
        console.log('✅ Status:', result.status);
        console.log('🔗 Image URL:', result.imageUrl);
        console.log('💬 Message:', result.message);
        
        if (result.contentLength) {
            console.log('📏 File Size:', result.contentLength, 'bytes');
            console.log('📄 Content Type:', result.contentType);
        }
        
        if (result.isLikelyGenerated !== undefined) {
            console.log('🎨 Custom Generated:', result.isLikelyGenerated ? '✅ YES!' : '❌ NO (Template)');
        }
        
        if (result.warning) {
            console.log('⚠️  Warning:', result.warning);
        }
        
        if (result.debugInfo) {
            console.log('\n🔍 DEBUG INFO:');
            console.log('- Response Length:', result.debugInfo.responseLength);
            console.log('- Images Found:', result.debugInfo.imagesFound);
            console.log('- Forms Found:', result.debugInfo.formsFound);
            console.log('- Contains Processing:', result.debugInfo.containsProcessing);
        }
        
        // Test if the image URL actually works
        if (result.imageUrl) {
            console.log('\n🧪 Testing image accessibility...');
            const axios = require('axios');
            
            try {
                const testResponse = await axios.head(result.imageUrl, { timeout: 5000 });
                console.log('✅ Image is accessible');
                console.log('📊 Actual size:', testResponse.headers['content-length'], 'bytes');
                console.log('📄 Actual type:', testResponse.headers['content-type']);
            } catch (error) {
                console.log('❌ Image accessibility test failed:', error.message);
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('\n❌ Final test failed:', error.message);
        console.error('🔍 Error details:', error.stack);
        throw error;
    }
}

// Quick comparison test
async function compareWithPackage() {
    console.log('\n📦 Comparing with textmaker-thiccy package...\n');
    
    try {
        const thiccysapi = require('textmaker-thiccy');
        
        const packageResult = await thiccysapi.photooxy(
            "https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html",
            "HELLO WORLD"
        );
        
        console.log('📦 Package result:', packageResult);
        return packageResult;
        
    } catch (error) {
        console.log('📦 Package test failed:', error.message);
        if (error.message.includes('Cannot find module')) {
            console.log('💡 To install: npm install textmaker-thiccy');
        }
        return null;
    }
}

async function runComparison() {
    console.log('🚀 Running comparison test...\n');
    
    try {
        // Test custom implementation
        console.log('1️⃣ Testing custom implementation:');
        const customResult = await testFinal();
        
        // Test package implementation
        console.log('\n2️⃣ Testing package implementation:');
        const packageResult = await compareWithPackage();
        
        // Compare results
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPARISON SUMMARY');
        console.log('='.repeat(60));
        
        console.log('Custom Implementation:');
        console.log('  - Success:', customResult.status ? '✅' : '❌');
        console.log('  - Generated:', customResult.isLikelyGenerated ? '✅' : '❌');
        console.log('  - URL:', customResult.imageUrl?.substring(0, 60) + '...');
        
        console.log('\nPackage Implementation:');
        if (packageResult) {
            console.log('  - Success: ✅');
            console.log('  - URL:', packageResult.substring(0, 60) + '...');
        } else {
            console.log('  - Success: ❌ (Package not available)');
        }
        
        // Recommendation
        console.log('\n💡 RECOMMENDATION:');
        if (customResult.isLikelyGenerated) {
            console.log('✅ Custom implementation is working! Use PhotoOxyFinalFix.');
        } else if (packageResult) {
            console.log('📦 Use the textmaker-thiccy package for better results.');
        } else {
            console.log('⚠️ Both methods have issues. PhotoOxy may have updated their system.');
        }
        
    } catch (error) {
        console.error('💥 Comparison failed:', error.message);
    }
}

if (require.main === module) {
    runComparison();
}

module.exports = { testFinal, compareWithPackage };
