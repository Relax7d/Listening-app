// 获取DOM元素
const textInput = document.getElementById('text-input');
const charCount = document.getElementById('char-count');
const readBtn = document.getElementById('read-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const configBtn = document.getElementById('config-btn');
const generateBtn = document.getElementById('generate-btn');
const generateQuestionsBtn = document.getElementById('generate-questions-btn');
const clearQuestionsBtn = document.getElementById('clear-questions-btn');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');
const statusText = document.getElementById('status-text');
const statusBar = document.getElementById('status-bar');
const voiceRadios = document.querySelectorAll('input[name="voice"]');
const voiceGenderRadios = document.querySelectorAll('input[name="voice-gender"]');
const difficultySelect = document.getElementById('difficulty');
const themeSelect = document.getElementById('theme-select');
const ieltsScenarioSelect = document.getElementById('ielts-scenario');
const questionTypeSelect = document.getElementById('question-type');
const questionCountSelect = document.getElementById('question-count');
const questionsSection = document.getElementById('questions-section');
const questionsContainer = document.getElementById('questions-container');

// 配置弹窗元素
const modal = document.getElementById('config-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const apiProviderSelect = document.getElementById('api-provider');
const apiKeyInput = document.getElementById('api-key');
const savedKeysSelect = document.getElementById('saved-keys');
const deleteKeyBtn = document.getElementById('delete-key-btn');
const togglePasswordBtn = document.getElementById('toggle-password');

// 语音合成对象
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isPaused = false;

// 初始化
function init() {
    // 加载可用的语音
    loadVoices();
    
    // 语音列表加载事件
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // 语速滑块事件
    speedSlider.addEventListener('input', function() {
        speedValue.textContent = this.value + 'x';
    });
    
    // 按钮事件
    readBtn.addEventListener('click', startReading);
    pauseBtn.addEventListener('click', pauseReading);
    stopBtn.addEventListener('click', stopReading);
    configBtn.addEventListener('click', openConfigModal);
    generateBtn.addEventListener('click', generateText);
    generateQuestionsBtn.addEventListener('click', generateQuestions);

    // 清除题目按钮
    if (clearQuestionsBtn) {
        clearQuestionsBtn.addEventListener('click', clearQuestions);
    }

    // 字符计数
    textInput.addEventListener('input', updateCharCount);
    updateCharCount();
    
    // 配置弹窗事件
    closeModalBtn.addEventListener('click', closeConfigModal);
    cancelBtn.addEventListener('click', closeConfigModal);
    saveBtn.addEventListener('click', saveConfig);
    deleteKeyBtn.addEventListener('click', deleteSavedKey);
    togglePasswordBtn.addEventListener('click', togglePassword);
    
    // 点击弹窗外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeConfigModal();
        }
    });
    
    // 已保存Keys选择事件
    savedKeysSelect.addEventListener('change', function() {
        const selectedKey = this.value;
        if (selectedKey) {
            const [provider, name] = selectedKey.split('|');
            apiProviderSelect.value = provider;
            apiKeyInput.value = name;
        }
    });

    // 难度选择改变时，更新题目数量选项的可用性
    difficultySelect.addEventListener('change', updateQuestionCountOptions);

    // 加载已保存的配置
    loadSavedConfigs();

    // 初始化题目数量选项
    updateQuestionCountOptions();
    
    // 更新状态
    updateStatus('准备就绪');
}

// 加载可用语音
function loadVoices() {
    const voices = speechSynthesis.getVoices();
    console.log('可用语音数量:', voices.length);
    
    // 检查是否有英文语音
    const usVoice = voices.find(v => v.lang === 'en-US');
    const gbVoice = voices.find(v => v.lang === 'en-GB');
    
    if (!usVoice && !gbVoice) {
        updateStatus('警告: 未检测到英文语音', 'warning');
    }
}

