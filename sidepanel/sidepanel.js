// Sidepanel JavaScript - ClipFill Extension

document.addEventListener('DOMContentLoaded', async () => {
  let snippets = [];
  let currentCategory = 'ALL';
  let searchQuery = '';
  let autoCaptureEnabled = true;

  // DOM Elements
  const autoCaptureToggle = document.getElementById('auto-capture-toggle');
  const btnOpenAdd = document.getElementById('btn-open-add');
  const btnReadClipboard = document.getElementById('btn-read-clipboard');
  const btnSmartFill = document.getElementById('btn-smart-fill');
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const categoryTabs = document.getElementById('category-tabs');
  const snippetsList = document.getElementById('snippets-list');
  const snippetCount = document.getElementById('snippet-count');
  const emptyState = document.getElementById('empty-state');

  // Modal Elements
  const modalEdit = document.getElementById('modal-edit');
  const modalTitle = document.getElementById('modal-title');
  const modalClose = document.getElementById('modal-close');
  const formSnippet = document.getElementById('form-snippet');
  const editId = document.getElementById('edit-id');
  const inputLabel = document.getElementById('input-label');
  const inputCategory = document.getElementById('input-category');
  const inputText = document.getElementById('input-text');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');

  // Drawer Elements
  const drawerSmartFill = document.getElementById('drawer-smartfill');
  const drawerClose = document.getElementById('drawer-close');
  const detectedFieldsList = document.getElementById('detected-fields-list');

  // Toast Element
  const appToast = document.getElementById('app-toast');
  const toastMessage = document.getElementById('toast-message');

  // 1. Initial Load & Listeners
  async function loadInitialData() {
    const data = await chrome.storage.local.get(['snippets', 'autoCapture']);
    snippets = data.snippets || [];
    autoCaptureEnabled = data.autoCapture !== false;
    autoCaptureToggle.checked = autoCaptureEnabled;

    // Reset storage if previous personal info preset snippets exist
    if (snippets.some(s => s.id && s.id.startsWith('info-'))) {
      snippets = [
        {
          id: 'default-1',
          text: 'john.doe@example.com',
          label: 'Sample Email',
          category: 'Personal',
          pinned: true,
          timestamp: Date.now() - 3600000
        },
        {
          id: 'default-2',
          text: 'John Doe',
          label: 'Full Name',
          category: 'Personal',
          pinned: true,
          timestamp: Date.now() - 7200000
        },
        {
          id: 'default-3',
          text: '+1 (555) 019-2834',
          label: 'Phone Number',
          category: 'Form Data',
          pinned: false,
          timestamp: Date.now() - 10800000
        }
      ];
      await chrome.storage.local.set({ snippets });
    }

    renderSnippets();
  }

  // Listen for storage changes in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.snippets) {
        snippets = changes.snippets.newValue || [];
        renderSnippets();
      }
      if (changes.autoCapture) {
        autoCaptureEnabled = changes.autoCapture.newValue;
        autoCaptureToggle.checked = autoCaptureEnabled;
      }
    }
  });

  // 2. Render Snippets Feed
  function renderSnippets() {
    let filtered = snippets;

    // Filter by Category
    if (currentCategory === 'PINNED') {
      filtered = filtered.filter(s => s.pinned);
    } else if (currentCategory !== 'ALL') {
      filtered = filtered.filter(s => s.category === currentCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.text.toLowerCase().includes(q) ||
        (s.label && s.label.toLowerCase().includes(q))
      );
    }

    // Sort: Pinned items first, then by timestamp descending
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    snippetCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
    snippetsList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    filtered.forEach(snippet => {
      const card = createSnippetCard(snippet);
      snippetsList.appendChild(card);
    });
  }

  // 3. Create Snippet Card Element
  function createSnippetCard(snippet) {
    const card = document.createElement('div');
    card.className = `snippet-card ${snippet.pinned ? 'pinned' : ''}`;
    card.dataset.id = snippet.id;

    const labelText = escapeHtml(snippet.label || snippet.text.substring(0, 25));
    const contentText = escapeHtml(snippet.text);
    const categoryClass = (snippet.category || 'General').replace(/\s+/g, '-');

    card.innerHTML = `
      <div class="card-top">
        <div class="card-tags">
          <span class="tag ${categoryClass}">${escapeHtml(snippet.category || 'General')}</span>
          <span class="card-label" title="${labelText}">${labelText}</span>
        </div>
        <button class="pin-btn ${snippet.pinned ? 'active' : ''}" title="${snippet.pinned ? 'Unpin' : 'Pin to top'}">
          ${snippet.pinned ? '★' : '☆'}
        </button>
      </div>

      <div class="card-body" title="Click to copy text">${contentText}</div>

      <div class="card-actions">
        <div class="action-icon-group">
          <button class="sub-icon-btn btn-copy" title="Copy to clipboard">📋</button>
          <button class="sub-icon-btn btn-edit" title="Edit snippet">✏️</button>
          <button class="sub-icon-btn delete btn-delete" title="Delete snippet">🗑️</button>
        </div>
      </div>
    `;

    // Card-wide click listener (fill active input or copy to clipboard)
    card.addEventListener('click', (e) => {
      // Don't trigger click action if user clicked explicit action sub-buttons
      if (
        e.target.closest('.sub-icon-btn') ||
        e.target.closest('.pin-btn')
      ) {
        return;
      }
      fillActiveElementOnTab(snippet.text);
    });

    // Event Handlers for Buttons
    card.querySelector('.pin-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePin(snippet.id);
    });

    card.querySelector('.btn-copy').addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(snippet.text);
    });

    card.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(snippet);
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSnippet(snippet.id);
    });

    return card;
  }

  // 4. Fill Active Element on Current Web Page (fallback to clipboard if not possible)
  async function fillActiveElementOnTab(text) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      await copyToClipboard(text, 'Copied to clipboard!');
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_ACTIVE_ELEMENT',
        text
      });

      if (response?.success) {
        showToast('Form field populated!');
      } else {
        // Active input box not available on page -> fallback to copying to clipboard
        await copyToClipboard(text, 'Copied to clipboard!');
      }
    } catch (err) {
      // Content script not loaded or page restricted (e.g. chrome:// pages) -> fallback to copying to clipboard
      await copyToClipboard(text, 'Copied to clipboard!');
    }
  }

  function openDrawer() {
    drawerSmartFill.hidden = false;
    drawerSmartFill.style.display = 'flex';
  }

  function closeDrawer() {
    drawerSmartFill.hidden = true;
    drawerSmartFill.style.display = 'none';
  }

  // 6. Smart Form Inspector & Autofill Drawer
  async function inspectAndOpenFormDrawer() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'INSPECT_FORM_FIELDS' });
      if (response?.success && response.fields && response.fields.length > 0) {
        renderDetectedFields(tab.id, response.fields);
        openDrawer();
      } else {
        showToast('No fillable form fields found on page');
      }
    } catch (err) {
      showToast('Cannot inspect page forms');
    }
  }

  function renderDetectedFields(tabId, fields) {
    detectedFieldsList.innerHTML = '';
    fields.forEach(field => {
      const item = document.createElement('div');
      item.className = 'field-item';
      item.innerHTML = `
        <div class="field-info">
          <span class="field-name">${escapeHtml(field.label)}</span>
          <span class="field-type">Type: ${field.type} ${field.name ? '| Name: ' + field.name : ''}</span>
        </div>
        <button class="btn primary btn-fill-this" style="font-size: 11px; padding: 4px 8px;">Fill</button>
      `;

      item.querySelector('.btn-fill-this').addEventListener('click', async () => {
        if (snippets.length === 0) {
          showToast('No saved snippets available');
          return;
        }

        let chosen = snippets[0];
        const fieldNameLower = field.label.toLowerCase();
        if (fieldNameLower.includes('email')) {
          chosen = snippets.find(s => s.text.includes('@') || s.label.toLowerCase().includes('email')) || chosen;
        } else if (fieldNameLower.includes('phone') || fieldNameLower.includes('tel')) {
          chosen = snippets.find(s => s.category === 'Form Data' || s.label.toLowerCase().includes('phone')) || chosen;
        } else if (fieldNameLower.includes('name')) {
          chosen = snippets.find(s => s.label.toLowerCase().includes('name')) || chosen;
        }

        await chrome.tabs.sendMessage(tabId, {
          type: 'FILL_SPECIFIC_FIELD',
          fieldId: field.id,
          text: chosen.text
        });
        showToast(`Filled ${field.label}!`);
      });

      detectedFieldsList.appendChild(item);
    });
  }

  // 7. Clipboard CRUD Operations
  async function togglePin(id) {
    const idx = snippets.findIndex(s => s.id === id);
    if (idx !== -1) {
      snippets[idx].pinned = !snippets[idx].pinned;
      await chrome.storage.local.set({ snippets });
    }
  }

  async function deleteSnippet(id) {
    snippets = snippets.filter(s => s.id !== id);
    await chrome.storage.local.set({ snippets });
    showToast('Snippet deleted');
  }

  async function copyToClipboard(text, customMsg = null) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(customMsg || 'Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy');
    }
  }

  // 8. Add / Edit Modal Logic
  function openEditModal(snippet = null) {
    if (snippet) {
      modalTitle.textContent = 'Edit Snippet';
      editId.value = snippet.id;
      inputLabel.value = snippet.label || '';
      inputCategory.value = snippet.category || 'General';
      inputText.value = snippet.text || '';
    } else {
      modalTitle.textContent = 'Add New Snippet';
      editId.value = '';
      inputLabel.value = '';
      inputCategory.value = 'Personal';
      inputText.value = '';
    }
    modalEdit.hidden = false;
    modalEdit.style.display = 'flex';
  }

  function closeModal() {
    modalEdit.hidden = true;
    modalEdit.style.display = 'none';
  }

  formSnippet.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editId.value;
    const label = inputLabel.value.trim();
    const category = inputCategory.value;
    const text = inputText.value.trim();

    if (!text) return;

    if (id) {
      const idx = snippets.findIndex(s => s.id === id);
      if (idx !== -1) {
        snippets[idx].label = label || text.substring(0, 25);
        snippets[idx].category = category;
        snippets[idx].text = text;
      }
    } else {
      const newSnippet = {
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text,
        label: label || (text.length > 25 ? text.substring(0, 25) + '...' : text),
        category,
        pinned: false,
        timestamp: Date.now()
      };
      snippets.unshift(newSnippet);
    }

    await chrome.storage.local.set({ snippets });
    closeModal();
    showToast(id ? 'Snippet updated' : 'Snippet added');
  });

  // 9. Event Listeners for Header & Toolbar
  autoCaptureToggle.addEventListener('change', async (e) => {
    autoCaptureEnabled = e.target.checked;
    await chrome.storage.local.set({ autoCapture: autoCaptureEnabled });
    showToast(autoCaptureEnabled ? 'Auto-capture ON' : 'Auto-capture OFF');
  });

  btnOpenAdd.addEventListener('click', () => openEditModal());
  modalClose.addEventListener('click', closeModal);
  btnCancelEdit.addEventListener('click', closeModal);
  drawerClose.addEventListener('click', closeDrawer);
  document.getElementById('drawer-footer-close')?.addEventListener('click', closeDrawer);

  btnReadClipboard.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const response = await chrome.runtime.sendMessage({
          type: 'SAVE_CLIPBOARD_TEXT',
          text,
          isExplicit: true
        });
        if (response?.success) {
          showToast('Added from clipboard!');
        }
      } else {
        showToast('Clipboard is empty');
      }
    } catch (err) {
      showToast('Clipboard access denied');
    }
  });

  btnSmartFill.addEventListener('click', inspectAndOpenFormDrawer);

  // Close modals on backdrop click or Escape key
  modalEdit.addEventListener('click', (e) => {
    if (e.target === modalEdit) closeModal();
  });

  drawerSmartFill.addEventListener('click', (e) => {
    if (e.target === drawerSmartFill) closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDrawer();
    }
  });

  // Auto-sync clipboard when sidebar gets focus
  window.addEventListener('focus', async () => {
    const { autoCapture = true } = await chrome.storage.local.get('autoCapture');
    if (!autoCapture) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim() && text.length < 10000) {
        await chrome.runtime.sendMessage({
          type: 'SAVE_CLIPBOARD_TEXT',
          text: text.trim(),
          isExplicit: false
        });
      }
    } catch (err) {
      // Ignore permission or focus issues
    }
  });

  // Search & Filter Listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    btnClearSearch.hidden = !searchQuery;
    renderSnippets();
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    btnClearSearch.hidden = true;
    renderSnippets();
  });

  categoryTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      categoryTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.cat;
      renderSnippets();
    }
  });

  // Helper Toast
  function showToast(msg) {
    toastMessage.textContent = msg;
    appToast.hidden = false;
    setTimeout(() => {
      appToast.hidden = true;
    }, 2000);
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Load initial data
  await loadInitialData();
});
