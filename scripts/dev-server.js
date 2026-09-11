// scripts/dev-server.js
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

// Route mappings mirroring firebase.json rewrites
const REWRITES = {
  "/": "/index.html",
  "/student": "/pages/student.html",
  "/student.html": "/pages/student.html",
  "/teacher": "/pages/teacher.html",
  "/teacher.html": "/pages/teacher.html",
  "/admin": "/pages/admin.html",
  "/admin.html": "/pages/admin.html"
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Apply rewrite if exists
  if (REWRITES[pathname]) {
    pathname = REWRITES[pathname];
  }

  let filePath = path.join(ROOT_DIR, pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 Forbidden");
    return;
  }

  // Check if target is a directory
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      const notFoundPath = path.join(ROOT_DIR, "pages", "404.html");
      if (fs.existsSync(notFoundPath)) {
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.end("<h1>404 Not Found</h1>");
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache"
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Local Dev Server running at: http://localhost:${PORT}/`);
  console.log(`- الرئيسية:   http://localhost:${PORT}/`);
  console.log(`- بوابة الطالب: http://localhost:${PORT}/student`);
  console.log(`- بوابة المعلم: http://localhost:${PORT}/teacher`);
  console.log(`- لوحة الإدارة: http://localhost:${PORT}/admin\n`);
});
