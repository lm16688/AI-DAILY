const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ==================== 配置 ====================

// 多数据源配置（免费、无需API Key）
const DATA_SOURCES = [
  // 1. Hacker News AI 相关（英文，稳定）
  {
    name: 'Hacker News',
    type: 'hackernews',
    enabled: true
  },
  // 2. Reddit r/MachineLearning（英文，丰富）
  {
    name: 'Reddit ML',
    type: 'reddit',
    subreddit: 'MachineLearning',
    enabled: true
  },
  // 3. Reddit r/artificial（英文，新闻多）
  {
    name: 'Reddit AI',
    type: 'reddit',
    subreddit: 'artificial',
    enabled: true
  },
  // 4. GitHub Trending（AI项目，英文）
  {
    name: 'GitHub Trending',
    type: 'github',
    enabled: true
  },
  // 5. 中文源：即刻 AI（RSS）
  {
    name: '即刻AI',
    type: 'rss',
    url: 'https://rsshub.app/jike/topic/63549b1970208ee92e0ae8a2', // AI话题
    enabled: true
  },
  // 6. 中文源：少数派 AI（RSS）
  {
    name: '少数派',
    type: 'rss',
    url: 'https://rsshub.app/sspai/tag/AI',
    enabled: true
  }
];

// 备用数据
const FALLBACK_NEWS = [
  {
    id: 1,
    cat: 'news',
    hot: true,
    title: 'OpenAI 发布 GPT-4o 多模态更新',
    summary: 'OpenAI 推出 GPT-4o 最新版本，支持更强大的图像理解和实时语音对话，API 价格降低 50%。',
    source: 'OpenAI Blog',
    date: new Date().toISOString().split('T')[0],
    url: 'https://openai.com/blog',
    tags: ['OpenAI', 'GPT-4o', '多模态']
  },
  {
    id: 2,
    cat: 'tools',
    hot: true,
    title: 'Claude 3.5 Sonnet 正式发布',
    summary: 'Anthropic 发布 Claude 3.5 Sonnet，编码能力超越 GPT-4，支持 Artifacts 实时预览功能。',
    source: 'Anthropic',
    date: new Date().toISOString().split('T')[0],
    url: 'https://anthropic.com',
    tags: ['Claude', 'Anthropic', '编码助手']
  },
  {
    id: 3,
    cat: 'research',
    hot: true,
    title: 'Google DeepMind 发布 AlphaFold 3',
    summary: '新一代蛋白质结构预测模型，能够预测 DNA、RNA 和小分子相互作用，准确度创新高。',
    source: 'Nature',
    date: new Date().toISOString().split('T')[0],
    url: 'https://deepmind.google',
    tags: ['DeepMind', '生物AI', 'AlphaFold']
  },
  {
    id: 4,
    cat: 'industry',
    hot: true,
    title: 'Meta 开源 Llama 3.1 405B 参数模型',
    summary: 'Meta 发布最大开源模型 Llama 3.1，4050亿参数，性能接近 GPT-4，允许商用。',
    source: 'Meta AI',
    date: new Date().toISOString().split('T')[0],
    url: 'https://ai.meta.com',
    tags: ['Meta', 'Llama', '开源模型']
  },
  {
    id: 5,
    cat: 'safety',
    hot: true,
    title: '欧盟 AI 法案正式生效',
    summary: '全球首部全面监管 AI 的法律生效，高风险 AI 系统需符合严格透明度要求。',
    source: 'EU Commission',
    date: new Date().toISOString().split('T')[0],
    url: 'https://digital-strategy.ec.europa.eu',
    tags: ['监管', '欧盟', 'AI治理']
  },
  {
    id: 6,
    cat: 'tools',
    hot: false,
    title: 'Cursor 获 6000 万美元融资',
    summary: 'AI 编程工具 Cursor 完成 B 轮融资，估值达 4 亿美元，用户增长迅猛。',
    source: 'TechCrunch',
    date: new Date().toISOString().split('T')[0],
    url: 'https://techcrunch.com',
    tags: ['Cursor', '融资', '编程工具']
  },
  {
    id: 7,
    cat: 'research',
    hot: false,
    title: 'Mistral AI 发布 Large 2 模型',
    summary: '法国 AI 公司 Mistral 发布新模型，支持 128K 上下文，代码生成能力突出。',
    source: 'Mistral AI',
    date: new Date().toISOString().split('T')[0],
    url: 'https://mistral.ai',
    tags: ['Mistral', '大模型', '欧洲AI']
  },
  {
    id: 8,
    cat: 'news',
    hot: false,
    title: '苹果智能 Apple Intelligence 延期',
    summary: 'iOS 18.1 将推迟发布 AI 功能，中文支持预计 2025 年上线。',
    source: 'Apple',
    date: new Date().toISOString().split('T')[0],
    url: 'https://apple.com',
    tags: ['Apple', 'iOS', '端侧AI']
  }
];

