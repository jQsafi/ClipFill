// Content Script for ClipFill Extension

(function () {
  if (window.__clipFillInjected) return;
  window.__clipFillInjected = true;

  let targetPickerActive = false;
  let currentTargetText = '';
  let hoveredElement = null;
  let bannerElement = null;

  // 1. Monitor Copy and Cut Events on Web Pages
  function captureCopiedText(e) {
    // Attempt 1: Get data directly from clipboard event if available
    let text = e.clipboardData?.getData('text/plain')?.trim();

    // Attempt 2: Check window selection
    if (!text) {
      text = window.getSelection()?.toString()?.trim();
    }

    // Attempt 3: Check selection inside active input or textarea
    if (!text) {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        const start = active.selectionStart;
        const end = active.selectionEnd;
        if (start !== undefined && end !== undefined && start !== end) {
          text = active.value.substring(start, end).trim();
        }
      }
    }

    if (text && text.length > 0 && text.length < 10000) {
      chrome.runtime.sendMessage({
        type: 'SAVE_CLIPBOARD_TEXT',
        text: text
      }).catch(() => {
        // Extension context may be invalidated or reloaded
      });
    }
  }

  document.addEventListener('copy', (e) => setTimeout(() => captureCopiedText(e), 20));
  document.addEventListener('cut', (e) => setTimeout(() => captureCopiedText(e), 20));

  let lastFocusedElement = null;
  let lastSelectionStart = null;
  let lastSelectionEnd = null;

  // Track focused field & cursor location
  function recordFieldFocus(target) {
    if (isFillableField(target)) {
      lastFocusedElement = target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        try {
          if (typeof target.selectionStart === 'number') {
            lastSelectionStart = target.selectionStart;
            lastSelectionEnd = target.selectionEnd;
          }
        } catch (e) {}
      }
    }
  }

  document.addEventListener('focusin', (e) => recordFieldFocus(e.target), true);
  document.addEventListener('click', (e) => recordFieldFocus(e.target), true);
  document.addEventListener('keyup', (e) => recordFieldFocus(e.target), true);
  document.addEventListener('mouseup', (e) => recordFieldFocus(e.target), true);
  document.addEventListener('selectionchange', () => {
    if (document.activeElement && isFillableField(document.activeElement)) {
      recordFieldFocus(document.activeElement);
    }
  });

  // 2. Helper to insert text into element at cursor position and dispatch synthetic events
  function insertTextAtCursor(element, valueToInsert) {
    if (!element) return false;

    element.focus();

    // 1. ContentEditable Elements
    if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
      document.execCommand('insertText', false, valueToInsert);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // 2. Standard HTML Input / Textarea
    const currentValue = element.value || '';
    let startPos = (typeof lastSelectionStart === 'number' && lastFocusedElement === element)
      ? lastSelectionStart
      : (typeof element.selectionStart === 'number' ? element.selectionStart : currentValue.length);

    let endPos = (typeof lastSelectionEnd === 'number' && lastFocusedElement === element)
      ? lastSelectionEnd
      : (typeof element.selectionEnd === 'number' ? element.selectionEnd : currentValue.length);

    // Construct new value inserting at cursor position / replacing selected text
    const newValue = currentValue.substring(0, startPos) + valueToInsert + currentValue.substring(endPos);

    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, newValue);
    } else if (valueSetter) {
      valueSetter.call(element, newValue);
    } else {
      element.value = newValue;
    }

    // Move cursor right after the inserted text snippet
    const newCaretPos = startPos + valueToInsert.length;
    try {
      if (typeof element.setSelectionRange === 'function') {
        element.setSelectionRange(newCaretPos, newCaretPos);
      }
    } catch (e) {}

    // Update tracked selection
    lastSelectionStart = newCaretPos;
    lastSelectionEnd = newCaretPos;

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    return true;
  }

  // 4. Target Field Selection Overlay Mode
  function startTargetPicker(textToFill) {
    if (targetPickerActive) stopTargetPicker();

    targetPickerActive = true;
    currentTargetText = textToFill;

    // Create sticky top banner
    bannerElement = document.createElement('div');
    bannerElement.className = 'clipfill-banner';
    bannerElement.innerHTML = `
      <div class="clipfill-banner-content">
        <span class="clipfill-banner-icon">🎯</span>
        <span>Click any form field to insert snippet. Press <strong>Esc</strong> to cancel.</span>
      </div>
      <button class="clipfill-banner-close" id="clipfill-cancel-btn">&times;</button>
    `;
    document.body.appendChild(bannerElement);

    document.getElementById('clipfill-cancel-btn')?.addEventListener('click', stopTargetPicker);
    document.addEventListener('mousemove', handlePickerMouseMove, true);
    document.addEventListener('click', handlePickerClick, true);
    document.addEventListener('keydown', handlePickerKeyDown, true);
  }

  function stopTargetPicker() {
    targetPickerActive = false;
    currentTargetText = '';

    if (hoveredElement) {
      hoveredElement.classList.remove('clipfill-target-hover');
      hoveredElement = null;
    }

    if (bannerElement) {
      bannerElement.remove();
      bannerElement = null;
    }

    document.removeEventListener('mousemove', handlePickerMouseMove, true);
    document.removeEventListener('click', handlePickerClick, true);
    document.removeEventListener('keydown', handlePickerKeyDown, true);
  }

  function handlePickerMouseMove(e) {
    if (!targetPickerActive) return;
    const target = e.target;

    const isFillable = isFillableField(target);

    if (hoveredElement && hoveredElement !== target) {
      hoveredElement.classList.remove('clipfill-target-hover');
      hoveredElement = null;
    }

    if (isFillable && target !== bannerElement && !bannerElement?.contains(target)) {
      hoveredElement = target;
      hoveredElement.classList.add('clipfill-target-hover');
    }
  }

  function handlePickerClick(e) {
    if (!targetPickerActive) return;

    if (bannerElement?.contains(e.target)) return;

    const target = e.target;
    if (isFillableField(target)) {
      e.preventDefault();
      e.stopPropagation();

      insertTextAtCursor(target, currentTargetText);
      stopTargetPicker();
    }
  }

  function handlePickerKeyDown(e) {
    if (e.key === 'Escape') {
      stopTargetPicker();
    }
  }

  function isFillableField(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      const nonInputTypes = ['hidden', 'submit', 'button', 'image', 'reset', 'file'];
      return !nonInputTypes.includes(type) && !el.disabled && !el.readOnly;
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      return true;
    }
    return false;
  }

  // 5. Inspect Form Fields on Page
  function inspectFormFields() {
    const elements = Array.from(document.querySelectorAll('input, textarea, select, [contenteditable="true"]'));
    const fields = [];

    elements.forEach((el, index) => {
      if (!isFillableField(el)) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') return;

      let labelText = '';
      if (el.id) {
        const labelEl = document.querySelector(`label[for="${el.id}"]`);
        if (labelEl) labelText = labelEl.innerText.trim();
      }

      if (!labelText && el.closest('label')) {
        labelText = el.closest('label').innerText.trim();
      }

      if (!labelText) {
        labelText = el.getAttribute('aria-label') || el.placeholder || el.name || el.id || `Field #${index + 1}`;
      }

      const selectorId = `clipfill-field-${index}`;
      el.setAttribute('data-clipfill-id', selectorId);

      fields.push({
        id: selectorId,
        type: el.getAttribute('type') || el.tagName.toLowerCase(),
        name: el.name || '',
        placeholder: el.placeholder || '',
        label: labelText,
        currentValue: el.value || el.innerText || ''
      });
    });

    return fields;
  }

  // 6. Handle Runtime Messages from Extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.type === 'FILL_ACTIVE_ELEMENT') {
        let target = document.activeElement;
        if (!isFillableField(target)) {
          target = lastFocusedElement;
        }

        if (target && isFillableField(target) && document.body.contains(target)) {
          const filled = insertTextAtCursor(target, message.text);
          sendResponse({ success: filled });
        } else {
          // If no active input field is present, signal failure so sidepanel can copy to clipboard
          sendResponse({ success: false, reason: 'NO_ACTIVE_INPUT' });
        }
      } else if (message.type === 'START_TARGET_PICKER') {
        startTargetPicker(message.text);
        sendResponse({ success: true });
      } else if (message.type === 'INSPECT_FORM_FIELDS') {
        const fields = inspectFormFields();
        sendResponse({ success: true, fields });
      } else if (message.type === 'FILL_SPECIFIC_FIELD') {
        const el = document.querySelector(`[data-clipfill-id="${message.fieldId}"]`);
        if (el) {
          const filled = insertTextAtCursor(el, message.text);
          sendResponse({ success: filled });
        } else {
          sendResponse({ success: false, reason: 'Field not found' });
        }
      }
    } catch (err) {
      console.error('Error in content script:', err);
      sendResponse({ success: false, error: err.message });
    }
    return true;
  });
})();
