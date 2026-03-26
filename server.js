const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3005;
const usersFile = path.join(__dirname, "data", "usuarios.json");

app.use(cors());
app.use(express.json());

function ensureUsersFile() {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
  }
}

// Dejo la lectura centralizada en un archivo local para mantener el caso simple y demostrar el flujo completo sin base de datos.
function readUsers() {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

// Este guardado conserva los registros creados desde el servicio y evita perder pruebas entre una peticion y otra.
function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function normalizeCredentials(body) {
  const username = String(body.username || body.usuario || "").trim().toLowerCase();
  const password = String(body.password || body.contrasena || "").trim();
  return { username, password };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Servicio activo" });
});

app.post("/api/register", (req, res) => {
  const { username, password } = normalizeCredentials(req.body || {});

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      message: "Debe enviar usuario y contrasena para completar el registro.",
    });
  }

  const users = readUsers();
  const exists = users.some((user) => user.username === username);

  if (exists) {
    return res.status(409).json({
      ok: false,
      message: "El usuario ya se encuentra registrado.",
    });
  }

  const newUser = {
    id: users.length + 1,
    username,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  return res.status(201).json({
    ok: true,
    message: "Registro realizado correctamente.",
    user: { id: newUser.id, username: newUser.username },
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = normalizeCredentials(req.body || {});

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      message: "Debe enviar usuario y contrasena para iniciar sesion.",
    });
  }

  const users = readUsers();
  const user = users.find((item) => item.username === username && item.password === password);

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: "Error en la autenticacion.",
    });
  }

  return res.json({
    ok: true,
    message: "Autenticacion satisfactoria.",
    user: { id: user.id, username: user.username },
  });
});

app.listen(PORT, () => {
  ensureUsersFile();
  console.log(`Servicio web escuchando en http://localhost:${PORT}`);
});
