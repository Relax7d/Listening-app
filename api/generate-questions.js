
const axios = require('axios');

module.exports = async function handler(req, res) {
    // CORS 处理
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, difficulty, questionType, ieltsScenario, apiKey, provider, questionCount = 5 } = req.body;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({ error: '文本内容太短，无法生成题目' });
        }

        const finalApiKey = apiKey || process.env.DEFAULT_API_KEY;
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
            const scenarioContext = ieltsScenario ? `\nThis text is from "${ieltsScenario}" scenario. ${scenarioInstructions[ieltsScenario] || ''}` : '';

            if (questionType === 'multiple-choice') {
                // 只生成选择题
                promptContent = `Based on the following English text, generate ${currentBatchSize} IELTS-style multiple-choice listening comprehension questions. Each question must have 4 options (A, B, C, D). For each question, identify the correct answer and provide a brief explanation.\n\nText:\n${text}\n${scenarioContext}\n${existingQuestionsPrompt}\n\nFormat your response as a JSON array:\n[\n  {\n    "type": "multiple-choice",\n    "question": "Your question text",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": 0,\n    "explanation": "Brief explanation"\n  }\n]\n\nImportant:\n- correctAnswer should be 0 for A, 1 for B, 2 for C, 3 for D\n- Make questions test understanding of main ideas, details, and inferences\n- Options should be plausible but only one is correct\n- Explanations should help learners understand why the answer is correct\n- Return ONLY the JSON array, no other text`;

            } else if (questionType === 'fill-blanks') {
                // 只生成填空题
                promptContent = `Based on the following English text, generate ${currentBatchSize} IELTS-style fill-in-the-blank listening comprehension questions. Create questions where key words or phrases from the text are blanked out. For each question, provide the correct answer and a brief explanation.\n\nText:\n${text}\n${scenarioContext}\n${existingQuestionsPrompt}\n\nFormat your response as a JSON array:\n[\n  {\n    "type": "fill-blanks",\n    "question": "Your question with a blank (use _____ for the blank)",\n    "correctAnswer": "The exact word or phrase that fills the blank",\n    "explanation": "Brief explanation of why this is correct"\n  }\n]\n\nImportant:\n- Use _____ to indicate the blank in the question\n- correctAnswer should be the exact word or phrase (case-insensitive)\n- Create questions that test understanding of key information from the text\n- The blank should be filled with words that appear in the original text\n- Make questions challenging but fair for ${difficulty} level\n- Explanations should help learners understand why the answer is correct\n- Return ONLY the JSON array, no other text`;

            } else {
                // 生成全部题型（选择题+填空题）
                const mcCount = Math.ceil(currentBatchSize * 0.6); // 60%选择题
                const fbCount = currentBatchSize - mcCount; // 40%填空题
                promptContent = `Based on the following English text, generate ${currentBatchSize} IELTS-style listening comprehension questions. Create a mix of multiple-choice questions and fill-in-the-blank questions.\n\nText:\n${text}\n${scenarioContext}\n${existingQuestionsPrompt}\n\nGenerate approximately ${mcCount} multiple-choice questions and ${fbCount} fill-in-the-blank questions.\n\nFormat your response as a JSON array:\n[\n  {\n    "type": "multiple-choice",\n    "question": "Your multiple-choice question text",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": 0,\n    "explanation": "Brief explanation"\n  },\n  {\n    "type": "fill-blanks",\n    "question": "Your question with a blank (use _____ for the blank)",\n    "correctAnswer": "The exact word or phrase",\n    "explanation": "Brief explanation"\n  }\n]\n\nImportant:\n- For multiple-choice: correctAnswer should be 0 for A, 1 for B, 2 for C, 3 for D\n- For fill-blanks: use _____ for the blank, correctAnswer is the exact word or phrase\n- Test understanding of main ideas, details, and inferences\n- Make questions challenging but fair for ${difficulty} level (${difficultyInstructions[difficulty]})\n- Explanations should help learners understand why the answer is correct\n- Return ONLY the JSON array, no other text`;
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
            return res.status(error.response.status || 500).json({
                error: error.response.data.error?.message || '题目生成失败',
                details: error.response.data
            });
        }

        res.status(500).json({
            error: '生成题目失败',
            message: error.message
        });
    }
};
