from flask import Flask, render_template, request
import sqlite3

app = Flask(__name__)

# Database Connection
conn = sqlite3.connect('growth.db', check_same_thread=False)
cursor = conn.cursor()

# Create Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    goal TEXT,
    skills TEXT,
    score INTEGER
)
''')

conn.commit()


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/dashboard', methods=['POST'])
def dashboard():

    name = request.form['name']
    goal = request.form['goal']
    skills = request.form['skills'].lower()

    score = 0

    required_skills = {
        'full stack developer': ['html', 'css', 'javascript', 'react', 'sql'],
        'python developer': ['python', 'flask', 'sql'],
        'data analyst': ['python', 'sql', 'excel']
    }

    missing = []

    if goal in required_skills:

        for skill in required_skills[goal]:

            if skill in skills:
                score += 20
            else:
                missing.append(skill)

    # Save Data
    cursor.execute(
        'INSERT INTO users(name, goal, skills, score) VALUES (?, ?, ?, ?)',
        (name, goal, skills, score)
    )

    conn.commit()

    return render_template(
        'dashboard.html',
        name=name,
        goal=goal,
        score=score,
        missing=missing
    )


if __name__ == '__main__':
    app.run(debug=True)
