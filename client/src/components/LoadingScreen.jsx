import React from 'react';
import '../Loading.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loader"></div>
            <p>Cargando experiencia...</p>
        </div>
    );
};

export default LoadingScreen;
