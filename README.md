
# MIRROR // BEHAVIORAL REGISTRY

## "Face your tasks. No escapes."

MIRROR is a metacognitive productivity system designed for high-functioning procrastinators. It combines rigid task management, strict socratic interrogation for pauses, and AI-driven psychological profiling to force execution.

### ⚡ Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
    ```
    *Get a key at [aistudio.google.com](https://aistudio.google.com)*

3.  **Run Locally**
    ```bash
    npm run dev
    ```

### 🏗 Architecture & Logic

*   **Atomic Persistence**: Uses IndexedDB via a `StorageService` to ensure zero data loss. Task updates are O(1) atomic writes, not bulk rewrites.
*   **Unidirectional Data Flow**: The `App.tsx` acts as the single source of truth. Modals and Logic Gates (Socratic Gatekeeper) delegate state back to the root.
*   **Audio Engine**: A synthesized `SoundService` (Oscillators) removes the need for external MP3 assets and includes a "User Interaction Handshake" to bypass browser audio policies.
*   **AI Integration**: Deep integration with Google Gemini 3.0 Flash/Pro for:
    *   **Gatekeeper**: Interrogates you before allowing breaks.
    *   **Verifier**: Audits task evidence before marking complete.
    *   **Analyst**: Generates psychological profiles based on your logs.

### 🚀 Deployment (Netlify)

This project is optimized for **Netlify**.

1.  **Push to Git**: Push your code to a GitHub, GitLab, or Bitbucket repository.
2.  **New Site from Git**: Log in to Netlify and click "Add new site" > "Import an existing project".
3.  **Connect Repository**: Select your repository.
4.  **Build Settings**:
    *   Netlify will detect `netlify.toml` automatically.
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
5.  **Environment Variables**:
    *   Go to **Site Settings > Environment variables**.
    *   Add Key: `VITE_GEMINI_API_KEY`
    *   Add Value: `your_actual_api_key_string`
6.  **Deploy**: Click "Deploy site".
