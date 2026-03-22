const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API代理端点
app.post('/api/generate', async (req, res) => {
    try {
        const { apiKey, provider, theme, difficulty, ieltsScenario, themeDescription, scenarioDescription, difficultyDescription, isIELTS } = req.body;

        // 如果前端没有提供apiKey，使用默认配置
        const finalApiKey = apiKey || process.env.DEFAULT_API_KEY || 'sk-3b0a0adcdb0e4652af77c978843eb4f6';
        const finalProvider = provider || process.env.DEFAULT_PROVIDER || 'deepseek';
        const finalTheme = themeDescription || theme;
        const finalScenario = scenarioDescription || ieltsScenario || 'general';
        const finalDifficulty = difficultyDescription || difficulty;

        console.log(`Using API Key: ${finalApiKey.substring(0, 10)}...`);
        console.log(`Theme: ${finalTheme}, Scenario: ${finalScenario}, Difficulty: ${finalDifficulty}, isIELTS: ${isIELTS}`);

        if (!finalApiKey) {
            return res.status(400).json({ error: '请先配置API Key' });
        }

        // 根据难度调整词汇和句子复杂度 - 难度优先级最高，严格约束
        const difficultyInstructions = {
            beginner: 'CRITICAL PRIORITY: Use ONLY elementary school vocabulary (5-8 letter words). Examples: good, bad, happy, sad, big, small, go, come, see, eat. NO words longer than 10 letters. Short sentences of exactly 5-8 words. Simple grammar ONLY: simple present tense, simple past tense. NO: present perfect, past perfect, future continuous, conditionals, passive voice. NO idioms, NO phrasal verbs. Topics: school, family, friends, daily routines. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.',
            intermediate: 'CRITICAL PRIORITY: Use middle school vocabulary (8-12 letter words). Examples: interesting, beautiful, important, understand, remember, learn, practice. NO words longer than 15 letters. Sentences of 8-12 words. Grammar: simple present, past, future; present perfect OK. Simple and compound sentences. NO: complex conditionals, subjunctive, inverted sentences. Common idioms OK like "take care of", "look forward to". Topics: hobbies, travel, education, work experience. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.',
            advanced: 'CRITICAL PRIORITY: Use college-level vocabulary (12-18 letter words). Examples: significant, comprehensive, approximately, nevertheless, implementation, perspective, methodology. Sentences of 12-18 words with 2-3 clauses. Grammar: passive voice, all conditionals, relative clauses, participle phrases. Academic topics: technology, environment, psychology, economics. Technical terminology when relevant. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.',
            native: 'CRITICAL PRIORITY: Use native-level vocabulary including idioms, phrasal verbs, colloquialisms. Examples: "get the hang of", "piece of cake", "keep in mind", "run out of", "bring up". Complex sentences of 18-25 words with multiple clauses. Grammar: all tenses including future perfect, subjunctive, inverted sentences, literary language. Any topic: philosophy, literature, professional contexts, nuanced discussions. STRICTLY follow word count. These constraints override any theme requirements that conflict with difficulty level.'
        };

        // 根据难度和是否为雅思场景调整字数 - 字数翻倍
        let lengthRequirement = '';
        let lengthDescription = '';
        if (isIELTS) {
            // 雅思模式：字数翻倍
            const ieltsLengthByDifficulty = {
                beginner: 'EXACTLY 160-240 words',
                intermediate: 'EXACTLY 300-400 words',
                advanced: 'EXACTLY 440-560 words',
                native: 'EXACTLY 600-800 words'
            };
            lengthRequirement = ieltsLengthByDifficulty[finalDifficulty] || 'EXACTLY 300-400 words';
            lengthDescription = `MUST be between ${lengthRequirement.split('EXACTLY ')[1]}`;
        } else {
            // 普通模式：字数翻倍
            const normalLengthByDifficulty = {
                beginner: 'EXACTLY 100-160 words',
                intermediate: 'EXACTLY 200-300 words',
                advanced: 'EXACTLY 360-440 words',
                native: 'EXACTLY 500-700 words'
            };
            lengthRequirement = normalLengthByDifficulty[finalDifficulty] || 'EXACTLY 200-400 words';
            lengthDescription = `MUST be between ${lengthRequirement.split('EXACTLY ')[1]}`;
        }

        // 根据雅思场景生成不同的提示词 - 严格约束
        let userPrompt = '';
        let systemPrompt = '';

        if (isIELTS && ieltsScenario === 'introduction') {
            systemPrompt = `You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ${difficultyInstructions[finalDifficulty]} CRITICAL REQUIREMENTS: Generate ONE monologue introduction about ${finalTheme}. Word count ${lengthRequirement}. Do NOT repeat the same information. Do NOT generate multiple similar paragraphs. Do NOT include any explanations, meta-commentary, or "Here is the text". Output ONLY the monologue text itself, nothing else. The monologue should be a continuous, coherent single text.`;
            userPrompt = `Generate an IELTS Section 2 style introduction/monologue about ${finalTheme}. CRITICAL: Word count MUST be ${lengthRequirement}. This is ${finalScenario}. Include relevant details and facts suitable for IELTS listening. STRICT REQUIREMENTS: (1) Generate ONLY ONE monologue, (2) Do NOT repeat content, (3) Do NOT write multiple paragraphs saying the same thing, (4) Do NOT include any intro/outro text, (5) Output ONLY the monologue text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ${finalDifficulty} EXACTLY.`;
        } else if (isIELTS && ieltsScenario === 'group-discussion') {
            systemPrompt = `You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ${difficultyInstructions[finalDifficulty]} CRITICAL REQUIREMENTS: Generate ONE group discussion dialogue. Word count ${lengthRequirement}. Do NOT repeat the same information. Do NOT generate multiple similar conversations. Use speaker labels. Do NOT include any explanations, meta-commentary, or "Here is the dialogue". Output ONLY the dialogue text itself, nothing else. The dialogue should be a continuous, coherent single conversation.`;
            userPrompt = `Generate an IELTS Section 3 style group discussion about ${finalTheme}. CRITICAL: Word count MUST be ${lengthRequirement}. This is ${finalScenario}. Create a natural conversation between 2-3 speakers. Use speaker labels like "Speaker A:", "Speaker B:", "Speaker C:". STRICT REQUIREMENTS: (1) Generate ONLY ONE dialogue, (2) Do NOT repeat the same information multiple times, (3) Include different viewpoints and natural dialogue flow, (4) Do NOT include any intro/outro text, (5) Output ONLY the dialogue text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ${finalDifficulty} EXACTLY.`;
        } else if (isIELTS && ieltsScenario === 'tutorial') {
            systemPrompt = `You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ${difficultyInstructions[finalDifficulty]} CRITICAL REQUIREMENTS: Generate ONE tutorial dialogue. Word count ${lengthRequirement}. Do NOT repeat the same information. Do NOT generate multiple similar conversations. Use speaker labels. Do NOT include any explanations, meta-commentary, or "Here is the tutorial". Output ONLY the dialogue text itself, nothing else. The tutorial should be a continuous, coherent single conversation.`;
            userPrompt = `Generate an IELTS Section 3 style tutorial/seminar about ${finalTheme}. CRITICAL: Word count MUST be ${lengthRequirement}. This is ${finalScenario}. Create a conversation between a professor and one or more students. Use speaker labels like "Professor:" and "Student:" (or "Student 1:", "Student 2:"). STRICT REQUIREMENTS: (1) Generate ONLY ONE tutorial dialogue, (2) Do NOT repeat content, (3) Include academic language and educational content, (4) Do NOT include any intro/outro text, (5) Output ONLY the dialogue text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ${finalDifficulty} EXACTLY.`;
        } else if (isIELTS && ieltsScenario === 'lecture') {
            systemPrompt = `You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ${difficultyInstructions[finalDifficulty]} CRITICAL REQUIREMENTS: Generate ONE academic lecture. Word count ${lengthRequirement}. Do NOT repeat the same information. Do NOT generate multiple similar lectures. Do NOT include any explanations, meta-commentary, or "Here is the lecture". Output ONLY the lecture text itself, nothing else. The lecture should be a continuous, coherent single text.`;
            userPrompt = `Generate an IELTS Section 4 style academic lecture about ${finalTheme}. CRITICAL: Word count MUST be ${lengthRequirement}. This is ${finalScenario}. The lecture should be presented by a professor or expert, covering key concepts, theories, or information about the topic. STRICT REQUIREMENTS: (1) Generate ONLY ONE lecture, (2) Do NOT repeat lecture points multiple times, (3) Include academic language and clear structure, (4) Do NOT include any intro/outro text, (5) Output ONLY the lecture text, (6) Make it suitable for IELTS listening practice, (7) Ensure vocabulary level matches ${finalDifficulty} EXACTLY.`;
        } else if (isIELTS) {
            systemPrompt = `You are an IELTS listening test material generator. You MUST STRICTLY follow these rules: ${difficultyInstructions[finalDifficulty]} CRITICAL REQUIREMENTS: Generate ONE English text. Word count ${lengthRequirement}. Do NOT repeat the same information. Do NOT generate multiple similar texts. Do NOT include any explanations, meta-commentary, or "Here is the text". Output ONLY the text itself, nothing else. The text should be a continuous, coherent single text.`;
            userPrompt = `Generate an IELTS-style English text about ${finalTheme}. CRITICAL: Word count MUST be ${lengthRequirement}. STRICT REQUIREMENTS: (1) Generate ONLY ONE text, (2) Do NOT repeat content, (3) Do NOT include any intro/outro text, (4) Output ONLY the text, (5) Make it suitable for IELTS listening practice, (6) Ensure vocabulary level matches ${finalDifficulty} EXACTLY.`;
        } else {
            systemPrompt = `You are an English listening practice material generator. You MUST STRICTLY follow these rules: ${difficultyInstructions[finalDifficulty]} CRITICAL REQUIREMENTS: Generate ONE English text. Word count ${lengthRequirement}. Do NOT repeat the same information. Do NOT generate multiple similar texts. Do NOT include any explanations, meta-commentary, or "Here is the text". Output ONLY the text itself, nothing else. The text should be a continuous, coherent single text.`;
            userPrompt = `Generate an English text about ${finalTheme}. CRITICAL: Word count MUST be ${lengthRequirement}. STRICT REQUIREMENTS: (1) Generate ONLY ONE text, (2) Do NOT repeat content, (3) Make it interesting and suitable for listening practice, (4) Do NOT include any intro/outro text, (5) Output ONLY the text, (6) Ensure vocabulary level matches ${finalDifficulty} EXACTLY.`;
        }

        let requestData = {};
        let url = '';
        let headers = {};

        // 根据不同的API提供商构建请求
        switch (finalProvider) {
            case 'deepseek':
                url = 'https://api.deepseek.com/v1/chat/completions';
                headers = {
                    'Authorization': `Bearer ${finalApiKey}`,
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
                    temperature: 0.3,  // 降低temperature以获得更可控的输出
                    max_tokens: 2000  // 增加tokens以确保能生成足够的字数（字数翻倍后需要更多tokens）
                };
                break;

            case 'zhipu':
                url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                headers = {
                    'Authorization': `Bearer ${finalApiKey}`,
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
                // 百度API需要在URL中包含access_token
                url += `?access_token=${finalApiKey}`;
                break;

            case 'qwen':
                url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                headers = {
                    'Authorization': `Bearer ${finalApiKey}`,
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

        console.log(`Calling ${finalProvider} API...`);
        
        const response = await axios.post(url, requestData, { headers });
        
        let generatedText = '';
        
        // 根据不同的API提供商解析响应
        if (finalProvider === 'deepseek' || finalProvider === 'zhipu' || finalProvider === 'qwen') {
            generatedText = response.data.choices[0].message.content;
        } else if (finalProvider === 'baidu') {
            generatedText = response.data.result;
        }
        
        // 清理生成的文本（移除可能的引号）
        generatedText = generatedText.trim();
        if (generatedText.startsWith('"') && generatedText.endsWith('"')) {
            generatedText = generatedText.slice(1, -1);
        }
        
        console.log(`Generated text: ${generatedText.substring(0, 50)}...`);
        
        res.json({ success: true, text: generatedText });
        
    } catch (error) {
        console.error('API调用错误:', error.message);
        
        if (error.response) {
            console.error('API响应错误:', error.response.data);
            return res.status(error.response.status).json({
                error: error.response.data.error?.message || 'API调用失败',
                details: error.response.data
            });
        }
        
        res.status(500).json({ 
            error: '生成文本失败',
            message: error.message 
        });
    }
});

// 生成雅思题目API（支持分段生成）
app.post('/api/generate-questions', async (req, res) => {
    try {
        const { text, difficulty, questionType, ieltsScenario, apiKey, provider, questionCount = 5 } = req.body;
        
        if (!text || text.trim().length < 50) {
            return res.status(400).json({ error: '文本内容太短，无法生成题目' });
        }
        
        const finalApiKey = apiKey || process.env.DEFAULT_API_KEY || 'sk-3b0a0adcdb0e4652af77c978843eb4f6';
        const finalProvider = provider || process.env.DEFAULT_PROVIDER || 'deepseek';
        
        console.log(`Generating IELTS questions for ${difficulty} level, type: ${questionType}, scenario: ${ieltsScenario}, count: ${questionCount}...`);

        // 根据难度调整题目难度
        const difficultyInstructions = {
            beginner: 'simple vocabulary and basic grammar',
            intermediate: 'moderate vocabulary and varied sentence structures',
            advanced: 'complex vocabulary and sophisticated language',
            native: 'native-level vocabulary and nuanced language'
        };

        // 分段生成题目：每批生成5道，直到达到目标数量
        const allQuestions = [];
        const batchSize = 5;
        const batches = Math.ceil(questionCount / batchSize);
        let batchCount = 0;

        for (let i = 0; i < batches; i++) {
            const currentBatchSize = Math.min(batchSize, questionCount - allQuestions.length);

            // 如果不是第一批，添加已生成题目的摘要，避免重复
            let existingQuestionsPrompt = '';
            if (i > 0) {
                existingQuestionsPrompt = `\n\nIMPORTANT: The following questions have already been generated. DO NOT generate similar or duplicate questions:\n${allQuestions.map(q => `- ${q.question.substring(0, 50)}...`).join('\n')}\n\nGenerate NEW and DIFFERENT questions that test different aspects of the text.`;
            }
        
        // 根据场景调整出题策略
        const scenarioInstructions = {
            'introduction': 'Focus on understanding details, facts, and main information presented in introductions or monologues. Test comprehension of specific details, numbers, dates, and key points.',
            'group-discussion': 'Focus on understanding opinions, viewpoints, agreements, disagreements, and conclusions in group discussions. Test comprehension of speaker attitudes and perspectives.',
            'tutorial': 'Focus on understanding academic explanations, student questions, and teacher responses. Test comprehension of educational content, feedback, and guidance.',
            'lecture': 'Focus on understanding complex academic content, main ideas, supporting details, and logical structure. Test comprehension of technical information and conceptual understanding.'
        };
        
        // 根据题目类型生成不同的prompt
        let promptContent = '';
        const scenarioContext = ieltsScenario ? `\nThis text is from the "${ieltsScenario}" scenario. ${scenarioInstructions[ieltsScenario] || ''}` : '';

        if (questionType === 'multiple-choice') {
            // 只生成选择题
            promptContent = `Based on the following English text, generate ${batchSize} IELTS-style multiple-choice listening comprehension questions. Each question must have 4 options (A, B, C, D). For each question, identify the correct answer and provide a brief explanation.\n\nText:\n${text}\n${scenarioContext}\n${existingQuestionsPrompt}\n\nFormat your response as a JSON array:\n[\n  {\n    "type": "multiple-choice",\n    "question": "Your question text",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": 0,\n    "explanation": "Brief explanation"\n  }\n]\n\nImportant:\n- correctAnswer should be 0 for A, 1 for B, 2 for C, 3 for D\n- Make questions test understanding of main ideas, details, and inferences\n- Options should be plausible but only one is correct\n- Explanations should help learners understand why the answer is correct\n- Return ONLY the JSON array, no other text`;

        } else if (questionType === 'fill-blanks') {
            // 只生成填空题
            promptContent = `Based on the following English text, generate ${batchSize} IELTS-style fill-in-the-blank listening comprehension questions. Create questions where key words or phrases from the text are blanked out. For each question, provide the correct answer and a brief explanation.\n\nText:\n${text}\n${scenarioContext}\n${existingQuestionsPrompt}\n\nFormat your response as a JSON array:\n[\n  {\n    "type": "fill-blanks",\n    "question": "Your question with the blank (use _____ for the blank)",\n    "correctAnswer": "The exact word or phrase that fills the blank",\n    "explanation": "Brief explanation of why this is correct"\n  }\n]\n\nImportant:\n- Use _____ to indicate the blank in the question\n- correctAnswer should be the exact word or phrase (case-insensitive)\n- Create questions that test understanding of key information from the text\n- The blank should be filled with words that appear in the original text\n- Make questions challenging but fair for ${difficulty} level\n- Explanations should help learners understand why the answer is correct\n- Return ONLY the JSON array, no other text`;

        } else {
            // 生成全部题型（选择题+填空题）
            const mcCount = Math.ceil(batchSize * 0.6); // 60%选择题
            const fbCount = batchSize - mcCount; // 40%填空题
            promptContent = `Based on the following English text, generate ${batchSize} IELTS-style listening comprehension questions. Create a mix of multiple-choice questions and fill-in-the-blank questions.\n\nText:\n${text}\n${scenarioContext}\n${existingQuestionsPrompt}\n\nGenerate approximately ${mcCount} multiple-choice questions and ${fbCount} fill-in-the-blank questions.\n\nFormat your response as a JSON array:\n[\n  {\n    "type": "multiple-choice",\n    "question": "Your multiple-choice question text",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": 0,\n    "explanation": "Brief explanation"\n  },\n  {\n    "type": "fill-blanks",\n    "question": "Your question with the blank (use _____ for the blank)",\n    "correctAnswer": "The exact word or phrase",\n    "explanation": "Brief explanation"\n  }\n]\n\nImportant:\n- For multiple-choice: correctAnswer should be 0 for A, 1 for B, 2 for C, 3 for D\n- For fill-blanks: use _____ for the blank, correctAnswer is the exact word or phrase\n- Test understanding of main ideas, details, and inferences\n- Make questions challenging but fair for ${difficulty} level (${difficultyInstructions[difficulty]})\n- Explanations should help learners understand why the answer is correct\n- Return ONLY the JSON array, no other text`;
        }

        // 构建API请求配置
        let requestData = {
            messages: [
                {
                    role: 'system',
                    content: `You are an expert IELTS examiner specializing in creating listening comprehension questions. Generate high-quality, challenging questions based on the given text. Questions should test understanding at ${difficulty} level (${difficultyInstructions[difficulty]}).`
                },
                {
                    role: 'user',
                    content: promptContent
                }
            ],
            temperature: 0.7,
            max_tokens: 1800
        };

        let url = '';
        let headers = {};

        // 根据不同的API提供商构建请求
        switch (finalProvider) {
            case 'deepseek':
                url = 'https://api.deepseek.com/v1/chat/completions';
                headers = {
                    'Authorization': `Bearer ${finalApiKey}`,
                    'Content-Type': 'application/json'
                };
                requestData.model = 'deepseek-chat';
                break;

            case 'zhipu':
                url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                headers = {
                    'Authorization': `Bearer ${finalApiKey}`,
                    'Content-Type': 'application/json'
                };
                requestData.model = 'glm-4';
                break;

            case 'baidu':
                url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro';
                headers = {
                    'Content-Type': 'application/json'
                };
                requestData.model = 'ernie-4.0-8k';
                requestData.max_output_tokens = 1800;
                // 百度API需要在URL中包含access_token
                url += `?access_token=${finalApiKey}`;
                break;

            case 'qwen':
                url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                headers = {
                    'Authorization': `Bearer ${finalApiKey}`,
                    'Content-Type': 'application/json'
                };
                requestData.model = 'qwen-turbo';
                break;

            default:
                return res.status(400).json({ error: '不支持的API提供商' });
        }
        
        console.log(`Calling ${finalProvider} API for questions...`);
        const response = await axios.post(url, requestData, { headers });
        
        let questionsText = '';
        // 根据不同的API提供商解析响应
        if (finalProvider === 'deepseek' || finalProvider === 'zhipu' || finalProvider === 'qwen') {
            questionsText = response.data.choices[0].message.content;
        } else if (finalProvider === 'baidu') {
            questionsText = response.data.result;
        }
        
        // 清理响应，提取JSON
        questionsText = questionsText.trim();
        
        // 移除可能的markdown代码块标记
        if (questionsText.startsWith('```json')) {
            questionsText = questionsText.slice(7);
        } else if (questionsText.startsWith('```')) {
            questionsText = questionsText.slice(3);
        }
        if (questionsText.endsWith('```')) {
            questionsText = questionsText.slice(0, -3);
        }
        questionsText = questionsText.trim();
        
        // 解析JSON
        let questions;
        try {
            questions = JSON.parse(questionsText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError.message);
            console.log('Raw response:', questionsText);
            
            // 尝试修复常见的JSON问题
            const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    questions = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    throw new Error('无法解析AI返回的题目数据');
                }
            } else {
                throw new Error('无法解析AI返回的题目数据');
            }
        }
        
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('生成的题目格式不正确');
        }
        
        // 验证题目格式（支持选择题和填空题）
        questions = questions.filter(q => {
            if (!q.question || !q.type) return false;
            
            if (q.type === 'multiple-choice') {
                // 选择题必须有4个选项
                return Array.isArray(q.options) && 
                       q.options.length === 4 &&
                       typeof q.correctAnswer === 'number' &&
                       q.correctAnswer >= 0 && 
                       q.correctAnswer <= 3;
            } else if (q.type === 'fill-blanks') {
                // 填空题必须有答案
                return q.correctAnswer && 
                       typeof q.correctAnswer === 'string' &&
                       q.correctAnswer.trim().length > 0;
            }
            
            return false;
        });
        
        if (questions.length === 0) {
            throw new Error('未能生成有效的题目');
        }

        // 将当前批次的题目添加到总列表中
        allQuestions.push(...questions);
        batchCount++;

        console.log(`Batch ${batchCount}/${batches}: Generated ${questions.length} questions (Total: ${allQuestions.length}/${questionCount})`);

        // 如果已经生成足够的题目，退出循环
        if (allQuestions.length >= questionCount) {
            break;
        }
        }

        // 如果生成的题目数量不足，取前N道
        const finalQuestions = allQuestions.slice(0, questionCount);

        console.log(`Successfully generated ${finalQuestions.length} questions (${questionType}, ${questionCount} requested)`);

        res.json({
            success: true,
            questions: finalQuestions
        });
        
    } catch (error) {
        console.error('题目生成错误:', error.message);
        
        if (error.response) {
            console.error('API响应错误:', error.response.data);
            return res.status(error.response.status).json({
                error: error.response.data.error?.message || '题目生成失败',
                details: error.response.data
            });
        }
        
        res.status(500).json({ 
            error: '生成题目失败',
            message: error.message 
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行正常' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`局域网访问: http://<本机IP>:${PORT}`);
    console.log(`静态文件服务: http://localhost:${PORT}`);
    console.log(`API端点: http://localhost:${PORT}/api/generate`);
    console.log(`题目生成端点: http://localhost:${PORT}/api/generate-questions`);
});
