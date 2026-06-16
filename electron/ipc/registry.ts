/**
 * IpcRegistry — centralized duplicate detection for ipcMain.handle registrations.
 *
 * Electron crashes with an unrecoverable error if two handlers are registered for
 * the same channel. This registry patches ipcMain.handle once (before any handlers
 * are registered) to intercept every call, detect duplicates, and log a clear
 * diagnostic instead of crashing.
 *
 * Usage: call installIpcRegistry() once at startup, BEFORE registerIpcHandlers().
 * Call ipcRegistry.report() after all handlers are registered to print the manifest.
 */

import { ipcMain } from 'electron'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChannelEntry {
  channel: string
  registeredAt: number
}

// ── Registry class ─────────────────────────────────────────────────────────────

class IpcRegistry {
  private readonly entries = new Map<string, ChannelEntry>()
  private readonly duplicates: string[] = []
  private installed = false

  /**
   * Patches ipcMain.handle so every subsequent call is tracked.
   * Must be called once before any IPC handler is registered.
   * Safe to call multiple times (idempotent).
   */
  install(): void {
    if (this.installed) return
    this.installed = true

    const registry = this
    const originalHandle = ipcMain.handle.bind(ipcMain)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ipcMain as any).handle = function (channel: string, handler: unknown) {
      if (registry.entries.has(channel)) {
        registry.duplicates.push(channel)
        console.error(
          `\n╔══════════════════════════════════════════════════════════════╗\n` +
          `║  [IPC Registry] ⛔  DUPLICATE CHANNEL BLOCKED                ║\n` +
          `╠══════════════════════════════════════════════════════════════╣\n` +
          `║  Channel : "${channel}"\n` +
          `║  Action  : Duplicate registration skipped (crash prevented)  ║\n` +
          `║  Fix     : Search all *.ipc.ts files for this channel name   ║\n` +
          `╚══════════════════════════════════════════════════════════════╝\n`,
        )
        return
      }
      registry.entries.set(channel, { channel, registeredAt: Date.now() })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return originalHandle(channel, handler as any)
    }
  }

  /**
   * Prints a full manifest of registered IPC channels to the console.
   * Call this after registerIpcHandlers() to confirm all channels loaded.
   */
  report(): StartupReport {
    const channels = Array.from(this.entries.keys()).sort()
    const hasDuplicates = this.duplicates.length > 0

    const status = hasDuplicates ? '⚠️  WARN' : '✓  OK  '
    console.log(
      `\n┌─────────────────────────────────────────────────────────────┐\n` +
      `│  [IPC Registry] ${status} — ${channels.length} channels registered         │\n` +
      (hasDuplicates
        ? `│  ⛔ ${this.duplicates.length} DUPLICATE(S) BLOCKED: ${this.duplicates.join(', ')}\n`
        : '') +
      `└─────────────────────────────────────────────────────────────┘\n` +
      channels.map(c => `   • ${c}`).join('\n') + '\n',
    )

    return {
      channelCount: channels.length,
      channels,
      duplicates: [...this.duplicates],
      healthy: !hasDuplicates,
    }
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────────

export const ipcRegistry = new IpcRegistry()

// ── Startup report type ────────────────────────────────────────────────────────

export interface StartupReport {
  channelCount: number
  channels: string[]
  duplicates: string[]
  healthy: boolean
}
