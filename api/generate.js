
const axios = require('axios');

module.exports = async function(req, res) {
    // CORS 处理
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { apiKey, provider, theme, difficulty, ieltsScenario, themeDescription, scenarioDescription, difficultyDescription, isIELTS } = req.body;

        const finalApiKey = apiKey || process.env.DEFAULT_API_KEY;
        const finalProvider = provider || process.env.DEFAULT_PROVIDER || 'deepseek';
        const finalTheme = themeDescription || theme;
        const finalScenario = scenarioDescription || ieltsScenario || 'general';
        const finalDifficulty = difficultyDescription || difficulty;

        console.log('Using API Key:', finalApiKey ? finalApiKey.substring(0, 10) + '...' : 'none');
        console.log('Theme:', finalTheme, 'Scenario:', finalScenario, 'Difficulty:', finalDifficulty, 'isIELTS:', isIELTS);

        if (!finalApiKey) {
            return res.status(400).json({ error: '请先配置API Key' });
        }

        const difficultyInstructions = {
            beginner: 'CRITICAL PRIORITY: Use ONLY elementary school vocabulary (5-8 letter words). Examples: good, bad, happy, sad, big, small, go, come, see, eat. NO words longer than 10 letters. Short sentences of exactly 5-8 words. Simple grammar ONLY: simple present tense, simple past tense. NO: present perfect, past perfect, future continuous, conditionals, passive voice. NO idioms, NO phrasal verbs. Topics: school, family, friends, daily routines. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.',
            intermediate: 'CRITICAL PRIORITY: Use middle school vocabulary (8-12 letter words). Examples: interesting, beautiful, important, understand, remember, learn, practice. NO words longer than 15 letters. Sentences of 8-12 words. Grammar: simple present, past, future; present perfect OK. Simple and compound sentences. NO: complex conditionals, subjunctive, inverted sentences. Common idioms OK like "take care of", "look forward to". Topics: hobbies, travel, education, work experience. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.',
            advanced: 'CRITICAL PRIORITY: Use college-level vocabulary (12-18 letter words). Examples: significant, comprehensive, approximately, nevertheless, implementation, perspective, methodology. Sentences of 12-18 words with 2-3 clauses. Grammar: passive voice, all conditionals, relative clauses, participle phrases. Academic topics: technology, environment, psychology, economics. Technical terminology when relevant. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.',
            native: 'CRITICAL PRIORITY: Use native-level vocabulary including idioms, phrasal verbs, colloquialisms. Examples: "get the hang of", "piece of cake", "keep in mind", "run out of", "bring up". Complex sentences of 18-25 words with multiple clauses. Grammar: all tenses including future perfect, subjunctive, inverted sentences, literary language. Any topic: philosophy, literature, professional contexts, nuanced discussions. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.'
        };

        let lengthRequirement = '';
        let lengthDescription = '';

        if (isIELTS) {
            const ieltsLengthByDifficulty = {
                beginner: 'EXACTLY 160-240 words',
                intermediate: 'EXACTLY 300-400 words',
                advanced: 'EXACTLY 440-560 words',
                native: 'EXACTLY 600-800 words'
            };
            lengthRequirement = ieltsLengthByDifficulty[finalDifficulty] || 'EXACTLY 300-400 words';
            lengthDescription = 'MUST be between ' + lengthRequirement.split('EXACTLY ')[1];
        } else {
            const normalLengthByDifficulty = {
                beginner: 'EXACTLY 100-160 words',
                intermediate: 'EXACTLY 200-300 words',
                advanced: 'EXACTLY 360-440 words',
                native: 'EXACTLY 500-700 words'
            };
            lengthRequirement = normalLengthByDifficulty[finalDifficulty] || 'EXACTLY 200-400 words';
            lengthDescription = 'MUST be between ' + lengthRequirement.split('EXACTLY ')[1];
        }

        let userPrompt = '';
        let systemPrompt = '';

        if (isIELTS && ieltsScenario === 'introduction') {
            systemPrompt = 'You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ' + difficultyInstructions[finalDifficulty] + ' CRITICAL REQUIREMENTS: Generate ONE monologue introduction about ' + finalTheme + '. Word count ' + lengthRequirement + '. Do NOT repeat the same information. Do NOT generate multiple similar paragraphs. Do NOT include any explanations, meta-commentary, or "Here is the text". Output ONLY the monologue text itself, nothing else. The monologue should be a continuous, coherent single text.';
            userPrompt = 'Generate an IELTS Section 2 style introduction/monologue about ' + finalTheme + '. CRITICAL: Word count MUST be ' + lengthRequirement + '. This is ' + finalScenario + '. Include relevant details and facts suitable for IELTS listening. STRICT REQUIREMENTS: (1) Generate ONLY ONE monologue, (2) Do NOT repeat content, (3) Do NOT write multiple paragraphs saying the same thing, (4) Do NOT include any intro/outro text, (5) Output ONLY the monologue text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ' + finalDifficulty + ' EXACTLY.';
        } else if (isIELTS && ieltsScenario === 'group-discussion') {
            systemPrompt = 'You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ' + difficultyInstructions[finalDifficulty] + ' CRITICAL REQUIREMENTS: Generate ONE group discussion dialogue. Word count ' + lengthRequirement + '. Do NOT repeat the same information. Do NOT generate multiple similar conversations. Use speaker labels. Do NOT include any explanations, meta-commentary, or "Here is the dialogue". Output ONLY the dialogue text itself, nothing else. The dialogue should be a continuous, coherent single conversation.';
            userPrompt = 'Generate an IELTS Section 3 style group discussion about ' + finalTheme + '. CRITICAL: Word count MUST be ' + lengthRequirement + '. This is ' + finalScenario + '. Create a natural conversation between 2-3 speakers. Use speaker labels like "Speaker A:", "Speaker B:", "Speaker C:". STRICT REQUIREMENTS: (1) Generate ONLY ONE dialogue, (2) Do NOT repeat the same information multiple times, (3) Include different viewpoints and natural dialogue flow, (4) Do NOT include any intro/outro text, (5) Output ONLY the dialogue text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ' + finalDifficulty + ' EXACTLY.';
        } else if (isIELTS && ieltsScenario === 'tutorial') {
            systemPrompt = 'You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ' + difficultyInstructions[finalDifficulty] + ' CRITICAL REQUIREMENTS: Generate ONE tutorial dialogue. Word count ' + lengthRequirement + '. Do NOT repeat the same information. Do NOT generate multiple similar conversations. Use speaker labels. Do NOT include any explanations, meta-commentary, or "Here is the tutorial". Output ONLY the dialogue text itself, nothing else. The tutorial should be a continuous, coherent single conversation.';
            userPrompt = 'Generate an IELTS Section 3 style tutorial/seminar about ' + finalTheme + '. CRITICAL: Word count MUST be ' + lengthRequirement + '. This is ' + finalScenario + '. Create a conversation between a professor and one or more students. Use speaker labels like "Professor:" and "Student:" (or "Student 1:", "Student 2:"). STRICT REQUIREMENTS: (1) Generate ONLY ONE tutorial dialogue, (2) Do NOT repeat content, (3) Include academic language and educational content, (4) Do NOT include any intro/outro text, (5) Output ONLY the dialogue text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ' + finalDifficulty + ' EXACTLY.';
        } else if (isIELTS && ieltsScenario === 'lecture') {
            systemPrompt = 'You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ' + difficultyInstructions[finalDifficulty] + ' CRITICAL REQUIREMENTS: Generate ONE academic lecture. Word count ' + lengthRequirement + '. Do NOT repeat the same information. Do NOT generate multiple similar lectures. Do NOT include any explanations, meta-commentary, or "Here is the lecture". Output ONLY the lecture text itself, nothing else. The lecture should be a continuous, coherent single text.';
            userPrompt = 'Generate an IELTS Section 4 style academic lecture about ' + finalTheme + '. CRITICAL: Word count MUST be ' + lengthRequirement + '. This is ' + finalScenario + '. The lecture should be presented by a professor or expert, covering key concepts, theories, or information about topic. STRICT REQUIREMENTS: (1) Generate ONLY ONE lecture, (2) Do NOT repeat lecture points multiple times, (3) Include academic language and clear structure, (4) Do NOT include any intro/outro text, (5) Output ONLY the lecture text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ' + finalDifficulty + ' EXACTLY.';
        } else if (isIELTS) {
            systemPrompt = 'You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ' + difficultyInstructions[finalDifficulty] + ' CRITICAL REQUIREMENTS: Generate ONE English text. Word count ' + lengthRequirement + '. Do NOT repeat the same information. Do NOT generate multiple similar texts. Do NOT include any explanations, meta-commentary, or "Here is the text". Output ONLY the text itself, nothing else. The text should be a continuous, coherent single text.';
            userPrompt = 'Generate an IELTS-style English text about ' + finalTheme + '. CRITICAL: Word count MUST be ' + lengthRequirement + '. STRICT REQUIREMENTS: (1) Generate ONLY ONE text, (2) Do NOT repeat content, (3) Do NOT include any intro/outro text, (4) Output ONLY the text, (5) Make it suitable for IELTS listening practice, (6) Ensure vocabulary level matches ' + finalDifficulty + ' EXACTLY.';
        } else {
            systemPrompt = 'You are an English listening practice material generator. You MUST STRICTLY follow these rules: ' + difficultyInstructions[finalDifficulty] + ' CRITICAL REQUIREMENTS: Generate ONE English text. Word count ' + lengthRequirement + '. Do NOT repeat the same information. Do NOT generate multiple similar texts. Do NOT include any explanations, meta-commentary, or "Here is the text". Output ONLY the text itself, nothing else. The text should be a continuous, coherent single text.';
            userPrompt = 'Generate an English text about ' + finalTheme + '. CRITICAL: Word count MUST be ' + lengthRequirement + '. STRICT REQUIREMENTS: (1) Generate ONLY ONE text, (2) Do NOT repeat content, (3) Make it interesting and suitable for listening practice, (4) Do NOT include any intro/outro text, (5) Output ONLY the text, (6) Ensure vocabulary level matches ' + finalDifficulty + ' EXACTLY.';
        }

        let requestData = {};
        let url = '';
        let headers = {};

        switch (finalProvider) {
            case 'deepseek':
                url = 'https://api.deepseek.com/v1/chat/completions';
                headers = {
                    'Authorization': 'Bearer ' + finalApiKey,
                    'Content-Type': 'application/json'
                };
                requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                };
                break;

            case 'zhipu':
                url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                headers = {
                    'Authorization': 'Bearer ' + finalApiKey,
                    'Content-Type': 'application/json'
                };
                requestData = {
                    model: 'glm-4',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                };
                break;

            case 'baidu':
                url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro';
                headers = {
                    'Content-Type': 'application/json'
                };
                requestData = {
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ],
                    temperature: 0.3,
                    max_output_tokens: 2000
                };
                url += '?access_token=' + finalApiKey;
                break;

            case 'qwen':
                url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                headers = {
                    'Authorization': 'Bearer ' + finalApiKey,
                    'Content-Type': 'application/json'
                };
                requestData = {
                    model: 'qwen-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                };
                break;

            default:
                return res.status(400).json({ error: '不支持的API提供商' });
        }

        console.log('Calling', finalProvider, 'API...');

        const response = await axios.post(url, requestData, { headers });

        let generatedText = '';

        if (finalProvider === 'deepseek' || finalProvider === 'zhipu' || finalProvider === 'qwen') {
            generatedText = response.data.choices[0].message.content;
        } else if (finalProvider === 'baidu') {
            generatedText = response.data.result;
        }

        generatedText = generatedText.trim();
        if (generatedText.startsWith('"') && generatedText.endsWith('"')) {
            generatedText = generatedText.slice(1, -1);
        }

        console.log('Generated text:', generatedText.substring(0, 50) + '...');

        res.json({ success: true, text: generatedText });

    } catch (error) {
        console.error('API调用错误:', error.message);

        if (error.response) {
            console.error('API响应错误:', error.response.data);
            return res.status(error.response.status || 500).json({
                error: error.response.data.error ? error.response.data.error.message : 'API调用失败',
                details: error.response.data
            });
        }

        res.status(500).json({
            error: '生成文本失败',
            message: error.message
        });
    }
};
