import { useEffect, useState } from "react"
import Loading from "./Loading";
import { useParams } from "react-router-dom";
import Ratings from "./Ratings";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

interface ImdbTitle {
    primaryTitle: string,
    primaryImage: {
      url: string;
    };
    plot: string,
    directors: {
        displayName: string;
    }[],
    writers: {
        displayName: string;
    }[],
    stars: {
        displayName: string;
    }[],
    interests: {
        name: string
    }[],
    runtimeSeconds: number,
    startYear: number;
}

function SingleMovie() {
    const [movie, setMovie] = useState<ImdbTitle | null>(null);
    const { movieId } = useParams<string>(); 
    const { currentUser } = useAuth()
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate()

    useEffect(() => {
        setLoading(true); 

        fetch(`https://api.imdbapi.dev/titles/${movieId}`)
        .then(res => res.json())
        .then(data => {setMovie(data)})
        .catch(console.error)
        .finally(() => setLoading(false))
    }, [movieId])

    if (loading) {
        return <Loading />
    }
    
    if (!movie && currentUser) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center py-20 px-4">
                <div className="text-gray-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                    </svg>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Movie Not Found</h1>
                <p className="text-gray-500 max-w-sm mb-6">
                    We couldn't find any details for this title. It might have been removed or the ID could be incorrect.
                </p>

                <button 
                    onClick={() => navigate(`/${currentUser.id}`)}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    return (
        <div className="flex my-20 font-sans">
            {movie ? 
                <div className="flex">

                    {movie.primaryImage?.url ? (
                        <img 
                            src={movie.primaryImage.url} 
                            alt={`${movie.primaryTitle} poster`} 
                            className="h-full w-100 rounded-lg float-left"
                        />
                    ) : (
                        <div className="h-full w-100 rounded-lg float-left flex items-center justify-center bg-gray-200 text-center text-sm font-medium text-gray-600">
                            No image available
                        </div>
                    )}

                    <div className="flex flex-col mx-10 my-2">
                        <div>
                            <h1 className="text-4xl font-bold mb-1">{movie.primaryTitle}</h1>
                            <p className="mb-4">
                                {movie.startYear} • {Math.floor(movie.runtimeSeconds / 3600)}h {Math.floor((movie.runtimeSeconds / 60) % 60)}m
                            </p>
                            
                            <p className="text-md mb-4">
                                <span className="font-bold">Plot:</span> {movie.plot ? movie.plot : " Unknown"}
                            </p>
                            
                            <p className="text-md">
                                <span className="font-bold">Director: </span>
                                {movie.directors ? movie.directors.map(d => d.displayName).join(", ") : " Unknown"}
                            </p>
                            
                            <p className="text-md">
                                <span className="font-bold">Writer: </span>
                                {movie.writers ? movie.writers.map(w => w.displayName).join(", ") : " Unknown"}
                            </p>
                            
                            <p className="text-md">
                                <span className="font-bold">Stars:</span>
                                {movie.stars ? movie.stars.map(s => s.displayName).join(", ") : " Unknown"}
                            </p>
                            
                            <div className="flex gap-3 flex-wrap mt-5">
                                {movie.interests ? movie.interests.map((genre, index) =>  (
                                <div key={index} className="inline-block bg-gray-300 px-3 py-0.5 rounded-lg">
                                    {genre.name}
                                </div>
                                )) : " Unknown"}
                            </div>
                            
                            <div className="flex flex-col items-start mt-5">
                                <h2 className="text-lg font-semibold">Rate</h2>
                                <div className="flex justify-center items-center">
                                    <Ratings movieId={movieId!} clear={true} /> 
                                </div>                                
                            </div>
                        </div>
                    </div>
                </div>
            : null} 
        </div>
    )
}

export default SingleMovie