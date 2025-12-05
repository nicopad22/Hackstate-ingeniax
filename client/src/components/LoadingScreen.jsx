import React from 'react';
import '../Loading.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loader"></div>
            <p>Loading experience...</p>
        </div>
    );
};

export default LoadingScreen;
