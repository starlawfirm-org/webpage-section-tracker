import http from "http";
import { readFile } from "fs/promises";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

http.createServer(async (req, res) => {
  if (req.url === "/collect" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      console.log("Received:", body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  try {
    const data = await readFile(filePath);
    res.writeHead(200); res.end(data);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
}).listen(3000, () => console.log("Demo at http://localhost:3000"));