// 开始朗读
function startReading() {
    const text = textInput.value.trim();
    
    if (!text) {
        updateStatus('请先输入要朗读的英文文本', 'warning');
        textInput.focus();
        return;
    }
    
    // 如果是暂停状态，继续朗读
    if (isPaused && speechSynthesis.paused) {
        speechSynthesis.resume();
        isPaused = false;
        pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> 暂停';
        updateStatus('正在朗读...');
        textInput.classList.add('reading');
        return;
    }
    
    // 如果正在朗读，先停止
    if (speechSynthesis.speaking) {
        stopReading();
    }
    
    // 创建新的朗读实例
    currentUtterance = new SpeechSynthesisUtterance(text);
    
    // 获取选择的语音类型和性别
    const selectedVoice = document.querySelector('input[name="voice"]:checked').value;
    const selectedGender = document.querySelector('input[name="voice-gender"]:checked').value;
    const voices = speechSynthesis.getVoices();
    
    // 筛选符合条件的语音
    let filteredVoices = voices.filter(v => v.lang === selectedVoice);
    
    // 根据性别进一步筛选
    if (selectedGender === 'female') {
        filteredVoices = filteredVoices.filter(v => 
            v.name.includes('Female') || v.name.includes('female') || 
            v.name.includes('Zira') || v.name.includes('Victoria') || 
            v.name.includes('Samantha') || v.name.includes('Moira') ||
            v.name.includes('Google US English') ||
            v.name.includes('Google UK English Female')
        );
    } else {
        filteredVoices = filteredVoices.filter(v => 
            !v.name.includes('Female') && !v.name.includes('female') &&
            v.name !== 'Zira' && v.name !== 'Victoria' &&
            v.name !== 'Samantha' && v.name !== 'Moira' &&
            !v.name.includes('Google UK English Female')
        );
    }
    
    // 设置语音（优先使用筛选后的语音）
    if (filteredVoices.length > 0) {
        currentUtterance.voice = filteredVoices[0];
    } else {
        // 如果没有找到指定性别的语音,使用默认语音
        const defaultVoice = voices.find(v => v.lang === selectedVoice);
        if (defaultVoice) {
            currentUtterance.voice = defaultVoice;
        }
    }
    currentUtterance.lang = selectedVoice;
    
    // 设置语速
    currentUtterance.rate = parseFloat(speedSlider.value);
    
    // 设置音调（可选）
    currentUtterance.pitch = 1;
    
    // 朗读事件
    currentUtterance.onstart = function() {
        updateStatus('正在朗读...');
        readBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        textInput.classList.add('reading');
    };
    
    currentUtterance.onend = function() {
        updateStatus('朗读完成');
        readBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        textInput.classList.remove('reading');
        isPaused = false;
    };
    
    currentUtterance.onerror = function(event) {
        console.error('朗读错误:', event.error);
        updateStatus('朗读出错: ' + getErrorMessage(event.error), 'error');
        readBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        textInput.classList.remove('reading');
    };
    
    currentUtterance.onpause = function() {
        updateStatus('已暂停');
        textInput.classList.remove('reading');
    };
    
    currentUtterance.onresume = function() {
        updateStatus('正在朗读...');
        textInput.classList.add('reading');
    };
    
    // 开始朗读
    speechSynthesis.speak(currentUtterance);
}

// 暂停/继续朗读
function pauseReading() {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        isPaused = true;
        pauseBtn.innerHTML = '<span class="btn-icon">▶️</span> 继续';
        updateStatus('已暂停');
        textInput.classList.remove('reading');
    } else if (isPaused) {
        speechSynthesis.resume();
        isPaused = false;
        pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> 暂停';
        updateStatus('正在朗读...');
        textInput.classList.add('reading');
    }
}

// 停止朗读
function stopReading() {
    speechSynthesis.cancel();
    isPaused = false;
    pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> 暂停';
    updateStatus('已停止');
    readBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    textInput.classList.remove('reading');
}

// 清空文本
function clearText() {
    if (textInput.value.trim()) {
        if (confirm('确定要清空所有文本吗?')) {
            textInput.value = '';
            stopReading();
            updateStatus('文本已清空');
            textInput.focus();
        }
    } else {
        updateStatus('文本框已经是空的');
    }
}

// 更新状态
function updateStatus(message, type = 'info') {
    statusText.textContent = message;

    // 根据类型设置样式
    statusBar.className = 'status-bar';
    if (type === 'error') {
        statusBar.style.borderColor = 'var(--error)';
        statusBar.style.background = 'rgba(239, 68, 68, 0.1)';
        statusBar.style.color = 'var(--error)';
    } else if (type === 'warning') {
        statusBar.style.borderColor = 'var(--warning)';
        statusBar.style.background = 'rgba(245, 158, 11, 0.1)';
        statusBar.style.color = 'var(--warning)';
    } else if (type === 'success') {
        statusBar.style.borderColor = 'var(--success)';
        statusBar.style.background = 'rgba(16, 185, 129, 0.1)';
        statusBar.style.color = 'var(--success)';
    } else {
        statusBar.style.borderColor = 'var(--neutral-200)';
        statusBar.style.background = 'var(--neutral-100)';
        statusBar.style.color = 'var(--neutral-600)';
    }
}

