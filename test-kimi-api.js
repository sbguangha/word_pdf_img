const https = require('https');

// 测试月之暗面API连接
async function testKimiAPI() {
    const apiKey = 'sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti';
    
    // 测试不同的API端点
    const endpoints = [
        'https://api.moonshot.cn/v1/models',
        'https://api.moonshot.cn/authropic/v1/models',
        'https://api.moonshot.cn/anthropic/v1/models'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n测试端点: ${endpoint}`);
        
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`状态码: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('成功! 可用模型:');
                if (data.data) {
                    data.data.forEach(model => {
                        console.log(`  - ${model.id}`);
                    });
                } else {
                    console.log(JSON.stringify(data, null, 2));
                }
            } else {
                const errorText = await response.text();
                console.log(`错误: ${errorText}`);
            }
        } catch (error) {
            console.log(`请求失败: ${error.message}`);
        }
    }
}

// 测试聊天API
async function testChatAPI() {
    const apiKey = 'sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti';
    
    const endpoints = [
        'https://api.moonshot.cn/v1/chat/completions',
        'https://api.moonshot.cn/authropic/v1/messages',
        'https://api.moonshot.cn/anthropic/v1/messages'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n测试聊天端点: ${endpoint}`);
        
        let payload;
        if (endpoint.includes('messages')) {
            // Anthropic格式
            payload = {
                model: 'claude-3-sonnet-20240229',
                max_tokens: 100,
                messages: [
                    {
                        role: 'user',
                        content: '你好'
                    }
                ]
            };
        } else {
            // OpenAI格式
            payload = {
                model: 'moonshot-v1-8k',
                messages: [
                    {
                        role: 'user',
                        content: '你好'
                    }
                ],
                max_tokens: 100
            };
        }
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log(`状态码: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('聊天测试成功!');
                console.log(JSON.stringify(data, null, 2));
            } else {
                const errorText = await response.text();
                console.log(`错误: ${errorText}`);
            }
        } catch (error) {
            console.log(`请求失败: ${error.message}`);
        }
    }
}

// 运行测试
console.log('开始测试月之暗面API连接...');
testKimiAPI().then(() => {
    console.log('\n开始测试聊天API...');
    return testChatAPI();
}).then(() => {
    console.log('\n测试完成!');
}).catch(error => {
    console.error('测试过程中出错:', error);
});
