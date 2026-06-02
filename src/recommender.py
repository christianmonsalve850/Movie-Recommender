import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ==========================================
# 1. LAZY GLOBAL LOADING (Memory-Safe)
# ==========================================
_MOVIES_CACHE = None

def get_movie_features():
    global _MOVIES_CACHE
    if _MOVIES_CACHE is None:
        csv_path = os.path.normpath(os.path.join(BASE_DIR, '..', 'data', 'processed', 'new_movie_features.csv'))
        
        # 1. Explicitly list only the features your math calculations need!
        # Drop text description columns or unneeded metadata strings right from the disk read stage
        needed_cols = [
            'tconst', 'primaryTitle', 'year', 'runtimeMinutes', 
            'logNumVotes', 'averageRating', 'releaseDecade', 
            'runtime_bin', 'bayesRating'
        ]
        
        # 2. Add extra genre columns to 'needed_cols' if your user vector uses them
        df = pd.read_csv(csv_path, usecols=needed_cols)
        
        # Downcast floats to minimize space
        float_cols = df.select_dtypes(include=['float64']).columns
        df[float_cols] = df[float_cols].astype('float32')
        _MOVIES_CACHE = df
    return _MOVIES_CACHE


# ==========================================
# 2. DATA PROFILING FUNCTIONS
# ==========================================
def get_user_profile(user_id):
    csv_path = os.path.normpath(os.path.join(BASE_DIR, '..', 'user_data', 'user_data.csv'))
    try:
        data = pd.read_csv(csv_path)
        data = data[data['user_id'] == user_id].drop(columns=['user_id'])
        if data.shape[0] < 5:
            return None
        return data
    except (FileNotFoundError, pd.errors.EmptyDataError):
        return None

def generate_user_vector(user_id, user_profile):
    """Accepts user_profile as an argument to avoid reloading the movie dataset."""
    if user_profile is None: 
        return None

    # Uses the global cached instance instead of parsing a new file from scratch
    movie_features = get_movie_features()
    data = user_profile.merge(movie_features, how='left', on='tconst')

    features = data.select_dtypes(include=['float32', 'float64', 'int64']).copy()
    if features.empty:
        return None

    user_mean = features['userRating'].mean()
    weight = data['userRating'] - user_mean

    # Safely drop target columns if they exist
    cols_to_drop = [c for c in ['userRating', 'numVotes'] if c in features.columns]
    features = features.drop(columns=cols_to_drop)

    to_standardize = ['year', 'runtimeMinutes', 'logNumVotes', 'averageRating', 'releaseDecade', 'runtime_bin', 'bayesRating']
    
    scaler = StandardScaler()
    features[to_standardize] = scaler.fit_transform(features[to_standardize])

    weighted_features = features.multiply(weight, axis=0)
    user_vector_numerator = weighted_features.sum()
    denominator = weight.abs().sum()
    
    if denominator == 0:
        return None
        
    user_vector = user_vector_numerator / denominator
    return user_vector, scaler


# ==========================================
# 3. CORE RECOMMENDATION ENGINE
# ==========================================
def get_recommendations(user_id, k=4):
    user_profile = get_user_profile(user_id)
    if user_profile is None or user_profile.empty: 
        return None
        
    # Pass down the existing user_profile pointer to save processing cycles
    user_vector_data = generate_user_vector(user_id, user_profile)
    if user_vector_data is None:
        return None
    user_vector, scaler = user_vector_data

    # Fetch global movie data pointer
    movies = get_movie_features()
    
    # Filter unseen records and slice by year boundary
    movies = movies[~movies['tconst'].isin(user_profile['tconst'])].query('year > 1980').copy()
    if movies.empty:
        return []

    to_standardize = ['year', 'runtimeMinutes', 'logNumVotes', 'averageRating', 'releaseDecade', 'runtime_bin', 'bayesRating']
    feature_columns = [col for col in user_vector.index if col in movies.columns]

    # Standardize features in-place without generating a dataframe duplicate
    movies[to_standardize] = scaler.transform(movies[to_standardize])

    # Perform matrix operations using raw NumPy arrays
    calc_matrix = movies[feature_columns].to_numpy()
    user_vector_2d = user_vector.to_numpy().reshape(1, -1)

    movies['cosineSimilarity'] = cosine_similarity(calc_matrix, user_vector_2d).flatten()

    alpha = 0.9
    beta = 0.05
    gamma = 0.05
    movies['final_score'] = (alpha * movies['cosineSimilarity'] + 
                             beta * movies['bayesRating'] + 
                             gamma * movies['logNumVotes'])

    top_recommendations = movies.sort_values(by='final_score', ascending=False).head(k)

    return list(top_recommendations['tconst'])