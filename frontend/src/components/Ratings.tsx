
import './styles/Ratings.css';
import { useEffect, useState } from 'react';
import { Fragment } from 'react';
import { useAuth } from './AuthContext';

function Ratings({movieId, clear}: {movieId: string, clear: boolean}) {
    const [rating, setRating] = useState<number>(0);
    const { currentUser, refreshRecommendations } = useAuth()

    const groupName = `rating-${movieId}`;

    async function rateMovie(value: number) {
        if (!currentUser) return;
        
        const response = await fetch("https://movie-recommender-production-7f63.up.railway.app/rate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                user_id: currentUser.id,
                tconst: movieId,
                rating: value
            })
        });

        if (response.ok) {
            setRating(value);
            refreshRecommendations();
        }
    }

    async function fetchRating() {
        if (!currentUser || !movieId) return;

        try {
            const response = await fetch(`https://movie-recommender-production-7f63.up.railway.app/rate?user_id=${encodeURIComponent(currentUser.id)}&tconst=${encodeURIComponent(movieId)}`);
            if (!response.ok) return;

            const data = await response.json();
            setRating(data.rating ? Number(data.rating) : 0);
        } catch (error) {
            console.error("Error loading rating:", error);
        }
    }

    useEffect(() => {
        fetchRating();
    }, [movieId, currentUser]);

    return (
        <div className='h-8 mx-2 mb-2 border-0 bg-#75beda flex justify-center items-center rounded-2xl bg-white/20' id={movieId}>
            <div className="rating">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((value) => (
                    <Fragment key={`${movieId}-star-${value}`}>
                        <input
                            id={`${movieId}-star-${value}`}
                            type="radio"
                            name={groupName}
                            value={value}
                            checked={rating === value}
                            onChange={() => rateMovie(value)}
                        />
                        <label htmlFor={`${movieId}-star-${value}`}>★</label>
                    </Fragment>
                ))}
            </div>
            <button 
                className={`cursor-pointer border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 font-medium rounded-xl px-4 py-2 text-sm transition-colors duration-200 ml-3 ${clear ? '' : 'hidden'}`}
                onClick={() => rateMovie(0)}
            >
                Clear
            </button>
        </div>
    );
}

export default Ratings;