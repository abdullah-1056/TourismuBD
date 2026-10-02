import { spawn } from "node:child_process";

const mode = process.argv[2];
const servers = {
  main: { name: "TourismuBD", port: 5175, args: [] },
  admin: { name: "TourismuBD Admin", port: 5176, args: ["--config", "vite.admin.config.js"] },
};

const server = servers[mode];

if (!server) {
  console.error("Use: node scripts/vite-dev.mjs main|admin");
  process.exit(1);
}

const url = `http://127.0.0.1:${server.port}/`;
const healthUrl = `${url}__tourismubd-health`;

try {
  const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1_000) });
  if (response.ok && (await response.text()) === server.name) {
    console.log(`${server.name} is already running at ${url}`);
    process.exit(0);
  }
} catch {
  // No matching TourismuBD development server is running on this port.
}

const vite = spawn(process.execPath, ["./node_modules/vite/bin/vite.js", "--force", ...server.args], {
  stdio: "inherit",
});

vite.on("exit", (code) => process.exit(code ?? 0));
