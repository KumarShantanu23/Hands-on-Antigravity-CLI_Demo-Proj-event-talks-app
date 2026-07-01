// State Management
let currentReleases = [];
let filteredReleases = [];
let visibleCount = 10;
let selectedRelease = null;

// DOM Elements
const feedTitle = document.getElementById('feed-title');
const feedMeta = document.getElementById('feed-meta');
const refreshBtn = document.getElementById('refresh-btn');
const refreshSpinner = document.getElementById('refresh-spinner');
const loader = document.getElementById('loader');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const releasesGrid = document.getElementById('releases-grid');

// Tweet Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const sendTweetBtn = document.getElementById('send-tweet-btn');

// Initialize application on load
document.addEventListener('DOMContentLoaded', () => {
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            `;
        }
    }
    fetchReleases();
    setupTweetTextarea();
});

// Fetch release notes from backend API
async function fetchReleases() {
    // UI Loading state
    setLoadingState(true);
    errorState.classList.add('hidden');
    releasesGrid.innerHTML = '';
    
    // Hide search & load-more during loading
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) searchContainer.classList.add('hidden');
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) loadMoreContainer.classList.add('hidden');

    const csvBtn = document.getElementById('export-csv-btn');
    if (csvBtn) {
        csvBtn.classList.add('hidden');
    }

    try {
        const response = await fetch('/api/releases');
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            currentReleases = data.releases;
            filteredReleases = [...currentReleases];
            visibleCount = 10;
            
            // Update Headers
            feedTitle.textContent = data.title || 'BigQuery Release Notes';
            feedMeta.textContent = `Showing ${currentReleases.length} recent updates`;
            
            // Show Export CSV button
            const csvBtn = document.getElementById('export-csv-btn');
            if (csvBtn) {
                csvBtn.classList.remove('hidden');
            }
            
            // Show Search bar
            const searchContainer = document.getElementById('search-container');
            if (searchContainer) {
                searchContainer.classList.remove('hidden');
                document.getElementById('search-input').value = '';
            }
            
            // Render releases
            renderVisibleReleases();
        } else {
            showError(data.message || 'Failed to fetch release notes from the server.');
        }
    } catch (err) {
        showError('A network error occurred. Please check if your server is running.');
    } finally {
        setLoadingState(false);
    }
}

// Set Loading State
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
        loader.classList.remove('hidden');
    } else {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
        loader.classList.add('hidden');
    }
}

// Show Error Message Card
function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
    feedMeta.textContent = 'Error loading feed';
}

// Format date into human readable form
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

// Render list of releases
function renderVisibleReleases() {
    releasesGrid.innerHTML = '';
    
    if (!filteredReleases || filteredReleases.length === 0) {
        releasesGrid.innerHTML = `
            <div class="state-container">
                <p>No release notes match your search criteria.</p>
            </div>
        `;
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.classList.add('hidden');
        }
        return;
    }

    const chunk = filteredReleases.slice(0, visibleCount);

    chunk.forEach((release, index) => {
        const card = document.createElement('article');
        card.className = 'release-card';
        card.style.animationDelay = `${(index % 10) * 0.05}s`;

        const formattedDate = formatDate(release.updated);

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title-group">
                    <h2>${escapeHTML(release.title)}</h2>
                    <span class="release-date">${escapeHTML(formattedDate)}</span>
                </div>
                <div class="card-action-buttons">
                    <button class="copy-shortcut-btn" title="Copy text to clipboard" onclick="copyCardToClipboard(${index}, this)">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="tweet-shortcut-btn" title="Tweet about this update" onclick="openTweetModal(${index})">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-content">
                ${release.summary}
            </div>
        `;
        releasesGrid.appendChild(card);
    });

    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (visibleCount < filteredReleases.length) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
}

// Safe escape HTML
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Setup character counter and constraints
function setupTweetTextarea() {
    tweetTextarea.addEventListener('input', () => {
        const len = tweetTextarea.value.length;
        charCounter.textContent = `${len} / 280`;
        
        if (len >= 280) {
            charCounter.classList.add('char-limit-reached');
            sendTweetBtn.disabled = true;
        } else {
            charCounter.classList.remove('char-limit-reached');
            sendTweetBtn.disabled = false;
        }
    });
}

