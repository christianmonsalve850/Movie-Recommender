import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_user_profile(user_id):
    csv_path = os.path.normpath(os.path.join(BASE_DIR, '..', 'user_data', 'user_data.csv'))
    data = pd.read_csv(csv_path)
    data = data[data['user_id'] == user_id].drop(columns=['user_id'])
    if data.shape[0] < 5:
        return None
    return data

def get_movie_features():
    csv_path = os.path.normpath(os.path.join(BASE_DIR, '..', 'data', 'processed', 'new_movie_features.csv'))

    data = pd.read_csv(csv_path)
    return data

def generate_user_vector(user_id):

    user_profile = get_user_profile(user_id=user_id)

    if user_profile is None: return None

    data = get_movie_features()
    data = user_profile.merge(data, how='left', on='tconst')

    features = data.select_dtypes(include=['float64', 'int64'])

    user_mean = features['userRating'].mean()
    userRatings = data['userRating']
    weight = userRatings - user_mean

    features = features.drop(columns=['userRating', 'numVotes'])

    to_standardize = ['year', 'runtimeMinutes', 'logNumVotes', 'averageRating', 'releaseDecade', 'runtime_bin', 'bayesRating']
    scaler = StandardScaler()
    features[to_standardize] = scaler.fit_transform(features[to_standardize])

    weighted_features = features.multiply(weight, axis=0)
    user_vector_numerator = weighted_features.sum()
    denominator = weight.abs().sum()
    user_vector = user_vector_numerator / denominator
    
    return user_vector, scaler

def get_recommendations(user_id, k=4):
    movies = get_movie_features()
    user_profile = get_user_profile(user_id)
    if user_profile is None: return None
    
    user_vector, scaler = generate_user_vector(user_id)

    to_standardize = ['year', 'runtimeMinutes', 'logNumVotes', 'averageRating', 'releaseDecade', 'runtime_bin', 'bayesRating']

    movies = movies[~movies['tconst'].isin(user_profile['tconst'])].query('year > 1950')
    movies = movies.drop(columns='numVotes')
    movies = movies.select_dtypes(include=['float64', 'int64'])
    movies[to_standardize] = scaler.transform(movies[to_standardize])

    user_vector_2d = np.array(user_vector).reshape(1, -1)

    movies['cosineSimilarity'] = cosine_similarity(np.array(movies), user_vector_2d)

    alpha = 0.9
    beta = 0.05
    gamma = 0.05
    movies['final_score'] = alpha * movies['cosineSimilarity'] + \
                beta * movies['bayesRating'] + \
                gamma * movies['logNumVotes']

    sorted_movies_by_similarity = movies.sort_values(by='final_score', ascending=False)

    movie_names = get_movie_features()

    movie_names = movie_names[~movie_names['tconst'].isin(user_profile['tconst'])]
    movie_names = movie_names[['tconst', 'primaryTitle']]

    index = sorted_movies_by_similarity.head(k).index

    return list(movie_names.loc[index].tconst)