// 更新字符计数
function updateCharCount() {
    const count = textInput.value.length;
    charCount.textContent = `${count} 字符`;
}

// 根据难度级别更新题目数量选项的可用性
function updateQuestionCountOptions() {
    const difficulty = difficultySelect.value;
    const options = questionCountSelect.options;

    // 重置所有选项
    for (let i = 0; i < options.length; i++) {
        options[i].disabled = false;
        // 移除括号中的限制说明
        options[i].text = options[i].text.replace(/\s*\(需要[^\)]+\)/, '');
    }

    // 根据难度禁用不符合要求的选项
    if (difficulty === 'beginner' || difficulty === 'intermediate') {
        // 初级和中级：只能选择5道
        options[1].disabled = true; // 10道
        options[2].disabled = true; // 15道
        options[1].text = '10 道题 (需要高级)';
        options[2].text = '15 道题 (需要母语)';
        // 如果当前选中的是被禁用的选项，切换到5道
        if (questionCountSelect.value === '10' || questionCountSelect.value === '15') {
            questionCountSelect.value = '5';
        }
    } else if (difficulty === 'advanced') {
        // 高级：可以选择5道或10道
        options[2].disabled = true; // 15道
        options[2].text = '15 道题 (需要母语)';
        // 如果当前选中的是15道，切换到10道
        if (questionCountSelect.value === '15') {
            questionCountSelect.value = '10';
        }
    }
    // 母语水平：所有选项都可用
}

// 清除题目
function clearQuestions() {
    questionsContainer.innerHTML = '';
    questionsSection.style.display = 'none';
    currentQuestions = [];
    updateStatus('题目已清除');
}

// 获取错误信息
function getErrorMessage(error) {
    const errorMessages = {
        'canceled': '朗读已取消',
        'interrupted': '朗读被中断',
        'interrupted-by-error': '朗读因错误被中断',
        'not-allowed': '不允许朗读',
        'network': '网络错误',
        'synthesis-unavailable': '语音合成不可用',
        'voice-unavailable': '语音不可用',
        'text-too-long': '文本过长'
    };
    
    return errorMessages[error] || '未知错误';
}

// 页面卸载时停止朗读
window.addEventListener('beforeunload', function() {
    stopReading();
});

// ========== 配置弹窗相关函数 ==========

// 打开配置弹窗
function openConfigModal() {
    modal.classList.add('show');
    loadSavedConfigs();
}

// 关闭配置弹窗
function closeConfigModal() {
    modal.classList.remove('show');
    if (apiKeyInput) {
        apiKeyInput.value = '';
    }
}

