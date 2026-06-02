from flask import Flask, jsonify, request
from flask_cors import CORS
from src.recommender import get_recommendations
import pandas as pd
import csv
import time
import requests
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

explored_movies_path = os.path.normpath(os.path.join(BASE_DIR, '..', 'data', 'processed', 'explored_movies.csv'))
user_data_csv_path = os.path.normpath(os.path.join(BASE_DIR, '..', 'user_data', 'user_data.csv'))
users_csv_path = os.path.normpath(os.path.join(BASE_DIR, '..', 'user_data', 'users.csv'))

df = pd.read_csv(explored_movies_path)
df = df.query('year > 2000').sort_values(['year', 'averageRating', 'numVotes'], ascending=False)

default_recs = [
    "tt0848228", "tt4154796", "tt0468569", "tt0110912", "tt0133093",
    "tt0816692", "tt1375666", "tt4154756", "tt3896198", "tt0109830",
    "tt0107290", "tt0088763", "tt0120338", "tt0172495", "tt7286456",
    "tt1877830", "tt1630029", "tt0499549", "tt0167260", "tt0120737",
]

@app.route('/api/movies', methods=['GET'])
def get_movies():
    query = request.args.get('search', '').lower()
    if query:
        filtered_df = df[df['primaryTitle'].str.lower().str.startswith(query)]
        results = filtered_df.to_dict(orient='records')
    else:
        results = df.head(20).to_dict(orient='records')
    return jsonify(results)

@app.route("/recommendations/<user_id>")
def recommendation(user_id):
    recs = get_recommendations(user_id, 50)
    if (recs is None):
        recs = default_recs
        
    detailed_movies = []
    
    for imdb_id in recs:
        try:
            response = requests.get(f"https://api.imdbapi.dev/titles/{imdb_id}", timeout=5)
            
            if response.status_code == 429:
                print(f"Backend hit rate limit for {imdb_id}. Cooling down for 2 seconds...")
                time.sleep(2) 
                
                response = requests.get(f"https://api.imdbapi.dev/titles/{imdb_id}", timeout=5)

            if response.status_code == 200:
                movie_data = response.json()
                detailed_movies.append(movie_data)
            else:
                print(f"Skipping {imdb_id}: Received status code {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"Network error on backend fetching {imdb_id}: {e}")
            
        time.sleep(0.3)
        
    return {
        "user_id": user_id, 
        "recommendations": detailed_movies
    }

@app.route("/rate", methods=["GET", "POST"])
def rate_movie():
    if request.method == "GET":
        user_id = request.args.get("user_id")
        tconst = request.args.get("tconst")

        if not user_id or not tconst:
            return jsonify({"rating": 0})

        try:
            with open(user_data_csv_path, "r", newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get("user_id") == user_id and row.get("tconst") == tconst:
                        return jsonify({"rating": float(row.get("userRating", "0"))})
                return jsonify({"rating": 0})
        except FileNotFoundError:
            return jsonify({"rating": 0})
    else: 
        data = request.get_json()
        user_id = data.get("user_id")
        tconst = data.get("tconst")
        rating = data.get("rating")

        rows = []
        updated = False
        fieldnames = ["tconst", "userRating", "user_id"] 

        try:
            with open(user_data_csv_path, "r", newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                fieldnames = reader.fieldnames or fieldnames
                for row in reader:
                    if row.get("user_id") == user_id and row.get("tconst") == tconst:
                        row["userRating"] = str(rating)
                        updated = True
                    rows.append(row)
        except FileNotFoundError:
            pass

        if not updated:
            rows.append({
                "user_id": user_id,
                "tconst": tconst,
                "userRating": str(rating)
            })

        with open(user_data_csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        return jsonify({"status": "success"})

@app.route("/api/users", methods=["GET", "POST"])
def handle_users():
    if request.method == "GET":
        users = []
        try:
            with open(users_csv_path, "r", newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    users.append({
                        "id": row.get("id", ""),
                        "name": row.get("name", ""),
                        "avatar": row.get("avatar", "")
                    })
        except FileNotFoundError:
            return jsonify([])
        return jsonify(users)

    if request.method == "POST":
        data = request.get_json()
        user_id = data.get("id")
        name = data.get("name")
        avatar = data.get("avatar")
            
        # Ensure directory structure exists on write operations
        os.makedirs(os.path.dirname(users_csv_path), exist_ok=True)
        
        file_exists = os.path.isfile(users_csv_path)
        with open(users_csv_path, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["id", "name", "avatar"])
            writer.writerow([user_id, name, avatar])
        
        return jsonify({"status": "success", "user_id": user_id})