import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Falha ao restaurar sessão:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, senha) => {
        try {
            const response = await api.post('/auth/login', { email, senha });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const updateUser = async (data) => {
        try {
            // Assuming endpoint is /auth/update or similar based on standard patterns
            const response = await api.put('/auth/update', data);
            const updatedUser = response.data;

            // Preserve photo if not returned
            const mergedUser = { ...user, ...updatedUser };

            localStorage.setItem('user', JSON.stringify(mergedUser));
            setUser(mergedUser);

            return mergedUser;
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    };

    const updateAvatar = async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await api.post('/auth/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { foto_url } = response.data;

            // Construct full URL if backend returns relative path
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const fullUrl = `\${baseUrl}\${foto_url}`;

            const updatedUser = { ...user, foto_url: fullUrl };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            return fullUrl;
        } catch (error) {
            console.error('Avatar update error:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, updateAvatar, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
