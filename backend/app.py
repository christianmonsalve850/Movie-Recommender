from flask import Flask, jsonify, request
from flask_cors import CORS
from src.recommender import get_recommendations
import pandas as pd
import csv
import time
import requests
# export FLASK_APP=backend.app
# flask run

app = Flask(__name__)

CORS(app)

df = pd.read_csv('/Users/christianmonsalve/Desktop/CODE/Projects/Movie_Recs/data/processed/explored_movies.csv')
df = df.query('year > 2000').sort_values(['year', 'averageRating', 'numVotes'], ascending=False)
main_user_recs = pd.read_csv('/Users/christianmonsalve/Desktop/CODE/Projects/Movie_Recs/data/recommendations_christian.csv')

default_recs = [
    "tt0848228",  # The Avengers (2012)
    "tt4154796",  # Avengers: Endgame (2019)
    "tt0468569",  # The Dark Knight (2008)
    "tt0110912",  # Pulp Fiction (1994)
    "tt0133093",  # The Matrix (1999)
    "tt0816692",  # Interstellar (2014)
    "tt1375666",  # Inception (2010)
    "tt4154756",  # Avengers: Infinity War (2018)
    "tt3896198",  # Guardians of the Galaxy Vol. 2 (2017)
    "tt0109830",  # Forrest Gump (1994)
    "tt0107290",  # Jurassic Park (1993)
    "tt0088763",  # Back to the Future (1985)
    "tt0120338",  # Titanic (1997)
    "tt0172495",  # Gladiator (2000)
    "tt7286456",  # Joker (2019)
    "tt1877830",  # The Batman (2022)
    "tt1630029",  # Avatar: The Way of Water (2022)
    "tt0499549",  # Avatar (2009)
    "tt0167260",  # The Lord of the Rings: The Return of the King (2003)
    "tt0120737",  # The Lord of the Rings: The Fellowship of the Ring (2001)
]

@app.route('/api/movies', methods=['GET'])
def get_movies():
    query = request.args.get('search', '').lower()
    
    if query:
        # Filter the pre-loaded DataFrame in memory
        filtered_df = df[df['primaryTitle'].str.lower().str.startswith(query)]
        results = filtered_df.to_dict(orient='records')
    else:
        # Return the first 20 movies by default if no search
        results = df.head(20).to_dict(orient='records')
    
    return jsonify(results)

@app.route("/recommendations/<user_id>")
def recommendation(user_id):
    recs = get_recommendations(user_id, 60)
    if (recs is None):
        recs = default_recs
        
    detailed_movies = []
    
    # Loop through the movie IDs on your server instead of the browser
    for imdb_id in recs:
        try:
            response = requests.get(f"https://api.imdbapi.dev/titles/{imdb_id}", timeout=5)
            
            # Handle rate limiting safely
            if response.status_code == 429:
                print(f"Backend hit rate limit for {imdb_id}. Cooling down for 2 seconds...")
                time.sleep(2) 
                
                # Retry the same movie once after the cooling down period
                response = requests.get(f"https://api.imdbapi.dev/titles/{imdb_id}", timeout=5)

            if response.status_code == 200:
                movie_data = response.json()
                detailed_movies.append(movie_data)
            else:
                print(f"Skipping {imdb_id}: Received status code {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"Network error on backend fetching {imdb_id}: {e}")
            
        time.sleep(0.3)
        
    # Return the clean array of fully detailed movie objects to React
    return {
        "user_id": user_id, 
        "recommendations": detailed_movies
    }

@app.route("/rate", methods=["GET", "POST"])
def rate_movie():
    csv_path = "/Users/christianmonsalve/Desktop/CODE/Projects/Movie_Recs/user_data/user_data.csv"

    if request.method == "GET":
        user_id = request.args.get("user_id")
        tconst = request.args.get("tconst")

        if not user_id or not tconst:
            return jsonify({"rating": None})

        try:
            with open(csv_path, "r", newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get("user_id") == user_id and row.get("tconst") == tconst:
                        return jsonify({"rating": float(row.get("userRating", "0"))})
                return jsonify({"rating": 0})
        except FileNotFoundError:
            return jsonify({"rating": None})

        return jsonify({"rating": None})
    else: 
        data = request.get_json()
        user_id = data.get("user_id")
        tconst = data.get("tconst")
        rating = data.get("rating")

        rows = []
        updated = False
        fieldnames = ["tconst", "userRating", "user_id"] 

        try:
            with open(csv_path, "r", newline="", encoding="utf-8") as f:
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

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        return jsonify({"status": "success"})

@app.route("/api/users", methods=["GET", "POST"])
def handle_users():
    users_csv_path = "/Users/christianmonsalve/Desktop/CODE/Projects/Movie_Recs/user_data/users.csv"

    if request.method == "GET":
        users = []
        try:
            with open(users_csv_path, "r", newline="") as f:
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
        data = request.json
        user_id = data.get("id")
        name = data.get("name")
        avatar = data.get("avatar")
            
        with open(users_csv_path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([user_id, name, avatar])
        
        return {"status": "success", "user_id": user_id}