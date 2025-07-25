// 验证月之暗面API连接
const https = require('https');

const API_KEY = 'sk-uUsX6dX28RqxdLqgYIgjiLzUU4lx9osHdWjRQBYzsxxJbfti';
const CORRECT_BASE_URL = 'https://api.moonshot.cn/v1';
const WRONG_BASE_URL = 'https://api.moonshot.cn/authropic';

console.log('🔍 验证月之暗面API连接...\n');

async function testEndpoint(baseUrl, description) {
    console.log(`测试 ${description}: ${baseUrl}`);
    
    try {
        const response = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${description} - 成功! 找到 ${data.data.length} 个模型`);
            return true;
        } else {
            console.log(`❌ ${description} - 失败! 状态码: ${response.status}`);
            const errorText = await response.text();
            console.log(`   错误信息: ${errorText}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${description} - 连接失败: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('API密钥:', API_KEY.substring(0, 20) + '...');
    console.log('');
    
    const correctWorks = await testEndpoint(CORRECT_BASE_URL, '正确端点');
    console.log('');
    const wrongWorks = await testEndpoint(WRONG_BASE_URL, '错误端点');
    
    console.log('\n📋 总结:');
    console.log(`正确端点 (${CORRECT_BASE_URL}): ${correctWorks ? '✅ 工作正常' : '❌ 不工作'}`);
    console.log(`错误端点 (${WRONG_BASE_URL}): ${wrongWorks ? '✅ 工作正常' : '❌ 不工作'}`);
    
    if (correctWorks && !wrongWorks) {
        console.log('\n🎉 API配置正确! 请确保Claude Code使用正确的端点。');
        console.log('\n💡 解决方案:');
        console.log('1. 运行 fix-environment-permanent.bat 永久修复');
        console.log('2. 或使用 start-claude-correct.bat 临时启动');
    }
}

main().catch(console.error);
