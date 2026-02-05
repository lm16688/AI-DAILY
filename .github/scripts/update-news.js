const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ==================== 配置 ====================

const DATA_SOURCES = [
  // === 英文数据源 ===
  
  // 1. Hacker News（技术社区，质量高）
  {
    name: 'Hacker News',
    type: 'hackernews',
    enabled: true
  },
  
  // 2. Reddit AI 社区（丰富讨论）
  {
    name: 'Reddit r/MachineLearning',
    type: 'reddit',
    subreddit: 'MachineLearning',
    enabled: true
  },
  {
    name: 'Reddit r/artificial',
    type: 'reddit',
    subreddit: 'artificial',
    enabled: true
  },
  {
    name: 'Reddit r/OpenAI',
    type: 'reddit',
    subreddit: 'OpenAI',
    enabled: true
  },
  {
    name: 'Reddit r/LocalLLaMA',
    type: 'reddit',
    subreddit: 'LocalLLaMA',
    enabled: true
  },
  
  // 3. GitHub Trending（AI项目）
  {
    name: 'GitHub Trending',
    type: 'github',
    enabled: true
  },
  
  // 4. Product Hunt（AI新产品）
  {
    name: 'Product Hunt',
    type: 'producthunt',
    enabled: true
  },
  
  // 5. Dev.to（开发者社区）
  {
    name: 'Dev.to',
    type: 'devto',
    enabled: true
  },
  
  // 6. ArXiv（最新论文）
  {
    name: 'ArXiv AI',
    type: 'arxiv',
    category: 'cs.AI',
    enabled: true
  },
  {
    name: 'ArXiv ML',
    type: 'arxiv',
    category: 'cs.LG',
    enabled: true
  },
  {
    name: 'ArXiv CL',
    type: 'arxiv',
    category: 'cs.CL',
    enabled: true
  },
  
  // 7. TechCrunch AI（RSS）
  {
    name: 'TechCrunch',
    type: 'rss',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    enabled: true
  },
  
  // 8. The Verge（RSS）
  {
    name: 'The Verge',
    type: 'rss',
    url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    enabled: true
  },
  
  // 9. Wired（RSS）
  {
    name: 'Wired',
    type: 'rss',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    enabled: true
  },
  
  // 10. MIT Technology Review（RSS）
  {
    name: 'MIT Tech Review',
    type: 'rss',
    url: 'https://www.technologyreview.com/feed/',
    enabled: true
  },
  
  // 11. VentureBeat AI（RSS）
  {
    name: 'VentureBeat',
    type: 'rss',
    url: 'https://venturebeat.com/category/ai/feed/',
    enabled: true
  },
  
  // 12. Analytics India Magazine（RSS）
  {
    name: 'Analytics India',
    type: 'rss',
    url: 'https://analyticsindiamag.com/feed/',
    enabled: true
  },
  
  // === 中文数据源 ===
  
  // 13. 即刻 AI
  {
    name: '即刻AI',
    type: 'rss',
    url: 'https://rsshub.app/jike/topic/63549b1970208ee92e0ae8a2',
    enabled: true
  },
  
  // 14. 少数派
  {
    name: '少数派',
    type: 'rss',
    url: 'https://rsshub.app/sspai/tag/AI',
    enabled: true
  },
  
  // 15. 量子位
  {
    name: '量子位',
    type: 'rss',
    url: 'https://rsshub.app/qbitai',
    enabled: true
  }
];

