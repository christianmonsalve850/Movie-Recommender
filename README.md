# Scalable Movie & TV Recommendation Pipeline

## Overview

<p>This project implements an end-to-end data analysis and data science pipeline for movie and TV analytics using Python. The system ingests raw datasets, performs cleaning and feature engineering, and builds a content-based recommendation system using a single user's ratings. The project emphasizes analytical rigor, interpretability, and clean project structure.</p>

## Objective

<p>The primary goal of this project is to demonstrate strong data analysis, feature engineering, and recommendation system design skills using real-world datasets. The recommender does not rely on other users' ratings; instead, it models user preferences directly from item features, making it robust, explainable, and suitable for small-to-medium scale datasets.</p>

## Tech Stack

<ul>
<li>Python</li>
<li>IMDb / TMDb datasets</li>
<li>Pandas (final aggregation & visualization)</li>
<li>Matplotlib</li>
<li>Jupyter Notebooks</li>
</ul>

## Project Architecture

<p>The project is structured to separate raw data, processing logic, analysis, and modeling.</p>

---

## Project Workflow

### 1. Data Exploration & Preparation
- Load datasets into Pandas
- Inspect structure, missing values, and distributions
- Clean and normalize relevant fields

### 2. Exploratory Data Analysis (EDA)
- Release trends over time
- Genre popularity and rating distributions

### 3. Feature Engineering
- One-hot encode genres and categorical features
- Normalize numerical attributes
- Assemble feature matrices using Scikit-learn

### 4. User Preference Modeling
- Build a user profile from personal ratings
- Compute a weighted preference vector

### 5. Recommendation System
- Compute cosine similarity between user profile and unseen movies
- Rank top-N recommendations

---

## Author

<p>Christian Monsalve</p>