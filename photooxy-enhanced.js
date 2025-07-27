const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

class PhotoOxyFixed {
    constructor(effectUrl = 'https://photooxy.com/logo-and-text-effects/shadow-text-effect-in-the-sky-394.html') {
        if (!effectUrl.includes('photooxy.com')) {
            throw new Error('Invalid URL: Must be a photooxy.com URL');
        }
        
        this.effectUrl = effectUrl;
        this.inputTexts = ['Sample'];
        this.sessionCookies = [];
        this.baseUrl = new URL(effectUrl).origin;
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    setText(text) {
        this.inputTexts = Array.isArray(text) ? text : [text];
    }

    async execute() {
        try {
            console.log('🚀 PhotoOxy Fixed execution started...');
            console.log('📍 URL:', this.effectUrl);
            console.log('📝 Input Texts:', this.inputTexts);

            // Step 1: Get initial page and form data
            const initialData = await this.getInitialData();
            
            // Step 2: Submit to build server (this is the key!)
            const buildResult = await this.submitToBuildServer(initialData);
            
            // Step 3: Get the generated image
            const finalResult = await this.getFinalImage(buildResult);
            
            console.log('✅ Process completed successfully!');
            return finalResult;

        } catch (error) {
            console.error('❌ PhotoOxy execution failed:', error.message);
            console.error('🔍 Details:', error.response?.data?.slice(0, 500) || error.stack);
            throw error;
        }
    }

    async getInitialData() {
        console.log('\n📥 Step 1: Getting initial page data...');
        
        const response = await axios.get(this.effectUrl, {
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000
        });

        console.log('✅ Initial page loaded, status:', response.status);
        
        // Store cookies
        if (response.headers['set-cookie']) {
            this.sessionCookies = response.headers['set-cookie'];
            console.log('🍪 Session cookies stored');
        }

        const $ = cheerio.load(response.data);
        
        // Extract the critical form data for PhotoOxy
        const formData = {
            // Extract build server URL - this is crucial!
            buildServer: $('input[name="build_server"]').val() || 
                        $('input[name="server"]').val() ||
                        $('#build_server').val(),
            
            // Extract build server ID
            buildServerId: $('input[name="build_server_id"]').val() || '1',
            
            // Extract token
            token: $('input[name="token"]').val() || 
                  $('meta[name="csrf-token"]').attr('content'),
            
            // Extract effect ID
            effectId: this.extractEffectId(),
            
            // Count text inputs
            textInputCount: $('input[type="text"], textarea').filter(':visible').length
        };

        console.log('📊 Extracted form data:');
        console.log('  - Build Server:', formData.buildServer);
        console.log('  - Build Server ID:', formData.buildServerId);
        console.log('  - Token:', formData.token ? 'Found' : 'Not found');
        console.log('  - Effect ID:', formData.effectId);
        console.log('  - Text Input Count:', formData.textInputCount);

        if (!formData.buildServer) {
            throw new Error('Could not find build server URL - this is required for PhotoOxy');
        }

        return { $, formData, html: response.data };
    }

    extractEffectId() {
        const match = this.effectUrl.match(/(\d+)\.html$/);
        return match ? match[1] : null;
    }

    async submitToBuildServer(initialData) {
        console.log('\n📤 Step 2: Submitting to build server...');
        
        const { formData } = initialData;
        const form = new FormData();

        // Add the essential PhotoOxy parameters
        form.append('token', formData.token || '');
        form.append('build_server', formData.buildServer);
        form.append('build_server_id', formData.buildServerId);
        form.append('submit', 'GO');
        form.append('id', formData.effectId);

        // Add text inputs with correct naming
        this.inputTexts.forEach((text, index) => {
            form.append(`text-${index}`, text);
            form.append('text[]', text);
        });

        // Make sure we have the right number of text inputs
        for (let i = this.inputTexts.length; i < formData.textInputCount; i++) {
            form.append(`text-${i}`, this.inputTexts[0] || 'Sample');
            form.append('text[]', this.inputTexts[0] || 'Sample');
        }

        console.log('📡 Submitting to build server:', formData.buildServer);
        console.log('📝 Submitting texts:', this.inputTexts);

        const response = await axios.post(this.effectUrl, form, {
            headers: {
                'User-Agent': this.userAgent,
                'Accept': '*/*',
                'Origin': this.baseUrl,
                'Referer': this.effectUrl,
                'Cookie': this.sessionCookies.join('; '),
                ...form.getHeaders()
            },
            maxRedirects: 0, // Don't follow redirects automatically
            validateStatus: (status) => status < 400,
            timeout: 30000
        });

        console.log('✅ Build server response, status:', response.status);

        return {
            response,
            html: response.data,
            buildServer: formData.buildServer,
            token: formData.token,
            effectId: formData.effectId
        };
    }

    async getFinalImage(buildResult) {
        console.log('\n🖼️ Step 3: Getting final generated image...');
        
        const $ = cheerio.load(buildResult.html);
        
        // Method 1: Look for generated image URLs (not sample images)
        let imageUrl = this.findGeneratedImageUrl($);
        
        if (imageUrl) {
            console.log('✅ Found generated image URL:', imageUrl);
            return await this.validateImageUrl(imageUrl);
        }

        // Method 2: Check if we need to call the build server directly
        imageUrl = await this.callBuildServerDirect(buildResult);
        
        if (imageUrl) {
            console.log('✅ Got image from build server:', imageUrl);
            return await this.validateImageUrl(imageUrl);
        }

        // Method 3: Look for AJAX endpoints in the response
        imageUrl = await this.checkForAjaxGeneration($, buildResult);
        
        if (imageUrl) {
            console.log('✅ Got image via AJAX:', imageUrl);
            return await this.validateImageUrl(imageUrl);
        }

        // Method 4: Parse JavaScript for image generation logic
        imageUrl = this.parseJavaScriptForImageUrl($);
        
        if (imageUrl) {
            console.log('✅ Found image URL in JavaScript:', imageUrl);
            return await this.validateImageUrl(imageUrl);
        }

        console.log('❌ Could not find generated image URL');
        console.log('🔍 Page contains:', $('img').length, 'images');
        
        // Debug: show all image sources found
        const allImages = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src) allImages.push(src);
        });
        console.log('🔍 All images found:', allImages);

        return {
            status: false,
            error: 'Could not generate custom image - form submission may have failed',
            debugInfo: {
                allImagesFound: allImages,
                responseLength: buildResult.html.length,
                buildServer: buildResult.buildServer
            }
        };
    }

    findGeneratedImageUrl($) {
        console.log('🔍 Looking for generated image URLs...');
        
        // Look for images that are NOT samples/templates
        const excludePatterns = [
            '/logo/', '/sample/', '/template/', '/demo/', 
            'logo-oxy.png', 'sample-', 'demo-', 'template-'
        ];

        // Check common selectors for result images
        const selectors = [
            'img[src*="/result/"]',
            'img[src*="/generated/"]', 
            'img[src*="/output/"]',
            'img[src*="/temp/"]',
            'img[src*="/cache/"]',
            '.result img',
            '#result img',
            '.photo-result img',
            '.generated-image',
            'img[data-result]'
        ];

        for (const selector of selectors) {
            const img = $(selector).first();
            if (img.length) {
                let src = img.attr('src');
                if (src && !excludePatterns.some(pattern => src.includes(pattern))) {
                    return src.startsWith('http') ? src : this.baseUrl + src;
                }
            }
        }

        // Look through all images for ones that look generated
        let bestCandidate = null;
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.includes('.jpg') || src.includes('.png')) {
                // Skip if it contains exclude patterns
                if (excludePatterns.some(pattern => src.includes(pattern))) {
                    return;
                }
                
                // Look for indicators this is a generated image
                if (src.includes('/uploads/') || src.includes('/temp/') || 
                    src.includes('/result/') || src.includes('/cache/') ||
                    /\d{10,}/.test(src)) { // Contains timestamp-like numbers
                    bestCandidate = src.startsWith('http') ? src : this.baseUrl + src;
                }
            }
        });

        return bestCandidate;
    }

    async callBuildServerDirect(buildResult) {
        console.log('🔍 Attempting direct build server call...');
        
        if (!buildResult.buildServer) {
            return null;
        }

        try {
            // Try to construct the build API endpoint
            const buildApiUrl = buildResult.buildServer + '/build';
            
            const form = new FormData();
            form.append('id', buildResult.effectId);
            form.append('token', buildResult.token || '');
            
            this.inputTexts.forEach((text, index) => {
                form.append(`text-${index}`, text);
            });

            const response = await axios.post(buildApiUrl, form, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Origin': this.baseUrl,
                    'Referer': this.effectUrl,
                    'Cookie': this.sessionCookies.join('; '),
                    ...form.getHeaders()
                },
                timeout: 30000
            });

            const data = response.data;
            
            // Handle JSON response
            if (typeof data === 'object') {
                return data.image || data.url || data.result || data.download_url;
            }
            
            // Handle HTML response
            const $ = cheerio.load(data);
            return this.findGeneratedImageUrl($);

        } catch (error) {
            console.log('⚠️ Direct build server call failed:', error.message);
            return null;
        }
    }

    async checkForAjaxGeneration($, buildResult) {
        console.log('🔍 Checking for AJAX generation endpoints...');
        
        // Look for AJAX URLs in JavaScript
        const scripts = $('script').toArray();
        
        for (const script of scripts) {
            const scriptContent = $(script).html() || '';
            
            // Look for common AJAX patterns
            const ajaxMatches = scriptContent.match(/(?:ajax|post|fetch)\s*\(\s*['"](.*?)['"]/g) ||
                               scriptContent.match(/url\s*:\s*['"](.*?)['"]/) ||
                               scriptContent.match(/['"]([^'"]*(?:generate|create|build|ajax)[^'"]*)['"]/) ||
                               [];

            for (const match of ajaxMatches) {
                const urlMatch = match.match(/['"](.*?)['"]/);
                if (urlMatch) {
                    const ajaxUrl = urlMatch[1];
                    if (ajaxUrl.includes('generate') || ajaxUrl.includes('create') || 
                        ajaxUrl.includes('build') || ajaxUrl.includes('ajax')) {
                        
                        const result = await this.tryAjaxEndpoint(ajaxUrl, buildResult);
                        if (result) return result;
                    }
                }
            }
        }

        return null;
    }

    async tryAjaxEndpoint(ajaxUrl, buildResult) {
        try {
            const fullUrl = ajaxUrl.startsWith('http') ? ajaxUrl : 
                           (ajaxUrl.startsWith('/') ? this.baseUrl + ajaxUrl : 
                            buildResult.buildServer + '/' + ajaxUrl);

            console.log('📡 Trying AJAX endpoint:', fullUrl);

            const formData = new URLSearchParams();
            formData.append('id', buildResult.effectId);
            formData.append('token', buildResult.token || '');
            
            this.inputTexts.forEach((text, index) => {
                formData.append(`text${index}`, text);
                formData.append('text[]', text);
            });

            const response = await axios.post(fullUrl, formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': this.userAgent,
                    'Cookie': this.sessionCookies.join('; '),
                    'Referer': this.effectUrl
                },
                timeout: 15000
            });

            const data = response.data;
            
            if (typeof data === 'object') {
                return data.image || data.url || data.result || data.download_url;
            }
            
            if (typeof data === 'string' && data.startsWith('http')) {
                return data;
            }

        } catch (error) {
            console.log('⚠️ AJAX endpoint failed:', error.message);
        }

        return null;
    }

    parseJavaScriptForImageUrl($) {
        console.log('🔍 Parsing JavaScript for image URLs...');
        
        const scripts = $('script').toArray();
        
        for (const script of scripts) {
            const scriptContent = $(script).html() || '';
            
            // Look for image URL patterns in JavaScript
            const patterns = [
                /(?:image|result|photo)[_\s]*[=:]\s*['"]([^'"]*\.(?:jpg|jpeg|png|gif))['"]/gi,
                /['"]([^'"]*\/(?:result|generated|output|temp)\/[^'"]*\.(?:jpg|jpeg|png))['"]/gi,
                /window\.location\s*=\s*['"]([^'"]*\.(?:jpg|jpeg|png))['"]/gi
            ];

            for (const pattern of patterns) {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const urlMatch = match.match(/['"]([^'"]*\.(?:jpg|jpeg|png|gif))['"]/);
                        if (urlMatch) {
                            const url = urlMatch[1];
                            if (!url.includes('logo') && !url.includes('sample')) {
                                return url.startsWith('http') ? url : this.baseUrl + url;
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    async validateImageUrl(imageUrl) {
        console.log('✅ Validating image URL:', imageUrl);
        
        try {
            const headResponse = await axios.head(imageUrl, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Referer': this.effectUrl
                },
                timeout: 10000
            });

            const contentType = headResponse.headers['content-type'];
            const contentLength = parseInt(headResponse.headers['content-length'] || '0');

            if (contentType?.startsWith('image/') && contentLength > 5000) {
                return {
                    status: true,
                    imageUrl: imageUrl,
                    contentType: contentType,
                    contentLength: contentLength,
                    message: 'Custom image generated successfully!'
                };
            } else {
                console.log('⚠️ Image validation warning: small file size or wrong content type');
                return {
                    status: true,
                    imageUrl: imageUrl,
                    contentType: contentType,
                    contentLength: contentLength,
                    message: 'Image found but may be template/sample',
                    warning: 'Small file size - might be template image'
                };
            }

        } catch (error) {
            console.log('⚠️ Image validation failed:', error.message);
            
            return {
                status: true,
                imageUrl: imageUrl,
                message: 'Image URL found but validation failed',
                warning: error.message
            };
        }
    }

    getDebugInfo() {
        return {
            effectUrl: this.effectUrl,
            inputTexts: this.inputTexts,
            baseUrl: this.baseUrl,
            effectId: this.extractEffectId(),
            sessionCookies: this.sessionCookies.length
        };
    }
}

// Alternative: Use the working npm package
class PhotoOxyWrapper {
    static async createWithPackage(effectUrl, text) {
        console.log('📦 Using textmaker-thiccy package as fallback...');
        
        try {
            // This requires: npm install textmaker-thiccy
            const thiccysapi = require('textmaker-thiccy');
            
            const texts = Array.isArray(text) ? text : [text];
            const result = await thiccysapi.photooxy(effectUrl, texts.length === 1 ? texts[0] : texts);
            
            return {
                status: true,
                imageUrl: result.image || result,
                message: 'Generated using textmaker-thiccy package',
                package: 'textmaker-thiccy'
            };
            
        } catch (error) {
            console.log('❌ Package method failed:', error.message);
            throw new Error('Both custom implementation and package method failed. Try: npm install textmaker-thiccy');
        }
    }
}

module.exports = { PhotoOxyFixed, PhotoOxyWrapper };
