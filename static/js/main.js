// State Management
let currentReleases = [];
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
    fetchReleases();
    setupTweetTextarea();
});

// Fetch release notes from backend API
async function fetchReleases() {
    // UI Loading state
    setLoadingState(true);
    errorState.classList.add('hidden');
    releasesGrid.innerHTML = '';

    try {
        const response = await fetch('/api/releases');
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            currentReleases = data.releases;
            
            // Update Headers
            feedTitle.textContent = data.title || 'BigQuery Release Notes';
            feedMeta.textContent = `Showing ${currentReleases.length} recent updates`;
            
            // Render releases
            renderReleases(currentReleases);
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
function renderReleases(releases) {
    if (!releases || releases.length === 0) {
        releasesGrid.innerHTML = `
            <div class="state-container">
                <p>No release notes found in this feed.</p>
            </div>
        `;
        return;
    }

    releases.forEach((release, index) => {
        const card = document.createElement('article');
        card.className = 'release-card';
        card.style.animationDelay = `${index * 0.05}s`;

        // Parse title and extract date or clean title
        const formattedDate = formatDate(release.updated);

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title-group">
                    <h2>${escapeHTML(release.title)}</h2>
                    <span class="release-date">${escapeHTML(formattedDate)}</span>
                </div>
                <button class="tweet-shortcut-btn" title="Tweet about this update" onclick="openTweetModal(${index})">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                </button>
            </div>
            <div class="card-content">
                ${release.summary}
            </div>
        `;
        releasesGrid.appendChild(card);
    });
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
    selectedRelease = currentReleases[index];
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
