const PORT = 17327;
const VERSION = "0.1.0";

let ws;

const summarize = ({ id, windowId, active, url, title }) => ({ id, windowId, active, url, title });

async function listTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(summarize);
}

async function openTab({ url }) {
  const { id, windowId, title } = await chrome.tabs.create({ url, active: false });
  return { id, windowId, active: false, url, title };
}

async function attachDebugger(tabId) {
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
  } catch (error) {
    if (!/already attached/i.test(error.message)) throw error;
  }
}

async function cdp({ tabId, method, params }) {
  await attachDebugger(tabId);
  return chrome.debugger.sendCommand({ tabId }, method, params);
}

const handlers = { tabs: listTabs, openTab, cdp };

const send = (payload) => ws.send(JSON.stringify(payload));

async function dispatch({ id, method, params }) {
  try {
    const handler = handlers[method];
    if (!handler) throw new Error(`Método desconhecido: ${method}`);
    send({ id, result: await handler(params) });
  } catch (error) {
    send({ id, error: error?.message ?? String(error) });
  }
}

function connect() {
  if (ws && ws.readyState <= WebSocket.OPEN) return;
  ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
  ws.onopen = () => send({ type: "hello", version: VERSION });
  ws.onmessage = ({ data }) => dispatch(JSON.parse(data));
  ws.onclose = () => setTimeout(connect, 2000);
}

function keepAlive() {
  if (ws?.readyState !== WebSocket.OPEN) return;
  ws.send('{"type":"ping"}');
}

setInterval(keepAlive, 20000);
chrome.alarms.create("reconnect", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(connect);
connect();
