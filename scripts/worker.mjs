import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const pollIntervalMs = Math.max(1000, Number(process.env.WORKER_POLL_INTERVAL_MS ?? 30000));
const heartbeatMs = Math.max(1000, Number(process.env.WORKER_HEARTBEAT_MS ?? 300000));
const taskCommand = process.env.WORKER_TASK_COMMAND?.trim();

let shuttingDown = false;
let activeChild = null;

const log = (...args) => {
  console.log(new Date().toISOString(), '[worker]', ...args);
};

function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
      env: process.env,
    });

    activeChild = child;

    child.on('exit', (code, signal) => {
      if (activeChild === child) {
        activeChild = null;
      }
      resolve({ code, signal });
    });
  });
}

async function idleLoop() {
  log('no WORKER_TASK_COMMAND configured; idling');

  while (!shuttingDown) {
    await sleep(Math.min(pollIntervalMs, heartbeatMs));
    if (!shuttingDown) {
      log('heartbeat');
    }
  }
}

async function commandLoop(command) {
  log(`running task command: ${command}`);

  while (!shuttingDown) {
    const { code, signal } = await runCommand(command);

    if (shuttingDown) {
      break;
    }

    if (signal) {
      log(`task command stopped by ${signal}; retrying after ${pollIntervalMs}ms`);
    } else if (code === 0) {
      log(`task command completed successfully; rerunning after ${pollIntervalMs}ms`);
    } else {
      log(`task command exited with code ${code}; rerunning after ${pollIntervalMs}ms`);
    }

    await sleep(pollIntervalMs);
  }
}

process.on('SIGINT', () => {
  shuttingDown = true;
  if (activeChild && !activeChild.killed) {
    activeChild.kill('SIGTERM');
  }
  log('received SIGINT, shutting down');
});

process.on('SIGTERM', () => {
  shuttingDown = true;
  if (activeChild && !activeChild.killed) {
    activeChild.kill('SIGTERM');
  }
  log('received SIGTERM, shutting down');
});

async function main() {
  log('worker started');

  if (taskCommand) {
    await commandLoop(taskCommand);
    return;
  }

  await idleLoop();
}

main().catch((error) => {
  console.error('[worker] fatal error', error);
  process.exit(1);
});
