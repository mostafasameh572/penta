// tools/kill-port-3000-node.js
const { execSync } = require("child_process");

const PORT = 3000;

function run(cmd) {
  return execSync(cmd, { stdio: ["pipe", "pipe", "ignore"] }).toString();
}

try {
  // netstat output example contains PID at end of line
  const out = run(`netstat -ano | findstr :${PORT}`);
  const lines = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Collect PIDs that match LISTENING on :PORT
  const pids = new Set();
  for (const line of lines) {
    // Typical: TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   1234
    if (!line.toUpperCase().includes("LISTENING")) continue;
    const parts = line.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }

  if (pids.size === 0) {
    console.log(`✅ Port ${PORT} is free`);
    process.exit(0);
  }

  // Kill only node.exe processes holding the port
  let killed = 0;
  for (const pid of pids) {
    const task = run(`tasklist /FI "PID eq ${pid}"`).toLowerCase();
    if (task.includes("node.exe")) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      killed++;
      console.log(`🛑 Killed node.exe on port ${PORT} (PID ${pid})`);
    } else {
      console.log(`⚠️ Port ${PORT} in use by non-node process (PID ${pid}) - skipped`);
    }
  }

  if (killed === 0) {
    console.log(`⚠️ Port ${PORT} is in use, but not by node.exe (nothing killed).`);
  } else {
    console.log(`✅ Cleared node listeners on port ${PORT}`);
  }
} catch (e) {
  // If findstr returns nothing, it throws => means port is free
  console.log(`✅ Port ${PORT} is free`);
}
