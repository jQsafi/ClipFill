// Service Worker for ClipFill Extension

// Initialize side panel behavior and context menus on install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Enable opening the side panel by clicking the action icon
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (err) {
    console.error('Error setting panel behavior:', err);
  }

  // Create Context Menu for saving selected text
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save selection to ClipFill',
    contexts: ['selection']
  });

  // Initialize storage defaults if empty
  const { snippets = null, autoCapture = null } = await chrome.storage.local.get(['snippets', 'autoCapture']);
  if (snippets === null) {
    await chrome.storage.local.set({
      snippets: [
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
      ]
    });
  }

  if (autoCapture === null) {
    await chrome.storage.local.set({ autoCapture: true });
  }
});

// Context Menu listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-selection' && info.selectionText) {
    await addSnippet({
      text: info.selectionText.trim(),
      sourceUrl: tab?.url || '',
      sourceTitle: tab?.title || ''
    });
  }
});

// Helper function to add snippet into storage without duplicates (or bump duplicate to top)
async function addSnippet({ text, label = '', category = 'General', sourceUrl = '', sourceTitle = '' }) {
  if (!text || !text.trim()) return null;

  const trimmedText = text.trim();
  const { snippets = [] } = await chrome.storage.local.get('snippets');

  // Check if identical text already exists
  const existingIdx = snippets.findIndex(s => s.text === trimmedText);

  if (existingIdx !== -1) {
    // Update timestamp and bring to top
    const existing = snippets[existingIdx];
    snippets.splice(existingIdx, 1);
    existing.timestamp = Date.now();
    snippets.unshift(existing);
  } else {
    // Create new entry
    const newSnippet = {
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: trimmedText,
      label: label || (trimmedText.length > 30 ? trimmedText.substring(0, 30) + '...' : trimmedText),
      category: category,
      pinned: false,
      timestamp: Date.now(),
      sourceUrl,
      sourceTitle
    };
    snippets.unshift(newSnippet);
  }

  // Cap storage to last 100 snippets to manage quota cleanly
  const updatedSnippets = snippets.slice(0, 100);
  await chrome.storage.local.set({ snippets: updatedSnippets });
  return updatedSnippets[0];
}

// Runtime message listener for content script or side panel interactions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'SAVE_CLIPBOARD_TEXT') {
        const { autoCapture = true } = await chrome.storage.local.get('autoCapture');
        if (!autoCapture && !message.isExplicit) {
          sendResponse({ success: false, reason: 'Auto-capture disabled' });
          return;
        }
        const item = await addSnippet({
          text: message.text,
          label: message.label,
          category: message.category,
          sourceUrl: sender.tab?.url || '',
          sourceTitle: sender.tab?.title || ''
        });
        sendResponse({ success: true, item });
      } else if (message.type === 'GET_SNIPPETS') {
        const { snippets = [] } = await chrome.storage.local.get('snippets');
        sendResponse({ success: true, snippets });
      } else {
        sendResponse({ success: false, reason: 'Unknown message type' });
      }
    } catch (err) {
      console.error('Error handling message in service worker:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true; // Keep message channel open for async response
});
