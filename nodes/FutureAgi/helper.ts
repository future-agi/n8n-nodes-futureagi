export function safeWarn(...args: any[]): void {
	try { (globalThis as any)?.console?.warn?.(...args); } catch { /* noop */ }
}
export function safeError(...args: any[]): void {
	try { (globalThis as any)?.console?.error?.(...args); } catch { /* noop */ }
}
export function safeLog(...args: any[]): void {
	try { (globalThis as any)?.console?.log?.(...args); } catch { /* noop */ }
}