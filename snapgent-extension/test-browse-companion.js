// Run the browser and desktop dispatch code against a controlled MCP catalog.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function functionSource(source, name) {
  const match = source.match(new RegExp(`^  (?:async )?function ${name}\\([^]*?^  \\}`, "m"));
  assert.ok(match, name);
  return match[0];
}

function harness(root) {
  const read = (file) => fs.readFileSync(path.join(root, "core", file), "utf8");
  const core = read("main.js");
  const companion = core.slice(core.indexOf('  const BROWSE_SERVER = "browse";'), core.indexOf("  function activeTools()"));
  assert.ok(companion.includes("function browseCompanionScope"));
  return new Function(`
    ${read("config.js")}
    ${read("parser.js")}
    let selectedTargetId = "chatcmd";
    let conversation = "/c/testing";
    const P = { id: "chatgpt", supportsVision: true, conversationKey: () => conversation };
    const A = { stop: false, running: true, toolRunning: true, toolName: "browse/execute",
      toolNames: new Set(["agent_user_message", "fs_view_image", "execute"]),
      toolList: [
        { server: "chatcmd", name: "agent_user_message" },
        { server: "chatcmd", name: "fs_view_image" },
        { server: "chatcmd", name: "chatcmd/execute" },
        { server: "browse", name: "browse/execute", inputSchema: { properties: { code: { type: "string" } } } },
        { server: "browse", name: "tabs" },
        { server: "unrelated", name: "unrelated/execute" },
      ],
      bridge: { servers: ["chatcmd", "browse", "unrelated"].map(id => ({ id, alive: true, tools: 2 })) },
    };
    let storageChange;
    const chrome = { storage: { onChanged: { addListener: fn => { storageChange = fn; } } } };
    const MCP_ENABLED_KEY = "zsMcpEnabled";
    const isMcpEnabled = () => true;
    const bareToolName = name => name.split("/").pop();
    const bareKey = name => bareToolName(name).split(".").pop();
    const isBlockedTool = () => false;
    const scrollSuppressed = () => false;
    const document = { hidden: false };
    const ensureTools = async () => A.toolList;
    const diag = () => {};
    const systemPrompt = () => "System instructions with fenced JSON";
    let sysDue = true;
    const sysResendDue = () => sysDue;
    const sinceLastSys = () => ({ users: 0, results: 12 });
    const resetSysCount = () => { sysDue = false; };
    const previewed = [];
    const ui = { showImages: images => previewed.push(images), banner: () => {} };
    const setTimeout = (callback, ms) => { if (ms < 2000) queueMicrotask(callback); };
    const ZSGuard = {
      mayRetryAfterDisconnect: result => result.sent === false,
    };
    const image = { mimeType: "image/png", data: "fixture" };
    const sent = [];
    let beforeReply = null;
    let firstReply = null;
    const bg = async request => {
      if (request.type === "ping") return { ok: true };
      sent.push(request);
      const hook = beforeReply;
      beforeReply = null;
      hook?.();
      if (firstReply) {
        const response = firstReply;
        firstReply = null;
        return response;
      }
      return request.name === "fs_view_image" || request.name === "browse/execute"
        ? { ok: true, images: [image] }
        : { ok: true, text: request.server };
    };
    ${companion}
    ${functionSource(core, "knownTool")}
    ${functionSource(core, "runTool")}
    ${functionSource(core, "withSysResend")}
    const call = (tool, args = {}) => runTool({tool, arguments: args});
    return {
      call, sent, previewed, A, ZS, ZSParse, P, withSysResend,
      grant: () => { browseConsent = {conversation}; },
      revoke: () => revokeBrowseCompanion(),
      navigate: key => { conversation = key; },
      select: target => { selectedTargetId = target; },
      enableServers: flags => storageChange({[MCP_ENABLED_KEY]:{newValue: flags}}, "local"),
      beforeReply: callback => { beforeReply = callback; },
      firstReply: response => { firstReply = response; },
    };
  `)();
}

