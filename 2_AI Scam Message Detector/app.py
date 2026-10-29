from flask import Flask, render_template, request
import sqlite3

app = Flask(__name__)

# Database Connection
conn = sqlite3.connect('scam.db', check_same_thread=False)
cursor = conn.cursor()

# Create Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    result TEXT,
    score INTEGER
)
''')

conn.commit()

# Scam Keywords with Risk Scores
scam_keywords = {
    'otp': 100,
    'password': 95,
    'bank account': 90,
    'verify account': 80,
    'click here': 60,
    'urgent': 50,
    'claim now': 50,
    'winner': 40,
    'lottery': 40,
    'free money': 70
}


# Home Page
@app.route('/')
def home():
    return render_template('index.html')


# Check Message
@app.route('/check', methods=['POST'])
def check():

    # Get user message
    message = request.form['message'].lower()

    score = 0
    found_keywords = []

    # Check scam words
    for word, risk in scam_keywords.items():

        if word in message:
            score += risk
            found_keywords.append(word)

    # Limit score to 100
    if score > 100:
        score = 100

    # Final Result
    if score >= 80:
        result = "HIGH RISK SCAM ⚠️"

    elif score >= 50:
        result = "SUSPICIOUS MESSAGE ⚠️"

    else:
        result = "SAFE MESSAGE ✅"

    # Save into database
    cursor.execute(
        "INSERT INTO reports(message, result, score) VALUES (?, ?, ?)",
        (message, result, score)
    )

    conn.commit()

    # Send result to HTML page
    return render_template(
        'result.html',
        result=result,
        score=score,
        keywords=found_keywords
    )


# Run App
if __name__ == '__main__':
    app.run(debug=True)
