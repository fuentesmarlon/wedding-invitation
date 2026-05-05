const fs = require("fs");
const http = require("http");
const path = require("path");

const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";
const publicDir = __dirname;
const invitationsDir = path.join(__dirname, "invitaciones");
const csvPath = path.join(invitationsDir, "asistencias.csv");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function saveRsvp(request, response) {
  try {
    const body = await readRequestBody(request);
    const data = JSON.parse(body);
    const guestName = String(data.guestName || "").trim();
    const companionName = String(data.companionName || "").trim();
    const hasChildren = Boolean(data.hasChildren);
    const childrenCount = hasChildren ? Number.parseInt(data.childrenCount, 10) : 0;

    if (!guestName) {
      sendJson(response, 400, { error: "El nombre del invitado es obligatorio." });
      return;
    }

    if (hasChildren && (!Number.isInteger(childrenCount) || childrenCount < 1)) {
      sendJson(response, 400, { error: "La cantidad de niños debe ser mayor a cero." });
      return;
    }

    fs.mkdirSync(invitationsDir, { recursive: true });

    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(
        csvPath,
        "fecha,nombre_invitado,nombre_acompanante,vienen_ninos,cantidad_ninos\n",
        "utf8"
      );
    }

    const row = [
      new Date().toISOString(),
      guestName,
      companionName,
      hasChildren ? "si" : "no",
      hasChildren ? childrenCount : 0,
    ].map(csvEscape).join(",");

    fs.appendFileSync(csvPath, `${row}\n`, "utf8");
    sendJson(response, 200, { ok: true });
  } catch (error) {
    sendJson(response, 500, { error: "No se pudo guardar la confirmación." });
  }
}

function serveStatic(request, response) {
  const requestedPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const normalizedPath = requestedPath === "/" ? "/index.html" : requestedPath;
  const filePath = path.normalize(path.join(publicDir, normalizedPath));

  if (!filePath.startsWith(publicDir) || filePath.includes(`${path.sep}invitaciones${path.sep}`)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/rsvp") {
    saveRsvp(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(port, host, () => {
  console.log(`Servidor listo en http://${host}:${port}`);
  console.log(`CSV: ${csvPath}`);
});
