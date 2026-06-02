const http = require('http');

// Extract port from AGY_BROWSER_WS_URL
const wsUrl = process.env.AGY_BROWSER_WS_URL;
if (!wsUrl) {
  console.error("AGY_BROWSER_WS_URL environment variable is not defined.");
  process.exit(1);
}
const portMatch = wsUrl.match(/:(\d+)\//);
if (!portMatch) {
  console.error("Could not parse port from WS URL:", wsUrl);
  process.exit(1);
}
const port = portMatch[1];
console.log("Using browser devtools port:", port);

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: port,
      path: path,
      method: method
    }, (res) => {
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
    req.end();
  });
}

async function run() {
  try {
    console.log("Creating new tab using PUT and navigating to Gemini share...");
    const targetUrl = "https://gemini.google.com/share/dfad70719c42";
    const tabInfo = await makeRequest('PUT', `/json/new?${targetUrl}`);
    console.log("New tab created response:", tabInfo);
    
    if (!tabInfo || !tabInfo.id) {
      throw new Error("Failed to create tab. Check response: " + JSON.stringify(tabInfo));
    }
    
    // Wait for the page to load (5 seconds)
    console.log("Waiting 6 seconds for page to load and render...");
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Get the WebSocket URL of the new tab
    const tabs = await makeRequest('GET', '/json');
    const targetTab = tabs.find(t => t.id === tabInfo.id);
    if (!targetTab) {
      throw new Error("Could not find the created tab in tab list.");
    }
    
    const dbgUrl = targetTab.webSocketDebuggerUrl;
    console.log("Connecting WebSocket to tab debugger:", dbgUrl);
    
    // Open WebSocket using global WebSocket API available in Node.js
    const ws = new WebSocket(dbgUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected. Sending CDP command to evaluate script...");
      const command = {
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: "document.body.innerText", // get innerText of the page
          returnByValue: true
        }
      };
      ws.send(JSON.stringify(command));
    };
    
    ws.onmessage = async (event) => {
      const response = JSON.parse(event.data);
      if (response.id === 1) {
        if (response.result && response.result.result) {
          const text = response.result.result.value;
          console.log("\n=================== GEMINI SHARE CONTENT ===================");
          console.log(text);
          console.log("============================================================\n");
        } else {
          console.log("CDP Error response:", response);
        }
        ws.close();
        
        // Clean up: close the tab
        console.log("Closing target tab...");
        await makeRequest('GET', `/json/close/${tabInfo.id}`);
        console.log("Done.");
      }
    };
    
    ws.onerror = (err) => {
      console.error("WS Error:", err);
    };
    
  } catch (err) {
    console.error("Execution failed:", err);
  }
}

run();
