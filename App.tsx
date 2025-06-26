/**
 * NumClash - Zar ve İşlem Strateji Oyunu
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import NumClashScreen from './src/screens/NumClashScreen';

type AppScreen = 'home' | 'game';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [playerCount, setPlayerCount] = useState<number>(2);

  const handleStartGame = (count: number) => {
    setPlayerCount(count);
    setCurrentScreen('game');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa" 
        translucent={false}
      />
      
      {currentScreen === 'home' ? (
        <HomeScreen onStartGame={handleStartGame} />
      ) : (
        <NumClashScreen 
          playerCount={playerCount} 
          onBackToHome={handleBackToHome} 
        />
      )}
    </>
  );
};

export default App;