// 切换密码显示
function togglePassword() {
    if (apiKeyInput && apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        togglePasswordBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else if (apiKeyInput) {
        apiKeyInput.type = 'password';
        togglePasswordBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
}

// 保存配置
function saveConfig() {
    const provider = apiProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        updateStatus('请输入API Key', 'error');
        return;
    }

    // 保存到localStorage
    const savedConfigs = getSavedConfigs();
    const keyName = `sk-${apiKey.substring(3, 7)}...`;
    savedConfigs.push({
        provider: provider,
        name: keyName,
        fullKey: apiKey,
        timestamp: Date.now()
    });

    localStorage.setItem('apiConfigs', JSON.stringify(savedConfigs));

    // 设置为当前使用的配置
    localStorage.setItem('currentConfig', JSON.stringify({
        provider: provider,
        apiKey: apiKey
    }));

    updateStatus('配置已保存', 'success');
    loadSavedConfigs();
    closeConfigModal();
}

// 删除已保存的Key
function deleteSavedKey() {
    const selectedKey = savedKeysSelect.value;
    if (!selectedKey) {
        updateStatus('请先选择要删除的Key', 'warning');
        return;
    }

    if (confirm('确定要删除这个配置吗?')) {
        const savedConfigs = getSavedConfigs();
        const [provider, name] = selectedKey.split('|');
        const index = savedConfigs.findIndex(
            c => c.provider === provider && c.name === name
        );

        if (index > -1) {
            savedConfigs.splice(index, 1);
            localStorage.setItem('apiConfigs', JSON.stringify(savedConfigs));
            loadSavedConfigs();
            updateStatus('配置已删除', 'success');
        }
    }
}

// 获取已保存的配置
function getSavedConfigs() {
    const saved = localStorage.getItem('apiConfigs');
    return saved ? JSON.parse(saved) : [];
}

// 加载已保存的配置
function loadSavedConfigs() {
    const savedConfigs = getSavedConfigs();
    
    // 清空并重新填充选择框
    savedKeysSelect.innerHTML = '<option value="">-- 选择已保存的 Key --</option>';
    savedConfigs.forEach(config => {
        const option = document.createElement('option');
        option.value = `${config.provider}|${config.name}`;
        option.textContent = `${config.provider.toUpperCase()} - ${config.name}`;
        savedKeysSelect.appendChild(option);
    });
    
    // 检查是否有当前配置
    const currentConfig = localStorage.getItem('currentConfig');
    if (currentConfig) {
        const config = JSON.parse(currentConfig);
        apiProviderSelect.value = config.provider;
        apiKeyInput.value = config.apiKey;
    }
}

// ========== 文本生成相关函数 ==========

// 带重试机制的fetch请求
async function fetchWithRetry(url, options, maxRetries = 2, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }

            // 如果是4xx错误（客户端错误），不重试
            if (response.status >= 400 && response.status < 500) {
                return response;
            }

            // 如果是5xx错误或网络错误，重试
            if (i < maxRetries - 1) {
                console.log(`请求失败，${delay}ms后重试 (${i + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // 指数退避
            }
        } catch (error) {
            console.error(`请求出错 (${i + 1}/${maxRetries}):`, error);
            if (i < maxRetries - 1) {
                console.log(`${delay}ms后重试...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                throw error;
            }
        }
    }
    throw new Error('请求失败，已达到最大重试次数');
}

