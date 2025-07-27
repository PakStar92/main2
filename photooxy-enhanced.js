const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

class PhotoOxyRealFix {
    constructor(effectUrl) {
        if (!effectUrl.includes('photooxy.com')) {
            throw new Error('Must be a PhotoOxy URL');
        }
        
        this.effectUrl = effectUrl;
        this.inputTexts = ['Sample'];
        this.cookies = [];
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    setText(text) {
        this.inputTexts = Array.isArray(text) ? text : [text];
    }

    async execute() {
        try {
            console.log('🔧 PhotoOxy Real Fix - Starting execution...');
            console.log('📍 URL:', this.effectUrl);
            console.log('📝 Text:', this.inputTexts);

            // Step 1: Load page and get form data
            const pageData = await this.loadPage();
            
            // Step 2: Submit the ACTUAL form (not to build server directly)
            const submitResult = await this.submitMainForm(pageData);
            
            // Step 3: Handle the result page
            const imageResult = await this.extractResultImage(submitResult);
            
            console.log('✅ Execution completed!');
            return imageResult;

        } catch (error) {
            console.error('❌ Execution failed:', error.message);
            throw error;
        }
    }

    async loadPage() {
        console.log('\n📥 Loading PhotoOxy page...');
        
        const response = await axios.get(this.effectUrl, {
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        console.log('✅ Page loaded, status:', response.status);
        
        // Store cookies
        if (response.headers['set-cookie']) {
            this.cookies = response.headers['set-cookie'];
            console.log('🍪 Stored cookies:', this.cookies.length);
        }

        const $ = cheerio.load(response.data);
        
        // Extract ALL form data properly
        const formData = {
            action: $('form').attr('action') || this.effectUrl,
            method: $('form').attr('method') || 'POST',
            inputs: {}
        };

        // Get all input fields
        $('input').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).val() || $(el).attr('value') || '';
            const type = $(el).attr('type') || 'text';
            
            if (name) {
                formData.inputs[name] = { value, type };
            }
        });

        // Get textarea fields
        $('textarea').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).text() || '';
            
