# ClipFill - Smart Clipboard & Form Filler (Microsoft Edge Edition)

> Automatically collect copied text snippets, manage personal contact information, and easily fill out web forms from a sleek Microsoft Edge side panel.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)
![Microsoft Edge Extension](https://img.shields.io/badge/Platform-Microsoft%20Edge-0078D4.svg)
![License](https://img.shields.io/badge/License-MIT-orange.svg)

---

## 👨‍💻 Developer & Author Information

- **Author:** Shafayat Hossain
- **Email:** [shafayat@engineer.com](mailto:shafayat@engineer.com)
- **Portfolio / Homepage:** [jqsafi.github.io](https://jqsafi.github.io)
- **WhatsApp Contact:** [wa.me/@jqsafi](https://wa.me/@jqsafi)

---

## 🌟 Key Features

- 🎯 **Smart Click-to-Fill**: Click any snippet in the Edge side panel to fill the currently focused input box on any active webpage.
- 📋 **Automatic Clipboard Fallback**: If no active input field is focused (or on restricted pages), clicking a snippet automatically copies the text to your clipboard.
- ⚡ **Auto Clipboard Collection**: Monitored copy actions dynamically save snippets to your sidebar history (can be toggled ON/OFF).
- 🔍 **Smart Form Inspection**: Scans form inputs on the current web page and maps them to your saved profile snippets (Name, Email, Phone, Address).
- 📌 **Pin & Categorize**: Organize items by categories (*Personal*, *Form Data*, *General*, *Code*) and pin high-priority snippets to the top.
- 🔒 **100% Privacy Focused**: All snippets and history are stored locally in your browser (`chrome.storage.local`). Zero data tracking or external network requests.

---

## 📁 Project Structure

```text
ClipFill/
├── manifest.json            # Extension Manifest V3 configuration (Edge compatible)
├── service-worker.js        # Background service worker & context menus
├── EDGEADDONS.md            # Microsoft Edge Add-ons Store listing metadata & privacy specs
├── CHROMEWEBSTORE.md        # Chrome Web Store listing metadata
├── README.md                # Project documentation for Microsoft Edge
├── content-scripts/
│   ├── content.js           # Page focus tracker, form filler & input listener
│   └── content.css          # Target selection overlay & banner styling
├── sidepanel/
│   ├── sidepanel.html       # Sidebar user interface layout
│   ├── sidepanel.css        # Modern dark-mode styling & dynamic animations
│   └── sidepanel.js         # Sidebar logic, storage sync & snippet manager
├── icons/                   # Extension icons (16px, 48px, 128px)
└── scripts/
    └── generate_icons.js    # Canvas icon generator script
```

---

## 🌐 Installation & Setup in Microsoft Edge

1. **Clone or Download** this repository branch:
   ```bash
   git clone -b ClipFill-Edge https://github.com/jqsafi/ClipFill.git
   ```
2. Open **Microsoft Edge** and navigate to:
   ```text
   edge://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the left sidebar / bottom left corner.
4. Click **Load unpacked** at the top.
5. Select the project folder (`ClipFill`).
6. Click the extension icon or open the sidebar in Microsoft Edge to launch **ClipFill**!

---

## 💡 How to Use in Edge

1. **Fill Active Input Box**: Click any input box on a web page, then click a snippet in the sidebar. The text will insert right at your cursor.
2. **Copy to Clipboard**: Click a snippet when no input box is active on the page, or click the **📋 Copy** icon.
3. **Save Selection**: Select text on any web page, right-click, and choose **Save selection to ClipFill**.
4. **Auto-Capture**: Enable the toggle switch in the sidebar header to automatically save text whenever you perform `Cmd+C` / `Ctrl+C`.
5. **Smart Form Autofill**: Click **Smart Fill** in the toolbar to scan all fields on the current page and map your profile data automatically.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
