#!/usr/bin/env node
// Minimal stdio MCP server (JSON-RPC 2.0, newline-delimited) exposing ffprobe and
// ffmpeg ebur128 so agents can inspect fixture audio instead of guessing.
// Tools: probe_audio, measure_loudness. Paths are restricted to the repo.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import readline from "node:readline";

const run = promisify(execFile);
const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);

function safe(p) {
  const abs = path.resolve(ROOT, String(p));
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) throw new Error("path outside repo");
  return abs;
}

const tools = {
  probe_audio: {
    description: "ffprobe an audio file in the repo: duration, codec, sample rate, channels.",
    inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    async call({ path: p }) {
      const { stdout } = await run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", safe(p)]);
      return stdout;
    },
  },
  measure_loudness: {
    description: "Integrated LUFS and true peak (ffmpeg ebur128 with peak=true) for an audio file in the repo.",
    inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    async call({ path: p }) {
      const { stderr } = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", safe(p), "-af", "ebur128=peak=true", "-f", "null", "-"], { maxBuffer: 64 * 1024 * 1024 });
      const i = stderr.lastIndexOf("Summary:");
      return i >= 0 ? stderr.slice(i) : stderr.slice(-2000);
    },
  },
};

const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...m }) + "\n");

readline.createInterface({ input: process.stdin }).on("line", async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  if (id === undefined) return; // notification
  try {
    if (method === "initialize") {
      send({ id, result: { protocolVersion: params?.protocolVersion ?? "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "plusg-audio", version: "0.1.0" } } });
    } else if (method === "tools/list") {
      send({ id, result: { tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })) } });
    } else if (method === "tools/call") {
      const t = tools[params?.name];
      if (!t) throw new Error("unknown tool");
      try {
        send({ id, result: { content: [{ type: "text", text: await t.call(params.arguments ?? {}) }] } });
      } catch (e) {
        send({ id, result: { isError: true, content: [{ type: "text", text: String(e.message ?? e) }] } });
      }
    } else if (method === "ping") {
      send({ id, result: {} });
    } else {
      send({ id, error: { code: -32601, message: "method not found" } });
    }
  } catch (e) {
    send({ id, error: { code: -32000, message: String(e.message ?? e) } });
  }
});
