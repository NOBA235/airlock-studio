# 🔐 AIRLOCK STUDIO

**Zero-Trust System Architecture Canvas & Hybrid-AI Prototype Compiler**

Built for the **Google #BuildHybridAI 2026 Hackathon** | Target: $10,000 Grand Prize

---

## 🎯 What is Airlock Studio?

Airlock Studio is a professional engineering tool that combines:

1. **Crisp Blueprint Canvas** - Draw system architecture diagrams with zero hand-drawn squiggles (powered by `@excalidraw/excalidraw` rendering engine)
2. **On-Device Privacy Airlock** - Gemini Nano scans your canvas locally to detect and redact secrets (API keys, database URIs, PII) before cloud compilation
3. **Hybrid AI Architecture Analysis** - Automatic SPOF detection, zero-trust security audits, and semantic node clustering
4. **Live Prototype Compiler** - Cloud Gemini generates working interactive HTML/Tailwind apps, PostgreSQL schemas, and `.env` templates from your sanitized diagrams
5. **Client-Side Secret Re-Hydration** - Toggle to inject real credentials back into local previews (browser RAM only - never transmitted)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm 9+
- **Firebase Project** with AI Logic API enabled
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Install dependencies
npm install

# Configure Firebase credentials
cp .env.example .env.local
# Edit .env.local with your Firebase project config

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS v4
- **Canvas Engine:** `@excalidraw/excalidraw` (stripped branding, crisp blueprint mode)
- **Hybrid AI:** Firebase AI Logic (`firebase/ai`) with Gemini Nano (on-device) + Gemini 2.5 Flash (cloud)
- **Backend:** Firebase Suite (Firestore, Auth, App Check, Remote Config)
- **Diagram Parsing:** `@excalidraw/mermaid-to-excalidraw`
- **Icons:** `lucide-react`

---

## 🔐 Privacy & Zero-Trust Features

### Local Privacy Airlock
- **On-Device Scanning** - Gemini Nano detects secrets/PII in canvas text nodes locally
- **Deterministic Redaction** - Real values replaced with `<SECRET_DB_URI_1>` placeholders before cloud transmission
- **Browser RAM Vault** - Original secrets stored strictly in memory (never persisted, never sent to cloud)
- **Visual Indicators** - Redacted nodes highlighted with amber borders

### Security Auditing
- **SPOF Detection** - Identifies single points of failure in your architecture
- **Zero-Trust Validation** - Flags unencrypted connections and missing auth gateways
- **Topology Analysis** - On-device graph inspection without cloud round-trip

---

## 📊 Build Phases

This project was built across 5 sequential phases:

- ✅ **Phase 1:** Project Configuration + Firebase Suite + TypeScript Contracts *(CURRENT)*
- ⏳ **Phase 2:** Hybrid AI Engine + Blueprint Mutator + Firestore Service
- ⏳ **Phase 3:** 3-Zone Studio Layout + Left Preset Rail + Command Dock
- ⏳ **Phase 4:** Airlock Diff Inspector + Live App Compiler Drawer + Re-Hydration
- ⏳ **Phase 5:** Final Assembly + Keyboard Shortcuts + Production Polish

---

## 🎨 Design Philosophy

**YC-Backed Engineering Studio Aesthetic (Linear / Raycast / Vercel)**

- Permanent 3-zone desktop layout (no chat sidebars)
- Crisp blueprint geometry (roughness: 0, monospace fonts, sharp corners)
- Deep carbon canvas (#09090b) with engineering grid snapping
- Live telemetry HUD showing ON_DEVICE vs IN_CLOUD call distribution
- Zero neon gradients, zero AI sparkles, zero demoware placeholders

---

## 📜 License

Apache License 2.0 - See [LICENSE](./LICENSE) for details.

---

## 🏆 Competition Details

**Google #BuildHybridAI 2026 Hackathon**
- Grand Prize: $10,000
- Focus: Hybrid on-device + cloud AI applications
- Judging Criteria: Innovation, technical execution, privacy considerations, real-world utility

---

## 🛠️ Development Status

**Current Build:** Functional 3-zone architecture canvas with hybrid AI ✅

The application is now ready for development testing:
- Load 3 built-in architecture presets
- Generate diagrams from natural language
- Run local Airlock privacy scans
- Cluster messy notes with AI
- Audit architectures for SPOFs

**Next Step:** Build the compiler drawer for prototype generation and secret re-hydration.

---

Built with 🔐 by the Airlock Studio Team