async function verify(root, browser) {
  const h = harness(root);
  const { call, sent, previewed, A, ZS, ZSParse } = h;
  assert.doesNotMatch(await call("list_mcp_servers"), /\bbrowse\b/);
  assert.match(await call("list_commands", { server: "browse" }), /not available/);
  assert.match(await call("browse/tabs"), /Only the selected target/);
  assert.equal(sent.length, 0);
  await call("fs_view_image");
  assert.equal(sent.at(-1).server, "chatcmd");
  assert.equal(previewed.length, 1);
  A.pendingImages = null;

  h.grant();
  assert.match(await call("list_mcp_servers"), /Connected MCP servers \(2\)/);
  assert.doesNotMatch(await call("list_mcp_servers"), /unrelated/);
  const browseList = await call("list_commands", { server: "browse" });
  assert.match(browseList, /browse\/execute:/);
  assert.match(browseList, /browse\/tabs:/);
  assert.doesNotMatch(browseList, /fs_view_image:/);
  assert.match(await call("list_commands"), /fs_view_image:/);
  assert.match(await call("list_commands", { server: "unrelated" }), /not available/);
  assert.match(await call("browse/unknown"), /Unknown|unknown/);
  assert.match(await call("unrelated/execute"), /Only the selected target/);

  const parsed = ZSParse.parseToolCalls('```json\n{"command":"browse/tabs","params":{"action":"list"}}\n```');
  assert.equal(parsed[0].tool, "browse/tabs");
  await call(parsed[0].tool);
  await call("execute");
  await call("browse/execute");
  await call("fs_view_image");
  assert.deepEqual(sent.slice(-4).map(r => r.server), ["browse", "chatcmd", "browse", "chatcmd"]);
  assert.equal(previewed.length, 3);
  assert.match(ZS.buildSystemPrompt({ targetServer: "chatcmd", browseCompanion: true }), /list_commands with server "browse"/);
  assert.doesNotMatch(ZS.buildSystemPrompt({ targetServer: "chatcmd" }), /Browse/);
  assert.equal(h.withSysResend("Exact image caption", true), "Exact image caption");
  assert.match(h.withSysResend("Text feedback", false), /System instructions with fenced JSON/);
  assert.equal(h.withSysResend("Another text result", false), "Another text result");

  h.navigate("/c/another");
  assert.match(await call("browse/tabs"), /Only the selected target/);
  h.navigate("/c/testing");
  h.select("unrelated");
  assert.match(await call("browse/tabs"), /Only the selected target/);
  h.select("chatcmd");
  h.P.id = "gemini";
  assert.match(await call("browse/tabs"), /Only the selected target/);
  h.P.id = "chatgpt";

  if (browser) {
    h.firstReply({ ok: false, kind: "disconnected", sent: false });
    assert.match(await call("browse/tabs"), /^Output of 'browse\/tabs':/);
    assert.deepEqual(sent.slice(-2).map(r => r.server), ["browse", "browse"]);
  }
  A.pendingImages = null;
  h.beforeReply(() => h.navigate("/c/another"));
  assert.equal(await call("browse/execute"), "(Browse stopped)");
  assert.equal(A.pendingImages, null);
  assert.equal(previewed.length, 3);
  assert.equal(A.stop, true);

  A.stop = false;
  h.navigate("/c/testing");
  h.beforeReply(() => h.revoke());
  assert.equal(await call("browse/execute"), "(Browse stopped)");
  assert.equal(A.pendingImages, null);
  A.stop = false;
  assert.match(await call("browse/tabs"), /Only the selected target/);

  h.grant();
  h.enableServers({browse: false});
  assert.match(await call("browse/tabs"), /Only the selected target/);
  h.enableServers({});
  assert.match(await call("browse/tabs"), /Only the selected target/);
  A.stop = false;
  await call("fs_view_image");
  assert.equal(sent.at(-1).server, "chatcmd");
  console.log(`PASS  companion discovery, routing, revocation and image results (${root})`);
}

(async () => {
  await verify(__dirname, true);
  await verify(path.join(__dirname, "../snapgent-app/extension"), false);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
