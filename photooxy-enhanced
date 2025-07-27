const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

class PhotoOxyEnhanced {
    constructor(effectUrl = 'https://photooxy.com/logo-and-text-effects/butterfly-text-with-reflection-effect-183.html') {
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
            console.log('🚀 Enhanced PhotoOxy execution started...');
            console.log('📍 URL:', this.effectUrl);
            console.log('📝 Input Texts:', this.inputTexts);

            // Step 1: Load initial page and maintain session
            const initialData = await this.loadInitialPage();
            
            // Step 2: Submit form with proper session handling
            const submissionResult = await this.submitForm(initialData);
            
            // Step 3: Handle the image generation process
            const imageResult = await this.processImageGeneration(submissionResult);
            
            console.log('✅ Process completed!');
            return imageResult;

        } catch (error) {
            console.error('❌ Enhanced PhotoOxy execution failed:', error.message);
            console.error('🔍 Stack trace:', error.stack);
            throw error;
        }
    }

    async loadInitialPage() {
        console.log('\n📥 Step 1: Loading initial page with session management...');
        
        const response = await axios({
            method: 'GET',
            url: this.effectUrl,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'User-Agent': this.userAgent,
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000
        });

        console.log('✅ Initial page loaded, status:', response.status);
        
        // Store session cookies
        if (response.headers['set-cookie']) {
            this.sessionCookies = response.headers['set-cookie'];
            console.log('🍪 Session cookies stored:', this.sessionCookies.length);
        }

        const $ = cheerio.load(response.data);
        const formData = this.extractEnhancedFormData($);
        
        console.log('📊 Enhanced form data extracted');
        return { $, formData, html: response.data };
    }

    extractEnhancedFormData($) {
        console.log('🔍 Extracting enhanced form data...');
        
        const formData = {
            hiddenInputs: {},
            textInputs: [],
            formAction: null,
            method: 'POST'
        };

        // Find the main form
        const mainForm = $('form').first();
        if (mainForm.length) {
            formData.formAction = mainForm.attr('action') || this.effectUrl;
            formData.method = mainForm.attr('method') || 'POST';
        }

        // Extract all hidden inputs
        $('input[type="hidden"]').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).val();
            if (name && value !== undefined) {
                formData.hiddenInputs[name] = value;
            }
        });

        // Extract text input information
        $('input[type="text"], textarea').each((i, el) => {
            const name = $(el).attr('name') || `text_${i}`;
            const placeholder = $(el).attr('placeholder') || '';
            const maxLength = $(el).attr('maxlength') || 100;
            
            formData.textInputs.push({
                name,
                placeholder,
                maxLength,
                index: i
            });
        });

        // Look for special PhotoOxy elements
        const buildServer = $('input[name="build_server"]').val() || 
                           $('input[name="server"]').val() ||
                           $('#build_server').val();
        
        if (buildServer) {
            formData.buildServer = buildServer;
        }

        // Extract effect ID more reliably
        const effectMatch = this.effectUrl.match(/(\d+)\.html$/);
        if (effectMatch) {
            formData.effectId = effectMatch[1];
        }

        // Look for CSRF tokens in meta tags
        const csrfToken = $('meta[name="csrf-token"]').attr('content') ||
                         $('meta[name="_token"]').attr('content');
        if (csrfToken) {
            formData.hiddenInputs['_token'] = csrfToken;
        }

        console.log('📋 Form data summary:');
        console.log('  - Hidden inputs:', Object.keys(formData.hiddenInputs).length);
        console.log('  - Text inputs:', formData.textInputs.length);
        console.log('  - Effect ID:', formData.effectId);
        console.log('  - Build server:', formData.buildServer);

        return formData;
    }

    async submitForm(initialData) {
        console.log('\n📤 Step 2: Submitting form with enhanced data...');
        
        const { formData } = initialData;
        const form = new FormData();

        // Add all hidden inputs
        Object.entries(formData.hiddenInputs).forEach(([key, value]) => {
            form.append(key, value);
        });

        // Add text inputs using multiple naming conventions
        this.inputTexts.forEach((text, index) => {
            // Try different naming patterns PhotoOxy might use
            form.append(`text_${index}`, text);
            form.append(`text-${index}`, text);
            form.append('text[]', text);
            
            if (formData.textInputs[index]) {
                form.append(formData.textInputs[index].name, text);
            }
        });

        // Add effect ID if found
        if (formData.effectId) {
            form.append('id', formData.effectId);
            form.append('effect_id', formData.effectId);
        }

        // Add standard submit data
        form.append('submit', 'GO');
        form.append('build', '1');

        const submitUrl = formData.formAction && formData.formAction.startsWith('http') 
            ? formData.formAction 
            : this.effectUrl;

        console.log('📡 Submitting to:', submitUrl);

        const response = await axios({
            method: 'POST',
            url: submitUrl,
            data: form,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Origin': this.baseUrl,
                'Referer': this.effectUrl,
                'User-Agent': this.userAgent,
                'Cookie': this.sessionCookies.join('; '),
                ...form.getHeaders()
            },
            maxRedirects: 5,
            timeout: 30000,
            validateStatus: (status) => status < 500
        });

        console.log('✅ Form submitted, status:', response.status);
        console.log('📍 Final URL:', response.request.res.responseUrl || submitUrl);

        return {
            response,
            html: response.data,
            finalUrl: response.request.res.responseUrl || submitUrl
        };
    }

    async processImageGeneration(submissionResult) {
        console.log('\n🖼️ Step 3: Processing image generation...');
        
        const $ = cheerio.load(submissionResult.html);
        
        // Method 1: Look for direct image URLs
        let imageUrl = this.findDirectImageUrl($);
        
        if (imageUrl) {
            console.log('✅ Found direct image URL:', imageUrl);
            return await this.validateAndReturnImage(imageUrl);
        }

        // Method 2: Look for AJAX endpoints
        imageUrl = await this.checkAjaxEndpoints($, submissionResult);
        
        if (imageUrl) {
            console.log('✅ Found image via AJAX:', imageUrl);
            return await this.validateAndReturnImage(imageUrl);
        }

        // Method 3: Look for processing status and wait
        const processingInfo = this.findProcessingInfo($);
        
        if (processingInfo.isProcessing) {
            console.log('⏳ Image is being processed, waiting...');
            imageUrl = await this.waitForProcessing(processingInfo);
            
            if (imageUrl) {
                console.log('✅ Found image after processing:', imageUrl);
                return await this.validateAndReturnImage(imageUrl);
            }
        }

        // Method 4: Check for redirect or next step
        const nextStep = this.findNextStep($);
        
        if (nextStep) {
            console.log('🔄 Following next step:', nextStep);
            return await this.followNextStep(nextStep);
        }

        console.log('❌ Could not find image URL using any method');
        return {
            status: false,
            imageUrl: null,
            error: 'Could not extract image URL from response',
            debugInfo: {
                responseLength: submissionResult.html.length,
                finalUrl: submissionResult.finalUrl,
                foundImages: $('img').length,
                foundLinks: $('a[href*=".jpg"], a[href*=".png"], a[href*=".jpeg"]').length
            }
        };
    }

    findDirectImageUrl($) {
        console.log('🔍 Looking for direct image URLs...');
        
        // Look for result images
        const selectors = [
            'img[src*="/result/"]',
            'img[src*="/generated/"]',
            'img[src*="/output/"]',
            'img.result-image',
            '#result-image',
            '.photo-result img',
            'img[src*=".jpg"]:not([src*="logo"]):not([src*="sample"])',
            'img[src*=".png"]:not([src*="logo"]):not([src*="sample"])'
        ];

        for (const selector of selectors) {
            const img = $(selector).first();
            if (img.length) {
                let src = img.attr('src');
                if (src && !src.includes('logo') && !src.includes('sample')) {
                    return src.startsWith('http') ? src : this.baseUrl + src;
                }
            }
        }

        // Look in download links
        const downloadLink = $('a[href*="/download/"], a[download], a[href*=".jpg"], a[href*=".png"]').first();
        if (downloadLink.length) {
            let href = downloadLink.attr('href');
            if (href) {
                return href.startsWith('http') ? href : this.baseUrl + href;
            }
        }

        return null;
    }

    async checkAjaxEndpoints($, submissionResult) {
        console.log('🔍 Checking for AJAX endpoints...');
        
        // Look for AJAX URLs in JavaScript
        const scriptText = $('script').text();
        const ajaxMatches = scriptText.match(/(?:url|ajax|endpoint)['":\s]*['"]([^'"]*(?:ajax|api|generate|create)[^'"]*)['"]/) ||
                           scriptText.match(/['"]([^'"]*\/ajax\/[^'"]*)['"]/) ||
                           scriptText.match(/['"]([^'"]*\/api\/[^'"]*)['"]/);

        if (ajaxMatches) {
            const ajaxUrl = ajaxMatches[1];
            console.log('📡 Found AJAX endpoint:', ajaxUrl);
            
            try {
                return await this.callAjaxEndpoint(ajaxUrl);
            } catch (error) {
                console.log('⚠️ AJAX call failed:', error.message);
            }
        }

        return null;
    }

    async callAjaxEndpoint(ajaxUrl) {
        const fullUrl = ajaxUrl.startsWith('http') ? ajaxUrl : this.baseUrl + ajaxUrl;
        
        const response = await axios({
            method: 'POST',
            url: fullUrl,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': this.userAgent,
                'Cookie': this.sessionCookies.join('; '),
                'Referer': this.effectUrl
            },
            timeout: 15000
        });

        const data = response.data;
        return data.image || data.url || data.result || data.download_url || null;
    }

    findProcessingInfo($) {
        const processingIndicators = [
            $('.processing').length > 0,
            $('[data-status="processing"]').length > 0,
            $('*:contains("processing")').length > 0,
            $('*:contains("generating")').length > 0
        ];

        const isProcessing = processingIndicators.some(indicator => indicator);
        
        if (isProcessing) {
            const statusUrl = $('[data-status-url]').attr('data-status-url') ||
                             $('meta[name="status-url"]').attr('content');
            
            return {
                isProcessing: true,
                statusUrl: statusUrl ? (statusUrl.startsWith('http') ? statusUrl : this.baseUrl + statusUrl) : null
            };
        }

        return { isProcessing: false };
    }

    async waitForProcessing(processingInfo, maxWait = 30000, interval = 2000) {
        console.log('⏳ Waiting for image processing to complete...');
        
        if (!processingInfo.statusUrl) {
            // Simple wait without status checking
            await new Promise(resolve => setTimeout(resolve, 5000));
            return null;
        }

        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            try {
                const response = await axios.get(processingInfo.statusUrl, {
                    headers: {
                        'User-Agent': this.userAgent,
                        'Cookie': this.sessionCookies.join('; ')
                    }
                });

                const data = response.data;
                
                if (data.status === 'completed' || data.ready) {
                    return data.image || data.url || data.result;
                }
                
                if (data.status === 'failed' || data.error) {
                    throw new Error('Image processing failed: ' + (data.error || 'Unknown error'));
                }

            } catch (error) {
                console.log('⚠️ Status check failed:', error.message);
            }

            await new Promise(resolve => setTimeout(resolve, interval));
        }

        console.log('⏰ Processing timeout reached');
        return null;
    }

    findNextStep($) {
        // Look for redirect meta tags
        const redirect = $('meta[http-equiv="refresh"]').attr('content');
        if (redirect) {
            const urlMatch = redirect.match(/url=(.+)/i);
            if (urlMatch) {
                return urlMatch[1].startsWith('http') ? urlMatch[1] : this.baseUrl + urlMatch[1];
            }
        }

        // Look for JavaScript redirects
        const scriptText = $('script').text();
        const jsRedirect = scriptText.match(/(?:location\.href|window\.location)[^'"]*['"]([^'"]*)['"]/) ||
                          scriptText.match(/(?:replace|assign)\(['"]([^'"]*)['"]\)/);
        
        if (jsRedirect) {
            const url = jsRedirect[1];
            return url.startsWith('http') ? url : this.baseUrl + url;
        }

        return null;
    }

    async followNextStep(nextUrl) {
        console.log('🔄 Following next step:', nextUrl);
        
        const response = await axios.get(nextUrl, {
            headers: {
                'User-Agent': this.userAgent,
                'Cookie': this.sessionCookies.join('; ')
            }
        });

        const $ = cheerio.load(response.data);
        const imageUrl = this.findDirectImageUrl($);
        
        return imageUrl ? await this.validateAndReturnImage(imageUrl) : null;
    }

    async validateAndReturnImage(imageUrl) {
        console.log('✅ Validating image URL:', imageUrl);
        
        try {
            // Make a HEAD request to validate the image
            const headResponse = await axios.head(imageUrl, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Referer': this.effectUrl
                },
                timeout: 10000
            });

            const contentType = headResponse.headers['content-type'];
            const contentLength = headResponse.headers['content-length'];

            if (contentType && contentType.startsWith('image/') && contentLength > 1000) {
                return {
                    status: true,
                    imageUrl: imageUrl,
                    contentType: contentType,
                    contentLength: parseInt(contentLength),
                    message: 'Image generated successfully'
                };
            } else {
                throw new Error('Invalid image response');
            }

        } catch (error) {
            console.log('⚠️ Image validation failed:', error.message);
            
            // Return the URL anyway, might still work
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
            sessionCookies: this.sessionCookies.length,
            effectId: this.effectUrl.match(/(\d+)\.html$/)?.[1]
        };
    }
}

module.exports = PhotoOxyEnhanced;
