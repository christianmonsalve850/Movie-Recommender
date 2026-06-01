import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

interface LoadingProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

function MovieRecommendations({ isLoading, setIsLoading }: LoadingProps) {

  interface ImdbTitle {
    id: string;
    primaryTitle: string;
    primaryImage: {
      url: string;
    };
    startYear: number;
    runtimeSeconds: number;
    genres: string[];
    rating?: {
      aggregateRating: number;
      voteCount: number;
    };
  }

  const [movies, setMovies] = useState<ImdbTitle[]>([])
  const [selectedPage, setSelectedPage] = useState<number>(1)

  const { userId } = useParams<{ userId: string }>();
  const { refreshTrigger } = useAuth(); 

  const activeClass = 'border-2 bg-black text-white';
  const inactiveClass = 'border border-gray-300 bg-white text-black hover:bg-gray-100';
  const baseButtonClass = 'flex justify-center items-center w-10 h-10 rounded-3xl cursor-pointer transition-colors duration-200';
  
  const MOVIES_PER_PAGE = 20;
  
  const indexOfLastMovie = selectedPage * MOVIES_PER_PAGE;
  const indexOfFirstMovie = indexOfLastMovie - MOVIES_PER_PAGE;
  const currentMovies = movies.slice(indexOfFirstMovie, indexOfLastMovie);

  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const refreshMilestone = Math.floor(refreshTrigger / 5);
  
  useEffect(() => {
    setIsLoading(true);
    setSelectedPage(1);
    
    fetch(`http://127.0.0.1:5000/recommendations/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMovies(data.recommendations || []);
      })
      .catch((err) => {
        console.error("Error loading recommendations:", err);
      })
      .finally(() => setIsLoading(false));

  }, [userId, setIsLoading]);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);

    fetch(`http://127.0.0.1:5000/recommendations/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.recommendations || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))

  }, [refreshMilestone]);

  return (
    <>  
      <div className='h-full w-full'>
        {
          isLoading ? 
            <Loading /> :
            <div className='flex flex-col px-40 py-15'>
              <div className='grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-8 lg:gap-12 xl:gap-16'>
                { currentMovies.map(movie => 
                  <MovieCard 
                    id={movie.id}
                    key={movie.id}
                    movie_title={movie.primaryTitle} 
                    genres={movie.genres}
                    poster_image={movie.primaryImage?.url}
                    year={movie.startYear}
                    runtimeSeconds={movie.runtimeSeconds}
                  /> 
                )}
              </div> 
              
              {totalPages > 1 && (
                <div className='flex mt-10 w-full justify-center items-center'>
                  <div className='flex gap-2 justify-center items-center'>
                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          setSelectedPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`${baseButtonClass} ${
                          selectedPage === page ? activeClass : inactiveClass
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
        }
      </div>
    </>
  )
}

export default MovieRecommendations;