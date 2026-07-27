/**
 * 可视化编辑 composable。
 *
 * 职责：
 *  - 管理编辑模式开关、选中元素（单选）
 *  - 向 iframe 注入/移除悬浮脚本
 *  - 处理 iframe 传来的选中元素消息
 *  - 提供注入脚本内容（getVisualEditScript）
 */

export interface SelectedElement {
  /** CSS 选择器 */
  selector: string
  /** 元素标签名（小写） */
  tagName: string
  /** 元素内文本（截断至 80 字符） */
  text: string
  /** HTML 片段（截断至 300 字符） */
  html: string
}

/** iframe → 主窗口的消息类型 */
export interface PreviewMessage {
  source: 'visual-edit-frame'
  action: 'element-selected' | 'exit-edit-mode'
  element?: SelectedElement
}

// ---------- script content ----------

/**
 * 注入到预览 iframe 的 JavaScript。
 *
 * 行为（F12 开发者工具风格）：
 *  1. mousemove 时给鼠标下的可交互元素加淡蓝色虚线边框（hover）
 *  2. click 时选中元素，显示绿色描边 + 绿色半透明填充 + 右上角标签徽章
 *  3. ESC 退出编辑模式，向父窗口发送 'exit-edit-mode'
 */
export function getVisualEditScript(): string {
  return `
(function () {
  var HOVER_COLOR = 'rgba(64, 158, 255, 0.7)';
  var HOVER_STYLE = 'outline: 2px dashed ' + HOVER_COLOR + ' !important';
  // box-shadow 不受 overflow:hidden 裁剪，能在元素外围渲染绿色描边
  var SELECTED_STYLE = 'outline: 3px solid rgba(34,197,94,0.85) !important; box-shadow: 0 0 0 1000px rgba(34,197,94,0.07) !important';
  var dataSel = 'data-ve-selected';

  var current = null;
  var lastHoverEl = null;
  var overlayContainer = null;
  var badge = null;

  function getOrCreateOverlayContainer() {
    if (!overlayContainer) {
      overlayContainer = document.createElement('div');
      overlayContainer.id = 've-overlay-root';
      overlayContainer.style.cssText = [
        'position:absolute',
        'pointer-events:none',
        'z-index:2147483646',
        'top:0', 'left:0',
        'width:100%', 'height:100%'
      ].join(';');
      (document.fullscreenElement || document.body).appendChild(overlayContainer);
    }
    return overlayContainer;
  }

  function removeOverlay() {
    if (overlayContainer) {
      overlayContainer.remove();
      overlayContainer = null;
    }
    badge = null;
  }

  function removeAllBorders() {
    var prev = document.querySelectorAll('[' + dataSel + ']');
    for (var i = 0; i < prev.length; i++) {
      prev[i].style.outline = prev[i].getAttribute(dataSel) || '';
      prev[i].removeAttribute(dataSel);
    }
    removeOverlay();
  }

  function showBadge(el) {
    removeOverlay();
    var container = getOrCreateOverlayContainer();
    var rect = el.getBoundingClientRect();
    var scrollX = window.scrollX;
    var scrollY = window.scrollY;

    // 绿色外框（用 SVG rect 画在 overlay 层）
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', rect.width + 6);
    svg.setAttribute('height', rect.height + 6);
    svg.style.cssText = [
      'position:absolute',
      'overflow:visible',
      'pointer-events:none',
      'left:' + (rect.left + scrollX - 3) + 'px',
      'top:' + (rect.top + scrollY - 3) + 'px',
      'width:' + (rect.width + 6) + 'px',
      'height:' + (rect.height + 6) + 'px',
      'z-index:2147483647'
    ].join(';');
    var rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectEl.setAttribute('x', '0');
    rectEl.setAttribute('y', '0');
    rectEl.setAttribute('width', '100%');
    rectEl.setAttribute('height', '100%');
    rectEl.setAttribute('fill', 'none');
    rectEl.setAttribute('stroke', '#22c55e');
    rectEl.setAttribute('stroke-width', '3');
    rectEl.setAttribute('rx', '6');
    svg.appendChild(rectEl);
    container.appendChild(svg);

    // 标签徽章
    badge = document.createElement('div');
    badge.setAttribute('data-ve-badge', '1');
    badge.style.cssText = [
      'position:absolute',
      'z-index:2147483647',
      'left:' + (rect.right + scrollX + 4) + 'px',
      'top:' + (rect.top + scrollY - 1) + 'px',
      'background:#22c55e',
      'color:#fff',
      'font-size:11px',
      'font-family:monospace',
      'font-weight:600',
      'padding:1px 6px',
      'border-radius:3px',
      'white-space:nowrap',
      'box-shadow:0 1px 4px rgba(0,0,0,0.25)',
      'line-height:1.7',
      'max-width:200px',
      'overflow:hidden',
      'text-overflow:ellipsis'
    ].join(';');
    badge.textContent = el.tagName.toLowerCase();
    container.appendChild(badge);
  }

  function setBorder(el, style) {
    if (!el.getAttribute(dataSel)) {
      el.setAttribute(dataSel, el.style.outline || '');
    }
    el.style.outline = style;
  }

  document.addEventListener('mousemove', function (e) {
    var el = e.target;
    if (el === document.documentElement || el === document.body) return;
    if (el !== lastHoverEl) {
      if (lastHoverEl && lastHoverEl !== current) {
        lastHoverEl.style.outline = lastHoverEl.getAttribute(dataSel) || '';
      }
      lastHoverEl = el;
    }
    if (el !== current) {
      el.style.outline = HOVER_STYLE;
    }
  }, true);

  document.addEventListener('click', function (e) {
    var el = e.target;
    e.preventDefault();
    e.stopPropagation();

    // 清除上一个选中
    if (current && current !== el) {
      current.style.outline = current.getAttribute(dataSel) || '';
      current.removeAttribute(dataSel);
    }
    removeOverlay();

    // 始终选中当前元素（替换旧选中，不支持取消）
    setBorder(el, SELECTED_STYLE);
    showBadge(el);
    current = el;

    var text = el.innerText || '';
    if (text.length > 80) text = text.substring(0, 80) + '…';
    var html = el.outerHTML || '';
    if (html.length > 300) html = html.substring(0, 300) + '…';

    window.parent.postMessage({
      source: 'visual-edit-frame',
      action: 'element-selected',
      element: {
        selector: getSelector(el),
        tagName: el.tagName.toLowerCase(),
        text: text,
        html: html,
      }
    }, '*');
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      removeAllBorders();
      current = null;
      window.parent.postMessage({ source: 'visual-edit-frame', action: 'exit-edit-mode' }, '*');
    }
  });

  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) {
      removeAllBorders();
      lastHoverEl = null;
    }
  });

  /** 生成元素的选择器路径 */
  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.className && typeof el.className === 'string' && el.className.trim()) {
      var cls = el.className.trim().split(/\\s+/)[0];
      if (cls) return el.tagName.toLowerCase() + '.' + cls.split(' ')[0];
    }
    var parent = el.parentElement;
    if (parent && parent !== document.body && parent !== document.documentElement) {
      var siblings = Array.from(parent.children).filter(function (c) { return c.tagName === el.tagName; });
      var idx = siblings.indexOf(el);
      return getSelector(parent) + ' > ' + el.tagName.toLowerCase() + ':nth-child(' + (idx + 1) + ')';
    }
    return el.tagName.toLowerCase();
  }
})();
`
}

