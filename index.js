const { PhotoOxyFixed, PhotoOxyWrapper } = require('./photooxy-enhanced');

async function testFixed() {
    // Method 1: Custom implementation
    const photoOxy = new PhotoOxyFixed('https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html');
    photoOxy.setText(['Hello World']);
    
    try {
        const result = await photoOxy.execute();
        console.log('Custom method result:', result);
    } catch (error) {
        console.log('Custom method failed, trying package...');
        
        // Method 2: Use the proven npm package
        try {
            const result = await PhotoOxyWrapper.createWithPackage(
                'https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html',
                'Hello World'
            );
            console.log('Package method result:', result);
        } catch (packageError) {
            console.error('Both methods failed:', packageError.message);
        }
    }
}

testFixed();