// 备用数据
const FALLBACK_NEWS = [
  {
    id: 1,
    cat: 'news',
    hot: true,
    title: 'OpenAI 发布 GPT-4o 多模态更新，API 价格降低 50%',
    summary: 'OpenAI 推出 GPT-4o 最新版本，支持更强大的图像理解和实时语音对话，开发者 API 成本大幅降低。',
    source: 'OpenAI Blog',
    date: new Date().toISOString().split('T')[0],
    url: 'https://openai.com/blog',
    tags: ['OpenAI', 'GPT-4o', '多模态', 'API'],
    lang: 'en'
  },
  {
    id: 2,
    cat: 'tools',
    hot: true,
    title: 'Claude 3.5 Sonnet 正式发布，编码能力超越 GPT-4',
    summary: 'Anthropic 发布 Claude 3.5 Sonnet，在多项编码基准测试中超越 GPT-4，新增 Artifacts 实时预览功能。',
    source: 'Anthropic',
    date: new Date().toISOString().split('T')[0],
    url: 'https://anthropic.com',
    tags: ['Claude', 'Anthropic', '编码助手', 'Sonnet'],
    lang: 'en'
  },
  {
    id: 3,
    cat: 'research',
    hot: true,
    title: 'Google DeepMind AlphaFold 3 登上 Nature 封面',
    summary: '新一代蛋白质结构预测模型能够预测 DNA、RNA 和小分子相互作用，为药物研发带来革命性突破。',
    source: 'Nature',
    date: new Date().toISOString().split('T')[0],
    url: 'https://www.nature.com',
    tags: ['DeepMind', '生物AI', 'AlphaFold', 'Nature'],
    lang: 'en'
  },
  {
    id: 4,
    cat: 'industry',
    hot: true,
    title: 'Meta 开源 Llama 3.1 405B，最大开源模型诞生',
    summary: 'Meta 发布 4050 亿参数模型，性能接近 GPT-4，允许商用，推动开源 AI 发展。',
    source: 'Meta AI',
    date: new Date().toISOString().split('T')[0],
    url: 'https://ai.meta.com',
    tags: ['Meta', 'Llama', '开源模型', '405B'],
    lang: 'en'
  },
  {
    id: 5,
    cat: 'safety',
    hot: true,
    title: '欧盟 AI 法案正式生效，全球首部全面监管 AI 法律',
    summary: '高风险 AI 系统需符合严格透明度要求，违规企业最高面临全球营业额 7% 罚款。',
    source: 'EU Commission',
    date: new Date().toISOString().split('T')[0],
    url: 'https://digital-strategy.ec.europa.eu',
    tags: ['监管', '欧盟', 'AI治理', '法规'],
    lang: 'en'
  },
  {
    id: 6,
    cat: 'tools',
    hot: true,
    title: 'Cursor 完成 6000 万美元 B 轮融资',
    summary: 'AI 编程工具 Cursor 估值达 4 亿美元，月活开发者超过 50 万，成为 VS Code 最强替代品。',
    source: 'TechCrunch',
    date: new Date().toISOString().split('T')[0],
    url: 'https://techcrunch.com',
    tags: ['Cursor', '融资', '编程工具', 'VS Code'],
    lang: 'en'
  },
  {
    id: 7,
    cat: 'research',
    hot: false,
    title: 'Mistral AI 发布 Large 2，支持 128K 上下文',
    summary: '法国 AI 公司 Mistral 发布新模型，代码生成能力突出，价格仅为 GPT-4 的 1/5。',
    source: 'Mistral AI',
    date: new Date().toISOString().split('T')[0],
    url: 'https://mistral.ai',
    tags: ['Mistral', '大模型', '欧洲AI', '性价比'],
    lang: 'en'
  },
  {
    id: 8,
    cat: 'news',
    hot: false,
    title: 'Apple Intelligence 中文支持推迟至 2025 年',
    summary: 'iOS 18.1 将先发布英文版 AI 功能，中文、日文、法文等多语言支持预计明年上线。',
    source: 'Apple',
    date: new Date().toISOString().split('T')[0],
    url: 'https://apple.com',
    tags: ['Apple', 'iOS', '端侧AI', '中文支持'],
    lang: 'en'
  },
  {
    id: 9,
    cat: 'tools',
    hot: false,
    title: 'Perplexity 推出 Pages 功能，挑战传统搜索引擎',
    summary: 'AI 搜索公司 Perplexity 允许用户创建可分享的 AI 生成页面，直接竞争 Google。',
    source: 'The Verge',
    date: new Date().toISOString().split('T')[0],
    url: 'https://theverge.com',
    tags: ['Perplexity', 'AI搜索', 'Google', 'Pages'],
    lang: 'en'
  },
  {
    id: 10,
    cat: 'research',
    hot: false,
    title: 'Stable Diffusion 3 开源发布，图像质量大幅提升',
    summary: 'Stability AI 发布最新版本，文本渲染能力显著改善，支持多比例生成。',
    source: 'Stability AI',
    date: new Date().toISOString().split('T')[0],
    url: 'https://stability.ai',
    tags: ['Stability AI', '图像生成', '开源', 'SD3'],
    lang: 'en'
  }
];

