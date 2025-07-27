const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

class PhotoOxyFinalFix {
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
            console.log('🎯 PhotoOxy Final Fix - Starting...');
            console.log('📍 URL:', this.effectUrl);
            console.log('📝 Text:', this.inputTexts);

            // Step 1: Load page and find the CORRECT form
            const pageData = await this.loadPageAndFindForm();
            
            // Step 2: Submit using the correct form data
            const result = await this.submitCorrectForm(pageData);
            
            console.log('✅ Execution completed!');
            return result;

        } catch (error) {
            console.error('❌ Execution failed:', error.message);
            throw error;
        }
    }

    async loadPageAndFindForm() {
        console.log('\n📥 Loading page and analyzing forms...');
        
        const response = await axios.get(this.effectUrl, {
            headers: {
                'User-Agent': this.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive'
            }
        });

        if (response.headers['set-cookie']) {
            this.cookies = response.headers['set-cookie'];
        }

        const $ = cheerio.load(response.data);
        
        console.log('✅ Page loaded, analyzing forms...');
        
        // Find all forms and analyze them
        const forms = [];
        $('form').each((i, formEl) => {
            const form = $(formEl);
            const action = form.attr('action') || '';
            const method = form.attr('method') || 'GET';
            const inputs = [];
            
            form.find('input, textarea, select').each((j, inputEl) => {
                const input = $(inputEl);
                inputs.push({
                    name: input.attr('name') || '',
                    type: input.attr('type') || 'text',
                    value: input.val() || input.attr('value') || '',
                    id: input.attr('id') || ''
                });
            });
            
            forms.push({
                index: i,
                action: action,
                method: method.toUpperCase(),
                inputs: inputs,
                element: form
            });
        });

        console.log(`📊 Found ${forms.length} forms:`);
        forms.forEach((form, i) => {
            console.log(`  Form ${i}: ${form.method} ${form.action} (${form.inputs.length} inputs)`);
            
            // Show relevant inputs
            const textInputs = form.inputs.filter(inp => 
                inp.type === 'text' || inp.type === 'textarea' || 
                inp.name.toLowerCase().includes('text')
            );
            if (textInputs.length > 0) {
                console.log(`    Text inputs: ${textInputs.map(inp => inp.name || inp.id).join(', ')}`);
            }
        });

        // Find the text effect form (not search form)
        const effectForm = forms.find(form => {
            // Skip search forms
            if (form.action.includes('/search') || form.action.includes('search')) {
                return false;
            }
            
            // Look for forms with text inputs and submit buttons
            const hasTextInput = form.inputs.some(inp => 
                inp.type === 'text' || inp.type === 'textarea' ||
                inp.name.toLowerCase().includes('text')
            );
            
            const hasSubmit = form.inputs.some(inp => 
                inp.type === 'submit' || inp.name.toLowerCase().includes('submit') ||
                inp.value.toLowerCase().includes('go') || inp.value.toLowerCase().includes('create')
            );
            
            return hasTextInput && (hasSubmit || form.method === 'POST');
        });

        if (!effectForm) {
            // Fallback: look for the form that contains build_server or token
            const buildForm = forms.find(form => 
                form.inputs.some(inp => 
                    inp.name === 'build_server' || inp.name === 'token' ||
                    inp.name === 'build_server_id'
                )
            );
            
            if (buildForm) {
                console.log('✅ Found form with build server data');
                return await this.analyzeForm(buildForm, $);
            }
            
            // Last resort: use manual form construction
            console.log('⚠️ No suitable form found, using manual approach');
            return await this.manualFormConstruction($);
        }

        console.log(`✅ Selected form: ${effectForm.method} ${effectForm.action}`);
        return await this.analyzeForm(effectForm, $);
    }

    async analyzeForm(form, $) {
        console.log('\n🔍 Analyzing selected form...');
        
        const formData = {
            action: form.action || this.effectUrl,
            method: form.method || 'POST',
            inputs: {},
            buildServer: null,
            token: null,
            effectId: this.effectUrl.match(/(\d+)\.html$/)?.[1]
        };

        // Process form inputs
        form.inputs.forEach(input => {
            if (input.name) {
                formData.inputs[input.name] = input.value;
                
                // Identify special fields
                if (input.name === 'build_server' || input.name === 'server') {
                    formData.buildServer = input.value;
                }
                if (input.name === 'token' || input.name === '_token') {
                    formData.token = input.value;
                }
            }
        });

        // Also check for hidden inputs outside the form (PhotoOxy sometimes does this)
        $('input[type="hidden"]').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).val() || $(el).attr('value');
            
            if (name && value && !formData.inputs[name]) {
                formData.inputs[name] = value;
                
                if (name === 'build_server' || name === 'server') {
                    formData.buildServer = value;
                }
                if (name === 'token' || name === '_token') {
                    formData.token = value;
                }
            }
        });

        console.log('📊 Form data extracted:');
        console.log('  - Action:', formData.action);
        console.log('  - Method:', formData.method);
        console.log('  - Build Server:', formData.buildServer || 'Not found');
        console.log('  - Token:', formData.token ? 'Found' : 'Not found');
        console.log('  - Effect ID:', formData.effectId);
        console.log('  - Input fields:', Object.keys(formData.inputs).length);

        return formData;
    }

    async manualFormConstruction($) {
        console.log('\n🔧 Using manual form construction...');
        
        // Extract essential data manually
        const buildServer = $('input[name="build_server"]').val() || 
                           $('input[name="server"]').val() ||
                           $('[name="build_server"]').val();
        
        const buildServerId = $('input[name="build_server_id"]').val() || '1';
        
        const token = $('input[name="token"]').val() || 
                     $('meta[name="csrf-token"]').attr('content') ||
                     $('[name="token"]').val();

        const effectId = this.effectUrl.match(/(\d+)\.html$/)?.[1];

        console.log('📊 Manual extraction:');
        console.log('  - Build Server:', buildServer || 'NOT FOUND');
        console.log('  - Build Server ID:', buildServerId);
        console.log('  - Token:', token ? 'Found' : 'NOT FOUND');
        console.log('  - Effect ID:', effectId);

        if (!buildServer) {
            throw new Error('Could not find build_server - PhotoOxy may have changed their structure');
        }

        return {
            action: this.effectUrl,
            method: 'POST',
            inputs: {
                'build_server': buildServer,
                'build_server_id': buildServerId,
                'token': token || '',
                'submit': 'GO',
                'id': effectId
            },
            buildServer: buildServer,
            token: token,
            effectId: effectId
        };
    }

    async submitCorrectForm(formData) {
        console.log('\n📤 Submitting correct form...');
        
        const form = new FormData();
        
        // Add all form inputs
        Object.entries(formData.inputs).forEach(([name, value]) => {
            if (name.toLowerCase().includes('text') && value === '') {
                // Replace empty text fields with our text
                form.append(name, this.inputTexts[0]);
                console.log(`  📝 ${name} = "${this.inputTexts[0]}"`);
            } else {
                form.append(name, value);
                if (name !== 'token') { // Don't log tokens
                    console.log(`  📄 ${name} = "${value}"`);
                }
            }
        });

        // Add text inputs in multiple formats (PhotoOxy expects different formats)
        this.inputTexts.forEach((text, index) => {
            form.append(`text-${index}`, text);
            form.append('text[]', text);
        });

        // Ensure we have essential fields
        if (!formData.inputs['submit']) {
            form.append('submit', 'GO');
        }
        if (formData.effectId && !formData.inputs['id']) {
            form.append('id', formData.effectId);
        }

        // Determine submit URL
        let submitUrl;
        if (formData.action.startsWith('http')) {
            submitUrl = formData.action;
        } else if (formData.action.startsWith('/')) {
            submitUrl = 'https://photooxy.com' + formData.action;
        } else {
            submitUrl = this.effectUrl;
        }

        console.log('📡 Submitting to:', submitUrl);

        try {
            const response = await axios({
                method: formData.method,
                url: submitUrl,
                data: form,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Origin': 'https://photooxy.com',
                    'Referer': this.effectUrl,
                    'Cookie': this.cookies.join('; '),
                    ...form.getHeaders()
                },
                maxRedirects: 10,
                timeout: 30000,
                validateStatus: (status) => status < 500 // Accept redirects and other responses
            });

            console.log('✅ Form submitted successfully, status:', response.status);
            console.log('📍 Response URL:', response.request.res.responseUrl || submitUrl);

            return await this.processResponse(response);

        } catch (error) {
            if (error.response && error.response.status < 500) {
                console.log('⚠️ Got HTTP error but continuing:', error.response.status);
                return await this.processResponse(error.response);
            }
            throw error;
        }
    }

    async processResponse(response) {
        console.log('\n🖼️ Processing response for image...');
        
        const $ = cheerio.load(response.data);
        const responseUrl = response.request?.res?.responseUrl || response.config.url;
        
        // Method 1: Look for images that aren't the old template
        const images = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
                const fullSrc = src.startsWith('http') ? src : 'https://photooxy.com' + src;
                const isTemplate = src.includes('icon59b22b5056bd6') || 
                                 src.includes('logo') || 
                                 src.includes('sample') ||
                                 src.includes('demo');
                
                images.push({
                    src: fullSrc,
                    isTemplate: isTemplate,
                    alt: $(el).attr('alt') || '',
                    size: this.estimateImageRelevance(src)
                });
            }
        });

        // Sort by relevance (non-templates first, then by size score)
        images.sort((a, b) => {
            if (a.isTemplate !== b.isTemplate) {
                return a.isTemplate ? 1 : -1; // Non-templates first
            }
            return b.size - a.size; // Higher size score first
        });

        console.log(`🔍 Found ${images.length} images:`);
        images.forEach((img, i) => {
            console.log(`  ${i + 1}. ${img.src} ${img.isTemplate ? '(TEMPLATE)' : '(CANDIDATE)'} [score: ${img.size}]`);
        });

        // Method 2: Check for processing indicators
        if ($('.processing, .generating, [data-processing="true"]').length > 0) {
            console.log('⏳ Image appears to be processing...');
            
            // Wait a bit and try to reload
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
                const reloadResponse = await axios.get(responseUrl, {
                    headers: {
                        'User-Agent': this.userAgent,
                        'Cookie': this.cookies.join('; ')
                    }
                });
                
                return await this.processResponse(reloadResponse);
            } catch (error) {
                console.log('⚠️ Could not reload for processing check');
            }
        }

        // Method 3: Look for download links
        const downloadLinks = [];
        $('a[href*=".jpg"], a[href*=".png"], a[download]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !href.includes('logo') && !href.includes('sample')) {
                downloadLinks.push(href.startsWith('http') ? href : 'https://photooxy.com' + href);
            }
        });

        if (downloadLinks.length > 0) {
            console.log('📥 Found download links:', downloadLinks);
            return await this.validateImageResult(downloadLinks[0]);
        }

        // Return best candidate image
        const bestImage = images.find(img => !img.isTemplate) || images[0];
        
        if (bestImage) {
            console.log('✅ Selected best candidate:', bestImage.src);
            return await this.validateImageResult(bestImage.src, !bestImage.isTemplate);
        }

        // No images found - return debug info
        return {
            status: false,
            error: 'No images found in response',
            debugInfo: {
                responseLength: response.data.length,
                responseUrl: responseUrl,
                formsFound: $('form').length,
                inputsFound: $('input').length,
                imagesFound: images.length,
                containsProcessing: response.data.includes('processing'),
                responseSnippet: response.data.substring(0, 500)
            }
        };
    }

    estimateImageRelevance(src) {
        let score = 0;
        
        // Positive indicators
        if (src.includes('/uploads/')) score += 10;
        if (src.includes('/temp/')) score += 15;
        if (src.includes('/result/')) score += 20;
        if (src.includes('/generated/')) score += 20;
        
        // Size indicators
        if (src.includes('w450') || src.includes('w500')) score += 5;
        if (src.includes('large')) score += 5;
        
        // Date indicators (recent dates get higher scores)
        const currentYear = new Date().getFullYear();
        if (src.includes(currentYear.toString())) score += 10;
        if (src.includes((currentYear - 1).toString())) score += 5;
        
        // Random string indicators (generated content)
        if (/[a-f0-9]{20,}/.test(src)) score += 8;
        
        return score;
    }

    async validateImageResult(imageUrl, isLikelyGenerated = null) {
        console.log('✅ Validating image result:', imageUrl);
        
        try {
            const response = await axios.head(imageUrl, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Referer': this.effectUrl
                },
                timeout: 10000
            });

            const contentType = response.headers['content-type'];
            const contentLength = parseInt(response.headers['content-length'] || '0');
            
            // Auto-detect if not specified
            if (isLikelyGenerated === null) {
                isLikelyGenerated = contentLength > 15000 && 
                                   !imageUrl.includes('icon59b22b5056bd6') &&
                                   !imageUrl.includes('logo') &&
                                   !imageUrl.includes('sample');
            }

            return {
                status: true,
                imageUrl: imageUrl,
                contentType: contentType,
                contentLength: contentLength,
                isLikelyGenerated: isLikelyGenerated,
                message: isLikelyGenerated ? 
                    '🎉 Custom image generated successfully!' : 
                    '⚠️ Image found but appears to be template',
                warning: isLikelyGenerated ? null : 'This might be a template/sample image'
            };

        } catch (error) {
            return {
                status: true,
                imageUrl: imageUrl,
                message: 'Image URL found but validation failed',
                warning: error.message,
                isLikelyGenerated: false
            };
        }
    }
}

module.exports = PhotoOxyFinalFix;
