# Microsoft Edge Add-ons Store Listing & Privacy Disclosures

**Last Updated:** August 17, 2026  
**Extension Name:** ClipFill - Smart Clipboard & Form Filler  
**Version:** 1.0.0  
**Target Browser:** Microsoft Edge (Chromium, Manifest V3)  
**Author:** Shafayat Hossain <shafayat@engineer.com>  
**Homepage:** https://jqsafi.github.io/ClipFill-Website/  
**Contact / WhatsApp:** https://wa.me/@jqsafi  
**Supported Locales:** English (`en`), Bengali/Bangla (`bn`), German (`de`), Spanish (`es`), French (`fr`), Japanese (`ja`)  

---

## 1. Store Metadata for Microsoft Edge Partner Center

### Title
ClipFill - Smart Clipboard & Form Filler

### Short Description (Max 132 chars)
Collect copied text snippets, manage personal contact info (Name, Email, Phone, Address), and auto-fill web forms in Microsoft Edge.

### Category
Productivity / Workflow

### Detailed Store Description
ClipFill is a smart clipboard companion and form filling assistant designed to supercharge your web productivity in Microsoft Edge. 

#### Key Features:
- 📋 **Automatic Clipboard Collection**: Automatically saves copied text snippets into a clean, searchable Microsoft Edge sidebar history.
- 🎯 **Target & Fill**: Click any item in your sidebar and point-and-click on any form field on the webpage to insert text instantly.
- ⚡ **Smart Form Autofill**: Scans page forms and populates inputs (Name, Email, Phone, Address) with 1-click matching.
- 📌 **Pin & Categorize**: Organize snippets with custom tags (Personal, Form Data, Code, Work) and pin frequently used items to the top.
- 🌐 **Multilingual Support (i18n)**: Fully internationalized with native locale files (`_locales`) supporting English, Bangla, German, Spanish, French, Japanese, and easily expandable.
- 🔒 **Privacy Focused**: All clipboard data and saved items are stored strictly locally in your browser (`chrome.storage.local`). Zero remote servers or data tracking.

---

## 2. Internationalization (i18n) & Multilingual Setup

- **Default Locale**: `en` (English)
- **Locale File Structure**:
  - `_locales/en/messages.json` (English - Primary)
  - `_locales/bn/messages.json` (Bangla / Bengali)
  - `_locales/de/messages.json` (German)
  - `_locales/es/messages.json` (Spanish)
  - `_locales/fr/messages.json` (French)
  - `_locales/ja/messages.json` (Japanese)
- **Manifest Placeholders**: Uses `__MSG_extension_name__`, `__MSG_extension_description__`, and `__MSG_action_title__` per WebExtension i18n standards.

---

## 3. Permissions Justification for Microsoft Edge Review

| Permission | Reason Required for Microsoft Edge |
| --- | --- |
| `sidePanel` | Required to render the ClipFill sidebar alongside active web pages in Microsoft Edge for quick snippet selection and form filling. |
| `storage` | Required to save clipboard history, user snippets, category tags, and user preferences locally in Microsoft Edge (`chrome.storage.local`). |
| `contextMenus` | Required to allow users to right-click selected text on web pages in Edge and save it directly to ClipFill. |
| `tabs` | Required to query the active tab context in Microsoft Edge and inspect web page forms for accurate field auto-filling. |
| `scripting` | Required to inject form filling scripts into active web pages when targeted field selection is triggered. |
| `clipboardRead` | Required to auto-capture copied snippets and allow 1-click clipboard paste into the extension sidebar. |
| `clipboardWrite` | Required to allow copying saved snippets back to system clipboard from the sidebar. |
| `<all_urls>` | Required to allow form filling and text selection monitoring across all web pages visited by the user in Microsoft Edge. |

---

## 4. Privacy Policy & Data Usage

- **Local Storage Only**: ClipFill does NOT transmit, sell, or communicate clipboard data to any external server, cloud platform, or third party.
- **Data Collected**: Only text explicitly copied by the user (or manually entered) is stored locally within `chrome.storage.local`.
- **User Control**: Auto-capture can be toggled OFF at any time directly from the top header switch in the sidebar.

---

## 5. Version History

- **v1.0.0** (2026-08-17): Initial Microsoft Edge compatible release featuring Manifest V3 i18n multilingual support (`_locales`), side panel UI, copy auto-capture, targeted field picker, smart form inspector, context menu integration, and local storage management.
