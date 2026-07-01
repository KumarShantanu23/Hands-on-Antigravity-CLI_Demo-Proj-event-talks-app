# BigQuery Release Notes Dashboard

A premium, single-page web dashboard that fetches official Google Cloud BigQuery Release Notes, displays them in a sleek glassmorphic UI, and enables you to draft and share specific updates directly to Twitter/X.

## 🚀 Features

- **Dynamic Feed Fetching**: Fetches and parses the official BigQuery Atom/RSS XML feed using Python's `feedparser`.
- **Glassmorphic UI**: Beautiful dark-mode dashboard styled with CSS variables, radial neon backgrounds, and smooth micro-animations.
- **Refresh State Management**: Fully featured loading spinner and error-handling fallback interfaces.
- **Twitter/X Integration**: Pick any release note, edit it inside a built-in character-constrained draft composer (280 characters), and post it directly via Web Intents.

---

## 📁 Project Structure

```text
bq-releases-notes/
├── app.py                  # Flask backend server & XML parser
├── requirements.txt        # Python package dependencies
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Main HTML structure & layouts
└── static/
    ├── css/
    │   └── style.css       # Custom dark-mode style sheets
    └── js/
        └── main.js         # Client-side state transitions & Web Intent compiler
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Clone and Setup Environment
Navigate to your project directory and initialize a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate virtual environment (macOS/Linux)
source venv/bin/activate
```

### 3. Install Dependencies
Install the required packages from `requirements.txt`:

```bash
pip install -r requirements.txt
```

---

## 🖥️ Running Locally

Start the Flask development server:

```bash
python app.py
```

The application will run on **http://127.0.0.1:5000**. Open this address in your browser to view the dashboard.