// ==================== 网络请求工具 ====================

function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { headers, timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function fetchXML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ==================== 数据源抓取 ====================

// 1. Hacker News
async function fetchHackerNews() {
  try {
    console.log('📡 抓取 Hacker News...');
    
    // 获取热门故事 ID
    const topIds = await fetchJSON('https://hacker-news.firebaseio.com/v0/topstories.json');
    const storyIds = topIds.slice(0, 30);
    
    const stories = [];
    for (const id of storyIds) {
      try {
        const story = await fetchJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!story || story.deleted || story.dead) continue;
        
        // AI 关键词过滤
        const text = (story.title || '').toLowerCase();
        const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'chatgpt', 'claude', 'neural', 'openai', 'anthropic', 'model'];
        
        if (aiKeywords.some(kw => text.includes(kw))) {
          stories.push({
            title: story.title,
            description: story.text ? story.text.slice(0, 200) : 'Hacker News 热门讨论',
            url: story.url || `https://news.ycombinator.com/item?id=${id}`,
            source: 'Hacker News',
            publishedAt: new Date(story.time * 1000).toISOString(),
            lang: 'en',
            score: story.score || 0
          });
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`  ✅ HN 获取 ${stories.length} 条 AI 相关`);
    return stories;
  } catch (e) {
    console.warn(`  ❌ HN 失败: ${e.message}`);
    return [];
  }
}

// 2. Reddit
async function fetchReddit(subreddit) {
  try {
    console.log(`📡 抓取 Reddit r/${subreddit}...`);
    
    // 使用 RSSHub 绕过 Reddit API 限制
    const url = `https://rsshub.app/reddit/r/${subreddit}`;
    const xml = await fetchXML(url);
    
    // 简单解析 RSS
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g;
    
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      const url = match[2].trim();
      const date = match[3].trim();
      
      // 过滤非 AI 内容
      const text = title.toLowerCase();
      const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'chatgpt', 'claude', 'neural', 'openai', 'anthropic', 'model', 'transformer'];
      
      if (aiKeywords.some(kw => text.includes(kw))) {
        items.push({
          title: title,
          description: `Reddit r/${subreddit} 热门讨论`,
          url: url,
          source: `Reddit r/${subreddit}`,
          publishedAt: new Date(date).toISOString(),
          lang: 'en'
        });
      }
    }
    
    console.log(`  ✅ Reddit 获取 ${items.length} 条`);
    return items.slice(0, 10);
  } catch (e) {
    console.warn(`  ❌ Reddit 失败: ${e.message}`);
    return [];
  }
}

