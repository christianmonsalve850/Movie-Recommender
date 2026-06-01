import './styles/MovieCard.css'
import Ratings from './Ratings';

interface Props {
    id: string,
    movie_title: string,
    genres: string[],
    poster_image: string,
    year: number,
    runtimeSeconds: number;
}

function MovieCard({id, movie_title, genres, poster_image, year, runtimeSeconds}: Props) {

    return (

        <div className='group card-container'>
            <div className='relative w-full h-3/4 top-0 rounded-t-xl overflow-hidden'>
                <img src={poster_image} alt={movie_title} className='movie-poster'/>
                <div className="poster-shadow">
                    <Ratings movieId={id} clear={false} />
                </div>
            </div>
            <div className='w-full h-1/4 bottom-0 rounded-b-xl p-4'>
                <h4 className='font-semibold text-lg pb-1 line-clamp-1'>{ movie_title }</h4>
                <span className='text-gray-500 text-sm block mb-1'>{ year } • { Math.floor(runtimeSeconds / 3600) }h { (runtimeSeconds / 60) % 60 }m</span>
                <div className='flex flex-wrap gap-1.5 mb-3'>
                    {genres?.slice(0, 3).map(genre => 
                        <span key={genre} className='text-gray-900 text-sm bg-gray-300 rounded-lg px-2 py-0.5'>{ genre }</span> 
                    )}
                </div>
            </div>
        </div>

  )
}

export default MovieCard;
