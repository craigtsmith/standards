/* oxlint-disable eslint/max-lines, eslint/no-unused-vars, typescript/no-namespace, typescript/consistent-type-definitions, eslint/class-methods-use-this -- probe; only sort-modules matters */

export enum PublicMode {
  Off,
  On,
}

export interface ProbeOptions {
  retries: number
}

export type ProbeResult = { ok: boolean }

enum LocalMode {
  Fast,
  Slow,
}

interface InternalState {
  ticks: number
}

declare type AmbientAlias = string
type InternalPair = [string, number]

class InternalEngine {
  spin(): LocalMode {
    return LocalMode.Fast
  }
}

export class ProbeDriver extends InternalEngine {
  run(): PublicMode {
    return PublicMode.On
  }
}

export function probeRun(state: InternalState): string {
  return helperNarrate(state.ticks)
}

export default function ProbeMain(options: ProbeOptions): string {
  return helperFormat(options.retries)
}

declare function ambientHook(tag: string): void

function helperFormat(value: number): string {
  return `${value}`
}

function helperNarrate(ticks: number): string {
  return helperFormat(ticks)
}

async function helperSettle(): Promise<void> {
  await Promise.resolve()
}
