# JARVIS — Advanced Intelligence System

![JARVIS Dashboard Source](https://img.shields.io/badge/Jarvis-v2.0-00d4ff?style=for-the-badge&logo=probot&logoColor=white)
![Build Status](https://img.shields.io/badge/Build-Success-00ff88?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/React-FastAPI-blue?style=for-the-badge)

**JARVIS** (Just A Rather Very Intelligent System) is a state-of-the-art personal AI assistant designed with a professional, futuristic interface and powerful agentic capabilities. Unlike standard LLM wrappers, JARVIS utilizes a complex multi-agent orchestrator and persistent memory to handle complex real-world tasks.

---

## 🌟 Why JARVIS is Unique

JARVIS isn't just a chatbot; it's a **System of Intelligence**. It stands out through:
-   **Agentic Orchestration**: Uses LangGraph to manage a network of specialized agents that can collaborate on complex goals.
-   **Dual-Layer Memory**: Bridges the gap between short-term conversation context and long-term semantic memory using Qdrant and mem0.
-   **Neural Interface**: A high-fidelity, professional-grade UI featuring a dedicated **System Dashboard** for real-time monitoring of AI "thoughts," agent status, and system health.
-   **Voice-First Architecture**: Native support for high-quality audio transcription (STT) and text-to-speech (TTS), allowing for truly hands-free operation.

---

## 🚀 Core Features

### 🖥️ Professional Dashboard
-   **Neural Core Visualization**: An interactive 3D-style orb representing the system's active state.
-   **System Diagnostics**: Real-time monitoring of CPU/Memory load, WebSocket latency, and database status.
-   **Agent Network Stream**: Monitor which agents (Search, Coder, Finance, etc.) are currently active and what they are processing.

### 🧠 Agent Hub
-   **Search Agent**: Deep web research using Tavily.
-   **Finance Agent**: Real-time market analysis and crypto tracking via yfinance.
-   **News Agent**: Aggregated global news reporting.
-   **Coder Agent**: Autonomous code generation and interpretation via E2B.
-   **System Agents**: Native integration with Google Drive, Calendar, and Email.

### 🗣️ Multi-Modal Interaction
-   **Neural Chat**: A high-performance chat interface with Markdown support, code highlighting, and agent tracing.
-   **Voice Core**: Low-latency voice interaction using OpenAI Whisper and TTS.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI, LangGraph, LangChain, Python 3.10+ |
| **Intelligence** | Anthropic Claude 3.5 Sonnet, OpenAI (Voice) |
| **Memory/DB** | Qdrant (Vector), PostgreSQL (Relational), Redis (Cache), mem0ai |

---

## 🏗️ Installation & Setup

### 1. Prerequisites
-   Python 3.10 or higher.
-   Node.js 18 or higher.
-   Docker (recommended for PostgreSQL, Redis, and Qdrant).

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Run the server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd jarvis-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 👥 Contributors

-   **Bhargavi Battula**
-   **Satya Ruchitha** 

---

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
*Created with focus and precision to redefine human-AI interaction.*
