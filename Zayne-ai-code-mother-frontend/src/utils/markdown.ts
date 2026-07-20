import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight(str: string, lang: string): string {
    const language = lang && hljs.getLanguage(lang) ? lang : ''
    try {
      const highlighted = language
        ? hljs.highlight(str, { language, ignoreIllegals: true }).value
        : hljs.highlightAuto(str).value
      const langClass = language ? ` language-${language}` : ''
      return `<pre class="hljs-code-block"><code class="hljs${langClass}">${highlighted}</code></pre>`
    } catch {
      return `<pre class="hljs-code-block"><code class="hljs">${escapeHtml(str)}</code></pre>`
    }
  },
})

/** 将 AI 回复渲染为带代码高亮的 HTML */
export function renderAiMarkdown(content: string): string {
  if (!content) return ''
  return md.render(content)
}