// Open Tweet Modal
function openTweetModal(index) {
    selectedRelease = filteredReleases[index];
    if (!selectedRelease) return;

    // Build tweet text preview
    // Extract plain text from HTML summary to prevent HTML tags in tweet
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = selectedRelease.summary;
    let plainSummary = tempDiv.textContent || tempDiv.innerText || '';
    
    // Trim summary
    plainSummary = plainSummary.replace(/\s+/g, ' ').trim();
    if (plainSummary.length > 150) {
        plainSummary = plainSummary.substring(0, 147) + '...';
    }

    const tweetText = `BigQuery Update: ${selectedRelease.title}\n\n"${plainSummary}"\n\nRead more: ${selectedRelease.link || 'https://cloud.google.com/bigquery'}`;
    
    tweetTextarea.value = tweetText;
    charCounter.textContent = `${tweetText.length} / 280`;
    
    if (tweetText.length > 280) {
        charCounter.classList.add('char-limit-reached');
    } else {
        charCounter.classList.remove('char-limit-reached');
    }

    tweetModal.classList.remove('hidden');
}

// Close Tweet Modal
function closeModal() {
    tweetModal.classList.add('hidden');
    selectedRelease = null;
}

// Publish Tweet via Twitter Intent API
function publishTweet() {
    const text = tweetTextarea.value;
    if (text.length > 280) {
        alert('Tweet exceeds the 280 character limit.');
        return;
    }
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
    closeModal();
}

// Copy release details to clipboard
function copyCardToClipboard(index, button) {
    const release = filteredReleases[index];
    if (!release) return;

    // Convert HTML summary to plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = release.summary;
    const plainSummary = tempDiv.textContent || tempDiv.innerText || '';

    const textToCopy = `BigQuery Update: ${release.title}\nDate: ${formatDate(release.updated)}\nLink: ${release.link}\n\n${plainSummary.trim()}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual feedback
        button.classList.add('copied');
        const originalSVG = button.innerHTML;
        // Checkmark SVG
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;

        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalSVG;
        }, 2000);
    }).catch(err => {
        alert('Failed to copy to clipboard: ' + err);
    });
}

// Export current releases to CSV
function exportToCSV() {
    if (!currentReleases || currentReleases.length === 0) return;

    const headers = ['ID', 'Title', 'Link', 'Date', 'Summary'];
    
    const rows = currentReleases.map(release => {
        // Convert summary HTML to plain text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.summary;
        const plainSummary = tempDiv.textContent || tempDiv.innerText || '';

        // Escape double quotes by doubling them
        const escapeCSVField = (field) => {
            const str = (field || '').toString();
            return `"${str.replace(/"/g, '""')}"`;
        };

        return [
            escapeCSVField(release.id),
            escapeCSVField(release.title),
            escapeCSVField(release.link),
            escapeCSVField(formatDate(release.updated)),
            escapeCSVField(plainSummary.trim())
        ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Load more releases (pagination)
function loadMoreReleases() {
    visibleCount += 10;
    renderVisibleReleases();
}

// Client-side search and filtering
function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!query) {
        filteredReleases = [...currentReleases];
    } else {
        filteredReleases = currentReleases.filter(release => {
            const titleMatch = (release.title || '').toLowerCase().includes(query);
            
            // Clean HTML tags from summary for searching text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = release.summary || '';
            const plainSummary = tempDiv.textContent || tempDiv.innerText || '';
            const contentMatch = plainSummary.toLowerCase().includes(query);
            
            return titleMatch || contentMatch;
        });
    }
    
    // Reset to first page
    visibleCount = 10;
    
    // Update count in header meta
    if (query) {
        feedMeta.textContent = `Found ${filteredReleases.length} matching updates`;
    } else {
        feedMeta.textContent = `Showing ${currentReleases.length} recent updates`;
    }
    
    renderVisibleReleases();
}

// Toggle Dark/Light Mode Theme
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');
    
    const themeIcon = document.getElementById('theme-icon');
    if (body.classList.contains('light-mode')) {
        // Moon Icon
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
        localStorage.setItem('theme', 'light');
    } else {
        // Sun Icon
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
        localStorage.setItem('theme', 'dark');
    }
}
