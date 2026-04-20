// SessionEnd hook: append a JSONL row to .claude/eval.jsonl with session stats.
// Lets the user review, later, which sessions succeeded vs. got stuck.
// Outcomes get tagged manually later (or by a review script).

const fs = require("fs");
const { execSync } = require("child_process");

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const obj = JSON.parse(input || "{}");
    const dir = process.env.CLAUDE_PROJECT_DIR || ".";

    let touches = 0;
    let touchedFiles = [];
    try {
      const log = fs.readFileSync(`${dir}/.claude/touch-log.txt`, "utf8");
      const lines = log.trim().split("\n").filter(Boolean);
      const sessionStart = obj.session_start_ts || 0;
      const recent = lines.filter((l) => {
        const ts = new Date(l.split("\t")[0]).getTime();
        return ts >= sessionStart;
      });
      touches = recent.length;
      touchedFiles = [...new Set(recent.map((l) => l.split("\t")[2]))];
    } catch (e) {}

    let diffStat = "";
    try {
      diffStat = execSync("git diff --shortstat HEAD", {
        cwd: dir,
        encoding: "utf8",
      }).trim();
    } catch (e) {}

    const row = {
      ts: new Date().toISOString(),
      session_id: obj.session_id || null,
      reason: obj.reason || null,
      tool_calls: touches,
      files_touched: touchedFiles.length,
      diff_stat: diffStat,
      outcome: null,
      notes: null,
    };

    fs.appendFileSync(`${dir}/.claude/eval.jsonl`, JSON.stringify(row) + "\n");
  } catch (e) {}
});