// 3. GitHub Trending（AI 项目）
async function fetchGitHubTrending() {
  try {
    console.log('📡 抓取 GitHub Trending...');
    
    // 使用 GitHub API 搜索热门 AI 项目
    const query = 'ai+machine+learning+stars:>1000+pushed:>2024-01-01';
    const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`;
    
    const data = await fetchJSON(url, {
      'User-Agent': 'AI-Daily-Bot'
    });
    
    const items = (data.items || []).map(repo => ({
      title: `${repo.name}: ${repo.description || 'AI Project'}`,
      description: `⭐ ${repo.stargazers_count} stars | ${repo.language || 'Unknown'} | ${repo.description || ''}`.slice(0, 200),
      url: repo.html_url,
      source: 'GitHub',
      publishedAt: new Date().toISOString(),
      lang: 'en'
    }));
    
    console.log(`  ✅ GitHub 获取 ${items.length} 条`);
    return items;
  } catch (e) {
    console.warn(`  ❌ GitHub 失败: ${e.message}`);
    return [];
  }
}

// 4. RSS 源（中文）
async function fetchRSS(name, url) {
  try {
    console.log(`📡 抓取 ${name}...`);
    const xml = await fetchXML(url);
    
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?(?:<description>|<content:encoded>)([\s\S]*?)(?:<\/description>|<\/content:encoded>)[\s\S]*?<\/item>/g;
    
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xml)) !== null && count < 10) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
      const link = match[2].trim();
      const desc = match[3].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').slice(0, 150).trim();
      
      items.push({
        title: title,
        description: desc || `${name} 最新文章`,
        url: link,
        source: name,
        publishedAt: new Date().toISOString(),
        lang: 'zh'
      });
      count++;
    }
    
    console.log(`  ✅ ${name} 获取 ${items.length} 条`);
    return items;
  } catch (e) {
    console.warn(`  ❌ ${name} 失败: ${e.message}`);
    return [];
  }
}

// ==================== 数据处理 ====================

function categorize(item) {
  const text = (item.title + ' ' + item.description).toLowerCase();
  
  if (/\b(tool|app|software|platform|cursor|copilot|vscode|plugin|api|github)\b/.test(text) ||
      text.includes('开源') || text.includes('工具')) {
    return 'tools';
  }
  
  if (/\b(research|paper|study|arxiv|model|algorithm|neural|deepmind|mit|stanford)\b/.test(text) ||
      text.includes('研究') || text.includes('论文')) {
    return 'research';
  }
  
  if (/\b(startup|funding|investment|million|billion|ipo|acquisition|估值|融资|收购)\b/.test(text)) {
    return 'industry';
  }
  
  if (/\b(safety|ethics|risk|regulation|policy|privacy|alignment|监管|安全|伦理)\b/.test(text)) {
    return 'safety';
  }
  
  return 'news';
}

function isHot(item) {
  const text = (item.title + ' ' + item.description).toLowerCase();
  const hotSignals = [
    'openai', 'google', 'microsoft', 'meta', 'nvidia', 'apple', 'anthropic',
    'gpt-4', 'gpt-5', 'claude 3', 'llama 3', 'breakthrough', '发布', '推出'
  ];
  
  return hotSignals.some(s => text.includes(s)) || (item.score && item.score > 100);
}

function generateTags(item) {
  const tags = [];
  const text = (item.title + ' ' + item.description).toLowerCase();
  
  // 公司标签
  const companies = {
    'openai': 'OpenAI', 'chatgpt': 'ChatGPT', 'anthropic': 'Anthropic',
    'claude': 'Claude', 'google': 'Google', 'gemini': 'Gemini',
    'deepmind': 'DeepMind', 'meta': 'Meta', 'llama': 'Llama',
    'microsoft': 'Microsoft', 'copilot': 'Copilot', 'nvidia': 'NVIDIA',
    'mistral': 'Mistral', '苹果': 'Apple', '百度': '百度', '阿里': '阿里'
  };
  
  Object.entries(companies).forEach(([key, val]) => {
    if (text.includes(key) && !tags.includes(val)) tags.push(val);
  });
  
  // 技术标签
  if (text.includes('开源') || text.includes('open source')) tags.push('开源');
  if (text.includes('多模态') || text.includes('multimodal')) tags.push('多模态');
  if (/\b(code|coding|编程|github)\b/.test(text)) tags.push('编程');
  
  return tags.slice(0, 4);
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

// ==================== 主函数 ====================

async function main() {
  console.log('🤖 AI Daily 新闻抓取启动');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}`);
  console.log('');

  const allArticles = [];

  // 并行抓取所有源
  const promises = [];
  
  // Hacker News
  promises.push(fetchHackerNews());
  
  // Reddit 源
  promises.push(fetchReddit('MachineLearning'));
  promises.push(fetchReddit('artificial'));
  promises.push(fetchReddit('ai'));
  promises.push(fetchReddit('artificial intelligence'));
  promises.push(fetchReddit('llm'));
  promises.push(fetchReddit('gpt'));
  promises.push(fetchReddit('chatgpt'));
  promises.push(fetchReddit('claude'));
  promises.push(fetchReddit('neural'));
  promises.push(fetchReddit('openai'));
  promises.push(fetchReddit('anthropic'));
  promises.push(fetchReddit('model'));
  promises.push(fetchReddit('transformer'));
  
  
  // GitHub
  promises.push(fetchGitHubTrending());
  
  // RSS 中文源
  promises.push(fetchRSS('即刻AI', 'https://rsshub.app/jike/topic/63549b1970208ee92e0ae8a2'));
  promises.push(fetchRSS('少数派', 'https://rsshub.app/sspai/tag/AI'));

  const results = await Promise.all(promises);
  results.forEach(items => allArticles.push(...items));

  console.log('');
  console.log(`📊 总计抓取: ${allArticles.length} 条`);

  // 如果都失败了，使用备用数据
  if (allArticles.length === 0) {
    console.log('⚠️ 所有源失败，使用备用数据');
    saveData(FALLBACK_NEWS, true);
    return;
  }

  // 去重（基于标题前30字符）
  const seen = new Set();
  const unique = allArticles.filter(item => {
    const key = item.title?.slice(0, 30);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 评分排序
  const scored = unique.map(item => {
    let score = 0;
    const text = (item.title + ' ' + item.description).toLowerCase();
    
    // 来源质量
    if (item.source === 'Hacker News') score += 3;
    if (item.source.includes('Reddit')) score += 2;
    
    // 时效性
    const hoursAgo = (Date.now() - new Date(item.publishedAt)) / (1000 * 60 * 60);
    score += Math.max(0, 24 - hoursAgo) * 0.5;
    
    // 热度
    if (item.score) score += item.score / 50;
    
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 转换为标准格式
  const today = new Date().toISOString().split('T')[0];
  const news = scored.slice(0, 20).map((s, idx) => ({
    id: idx + 1,
    cat: categorize(s.item),
    hot: isHot(s.item),
    title: cleanText(s.item.title),
    summary: cleanText(s.item.description),
    source: s.item.source,
    date: today,
    url: s.item.url,
    tags: generateTags(s.item),
    lang: s.item.lang || 'en'
  }));

  // 统计
  console.log('');
  console.log('📈 分类统计:');
  ['news', 'tools', 'research', 'industry', 'safety'].forEach(cat => {
    const count = news.filter(n => n.cat === cat).length;
    const langCount = news.filter(n => n.cat === cat && n.lang === 'zh').length;
    console.log(`  ${cat}: ${count} 条 (${langCount} 中文)`);
  });

  saveData(news, false);
}

function saveData(news, isFallback) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const today = new Date().toISOString().split('T')[0];
  const output = {
    meta: {
      lastUpdated: new Date().toISOString(),
      total: news.length,
      isFallback: isFallback,
      sources: [...new Set(news.map(n => n.source))],
      date: today
    },
    news: news
  };

  fs.writeFileSync(path.join(dataDir, 'news.json'), JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(dataDir, `news-${today}.json`), JSON.stringify(output, null, 2));

  console.log('');
  console.log('✅ 数据保存成功');
  console.log(`📁 文件: data/news.json`);
  console.log(`🔥 热点: ${news.filter(n => n.hot).length} 条`);
  console.log(`🇨🇳 中文: ${news.filter(n => n.lang === 'zh').length} 条`);
  console.log(`🇺🇸 英文: ${news.filter(n => n.lang === 'en').length} 条`);
}

main().catch(err => {
  console.error('❌ 致命错误:', err);
  process.exit(1);
});