// ==================== 网络请求工具 ====================

function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { headers, timeout: 20000 }, (res) => {
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

function fetchXML(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    client.get(url, { headers, timeout: 20000 }, (res) => {
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
    const topIds = await fetchJSON('https://hacker-news.firebaseio.com/v0/topstories.json');
    const storyIds = topIds.slice(0, 50);
    
    const stories = [];
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'chatgpt', 'claude', 'neural', 'openai', 'anthropic', 'model', 'transformer', 'llama', 'mistral', 'gemini'];
    
    for (const id of storyIds) {
      try {
        const story = await fetchJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!story || story.deleted || story.dead) continue;
        
        const text = (story.title || '').toLowerCase();
        if (aiKeywords.some(kw => text.includes(kw))) {
          stories.push({
            title: story.title,
            description: story.text ? cleanText(story.text.slice(0, 300)) : 'Hacker News 热门 AI 讨论',
            url: story.url || `https://news.ycombinator.com/item?id=${id}`,
            source: 'Hacker News',
            publishedAt: new Date(story.time * 1000).toISOString(),
            lang: 'en',
            score: story.score || 0
          });
        }
      } catch (e) { continue; }
    }
    
    console.log(`  ✅ HN: ${stories.length} 条`);
    return stories;
  } catch (e) {
    console.warn(`  ❌ HN: ${e.message}`);
    return [];
  }
}

// 2. Reddit
async function fetchReddit(subreddit) {
  try {
    console.log(`📡 抓取 Reddit r/${subreddit}...`);
    const url = `https://rsshub.app/reddit/r/${subreddit}`;
    const xml = await fetchXML(url);
    
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g;
    
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'chatgpt', 'claude', 'neural', 'openai', 'anthropic', 'model', 'transformer', 'llama', 'gemini', 'mistral', 'stable diffusion', 'midjourney'];
    
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      const url = match[2].trim();
      const date = match[3].trim();
      
      const text = title.toLowerCase();
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
    
    console.log(`  ✅ Reddit: ${items.length} 条`);
    return items.slice(0, 8);
  } catch (e) {
    console.warn(`  ❌ Reddit: ${e.message}`);
    return [];
  }
}

// 3. GitHub Trending
async function fetchGitHubTrending() {
  try {
    console.log('📡 抓取 GitHub Trending...');
    
    // 搜索 AI 相关热门仓库
    const queries = [
      'artificial intelligence stars:>500',
      'machine learning stars:>500',
      'llm stars:>200',
      'gpt stars:>200'
    ];
    
    const allRepos = [];
    for (const query of queries) {
      try {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
        const data = await fetchJSON(url, {
          'User-Agent': 'AI-Daily-Bot',
          'Accept': 'application/vnd.github.v3+json'
        });
        
        if (data.items) {
          allRepos.push(...data.items);
        }
        // 避免 rate limit
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) { continue; }
    }
    
    // 去重
    const seen = new Set();
    const unique = allRepos.filter(repo => {
      if (seen.has(repo.id)) return false;
      seen.add(repo.id);
      return true;
    });
    
    const items = unique.slice(0, 8).map(repo => ({
      title: `${repo.name}: ${repo.description || 'AI Project'}`,
      description: `⭐ ${repo.stargazers_count.toLocaleString()} stars | ${repo.language || 'Multi'} | ${repo.description || 'Open source AI project'}`.slice(0, 200),
      url: repo.html_url,
      source: 'GitHub',
      publishedAt: new Date().toISOString(),
      lang: 'en',
      score: repo.stargazers_count
    }));
    
    console.log(`  ✅ GitHub: ${items.length} 条`);
    return items;
  } catch (e) {
    console.warn(`  ❌ GitHub: ${e.message}`);
    return [];
  }
}