            if (name) {
                formData.inputs[name] = { value, type: 'textarea' };
            }
        });

        // Extract effect ID
        const effectMatch = this.effectUrl.match(/(\d+)\.html$/);
        if (effectMatch) {
            formData.effectId = effectMatch[1];
        }

        console.log('📊 Form analysis:');
        console.log('  - Action:', formData.action);
        console.log('  - Method:', formData.method);
        console.log('  - Inputs found:', Object.keys(formData.inputs).length);
        console.log('  - Effect ID:', formData.effectId);
        
        // Debug: show all input fields found
        Object.entries(formData.inputs).forEach(([name, data]) => {
            if (data.type !== 'hidden') {
                console.log(`  - ${name} (${data.type}):`, data.value || '[empty]');
            }
        });

        return { $, formData, html: response.data };
    }

    async submitMainForm(pageData) {
        console.log('\n📤 Submitting main form...');
        
        const { formData } = pageData;
        const form = new FormData();

        // Add all existing form fields
        Object.entries(formData.inputs).forEach(([name, data]) => {
            if (data.type === 'text' || data.type === 'textarea') {
                // Replace text inputs with our custom text
                if (this.inputTexts.length > 0) {
                    const textIndex = name.match(/text[_-]?(\d*)/i);
                    if (textIndex) {
                        const index = parseInt(textIndex[1]) || 0;
                        const text = this.inputTexts[index] || this.inputTexts[0];
                        form.append(name, text);
                        console.log(`  📝 Setting ${name} = "${text}"`);
                    } else if (name.toLowerCase().includes('text') || data.type === 'textarea') {
                        form.append(name, this.inputTexts[0]);
                        console.log(`  📝 Setting ${name} = "${this.inputTexts[0]}"`);
                    } else {
                        form.append(name, data.value);
                    }
                } else {
                    form.append(name, data.value);
                }
            } else {
                // Keep hidden and other fields as-is
                form.append(name, data.value);
            }
        });

        // Add standard PhotoOxy fields if not present
        if (!formData.inputs.submit) {
            form.append('submit', 'GO');
        }
        
        if (formData.effectId && !formData.inputs.id) {
            form.append('id', formData.effectId);
        }

        const submitUrl = formData.action.startsWith('http') ? 
            formData.action : 
            'https://photooxy.com' + formData.action;

        console.log('📡 Submitting to:', submitUrl);
        console.log('📝 Form data entries:', form._streams.length);

        const response = await axios({
            method: formData.method,
            url: submitUrl,
            data: form,
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Origin': 'https://photooxy.com',
                'Connection': 'keep-alive',
                'Referer': this.effectUrl,
                'Cookie': this.cookies.join('; '),
                'Upgrade-Insecure-Requests': '1',
                ...form.getHeaders()
            },
            maxRedirects: 10,
            timeout: 30000
        });

        console.log('✅ Form submitted, status:', response.status);
        console.log('📍 Final URL:', response.request.res.responseUrl || submitUrl);

        return {
            response,
            html: response.data,
            finalUrl: response.request.res.responseUrl || submitUrl
        };
    }

    async extractResultImage(submitResult) {
        console.log('\n🖼️ Extracting result image...');
        
        const $ = cheerio.load(submitResult.html);
        
        // Method 1: Look for processing or result indicators
        const processingDiv = $('.processing, .generating, [data-processing]').first();
        if (processingDiv.length) {
            console.log('⏳ Image is being processed...');
            return await this.waitForProcessing($, submitResult);
        }

        // Method 2: Look for direct result images
        let resultImage = this.findResultImage($);
        if (resultImage) {
            console.log('✅ Found result image:', resultImage);
            return await this.validateResult(resultImage);
        }

        // Method 3: Check for AJAX or JavaScript-based generation
        resultImage = await this.checkJavaScriptGeneration($, submitResult);
        if (resultImage) {
            console.log('✅ Found image via JavaScript:', resultImage);
            return await this.validateResult(resultImage);
        }

        // Method 4: Look for download links or hidden images
        resultImage = this.findHiddenResultImage($);
        if (resultImage) {
            console.log('✅ Found hidden result image:', resultImage);
            return await this.validateResult(resultImage);
        }

        // Method 5: Check if we need to follow a redirect or next step
        const nextStep = this.findNextStep($);
        if (nextStep) {
            console.log('🔄 Following next step:', nextStep);
            return await this.followNextStep(nextStep);
        }

        console.log('❌ Could not find result image');
        return this.createDebugResult($, submitResult);
    }

    findResultImage($) {
        console.log('🔍 Looking for result images...');
        
        // Current timestamp to identify fresh images
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getDate()).padStart(2, '0');
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Look for images that were created recently (today or yesterday)
        const recentTimePatterns = [
            currentYear.toString(),
            `${currentYear}/${currentMonth}`,
            `${currentYear}/${currentMonth}/${currentDay}`,
            yesterday.getFullYear().toString()
        ];

        let bestCandidate = null;
        let highestScore = 0;

        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (!src) return;

            let score = 0;
            const fullSrc = src.startsWith('http') ? src : 'https://photooxy.com' + src;

            // Skip obvious template/sample images
            if (src.includes('logo') || src.includes('sample') || 
                src.includes('demo') || src.includes('template') ||
                src.includes('icon59b22b5056bd6')) { // Skip the 2017 template
                return;
            }

            // Score based on URL patterns that indicate generated content
            if (src.includes('/uploads/')) score += 10;
            if (src.includes('/temp/')) score += 15;
            if (src.includes('/result/')) score += 20;
            if (src.includes('/generated/')) score += 20;
            if (src.includes('/cache/')) score += 10;

            // Score based on recent timestamps
            recentTimePatterns.forEach(pattern => {
                if (src.includes(pattern)) score += 25;
            });

            // Score based on long random strings (indicating generated content)
            const randomStringMatch = src.match(/[a-f0-9]{20,}/);
            if (randomStringMatch) score += 15;

            // Score based on file size indicators (bigger files likely generated)
            if (src.includes('w450') || src.includes('w500') || src.includes('large')) score += 5;

            // Higher score for images in result containers
            const container = $(el).closest('.result, .photo-result, .generated, .output');
            if (container.length) score += 10;

            if (score > highestScore) {
                highestScore = score;
                bestCandidate = fullSrc;
            }
        });

        console.log('🎯 Best candidate score:', highestScore);
        return bestCandidate;
    }

    findHiddenResultImage($) {
        console.log('🔍 Looking for hidden result images...');
        
        // Look for images in hidden divs or data attributes
        const hiddenSelectors = [
            'img[data-src]',
            'img[data-original]',
            'img[data-result]',
            '[data-image-url]',
            '.hidden img',
            '.result-hidden img'
        ];

        for (const selector of hiddenSelectors) {
            const element = $(selector).first();
            if (element.length) {
                const src = element.attr('data-src') || 
                           element.attr('data-original') || 
                           element.attr('data-result') ||
                           element.attr('src');
                
                if (src && !src.includes('logo') && !src.includes('sample')) {
                    return src.startsWith('http') ? src : 'https://photooxy.com' + src;
                }
            }
        }

        return null;
    }

    async checkJavaScriptGeneration($, submitResult) {
        console.log('🔍 Checking JavaScript for image generation...');
        
        const scripts = $('script').toArray();
        
        for (const script of scripts) {
            const content = $(script).html() || '';
            
            // Look for image URLs in JavaScript
            const patterns = [
                /(?:result|image|photo).*?[=:]\s*['"]([^'"]*\.(?:jpg|jpeg|png))['"]/gi,
                /window\.location.*?['"]([^'"]*\.(?:jpg|jpeg|png))['"]/gi,
                /src\s*[=:]\s*['"]([^'"]*\/(?:uploads|temp|result)\/[^'"]*\.(?:jpg|jpeg|png))['"]/gi
            ];

            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const urlMatch = match.match(/['"]([^'"]*\.(?:jpg|jpeg|png))['"]/);
                        if (urlMatch) {
                            const url = urlMatch[1];
                            if (!url.includes('logo') && !url.includes('sample') && 
                                !url.includes('icon59b22b5056bd6')) {
                                return url.startsWith('http') ? url : 'https://photooxy.com' + url;
                            }
                        }
                    }
                }
            }

            // Look for AJAX calls that might generate images
            if (content.includes('ajax') || content.includes('XMLHttpRequest')) {
                const ajaxResult = await this.tryJavaScriptAjax(content, submitResult);
                if (ajaxResult) return ajaxResult;
            }
        }

        return null;
    }

    async tryJavaScriptAjax(scriptContent, submitResult) {
        try {
            // Extract AJAX URLs from JavaScript
            const ajaxMatches = scriptContent.match(/(?:ajax|post|fetch)\s*\(\s*{[^}]*url\s*:\s*['"]([^'"]*)['"]/gi) ||
                               scriptContent.match(/\.post\s*\(\s*['"]([^'"]*)['"]/gi) ||
                               [];

            for (const match of ajaxMatches) {
                const urlMatch = match.match(/['"]([^'"]*)['"]/);
                if (urlMatch) {
                    const ajaxUrl = urlMatch[1];
                    const fullUrl = ajaxUrl.startsWith('http') ? ajaxUrl : 'https://photooxy.com' + ajaxUrl;
                    
                    console.log('📡 Trying AJAX URL:', fullUrl);
                    
                    const response = await axios.post(fullUrl, {
                        id: this.effectUrl.match(/(\d+)\.html$/)?.[1],
                        text: this.inputTexts[0]
                    }, {
                        headers: {
                            'User-Agent': this.userAgent,
                            'X-Requested-With': 'XMLHttpRequest',
                            'Cookie': this.cookies.join('; ')
                        },
                        timeout: 10000
                    });

                    const data = response.data;
                    if (typeof data === 'object' && (data.image || data.url || data.result)) {
                        return data.image || data.url || data.result;
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ AJAX attempt failed:', error.message);
        }

        return null;
    }

    findNextStep($) {
        // Look for meta refresh or JavaScript redirects
        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
        if (metaRefresh) {
            const urlMatch = metaRefresh.match(/url=(.+)/i);
            if (urlMatch) {
                return urlMatch[1];
            }
        }

        return null;
    }

    async followNextStep(nextUrl) {
        console.log('🔄 Following next step:', nextUrl);
        
        const fullUrl = nextUrl.startsWith('http') ? nextUrl : 'https://photooxy.com' + nextUrl;
        
        const response = await axios.get(fullUrl, {
            headers: {
                'User-Agent': this.userAgent,
                'Cookie': this.cookies.join('; ')
            }
        });

        const $ = cheerio.load(response.data);
        const image = this.findResultImage($);
        
        if (image) {
            return await this.validateResult(image);
        }

        return null;
    }

    async validateResult(imageUrl) {
        console.log('✅ Validating result:', imageUrl);
        
        try {
            const response = await axios.head(imageUrl, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Referer': this.effectUrl
                }
            });

            const contentType = response.headers['content-type'];
            const contentLength = parseInt(response.headers['content-length'] || '0');

            // Check if this looks like a real generated image
            const isLikelyGenerated = contentLength > 10000 && // Reasonable file size
                                     contentType?.startsWith('image/') &&
                                     !imageUrl.includes('icon59b22b5056bd6') && // Not the 2017 template
                                     !imageUrl.includes('logo');

            return {
                status: true,
                imageUrl: imageUrl,
                contentType: contentType,
                contentLength: contentLength,
                message: isLikelyGenerated ? 
                    'Custom image generated successfully!' : 
                    'Image found but may be template',
                isLikelyGenerated: isLikelyGenerated,
                warning: isLikelyGenerated ? null : 'This might be a template image'
            };

        } catch (error) {
            return {
                status: true,
                imageUrl: imageUrl,
                message: 'Image URL found but validation failed',
                warning: error.message
            };
        }
    }

    createDebugResult($, submitResult) {
        const allImages = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
                allImages.push({
                    src: src,
                    fullSrc: src.startsWith('http') ? src : 'https://photooxy.com' + src,
                    alt: $(el).attr('alt') || '',
                    class: $(el).attr('class') || ''
                });
            }
        });

        return {
            status: false,
            error: 'No generated image found',
            message: 'Form submitted but could not locate result image',
            debugInfo: {
                allImages: allImages,
                responseLength: submitResult.html.length,
                finalUrl: submitResult.finalUrl,
                containsProcessing: submitResult.html.includes('processing'),
                containsGenerated: submitResult.html.includes('generated'),
                containsResult: submitResult.html.includes('result')
            }
        };
    }
}

module.exports = PhotoOxyRealFix;
