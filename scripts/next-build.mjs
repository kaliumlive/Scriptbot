import { spawn } from 'node:child_process'

const nextBin = './node_modules/next/dist/bin/next'
const env = {
  ...process.env,
  NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || '.next-build',
}

const child = spawn(process.execPath, [nextBin, 'build', '--webpack'], {
  stdio: 'inherit',
  env,
  shell: false,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})

