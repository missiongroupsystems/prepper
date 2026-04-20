let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  try {
    const obj = JSON.parse(data);
    const tool = obj.tool_name || "?";
    const f =
      (obj.tool_response && obj.tool_response.filePath) ||
      (obj.tool_input && obj.tool_input.file_path) ||
      "";
    if (!f) return;
    const ts = new Date().toISOString();
    const line = `${ts}\t${tool}\t${f}\n`;
    const dir = process.env.CLAUDE_PROJECT_DIR || ".";
    require("fs").appendFileSync(`${dir}/.claude/touch-log.txt`, line);
  } catch (e) {}
});