// ---------- composable ----------

import { ref, onUnmounted } from 'vue'

export function useVisualEdit() {
  /** 是否处于可视化编辑模式 */
  const isEditing = ref(false)

  /** 当前已选中的单个元素（单选模式） */
  const selectedElement = ref<SelectedElement | null>(null)

  // ---------- 生命周期 ----------

  function onPreviewMessage(event: MessageEvent) {
    if (isEditing.value !== true) return
    const msg = event.data as PreviewMessage
    if (!msg || msg.source !== 'visual-edit-frame') return

    if (msg.action === 'element-selected') {
      // 单选：直接替换
      selectedElement.value = msg.element ?? null
    } else if (msg.action === 'exit-edit-mode') {
      isEditing.value = false
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('message', onPreviewMessage)
  }

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', onPreviewMessage)
    }
  })

  // ---------- 编辑模式切换 ----------

  function enterEditMode() {
    isEditing.value = true
    selectedElement.value = null
  }

  function exitEditMode() {
    isEditing.value = false
    selectedElement.value = null
  }

  // ---------- iframe 脚本注入 / 移除 ----------

  const SCRIPT_ID = 'visual-edit-script-v2'

  function injectScript(iframe: HTMLIFrameElement) {
    if (!iframe?.contentWindow) return
    const doc = iframe.contentDocument ?? iframe.contentWindow.document
    if (!doc?.body) return
    if (doc.getElementById(SCRIPT_ID)) return

    const script = doc.createElement('script')
    script.id = SCRIPT_ID
    script.textContent = getVisualEditScript()
    doc.head?.appendChild(script) ?? doc.documentElement.appendChild(script)
  }

  function removeScript(iframe: HTMLIFrameElement) {
    if (!iframe?.contentWindow) return
    const doc = iframe.contentDocument ?? iframe.contentWindow.document
    const old = doc.getElementById(SCRIPT_ID)
    if (old) old.remove()
  }

  // ---------- 提示词拼接 ----------

  /**
   * 将已选中的元素信息追加到提示词开头。
   */
  function buildPromptWithElements(basePrompt: string): string {
    const el = selectedElement.value
    if (!el) return basePrompt

    const text = el.text.length > 80 ? el.text.substring(0, 80) + '…' : el.text
    return (
      `**🎯 已选中页面元素（可视化编辑）**\n` +
      `- **[\`${el.tagName}\`]** \`${el.selector}\`\n` +
      `  &nbsp;&nbsp;文本：\`${text}\`\n\n` +
      `> **💬 用户需求：**\n${basePrompt}`
    )
  }

  return {
    isEditing,
    selectedElement,
    enterEditMode,
    exitEditMode,
    injectScript,
    removeScript,
    buildPromptWithElements,
  }
}
