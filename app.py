import feedparser
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        feed = feedparser.parse(FEED_URL)
        releases = []
        for entry in feed.entries:
            releases.append({
                'id': entry.get('id', ''),
                'title': entry.get('title', 'No Title'),
                'link': entry.get('link', ''),
                'updated': entry.get('updated', entry.get('published', '')),
                'summary': entry.get('summary', entry.get('description', 'No Content')),
            })
        return jsonify({
            'status': 'success',
            'title': feed.feed.get('title', 'BigQuery Release Notes'),
            'releases': releases
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
