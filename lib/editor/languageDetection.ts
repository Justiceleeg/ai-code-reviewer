// Language detection utilities

// Map file extensions to Monaco language IDs
const extensionToLanguage: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  xml: 'xml',
  svg: 'xml',

  // Python
  py: 'python',
  pyw: 'python',
  pyi: 'python',

  // Ruby
  rb: 'ruby',
  rake: 'ruby',
  gemspec: 'ruby',

  // Go
  go: 'go',

  // Rust
  rs: 'rust',

  // Java/Kotlin
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',

  // C/C++
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',

  // C#
  cs: 'csharp',

  // PHP
  php: 'php',

  // Swift
  swift: 'swift',

  // Shell
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',

  // Data/Config
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'ini',
  ini: 'ini',
  env: 'ini',

  // Markdown
  md: 'markdown',
  mdx: 'markdown',

  // SQL
  sql: 'sql',

  // GraphQL
  graphql: 'graphql',
  gql: 'graphql',

  // Docker
  dockerfile: 'dockerfile',

  // Misc
  r: 'r',
  lua: 'lua',
  pl: 'perl',
  pm: 'perl',
  scala: 'scala',
  clj: 'clojure',
  ex: 'elixir',
  exs: 'elixir',
  erl: 'erlang',
  hrl: 'erlang',
  hs: 'haskell',
  dart: 'dart',
  vue: 'html',
  svelte: 'html',
};

// Shebang patterns for language detection
const shebangPatterns: [RegExp, string][] = [
  [/^#!.*\bpython[23]?\b/, 'python'],
  [/^#!.*\bnode\b/, 'javascript'],
  [/^#!.*\b(ba)?sh\b/, 'shell'],
  [/^#!.*\bzsh\b/, 'shell'],
  [/^#!.*\bruby\b/, 'ruby'],
  [/^#!.*\bperl\b/, 'perl'],
  [/^#!.*\bphp\b/, 'php'],
];

// Content patterns for language detection
const contentPatterns: [RegExp, string][] = [
  // TypeScript (must check before JavaScript)
  [/\b(interface|type|enum)\s+\w+\s*[{=<]/, 'typescript'],
  [/:\s*(string|number|boolean|void|any|never)\b/, 'typescript'],
  [/<\w+>/, 'typescript'], // Generic type hints

  // JavaScript/React
  [/\b(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/, 'javascript'],
  [/\bexport\s+(default\s+)?(function|class|const)\b/, 'javascript'],
  [/\bimport\s+.*\s+from\s+['"]/, 'javascript'],
  [/<\w+(\s+\w+=['"].*['"])*\s*\/?>/, 'html'], // JSX could also match

  // Python
  [/\bdef\s+\w+\s*\(.*\)\s*:/, 'python'],
  [/\bclass\s+\w+.*:/, 'python'],
  [/\bimport\s+\w+|from\s+\w+\s+import/, 'python'],
  [/^\s*@\w+(\.\w+)*\s*$/, 'python'], // Decorators

  // Ruby
  [/\bdef\s+\w+.*\bend\b/, 'ruby'],
  [/\bclass\s+\w+.*\bend\b/, 'ruby'],
  [/\bdo\s*\|.*\|\s*$/, 'ruby'],

  // Go
  [/\bfunc\s+(\w+\s*)?\(/, 'go'],
  [/\bpackage\s+\w+/, 'go'],
  [/\btype\s+\w+\s+struct\b/, 'go'],

  // Rust
  [/\bfn\s+\w+\s*(<.*>)?\s*\(/, 'rust'],
  [/\blet\s+mut\s+/, 'rust'],
  [/\bimpl\b.*\bfor\b/, 'rust'],

  // Java
  [/\bpublic\s+(static\s+)?(class|interface|enum)\b/, 'java'],
  [/\bprivate\s+(static\s+)?\w+\s+\w+\s*[;=]/, 'java'],

  // C/C++
  [/#include\s*[<"]/, 'cpp'],
  [/\bint\s+main\s*\(/, 'c'],
  [/\bstd::\w+/, 'cpp'],

  // PHP
  [/<\?php/, 'php'],

  // SQL
  [/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i, 'sql'],

  // YAML
  [/^\s*\w+:\s*\n/, 'yaml'],

  // JSON
  [/^\s*\{[\s\S]*"[^"]+"\s*:/, 'json'],

  // HTML
  [/<!DOCTYPE\s+html/i, 'html'],
  [/<html\b/i, 'html'],

  // CSS
  [/^\s*[.#]?\w+\s*\{[\s\S]*\}\s*$/, 'css'],
  [/@media\s*\(|@import\s+/, 'css'],

  // Shell
  [/^\s*(if|for|while|case)\s+.*;\s*then/, 'shell'],
  [/\$\(\w+\)|\$\{\w+\}/, 'shell'],
];

/**
 * Detect language from file extension
 */
export function detectLanguageFromExtension(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return null;

  // Special case for Dockerfile
  if (fileName.toLowerCase() === 'dockerfile') {
    return 'dockerfile';
  }

  return extensionToLanguage[extension] || null;
}

/**
 * Detect language from code content
 */
export function detectLanguageFromContent(code: string): string | null {
  if (!code.trim()) return null;

  const lines = code.split('\n');
  const firstLine = lines[0].trim();

  // Check shebang first
  for (const [pattern, language] of shebangPatterns) {
    if (pattern.test(firstLine)) {
      return language;
    }
  }

  // Check content patterns
  for (const [pattern, language] of contentPatterns) {
    if (pattern.test(code)) {
      return language;
    }
  }

  return null;
}

/**
 * Detect language from file name and/or content
 */
export function detectLanguage(fileName: string, code: string): string {
  // Try extension first
  const fromExtension = detectLanguageFromExtension(fileName);
  if (fromExtension) {
    return fromExtension;
  }

  // Fall back to content detection
  const fromContent = detectLanguageFromContent(code);
  if (fromContent) {
    return fromContent;
  }

  // Default to plaintext
  return 'plaintext';
}

/**
 * Get display name for a Monaco language ID
 */
export function getLanguageDisplayName(languageId: string): string {
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    go: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kotlin: 'Kotlin',
    scala: 'Scala',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    less: 'Less',
    json: 'JSON',
    yaml: 'YAML',
    xml: 'XML',
    markdown: 'Markdown',
    sql: 'SQL',
    shell: 'Shell',
    dockerfile: 'Dockerfile',
    graphql: 'GraphQL',
    plaintext: 'Plain Text',
  };

  return displayNames[languageId] || languageId.charAt(0).toUpperCase() + languageId.slice(1);
}
