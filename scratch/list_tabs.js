const http = require('http');

const wsUrl = process.env.AGY_BROWSER_WS_URL;
const portMatch = wsUrl.match(/:(\d+)\//);
const port = portMatch[1];

http.get(`http://127.0.0.1:${port}/json`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const tabs = JSON.parse(data);
      console.log("Active Tabs:");
      tabs.forEach(t => console.log(`- Title: "${t.title}" | URL: "${t.url}" | Type: "${t.type}"`));
    } catch(e) {
      console.log("Raw response:", data);
    }
  });
});
