/** Preserve Hexo anchors with Markdown headings such as `## TLS {#TLS}`. */
export default function explicitHeadingIds() {
  return function transform(tree) {
    function walk(node) {
      if (node.type === 'heading') {
        const last = node.children.at(-1);
        if (last?.type === 'text') {
          const match = last.value.match(/\s+\{#([^\s{}]+)\}$/u);
          if (match) {
            last.value = last.value.slice(0, match.index);
            node.data ??= {};
            node.data.hProperties ??= {};
            node.data.hProperties.id = match[1];
          }
        }
      }
      for (const child of node.children ?? []) walk(child);
    }
    walk(tree);
  };
}
