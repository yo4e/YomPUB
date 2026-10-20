export type Direction = 'ltr' | 'rtl' | 'auto';
export type WritingMode = 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
export type Inline =
  | { type: 'text' | 'code'; value: string }
  | { type: 'softBreak' | 'hardBreak' }
  | { type: 'emphasis' | 'strong'; children: Inline[] }
  | { type: 'link'; href: string; title: string; children: Inline[] }
  | { type: 'image'; src: string; alt: string; title: string }
  | { type: 'ruby'; base: string; annotation: string }
  | { type: 'span'; lang: string; direction: Direction; value: string };
export type Block =
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'heading'; level: number; id: string; children: Inline[] }
  | { type: 'blockquote' | 'item'; children: Block[] }
  | { type: 'list'; ordered: boolean; start: number; tight: boolean; children: Block[] }
  | { type: 'codeBlock'; value: string; info: string }
  | { type: 'thematicBreak' };
export interface Metadata {
  title: string;
  author: string | null;
  lang: string;
  direction: Direction;
  writingMode: WritingMode;
  cover: { src: string; alt: string } | null;
}
export interface Book {
  format: '0.1-draft.1';
  metadata: Metadata;
  blocks: Block[];
  toc: { id: string; level: number; label: string }[];
  assets: string[];
}
export interface Diagnostic { code: string; message: string; line?: number }
export interface ParseResult { book: Book; warnings: Diagnostic[] }
