import { useState, useRef } from 'react';
import './styles/NavBar.css'
import { Film, Search } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface MovieData {
  tconst: string,
  primaryTitle: string;
  year: number;
}

interface LoadingProps {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

function NavBar({ setIsLoading }: LoadingProps) {

  const navigate = useNavigate();

  const { currentUser, logout } = useAuth()
  const currentPath = window.location.pathname;

  const clickMainPage = () => {
    if (!currentUser) return;

    if (currentPath === `/${currentUser.id}`) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    navigate(`/${currentUser.id}`);
  };

  const [searchQuery, setSearchQuery] = useState("");

  const [autocomplete, setAutocomplete] = useState<MovieData[]>([])

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/movies?search=${searchTerm}`);
      const data = await response.json();
      
      if (searchTerm.length < 2) {
        setAutocomplete([])
      } else {
        setAutocomplete(data.slice(0, 5))
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery]);

  const [isFocused, setIsFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, []);

  const handleSearchClick = (id: string) => {
    navigate(`/movies/${id}`);
    setSearchQuery('');
  };

  return (
    <>
      <div className='flex px-40 py-5 justify-between border-b border-gray-300 sticky top-0 bg-white-smoke/70 backdrop-blur z-10'>
        <div className='flex items-center'>
          <Film className="w-9 h-9 mr-1" />
          <button className='text-3xl font-semibold cursor-pointer' onClick={() => clickMainPage()}>MovieHub</button>
        </div> 
        <div className='flex'>
          <div className="relative" ref={searchWrapperRef}>
            <form action="POST" onSubmit={() => {handleSearch(searchQuery);}}>
              <input 
                id='search-input'
                className='search-bar' 
                type="text" 
                placeholder='Search movies...'
                autoComplete='off'
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className='absolute text-gray-500 left-3 top-1/2 w-5 h-5 -translate-y-1/2' />
              { isFocused && searchQuery.length > 1 && (
                <div id='suggestion-box' className='absolute z-20 w-lg bg-gray-200 -translate-y-1.5 rounded-b-lg'>
                  <ul className='cursor-pointer text-sm leading-tight font-medium'>
                    {autocomplete && autocomplete.map((movie: MovieData, index: number) => 
                      <li 
                        key={index}
                        onClick={() => handleSearchClick(movie.tconst)}
                        className={`pl-10 py-3 hover:bg-gray-300 
                          ${ index === 0 ? 'border-t-2 border-t-gray-300' : '' }
                          ${ index === autocomplete.length - 1 ? 'rounded-b-lg' : ''}`}
                        >
                          <span className="truncate mr-4 text-gray-900">
                            { movie.primaryTitle }
                          </span>

                          {movie.year && (
                            <span className="text-gray-500 font-normal shrink-0">
                              { movie.year }
                            </span>
                          )}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </form>
          </div>
        </div>
        <div className='flex items-center'>
          {currentUser && (
            <button 
              type="button" 
              onClick={() => {
                logout();               
                navigate('/'); 
              }}
              className="flex h-full items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default NavBar;