// 4. Product Hunt
async function fetchProductHunt() {
  try {
    console.log('📡 抓取 Product Hunt...');
    
    // 使用 RSSHub 的 Product Hunt 路由
    const url = 'https://rsshub.app/producthunt/today';
    const xml = await fetchXML(url);
    
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g;
    
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'gpt', 'chatbot', 'automation', 'assistant', 'model', 'neural'];
    
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xml)) !== null && count < 10) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      const url = match[2].trim();
      const desc = match[3].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').slice(0, 150).trim();
      const date = match[4].trim();
      
      const text = (title + ' ' + desc).toLowerCase();
      if (aiKeywords.some(kw => text.includes(kw))) {
        items.push({
          title: `Product Hunt: ${title}`,
          description: desc || 'New AI product launch',
          url: url,
          source: 'Product Hunt',
          publishedAt: new Date(date).toISOString(),
          lang: 'en'
        });
        count++;
      }
    }
    
    console.log(`  ✅ Product Hunt: ${items.length} 条`);
    return items;
  } catch (e) {
    console.warn(`  ❌ Product Hunt: ${e.message}`);
    return [];
  }
}

// 5. Dev.to
async function fetchDevTo() {
  try {
    console.log('📡 抓取 Dev.to...');
    
    // Dev.to API - 获取 AI 相关文章
    const url = 'https://dev.to/api/articles?tag=ai&per_page=10';
    const data = await fetchJSON(url);

    // 修复：检查返回格式
    if (!Array.isArray(data)) {
      console.warn(`  ⚠️ Dev.to 返回格式错误: ${typeof data}`);
      return [];
    }
    
    const items = data.map(article => ({
      title: article.title,
      description: article.description || `By ${article.user.name} | ${article.readable_publish_date}`,
      url: article.url,
      source: 'Dev.to',
      publishedAt: article.published_at,
      lang: 'en',
      score: article.public_reactions_count
    }));
    
    console.log(`  ✅ Dev.to: ${items.length} 条`);
    return items;
  } catch (e) {
    console.warn(`  ❌ Dev.to: ${e.message}`);
    return [];
  }
}

// 6. ArXiv 论文
async function fetchArXiv(category) {
  try {
    console.log(`📡 抓取 ArXiv ${category}...`);
    
    // ArXiv API - 获取最新论文
    const url = `https://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=10`;
    const xml = await fetchXML(url);
    
    const items = [];
    const entryRegex = /<entry>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<published>([\s\S]*?)<\/published>[\s\S]*?<id>([\s\S]*?)<\/id>[\s\S]*?<\/entry>/g;
    
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      const summary = match[2].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      const published = match[3].trim();
      const id = match[4].trim();
      
      items.push({
        title: `ArXiv: ${title}`,
        description: cleanText(summary.slice(0, 250)) || 'Latest AI research paper',
        url: id,
        source: `ArXiv ${category}`,
        publishedAt: published,
        lang: 'en'
      });
    }
    
    console.log(`  ✅ ArXiv: ${items.length} 条`);
    return items;
  } catch (e) {
    console.warn(`  ❌ ArXiv: ${e.message}`);
    return [];
  }
}

// 7. RSS 通用抓取
async function fetchRSS(name, url) {
  try {
    console.log(`📡 抓取 ${name}...`);
    const xml = await fetchXML(url);
    
    const items = [];
    // 支持多种 RSS 格式
    const itemRegex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?(?:<description>|<content:encoded>)([\s\S]*?)(?:<\/description>|<\/content:encoded>)[\s\S]*?(?:<pubDate>|<published>)([\s\S]*?)(?:<\/pubDate>|<\/published>)[\s\S]*?<\/item>/g;
    
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xml)) !== null && count < 8) {
      const title = match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
      const link = match[2].trim();
      const desc = match[3].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').slice(0, 200).trim();
      const date = match[4].trim();
      
      items.push({
        title: title,
        description: desc || `${name} 最新文章`,
        url: link,
        source: name,
        publishedAt: new Date(date).toISOString(),
        lang: /[\u4e00-\u9fa5]/.test(title) ? 'zh' : 'en'
      });
      count++;
    }
    
    console.log(`  ✅ ${name}: ${items.length} 条`);
    return items;
  } catch (e) {
    console.warn(`  ❌ ${name}: ${e.message}`);
    return [];
  }
}

