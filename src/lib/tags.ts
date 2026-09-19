// Keep old tag names as aliases so existing links can still resolve.
export const TAG_ALIASES: Readonly<Record<string, string>> = {
  'cloud native': 'cloud-native',
  'best-practive': 'best-practice',
};

const TAG_LABELS: Readonly<Record<string, string>> = {
  sre: 'SRE',
  tcp: 'TCP',
  https: 'HTTPS',
  'cloud-native': 'Cloud Native',
  dns: 'DNS',
  'distributed-system': 'Distributed Systems',
  golang: 'Go',
  linux: 'Linux',
  network: 'Network',
  python: 'Python',
  aiops: 'AIOps',
  'best-practice': 'Best Practices',
  design: 'Design',
  docker: 'Docker',
  frontend: 'Frontend',
  http2: 'HTTP/2',
  kernel: 'Kernel',
  nginx: 'Nginx',
  stability: 'Stability',
};

export function normalizeTag(tag: string): string {
  return TAG_ALIASES[tag] ?? tag;
}

export function tagLabel(tag: string): string {
  const normalized = normalizeTag(tag);
  return TAG_LABELS[normalized] ?? normalized;
}