// 生成随机文本
async function generateText() {
    const theme = themeSelect.value;
    const difficulty = difficultySelect.value;
    const ieltsScenario = ieltsScenarioSelect.value;
    const isIELTS = ieltsScenario && ieltsScenario !== 'general';

    // 防止重复点击
    if (generateBtn.disabled) {
        updateStatus('正在生成中，请稍候...', 'warning');
        return;
    }

    // 获取难度对应的描述
    const difficultyLevels = {
        beginner: 'elementary school level',
        intermediate: 'middle school level',
        advanced: 'college level',
        native: 'native English speaker level'
    };

    // 获取主题对应的英文描述
    const themeDescriptions = {
        story: 'stories and narratives',
        news: 'news articles',
        conversation: 'everyday conversations',
        learning: 'educational content',
        essay: 'short essays',
        science: 'scientific topics',
        technology: 'technology and innovation',
        culture: 'cultural topics',
        business: 'business and professional contexts',
        daily: 'daily life situations'
    };

    // 获取雅思场景对应的英文描述
    const scenarioDescriptions = {
        'introduction': 'introduction and monologue',
        'group-discussion': 'group discussion',
        'tutorial': 'tutorial and seminar',
        'lecture': 'academic lecture'
    };

    // 如果是随机主题，随机选择一个
    const allThemes = ['story', 'news', 'conversation', 'learning', 'essay', 'science', 'technology', 'culture', 'business', 'daily'];
    const finalTheme = theme === 'random' ?
        allThemes[Math.floor(Math.random() * allThemes.length)] :
        theme;

    const finalThemeDesc = themeDescriptions[finalTheme] || finalTheme;
    const difficultyDesc = difficultyLevels[difficulty] || difficulty;
    const finalScenarioDesc = scenarioDescriptions[ieltsScenario] || ieltsScenario;

    updateStatus('正在生成文本...', 'info');
    generateBtn.disabled = true;

    try {
        // 获取保存的配置，如果没有则使用后端默认配置
        const currentConfig = localStorage.getItem('currentConfig');

        let requestBody = {
            theme: finalTheme,
            difficulty: difficulty,
            themeDescription: finalThemeDesc,
            difficultyDescription: difficultyDesc,
            ieltsScenario: ieltsScenario,
            scenarioDescription: finalScenarioDesc,
            isIELTS: isIELTS
        };

        // 如果前端有配置，则使用前端的配置
        if (currentConfig) {
            const config = JSON.parse(currentConfig);
            requestBody.apiKey = config.apiKey;
            requestBody.provider = config.provider;
        }
        
        // 使用带重试机制的fetch
        // 自动检测是否在Vercel环境，使用相对路径
        const apiBaseUrl = window.location.hostname.includes('vercel.app')
            ? '/api'
            : 'http://localhost:3000/api';

        const response = await fetchWithRetry(`${apiBaseUrl}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '生成失败');
        }
        
        const data = await response.json();
        
        // 将生成的文本放入文本框
        textInput.value = data.text;
        
        // 如果文本框是空的，追加文本
        if (!textInput.value.trim()) {
            textInput.value = data.text;
        } else {
            textInput.value = textInput.value.trim() + '\n\n' + data.text;
        }
        
        updateStatus('文本生成成功!', 'success');
        
    } catch (error) {
        console.error('生成错误:', error);
        updateStatus('生成失败: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
}

// 初始化应用
init();

// ========== 雅思题目生成相关函数 ==========

// 存储当前题目数据
let currentQuestions = [];

// 生成雅思题目
async function generateQuestions() {
    const text = textInput.value.trim();

    if (!text) {
        updateStatus('请先生成或输入英文文本', 'warning');
        return;
    }

    // 防止重复点击
    if (generateQuestionsBtn.disabled) {
        updateStatus('正在生成中，请稍候...', 'warning');
        return;
    }

    // 检查文本长度，防止超限
    if (text.length > 10000) {
        updateStatus('文本过长，请缩短后重新生成', 'error');
        return;
    }

    const difficulty = difficultySelect.value;
    const ieltsScenario = ieltsScenarioSelect.value;
    const questionCount = parseInt(questionCountSelect.value);
    
    // 检查难度是否适合生成雅思题
    if (difficulty === 'beginner') {
        updateStatus('⚠️ 雅思题目需要中级或以上难度才能生成', 'warning');
        
        // 询问用户是否要提升难度
        const confirmUpgrade = confirm(
            '当前难度为初级，雅思题目需要中级或以上难度。\n\n' +
            '是否自动切换到中级难度？'
        );
        
        if (confirmUpgrade) {
            difficultySelect.value = 'intermediate';
            updateStatus('已切换到中级难度，请重新点击生成雅思题', 'info');
        }
        return;
    }
    
    const questionType = questionTypeSelect.value;
    const difficultyLabels = {
        beginner: '初级',
        intermediate: '中级',
        advanced: '高级',
        native: '母语水平'
    };
    
    const scenarioLabels = {
        'introduction': '介绍说明类',
        'group-discussion': '小组讨论',
        'tutorial': '师生讨论',
        'lecture': '学术讲座'
    };
    
    const questionTypeLabels = {
        'all': '全部题型',
        'multiple-choice': '选择题',
        'fill-blanks': '填空题'
    };
    
    const scenarioInfo = scenarioLabels[ieltsScenario] || ieltsScenario;
    updateStatus(`正在生成${scenarioInfo}${difficultyLabels[difficulty]}雅思${questionTypeLabels[questionType]}...`, 'info');
    generateQuestionsBtn.disabled = true;

    try {
        // 获取保存的配置
        const currentConfig = localStorage.getItem('currentConfig');

        let requestBody = {
            text: text,
            difficulty: difficulty,
            questionType: questionType,
            ieltsScenario: ieltsScenario,
            questionCount: questionCount
        };

        // 如果前端有配置，则使用前端的配置
        if (currentConfig) {
            const config = JSON.parse(currentConfig);
            requestBody.apiKey = config.apiKey;
            requestBody.provider = config.provider;
        }

        // 使用带重试机制的fetch
        // 自动检测是否在Vercel环境，使用相对路径
        const apiBaseUrl = window.location.hostname.includes('vercel.app')
            ? '/api'
            : 'http://localhost:3000/api';

        const response = await fetchWithRetry(`${apiBaseUrl}/generate-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '生成题目失败');
        }
        
        const data = await response.json();
        
        if (data.questions && data.questions.length > 0) {
            // 清空旧数据，防止污染
            currentQuestions = [];
            currentQuestions = data.questions;
            displayQuestions(currentQuestions);
            questionsSection.style.display = 'block';
            updateStatus(`雅思题目生成成功！共 ${data.questions.length} 道题`, 'success');
            
            // 滚动到题目区域
            setTimeout(() => {
                questionsSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            throw new Error('未能生成题目');
        }
        
    } catch (error) {
        console.error('生成题目错误:', error);
        updateStatus('生成题目失败: ' + error.message, 'error');
    } finally {
        generateQuestionsBtn.disabled = false;
    }
}

// 显示题目
function displayQuestions(questions) {
    questionsContainer.innerHTML = '';
    
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.dataset.index = index;
        questionDiv.dataset.type = q.type || 'multiple-choice'; // 标记题目类型
        
        const questionNumber = document.createElement('div');
        questionNumber.className = 'question-number';
        const typeLabel = q.type === 'fill-blanks' ? '📝 填空' : '❓ 选择';
        questionNumber.textContent = `${typeLabel} Question ${index + 1}`;
        
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = q.question;
        
        questionDiv.appendChild(questionNumber);
        questionDiv.appendChild(questionText);
        
        // 根据题目类型渲染不同的输入界面
        if (q.type === 'fill-blanks') {
            // 填空题
            const answerInput = document.createElement('div');
            answerInput.className = 'fill-blank-answer';
            
            const inputLabel = document.createElement('label');
            inputLabel.textContent = '您的答案: ';
            
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.className = 'blank-input';
            inputField.placeholder = '在此输入答案...';
            inputField.dataset.questionIndex = index;
            
            inputField.addEventListener('input', (e) => {
                currentQuestions[index].userAnswer = e.target.value.trim();
            });
            
            answerInput.appendChild(inputLabel);
            answerInput.appendChild(inputField);
            questionDiv.appendChild(answerInput);
        } else {
            // 选择题
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'question-options';
            
            const optionLabels = ['A', 'B', 'C', 'D'];
            q.options.forEach((option, optIndex) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-item';
                optionDiv.dataset.option = optIndex;
                
                const optionLabel = document.createElement('div');
                optionLabel.className = 'option-label';
                optionLabel.textContent = optionLabels[optIndex];
                
                const optionText = document.createElement('div');
                optionText.className = 'option-text';
                optionText.textContent = option;
                
                optionDiv.appendChild(optionLabel);
                optionDiv.appendChild(optionText);
                
                optionDiv.addEventListener('click', () => selectOption(index, optIndex));
                
                optionsDiv.appendChild(optionDiv);
            });
            
            questionDiv.appendChild(optionsDiv);
        }
        
        questionsContainer.appendChild(questionDiv);
    });
    
    // 添加"检查答案"按钮
    const checkBtn = document.createElement('button');
    checkBtn.className = 'check-answers-btn';
    checkBtn.textContent = '✓ 检查答案';
    checkBtn.addEventListener('click', checkAnswers);
    questionsContainer.appendChild(checkBtn);
    
    // 添加分数显示区域
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'score-display';
    scoreDiv.id = 'score-display';
    scoreDiv.innerHTML = `
        <div>您的得分</div>
        <div class="score-number" id="score-number">0/0</div>
        <div class="score-message" id="score-message"></div>
    `;
    questionsContainer.appendChild(scoreDiv);
}