// ==================== 数据处理 ====================

function categorize(item) {
  const text = (item.title + ' ' + item.description).toLowerCase();
  
  // 研究类（论文、ArXiv、研究）
  if (/\b(research|paper|arxiv|study|university|mit|stanford|deepmind|openai research)\b/.test(text) ||
      text.includes('论文') || item.source.includes('ArXiv')) {
    return 'research';
  }
  
  // 工具类（产品、GitHub、开源）
  if (/\b(tool|app|software|platform|cursor|copilot|vscode|plugin|api|github|open source|launch|release)\b/.test(text) ||
      text.includes('开源') || text.includes('工具') || item.source === 'Product Hunt' || item.source === 'GitHub') {
    return 'tools';
  }
  
  // 商业类（融资、收购、市场）
  if (/\b(startup|funding|investment|million|billion|ipo|acquisition|估值|融资|收购|revenue|market)\b/.test(text)) {
    return 'industry';
  }
  
  // 安全伦理类
  if (/\b(safety|ethics|risk|regulation|policy|privacy|alignment|监管|安全|伦理|bias|fairness)\b/.test(text)) {
    return 'safety';
  }
  
  return 'news';
}

function isHot(item) {
  const text = (item.title + ' ' + item.description).toLowerCase();
  const hotCompanies = ['openai', 'google', 'microsoft', 'meta', 'nvidia', 'apple', 'anthropic', 'deepmind'];
  const hotProducts = ['gpt-4', 'gpt-5', 'claude 3', 'llama 3', 'gemini', 'sonnet', 'opus'];
  const hotActions = ['发布', '推出', 'launch', 'release', 'announce', 'unveil', 'breakthrough'];
  
  const hasMajor = hotCompanies.some(c => text.includes(c));
  const hasProduct = hotProducts.some(p => text.includes(p));
  const hasAction = hotActions.some(a => text.includes(a));
  
  return (hasMajor && hasAction) || hasProduct || (item.score && item.score > 200);
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
    'mistral': 'Mistral', 'apple': 'Apple', '百度': '百度', '阿里': '阿里',
    'stability': 'Stability AI', 'midjourney': 'Midjourney'
  };
  
  Object.entries(companies).forEach(([key, val]) => {
    if (text.includes(key) && !tags.includes(val)) tags.push(val);
  });
  
  // 技术标签
  if (text.includes('开源') || text.includes('open source')) tags.push('开源');
  if (text.includes('多模态') || text.includes('multimodal')) tags.push('多模态');
  if (/\b(code|coding|编程|github|vscode)\b/.test(text)) tags.push('编程');
  if (text.includes('image') || text.includes('图像') || text.includes('diffusion')) tags.push('图像生成');
  if (text.includes('video') || text.includes('视频')) tags.push('视频生成');
  if (text.includes('paper') || text.includes('论文') || text.includes('arxiv')) tags.push('论文');
  
  return tags.slice(0, 4);
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .slice(0, 200);
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
  
  // Reddit 多社区
  promises.push(fetchReddit('MachineLearning'));
  promises.push(fetchReddit('artificial'));
  promises.push(fetchReddit('OpenAI'));
  promises.push(fetchReddit('LocalLLaMA'));
  
  // GitHub
  promises.push(fetchGitHubTrending());
  
  // Product Hunt
  promises.push(fetchProductHunt());
  
  // Dev.to
  promises.push(fetchDevTo());
  
  // ArXiv 多类别
  promises.push(fetchArXiv('cs.AI'));
  promises.push(fetchArXiv('cs.LG'));
  promises.push(fetchArXiv('cs.CL'));
  
  // RSS 英文媒体
  promises.push(fetchRSS('TechCrunch', 'https://techcrunch.com/category/artificial-intelligence/feed/'));
  promises.push(fetchRSS('The Verge', 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml'));
  promises.push(fetchRSS('Wired', 'https://www.wired.com/feed/tag/ai/latest/rss'));
  promises.push(fetchRSS('MIT Tech Review', 'https://www.technologyreview.com/feed/'));
  promises.push(fetchRSS('VentureBeat', 'https://venturebeat.com/category/ai/feed/'));
  
  // RSS 中文媒体
  promises.push(fetchRSS('即刻AI', 'https://rsshub.app/jike/topic/63549b1970208ee92e0ae8a2'));
  promises.push(fetchRSS('少数派', 'https://rsshub.app/sspai/tag/AI'));
  promises.push(fetchRSS('量子位', 'https://rsshub.app/qbitai'));

  const results = await Promise.all(promises);
  results.forEach(items => allArticles.push(...items));

  console.log('');
  console.log(`📊 原始抓取: ${allArticles.length} 条`);

  // 使用备用数据
  if (allArticles.length === 0) {
    console.log('⚠️ 所有源失败，使用备用数据');
    saveData(FALLBACK_NEWS, true);
    return;
  }

  // 去重
  const seen = new Set();
  const unique = allArticles.filter(item => {
    const key = item.title?.slice(0, 40);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`📊 去重后: ${unique.length} 条`);

  // 评分排序
  const scored = unique.map(item => {
    let score = 0;
    const text = (item.title + ' ' + item.description).toLowerCase();
    
    // 来源权重
    const sourceWeight = {
      'Hacker News': 5,
      'TechCrunch': 4,
      'The Verge': 4,
      'MIT Tech Review': 4,
      'GitHub': 3,
      'Product Hunt': 3,
      'ArXiv': 3,
      'Reddit': 2
    };
    
    Object.entries(sourceWeight).forEach(([src, weight]) => {
      if (item.source.includes(src)) score += weight;
    });
    
    // 时效性（24小时内满分）
    const hoursAgo = (Date.now() - new Date(item.publishedAt)) / (1000 * 60 * 60);
    score += Math.max(0, 24 - hoursAgo) * 0.5;
    
    // 热度分数
    if (item.score) score += Math.min(item.score / 100, 5);
    
    // 关键词加分
    const hotKeywords = ['openai', 'gpt-4', 'gpt-5', 'claude', 'launch', 'breakthrough'];
    hotKeywords.forEach(kw => { if (text.includes(kw)) score += 1; });
    
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 转换为标准格式
  const today = new Date().toISOString().split('T')[0];
  const news = scored.slice(0, 25).map((s, idx) => ({
    id: idx + 1,
    cat: categorize(s.item),
    hot: isHot(s.item),
    title: cleanText(s.item.title),
    summary: cleanText(s.item.description),
    source: s.item.source,
    date: today,
    url: s.item.url,
    tags: generateTags(s.item),
    lang: s.item.lang || (/[\u4e00-\u9fa5]/.test(s.item.title) ? 'zh' : 'en'),
    score: Math.round(s.score)
  }));

  // 统计
  console.log('');
  console.log('📈 最终统计:');
  console.log(`  总计: ${news.length} 条`);
  
  const langStats = { en: 0, zh: 0 };
  const catStats = {};
  
  news.forEach(n => {
    langStats[n.lang] = (langStats[n.lang] || 0) + 1;
    catStats[n.cat] = (catStats[n.cat] || 0) + 1;
  });
  
  console.log(`  🇺🇸 英文: ${langStats.en} 条`);
  console.log(`  🇨🇳 中文: ${langStats.zh} 条`);
  console.log('  分类:', catStats);

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
  console.log(`📁 data/news.json`);
  console.log(`🔥 热点: ${news.filter(n => n.hot).length} 条`);
}

main().catch(err => {
  console.error('❌ 致命错误:', err);
  process.exit(1);
});
