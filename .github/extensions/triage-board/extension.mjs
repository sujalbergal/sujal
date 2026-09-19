import { createServer } from "node:http";
import { joinSession, createCanvas } from "@github/copilot-sdk/extension";

const servers = new Map();
const issues = [
  { number: 7, title: "Allow users to filter games by category and publisher", state: "OPEN", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/7", description: "Add category checkboxes and publisher filtering so players can narrow the catalog and combine both filters.", reason: "Active work for this session has an open pull request, making review or follow-up the most immediate need." },
  { number: 6, title: "Implement pagination on the game list page", state: "OPEN", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/6", description: "Add paginated data helpers and accessible page controls to keep the growing catalog fast and manageable.", reason: "Catalog-scale performance is foundational for the next wave of browsing features." },
  { number: 5, title: "Show a catalog summary on the home page", state: "OPEN", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/5", description: "Show total games and average star rating, including empty and unrated catalog states.", reason: "It is a focused, low-risk improvement that gives visitors useful context quickly." },
  { number: 4, title: "Add a publisher page listing that publisher's games", state: "OPEN", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/4", description: "Create prerendered publisher pages with publisher details and a reusable game-card listing.", reason: "Important navigation work, but it benefits from list and publisher discovery patterns being settled first." },
  { number: 3, title: "Show category and publisher descriptions on the game detail page", state: "OPEN", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/3", description: "Expose available category and publisher descriptions on each game detail page.", reason: "Useful content enhancement, but less urgent than performance and discovery workflows." },
  { number: 2, title: "Allow users to sort the game list", state: "OPEN", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/2", description: "Add accessible sorting by title and star rating, with sensible handling for unrated games.", reason: "Improves browsing control and can follow the core list improvements." },
  { number: 1, title: "Add a search box to find games by title", state: "OPEN", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/1", description: "Add case-insensitive title search with an accessible input and no-match empty state.", reason: "Valuable discoverability work that can be coordinated with the existing filters." },
  { number: 8, title: "Update our repository coding standards", state: "CLOSED", url: "https://github.com/sujalbergal/sujal-Tailspin-Toys/issues/8", description: "Clarify comment, documentation, formatting, and linting expectations.", reason: "Already closed; retained for reference rather than active triage." },
];

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function card(issue, featured) {
  return `<article class="card ${featured ? "featured" : ""}">
    <div class="meta"><span>#${issue.number}</span><span class="state ${issue.state.toLowerCase()}">${issue.state}</span></div>
    <h3><a href="${issue.url}" target="_blank" rel="noreferrer">${escapeHtml(issue.title)}</a></h3>
    <p>${escapeHtml(issue.description)}</p>
    ${featured ? `<div class="reason"><strong>Why it is here:</strong> ${escapeHtml(issue.reason)}</div>` : ""}
    <button class="add" data-issue="${issue.number}" type="button">Add to current context</button>
  </article>`;
}

function html() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Issue triage board</title>
  <style>
    :root{color-scheme:dark;--bg:#0d1117;--panel:#161b22;--border:#30363d;--text:#f0f6fc;--muted:#8b949e;--accent:#2f81f7;--green:#3fb950}
    *{box-sizing:border-box}body{margin:0;padding:24px;background:var(--bg);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{max-width:1100px;margin:auto}h1{margin:0 0 6px;font-size:24px}h2{margin:28px 0 12px;font-size:17px}.intro{margin:0;color:var(--muted)}
    .board{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}.card{display:flex;flex-direction:column;gap:10px;padding:16px;background:var(--panel);border:1px solid var(--border);border-radius:8px;min-height:220px}.featured{border-color:var(--accent);box-shadow:0 0 0 1px #2f81f733}.meta{display:flex;justify-content:space-between;color:var(--muted);font-family:ui-monospace,monospace}.state{border-radius:999px;padding:2px 8px;font:600 11px system-ui}.open{color:#b6e3ff;background:#1f6feb33}.closed{color:#aff5b4;background:#23863655}h3{margin:0;font:600 16px/1.3 system-ui}h3 a{color:var(--text);text-decoration:none}h3 a:hover{color:#79c0ff;text-decoration:underline}.card p{margin:0;color:var(--muted)}.reason{margin-top:auto;padding:10px;border-left:3px solid var(--accent);background:#1f6feb1a;color:#c9d1d9}.add{margin-top:auto;border:1px solid var(--border);border-radius:6px;padding:8px 10px;background:#21262d;color:var(--text);cursor:pointer}.add:hover{border-color:var(--accent);background:#30363d}.add:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.added{color:#aff5b4;border-color:var(--green)}#status{min-height:22px;margin-top:16px;color:#aff5b4}
  </style></head><body><main><h1>Issue triage board</h1><p class="intro">The three issues most likely to need attention now are highlighted first. Add any issue to the current session context to start work immediately.</p>
  <h2>Most likely to need attention</h2><section class="board" aria-label="Priority issues">${issues.slice(0, 3).map((issue) => card(issue, true)).join("")}</section>
  <h2>Remaining issues</h2><section class="board" aria-label="Remaining issues">${issues.slice(3).map((issue) => card(issue, false)).join("")}</section><div id="status" role="status" aria-live="polite"></div></main>
  <script>document.querySelectorAll(".add").forEach((button)=>button.addEventListener("click",async()=>{button.disabled=true;const response=await fetch("/add-to-context",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({issue:Number(button.dataset.issue)})});const result=await response.json();document.querySelector("#status").textContent=result.message;button.textContent=result.ok?"Added to current context":"Unable to add";button.classList.toggle("added",result.ok);if(!result.ok)button.disabled=false;}));</script></body></html>`;
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function body(req) {
  let value = "";
  for await (const chunk of req) value += chunk;
  return JSON.parse(value);
}

async function addIssue(number, session) {
  const issue = issues.find((candidate) => candidate.number === number);
  if (!issue) return { ok: false, message: "Issue not found." };
  await session.send(`Add issue #${issue.number} to the current context for this session. Title: ${issue.title}. Description: ${issue.description} URL: ${issue.url}`);
  return { ok: true, message: `Issue #${issue.number} added to the current context.` };
}

function startServer(session) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        if (req.method === "POST" && req.url === "/add-to-context") return json(res, 200, await addIssue(Number((await body(req)).issue), session));
        if (req.method === "GET" && req.url === "/") { res.setHeader("Content-Type", "text/html; charset=utf-8"); return res.end(html()); }
        return json(res, 404, { ok: false, message: "Not found." });
      } catch (error) { return json(res, 400, { ok: false, message: error instanceof Error ? error.message : "Request failed." }); }
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` }));
  });
}

const session = await joinSession({
  canvases: [createCanvas({
    id: "triage-board",
    displayName: "Issue triage board",
    description: "A Kanban board highlighting the three repository issues most likely to need attention, with actions to add issues to the current session context.",
    actions: [{
      name: "add_issue_to_context",
      description: "Add a repository issue to the current session context.",
      inputSchema: { type: "object", properties: { issueNumber: { type: "integer" } }, required: ["issueNumber"], additionalProperties: false },
      handler: async (ctx) => addIssue(ctx.input.issueNumber, session),
    }],
    open: async (ctx) => {
      let entry = servers.get(ctx.instanceId);
      if (!entry) { entry = await startServer(session); servers.set(ctx.instanceId, entry); }
      return { title: "Issue triage board", url: entry.url };
    },
    onClose: async (ctx) => {
      const entry = servers.get(ctx.instanceId);
      if (entry) { servers.delete(ctx.instanceId); await new Promise((resolve) => entry.server.close(resolve)); }
    },
  })],
});