// 选择选项
function selectOption(questionIndex, optionIndex) {
    // 移除同一题目的其他选中状态
    const questionDiv = document.querySelector(`.question-item[data-index="${questionIndex}"]`);
    const options = questionDiv.querySelectorAll('.option-item');
    options.forEach(opt => opt.classList.remove('selected'));
    
    // 选中当前选项
    const selectedOption = questionDiv.querySelector(`.option-item[data-option="${optionIndex}"]`);
    selectedOption.classList.add('selected');
    
    // 保存用户选择
    if (!currentQuestions[questionIndex].userAnswer) {
        currentQuestions[questionIndex].userAnswer = optionIndex;
    } else {
        currentQuestions[questionIndex].userAnswer = optionIndex;
    }
}

// 检查答案
function checkAnswers() {
    let correctCount = 0;
    const totalQuestions = currentQuestions.length;
    
    currentQuestions.forEach((q, index) => {
        const questionDiv = document.querySelector(`.question-item[data-index="${index}"]`);
        const questionType = questionDiv.dataset.type;
        
        if (questionType === 'fill-blanks') {
            // 填空题检查
            const inputField = questionDiv.querySelector('.blank-input');
            const userAnswer = q.userAnswer ? q.userAnswer.trim() : '';
            const correctAnswer = q.correctAnswer.trim();

            // 移除之前的结果显示
            if (questionDiv.querySelector('.result-message')) {
                questionDiv.querySelector('.result-message').remove();
            }

            // 修复bug：如果用户未输入答案或只输入空格（trim后为空字符串），直接算作错误
            if (!userAnswer || userAnswer.length === 0) {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'result-message wrong';
                resultDiv.innerHTML = `
                    <span>✗ 错误</span>
                    <span>请先输入答案</span>
                    <span>正确答案: ${q.correctAnswer}</span>
                `;
                questionDiv.appendChild(resultDiv);
                // 不增加correctCount，继续下一题
            } else {
                // 判断答案是否正确（忽略大小写的模糊匹配）
                const userAnswerLower = userAnswer.toLowerCase();
                const correctAnswerLower = correctAnswer.toLowerCase();
                const isCorrect = userAnswerLower === correctAnswerLower ||
                                userAnswerLower.includes(correctAnswerLower) ||
                                correctAnswerLower.includes(userAnswerLower);

                const resultDiv = document.createElement('div');
                resultDiv.className = 'result-message ' + (isCorrect ? 'correct' : 'wrong');
                resultDiv.innerHTML = `
                    <span>${isCorrect ? '✓ 正确!' : '✗ 错误'}</span>
                    <span>正确答案: ${q.correctAnswer}</span>
                `;
                questionDiv.appendChild(resultDiv);

                if (isCorrect) correctCount++;
            }
            
        } else {
            // 选择题检查
            const options = questionDiv.querySelectorAll('.option-item');
            
            // 标记正确和错误答案
            options.forEach((opt, optIndex) => {
                opt.classList.remove('correct-answer', 'wrong-answer');
                
                if (optIndex === q.correctAnswer) {
                    opt.classList.add('correct-answer');
                } else if (q.userAnswer !== undefined && optIndex === q.userAnswer && optIndex !== q.correctAnswer) {
                    opt.classList.add('wrong-answer');
                }
            });
            
            if (q.userAnswer === q.correctAnswer) {
                correctCount++;
            }
        }
        
        // 显示解释
        if (!questionDiv.querySelector('.explanation')) {
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'explanation';
            let answerText = '';
            if (questionType === 'fill-blanks') {
                answerText = q.correctAnswer;
            } else {
                answerText = ['A', 'B', 'C', 'D'][q.correctAnswer];
            }
            explanationDiv.innerHTML = `
                <div class="explanation-text">
                    <strong>解析：</strong>${q.explanation || '正确答案是 ' + answerText}
                </div>
            `;
            questionDiv.appendChild(explanationDiv);
        }
        
        setTimeout(() => {
            const explanation = questionDiv.querySelector('.explanation');
            if (explanation) explanation.classList.add('show');
        }, index * 100);
    });
    
    // 显示分数
    const scoreDisplay = document.getElementById('score-display');
    const scoreNumber = document.getElementById('score-number');
    const scoreMessage = document.getElementById('score-message');
    
    const percentage = (correctCount / totalQuestions) * 100;
    scoreNumber.textContent = `${correctCount}/${totalQuestions}`;
    
    if (percentage === 100) {
        scoreMessage.textContent = '🎉 完美！您全部答对了！';
    } else if (percentage >= 80) {
        scoreMessage.textContent = '👏 太棒了！您的表现非常出色！';
    } else if (percentage >= 60) {
        scoreMessage.textContent = '💪 继续努力，您做得不错！';
    } else if (percentage >= 40) {
        scoreMessage.textContent = '📚 建议多听几遍，再试试看！';
    } else {
        scoreMessage.textContent = '🔁 建议反复听力练习，加油！';
    }
    
    scoreDisplay.classList.add('show');
    updateStatus(`您的得分: ${correctCount}/${totalQuestions}`, 'success');
}
