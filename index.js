const PhotoOxyEnhanced = require('./photooxy-enhanced');

async function testPhotoOxy() {
    const photoOxy = new PhotoOxyEnhanced('https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html');
    photoOxy.setText(['Hello World']);
    
    try {
        const result = await photoOxy.execute();
        console.log('Success:', result);
    } catch (error) {
        console.error('Failed:', error.message);
    }
}

testPhotoOxy();
