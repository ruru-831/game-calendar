const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 5173;
const ROOT = __dirname;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".rules": "text/plain; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const requestPath = (req.url || "/").split("?")[0];
  const relativePath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.resolve(ROOT, `.${relativePath}`);

  if (!resolvedPath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(resolvedPath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = contentTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(resolvedPath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Local server started: http://localhost:${PORT}`);
});
