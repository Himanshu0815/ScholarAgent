
# ScholarAgent — Academic Research & Education Assistant

**ScholarAgent** is a sophisticated React-based AI application designed to assist researchers, students, and academics. It leverages the **Google Gemini 2.5 Flash** model with **Search Grounding** to perform real-time research, synthesize academic papers, and generate citation-backed reports.

## 🚀 Key Features

### 1. Deep Research Generation
*   **Real-time Synthesis:** Generates structured academic reports (Executive Summary, Key Findings, Methodology, Conclusion).
*   **Grounding & Citations:** Automatically searches Google Scholar and academic databases to find real-world sources.
*   **Inline Citations:** Maps sources to specific text segments using standard academic notation (e.g., `[1]`, `[2]`).
*   **Granular Control:** Users can select between **Concise Summaries** and **Detailed Reports**.

### 2. Personalized Research Feed
*   **Curated Updates:** proactively fetches recent papers (last 1-3 months) based on user-defined topics of interest.
*   **Persistent Preferences:** Saves user topics locally for a personalized experience upon return.

### 3. Interactive RAG Chat ("Chat with Paper")
*   **Context-Aware:** Allows users to ask follow-up questions about the generated report.
*   **RAG Implementation:** Injects the full report context into the LLM to ensure answers are strictly based on the research findings.
*   **Multi-turn Conversation:** Maintains conversation history for natural dialogue.

### 4. Citation Management
*   **Source Attribution:** Displays a dedicated list of all referenced materials.
*   **Export Capability:** Supports exporting citations to **BibTeX** and **RIS** formats for integration with Zotero, Mendeley, and EndNote.

### 5. Document Export
*   **PDF Generation:** Client-side rendering of reports to PDF.
*   **Markdown Export:** Download raw Markdown files for editing in LaTeX or other editors.

---

## 🔄 Application Workflow

<img width="6486" height="3497" alt="ScholarAgent- Workflow diagram" src="https://github.com/user-attachments/assets/fdf2b040-4560-4717-9426-d13cc18a0d25" />


## 🛠 Technical Architecture

### Tech Stack
*   **Frontend Framework:** React 19
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Dark Mode native)
*   **AI Provider:** Google GenAI SDK (`@google/genai`)
*   **Icons:** Lucide React
*   **Utilities:** `html2pdf.js` for PDF generation.

### Core Services (`services/gemini.ts`)

The application relies on a centralized service layer to communicate with the Gemini API.

*   **`generateResearch(topic, detailLevel)`**:
    *   Uses the `googleSearch` tool to retrieve ground truth data.
    *   Processes `groundingSupports` metadata to calculate text indices for inline citations.
    *   Deduplicates sources to create a clean reference list.

*   **`generateChatResponse(history, context, message)`**:
    *   Implements RAG (Retrieval-Augmented Generation).
    *   Passes the current report content (~20k chars context window) as a "System Instruction" or context block.
    *   Enables `googleSearch` simultaneously to verify facts or find external answers if the report is insufficient.

### Data Models (`types.ts`)

*   **`ResearchReport`**: Stores the generated content, timestamp, and the array of `GroundingChunk` (sources).
*   **`GroundingChunk`**: Represents a specific source (URI, Title) returned by the Gemini Search Grounding tool.
*   **`FeedData`**: Caches the personalized feed content.

---

## 📂 Project Structure

```text
/
├── index.html              # Entry HTML with Tailwind & html2pdf CDN
├── index.tsx               # React Root
├── App.tsx                 # Main Controller & State Management
├── types.ts                # TypeScript Interfaces
├── services/
│   └── gemini.ts           # API Logic, Citation Processing, RAG
└── components/
    ├── HistorySidebar.tsx  # Navigation & Past Reports
    ├── ChatInterface.tsx   # RAG Chat UI
    ├── ResearchFeed.tsx    # Personalized News Feed
    ├── SourceList.tsx      # Reference List & BibTeX/RIS Export
    └── MarkdownRenderer.tsx# Custom Markdown rendering with Styles
```

---

## 🚦 Setup & Installation

1.  **Environment Configuration:**
    Ensure your environment has a valid Google Gemini API Key.
    The application expects `process.env.API_KEY` to be available.

2.  **Install Dependencies:**
    *(Based on `importmap` in `index.html`, dependencies are loaded via CDN for this build, but standard Node setup would apply usually)*.

3.  **Run Application:**
    The application handles API keys securely via the backend proxy or environment injection configured in the hosting environment.

---

## 🧪 Citation Processing Logic

One of the most complex parts of ScholarAgent is the **`processCitations`** function in `services/gemini.ts`.

1.  **Raw Input:** Receives raw text and a list of `GroundingSupport` objects from Gemini.
2.  **Mapping:**
    *   Iterates through supports to identify which URL (`GroundingChunk`) corresponds to which text segment.
    *   Assigns a unique integer ID (1, 2, 3...) to each unique URL based on order of appearance.
3.  **Injection:**
    *   Calculates string indices to inject HTML `<sup>[x]</sup>` tags directly into the Markdown string.
    *   Sorts injections in reverse order (end-to-start) to prevent index shifting during string manipulation.
4.  **Output:** Returns the modified text and a clean list of unique sources.

---

## 🎨 UI/UX Design

*   **Dark Mode:** The application uses a deep slate (`slate-900`, `slate-950`) color palette optimized for long reading sessions and reduced eye strain.
*   **Typography:** Uses **Inter** for UI elements and **Merriweather** for report content to mimic academic paper formatting.
*   **Responsive:** Fully responsive layout with collapsible sidebars on mobile (implied via Tailwind classes).
