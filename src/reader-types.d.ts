import type { Book, Diagnostic } from './model.js';
export interface InputFile { path: string; file: Blob }
export type Publication = InputFile[] | ((signal: AbortSignal) => Promise<InputFile[]>);
export interface ReaderOptions { fontSize?: number; lineHeight?: number; fontFamily?: 'mincho' | 'gothic'; theme?: 'paper' | 'night'; chrome?: 'full' | 'none' }
export type OpenResult = { status: 'opened' | 'cancelled' | 'destroyed' } | { status: 'error'; code: string; message: string };
export type WorkerResult = { stage: 'parse' | 'assets' } | { ok: false; code: string; message: string; line?: number } | { ok: true; source: string; book: Book; warnings: Diagnostic[]; assets: {path: string; mime: string; bytes: ArrayBuffer}[] };
export interface Snapshot { source: string; book: Book; warnings: Diagnostic[] }
export interface Job { controller: AbortController; worker: Worker | null; urls: string[]; resolve: (result: OpenResult) => void }
