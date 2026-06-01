import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
    id: string;
    name: string;
    avatar: string;
}

interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    logout: () => void;
    refreshRecommendations: () => void;
    refreshTrigger: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children} : {children: ReactNode}) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    useEffect(() => {
        const savedUser = localStorage.getItem('moviehub_user');
        if (savedUser) {
            try {
                setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse saved user session", e);
            }
        }
    }, []);

    const handleSetUser = (user: User | null) => {
        setCurrentUser(user);
        if (user) {
            localStorage.setItem('moviehub_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('moviehub_user');
        }
    };

    const logout = () => {
        handleSetUser(null);
    }

    const refreshRecommendations = () => {
        setRefreshTrigger(prev => prev + 1);
    }

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser: handleSetUser, logout, refreshRecommendations, refreshTrigger }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}