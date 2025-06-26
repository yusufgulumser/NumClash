import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Animated,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface LinearProgressProps {
  duration: number;
  color: string;
  onComplete: () => void;
  isActive: boolean;
}

const LinearProgress: React.FC<LinearProgressProps> = ({ duration, color, onComplete, isActive }) => {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      setProgress(100);
      let currentProgress = 100;
      const decrementAmount = 100 / duration;
      
      intervalRef.current = setInterval(() => {
        currentProgress -= decrementAmount;
        setProgress(Math.max(0, currentProgress));
        
        if (currentProgress <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, duration]);

  return (
    <View style={styles.progressBarBackground}>
      <View 
        style={[
          styles.progressBar, 
          { 
            backgroundColor: color,
            width: `${progress}%`,
          }
        ]} 
      />
    </View>
  );
};

interface Player {
  id: number;
  name: string;
  currentNumber: number;
  color: string;
}

interface GameState {
  players: Player[];
  targetNumber: number;
  currentPlayerIndex: number;
  diceResults: [number, number] | null;
  diceCalculationResult: number | null;
  winner: Player | null;
  gameStarted: boolean;
  gamePhase: 'roll' | 'dice-operation' | 'final-operation';
}

type Operation = '+' | '-' | '*' | '/';

interface GameMove {
  playerId: number;
  diceResults: [number, number];
  diceOperation: Operation;
  diceCalculationResult: number;
  finalOperation: Operation;
  previousNumber: number;
  newNumber: number;
}

const INITIAL_PLAYER_NUMBER = 5;
const MIN_TARGET = 50;
const MAX_TARGET = 500;
const DICE_OPERATION_TIMER = 5;
const FINAL_OPERATION_TIMER = 5;

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const generateTargetNumber = (): number => {
  return Math.floor(Math.random() * (MAX_TARGET - MIN_TARGET + 1) + MIN_TARGET);
};

const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

const rollTwoDice = (): [number, number] => {
  return [rollDice(), rollDice()];
};

const initializeGame = (playerCount: number, customNames?: string[]): GameState => {
  const targetNumber = generateTargetNumber();
  const startingPlayerIndex = Math.floor(Math.random() * playerCount);

  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: i + 1,
      name: customNames?.[i]?.trim() || `Oyuncu ${i + 1}`,
      currentNumber: INITIAL_PLAYER_NUMBER,
      color: PLAYER_COLORS[i],
    });
  }

  return {
    players,
    targetNumber,
    currentPlayerIndex: startingPlayerIndex,
    diceResults: null,
    diceCalculationResult: null,
    winner: null,
    gameStarted: true,
    gamePhase: 'roll',
  };
};

const applyOperation = (
  number1: number,
  number2: number,
  operation: Operation
): number => {
  let result: number;

  switch (operation) {
    case '+':
      result = number1 + number2;
      break;
    case '-':
      result = Math.abs(number1 - number2);
      break;
    case '*':
      result = number1 * number2;
      break;
    case '/':
      if (number2 === 0) {
        throw new Error('Sıfıra bölme yapılamaz!');
      }
      if (number1 % number2 !== 0) {
        throw new Error('Tam bölme yapılamaz!');
      }
      result = number1 / number2;
      break;
    default:
      throw new Error('Geçersiz işlem!');
  }

  return result;
};

const canDivide = (number1: number, number2: number): boolean => {
  if (number2 === 0) return false;
  return number1 % number2 === 0;
};

const rollDiceForGame = (gameState: GameState): GameState => {
  const diceResults = rollTwoDice();
  
  return {
    ...gameState,
    diceResults,
    gamePhase: 'dice-operation',
  };
};

const applyDiceOperation = (
  gameState: GameState,
  operation: Operation
): GameState => {
  if (!gameState.diceResults) {
    throw new Error('Önce zar atmalısınız!');
  }

  const [dice1, dice2] = gameState.diceResults;
  const diceCalculationResult = applyOperation(dice1, dice2, operation);

  return {
    ...gameState,
    diceCalculationResult,
    gamePhase: 'final-operation',
  };
};

const applyFinalMove = (
  gameState: GameState,
  operation: Operation
): GameState => {
  if (!gameState.diceCalculationResult) {
    throw new Error('Önce zar işlemi yapmalısınız!');
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const newNumber = applyOperation(
    currentPlayer.currentNumber,
    gameState.diceCalculationResult,
    operation
  );

  const updatedPlayers = gameState.players.map(player =>
    player.id === currentPlayer.id
      ? { ...player, currentNumber: newNumber }
      : player
  );

  const winner = newNumber === gameState.targetNumber ? currentPlayer : null;

  const nextPlayerIndex = winner
    ? gameState.currentPlayerIndex
    : (gameState.currentPlayerIndex + 1) % gameState.players.length;

  return {
    ...gameState,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    diceResults: null,
    diceCalculationResult: null,
    winner,
    gamePhase: 'roll',
  };
};

const getCurrentPlayer = (gameState: GameState): Player => {
  return gameState.players[gameState.currentPlayerIndex];
};

const getDiceFace = (number: number): string => {
  const diceFaces = {
    1: '⚀',
    2: '⚁', 
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  };
  return diceFaces[number as keyof typeof diceFaces] || '⚀';
};

interface NumClashScreenProps {
  playerCount: number;
  onBackToHome: () => void;
}

const NumClashScreen: React.FC<NumClashScreenProps> = ({ playerCount, onBackToHome }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [showPlayerNamesModal, setShowPlayerNamesModal] = useState(true);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(playerCount).fill(''));
  const [isRolling, setIsRolling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentTimer, setCurrentTimer] = useState<'dice' | 'final'>('dice');
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const dice1Animation = new Animated.Value(0);
  const dice2Animation = new Animated.Value(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const currentPlayerScale = useRef(new Animated.Value(1)).current;
  const targetBounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeNewGame();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [playerCount]);

  useEffect(() => {
    if (showOperationsModal && gameState) {
      if (gameState.gamePhase === 'dice-operation') {
        setCurrentTimer('dice');
        startTimer(DICE_OPERATION_TIMER);
      } else if (gameState.gamePhase === 'final-operation') {
        setCurrentTimer('final');
        startTimer(FINAL_OPERATION_TIMER);
      }
    } else {
      stopTimer();
    }
    
    return () => {
      stopTimer();
    };
  }, [showOperationsModal, gameState?.gamePhase]);

  useEffect(() => {
    if (gameState) {
      startActivePlayerAnimations();
      
      Animated.sequence([
        Animated.spring(targetBounce, {
          toValue: 1.1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(targetBounce, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [gameState?.currentPlayerIndex]);

  const startActivePlayerAnimations = () => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();

    Animated.spring(currentPlayerScale, {
      toValue: 1.05,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  };

  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startTimer = (duration: number) => {
    stopTimer();
    
    setTimeLeft(duration);
    setIsTimerActive(true);

    let countdown = duration;
    timerRef.current = setInterval(() => {
      countdown -= 1;
      setTimeLeft(countdown);
      
      if (countdown <= 3 && countdown > 0) {
        startShakeAnimation();
      }
      
      if (countdown <= 0) {
        return;
      }
    }, 1000);
  };

  const stopTimer = () => {
    setIsTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeUp = () => {
    if (!gameState) return;
    
    stopTimer();
    
    const operations: Operation[] = ['+', '-', '*', '/'];
    let validOperations: Operation[] = [];

    if (gameState.gamePhase === 'dice-operation' && gameState.diceResults) {
      validOperations = operations.filter(op => canUseDiceOperation(op));
      
      if (validOperations.length > 0) {
        const randomOperation = validOperations[Math.floor(Math.random() * validOperations.length)];
        console.log('Otomatik zar işlemi:', randomOperation, 'Seçenekler:', validOperations);
        
        // Otomatik işlemi uygula
        try {
          const newGameState = applyDiceOperation(gameState, randomOperation);
          setGameState(newGameState);
  
        } catch (error) {
          console.error('Otomatik zar işlemi hatası:', error);
        }
      }
    } else if (gameState.gamePhase === 'final-operation' && gameState.diceCalculationResult !== null) {
      validOperations = operations.filter(op => canUseFinalOperation(op));
      
      if (validOperations.length > 0) {
        const randomOperation = validOperations[Math.floor(Math.random() * validOperations.length)];
        console.log('Otomatik final işlemi:', randomOperation, 'Seçenekler:', validOperations);
        
        // Otomatik işlemi uygula
        try {
          const newGameState = applyFinalMove(gameState, randomOperation);
          setGameState(newGameState);
          setShowOperationsModal(false);

          // Kazanan kontrolü
          if (newGameState.winner) {
            setTimeout(() => {
              Alert.alert(
                '🎉 Tebrikler!',
                `${newGameState.winner!.name} oyunu kazandı!`,
                [
                  {
                    text: 'Ana Sayfa',
                    onPress: onBackToHome,
                  },
                  {
                    text: 'Yeni Oyun',
                    onPress: initializeNewGame,
                  },
                ]
              );
            }, 500);
          }
        } catch (error) {
          console.error('Otomatik final işlemi hatası:', error);
        }
      }
    }
  };

  const initializeNewGame = () => {
    const newGame = initializeGame(playerCount);
    setGameState(newGame);
    setShowOperationsModal(false);
    stopTimer();
    
    // Oyun başlangıç animasyonu
    Animated.parallel([
      Animated.spring(currentPlayerScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rollDiceAction = async () => {
    if (!gameState || isRolling || gameState.gamePhase !== 'roll') return;

    setIsRolling(true);
    
    // İki zar animasyonu - daha dramatik
    Animated.parallel([
      Animated.sequence([
        Animated.timing(dice1Animation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dice1Animation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dice1Animation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dice1Animation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dice1Animation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dice1Animation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(dice2Animation, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dice2Animation, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dice2Animation, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dice2Animation, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dice2Animation, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dice2Animation, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => {
      const newGameState = rollDiceForGame(gameState);
      setGameState(newGameState);
      setIsRolling(false);
      setShowOperationsModal(true);
    }, 1000);
  };

  const selectDiceOperation = (operation: Operation) => {
    if (!gameState || !gameState.diceResults || gameState.gamePhase !== 'dice-operation') {
      return;
    }

    const [dice1, dice2] = gameState.diceResults;

    // Bölme işlemi kontrolü - sadece sıfıra bölme ve tam bölme kontrolü
    if (operation === '/') {
      if (dice2 === 0) {
        Alert.alert('Hata', 'Sıfıra bölme yapılamaz!');
        return;
      }
      if (dice1 % dice2 !== 0) {
        Alert.alert('Hata', 'Tam bölme yapılamaz! Başka bir işlem seçin.');
        return;
      }
    }

    try {
      const newGameState = applyDiceOperation(gameState, operation);
      setGameState(newGameState);
      // Timer'ı durdur, useEffect yeni aşama için timer başlatacak
      stopTimer();
    } catch (error) {
      Alert.alert('Hata', (error as Error).message);
    }
  };

  const selectFinalOperation = (operation: Operation) => {
    if (!gameState || gameState.diceCalculationResult === null || gameState.gamePhase !== 'final-operation') {
      return;
    }

    const currentPlayer = getCurrentPlayer(gameState);

    // Bölme işlemi kontrolü - sadece sıfıra bölme ve tam bölme kontrolü
    if (operation === '/' && !canDivide(currentPlayer.currentNumber, gameState.diceCalculationResult)) {
      Alert.alert('Hata', 'Bu işlem yapılamaz! Başka bir işlem seçin.');
      return;
    }

    try {
      const newGameState = applyFinalMove(gameState, operation);
      setGameState(newGameState);
      setShowOperationsModal(false);
      stopTimer();

      // Kazanan kontrolü
      if (newGameState.winner) {
        setTimeout(() => {
          Alert.alert(
            '🎉 Tebrikler!',
            `${newGameState.winner!.name} oyunu kazandı!`,
            [
              {
                text: 'Ana Sayfa',
                onPress: onBackToHome,
              },
              {
                text: 'Yeni Oyun',
                onPress: initializeNewGame,
              },
            ]
          );
        }, 500);
      }
    } catch (error) {
      Alert.alert('Hata', (error as Error).message);
    }
  };

  const getOperationSymbol = (op: Operation): string => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return '+';
    }
  };

  const canUseDiceOperation = (operation: Operation): boolean => {
    if (!gameState || !gameState.diceResults) return false;
    
    const [dice1, dice2] = gameState.diceResults;
    
    if (operation === '/') {
      // Sıfıra bölme yapılamaz ve tam bölme gerekli
      if (dice2 === 0) return false;
      return dice1 % dice2 === 0;
    }
    
    // Diğer işlemler (0 dahil) her zaman yapılabilir
    return true;
  };

  const canUseFinalOperation = (operation: Operation): boolean => {
    if (!gameState || gameState.diceCalculationResult === null) return false;
    
    const currentPlayer = getCurrentPlayer(gameState);
    
    if (operation === '/') {
      return canDivide(currentPlayer.currentNumber, gameState.diceCalculationResult);
    }
    
    // Diğer işlemler (0 dahil) her zaman yapılabilir
    return true;
  };

  // Player Names Modal
  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const startGameWithNames = () => {
    // En az bir karakter girilmiş mi kontrol et
    if (playerNames.some(name => name.trim() === '')) {
      Alert.alert('Uyarı', 'Lütfen tüm oyuncu isimlerini girin!');
      return;
    }
    
    setShowPlayerNamesModal(false);
    const initialState = initializeGame(playerCount, playerNames);
    setGameState(initialState);
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Oyun yükleniyor...</Text>
      </View>
    );
  }

  const currentPlayer = getCurrentPlayer(gameState);

  // Çoklu oyuncu için vertical scrollable layout
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Modal
        visible={showPlayerNamesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.playerNamesModalContent}>
            <Text style={styles.modalTitle}>Oyuncu İsimleri</Text>
            <Text style={styles.modalSubtitle}>Oyuna başlamadan önce isimleri girin</Text>
            
            {Array(playerCount).fill(0).map((_, index) => (
              <View key={index} style={styles.playerNameInputContainer}>
                <View style={[styles.playerColorIndicator, { backgroundColor: PLAYER_COLORS[index] }]} />
                <TextInput
                  style={styles.playerNameInput}
                  placeholder={`Oyuncu ${index + 1}`}
                  value={playerNames[index]}
                  onChangeText={(text) => handlePlayerNameChange(index, text)}
                  maxLength={15}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.startGameButton}
              onPress={startGameWithNames}
            >
              <Text style={styles.startGameButtonText}>OYUNU BAŞLAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity style={styles.homeButton} onPress={onBackToHome}>
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.gameLayout}>
        
        {/* Hedef - Her zaman üstte */}
        <Animated.View 
          style={[
            styles.targetSection,
            {
              transform: [{ scale: targetBounce }]
            }
          ]}
        >
          <Text style={styles.targetLabel}>HEDEF</Text>
          <Text style={styles.targetNumber}>{gameState.targetNumber}</Text>
        </Animated.View>

        {/* Ana Oyun Alanı */}
        <View style={styles.gameContent}>
          
          {/* Sol: Oyuncular */}
          <View style={styles.playersContainer}>
            {gameState.players.map((player, index) => {
              const isCurrentPlayer = gameState.currentPlayerIndex === index;
              
              return (
                <Animated.View 
                  key={player.id} 
                  style={[
                    styles.playerSection,
                    {
                      transform: [
                        { 
                          scale: isCurrentPlayer ? pulseAnim : 1
                        },
                        {
                          translateX: isCurrentPlayer ? shakeAnim : 0
                        }
                      ]
                    }
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.playerCard, 
                      { 
                        backgroundColor: player.color + '20',
                        shadowColor: isCurrentPlayer ? player.color : '#000',
                        shadowOpacity: isCurrentPlayer ? glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0.6],
                        }) : 0.1,
                        borderWidth: isCurrentPlayer ? 3 : 1,
                        borderColor: isCurrentPlayer ? player.color : 'transparent',
                      }
                    ]}
                  >
                    {isCurrentPlayer && (
                      <Animated.View
                        style={[
                          styles.activePlayerIndicator,
                          {
                            backgroundColor: player.color,
                            opacity: glowAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 0.8],
                            }),
                          }
                        ]}
                      />
                    )}
                    <Text style={[styles.playerName, { color: player.color }]}>
                      {player.name} {isCurrentPlayer ? '👑' : ''}
                    </Text>
                    <Text style={[styles.playerNumber, { color: player.color }]}>
                      {player.currentNumber}
                    </Text>
                    {isCurrentPlayer && (
                      <Text style={[styles.currentPlayerLabel, { color: player.color }]}>
                        SİRAN!
                      </Text>
                    )}
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>

          {/* Sağ: Zarlar ve Kontroller */}
          <View style={styles.controlsContainer}>
            
            {/* Zarlar */}
            <Animated.View 
              style={[
                styles.diceContainer,
                {
                  transform: [{ scale: fadeAnim }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.diceButton, 
                  (isRolling || gameState.gamePhase !== 'roll') && styles.diceButtonDisabled
                ]}
                onPress={rollDiceAction}
                disabled={isRolling || gameState.gamePhase !== 'roll'}
              >
                <View style={styles.diceRow}>
                  <Animated.View
                    style={[
                      styles.dice,
                      styles.activeDice,
                      {
                        transform: [{
                          rotateY: dice1Animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        }],
                      },
                    ]}
                  >
                    <Text style={styles.diceText}>
                      {gameState.diceResults ? getDiceFace(gameState.diceResults[0]) : '🎲'}
                    </Text>
                    {gameState.diceResults && (
                      <Text style={styles.diceNumber}>{gameState.diceResults[0]}</Text>
                    )}
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.dice,
                      styles.activeDice,
                      {
                        transform: [{
                          rotateY: dice2Animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        }],
                      },
                    ]}
                  >
                    <Text style={styles.diceText}>
                      {gameState.diceResults ? getDiceFace(gameState.diceResults[1]) : '🎲'}
                    </Text>
                    {gameState.diceResults && (
                      <Text style={styles.diceNumber}>{gameState.diceResults[1]}</Text>
                    )}
                  </Animated.View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Boşluk için Spacer */}
            <View style={styles.spacer} />

            {/* Aktif Oyuncu Gösterisi - Modern Tasarım */}
            <Animated.View 
              style={[
                styles.currentPlayerWrapper,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={[currentPlayer.color, currentPlayer.color + '90']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.currentPlayerGradient}
              >
                <View style={styles.currentPlayerContent}>
                  <View style={styles.currentPlayerIcon}>
                    <Text style={styles.currentPlayerEmoji}>👑</Text>
                  </View>
                  <View style={styles.currentPlayerTextContainer}>
                    <Text style={styles.currentPlayerLabel}>SIRA</Text>
                    <Text style={styles.currentPlayerName}>{currentPlayer.name}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

          </View>
        </View>

      </View>

      {/* Operations Modal */}
      <Modal
        visible={showOperationsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOperationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                borderTopColor: currentPlayer.color,
                transform: [{ translateY: shakeAnim }]
              }
            ]}
          >
            
            {/* Progress Bar ve Timer */}
            <View style={styles.timerContainer}>
              <LinearProgress
                duration={currentTimer === 'dice' ? DICE_OPERATION_TIMER : FINAL_OPERATION_TIMER}
                color={currentPlayer.color}
                onComplete={handleTimeUp}
                isActive={isTimerActive}
              />
              <View style={styles.timerInfo}>
                <Animated.Text 
                  style={[
                    styles.timerText, 
                    { 
                      color: currentPlayer.color,
                      transform: [{ scale: timeLeft <= 3 ? pulseAnim : 1 }]
                    }
                  ]}
                >
                  {timeLeft}s
                </Animated.Text>
                <Text style={styles.timerPhaseText}>
                  {currentTimer === 'dice' ? 'Zar İşlemi' : 'Ana Sayı İşlemi'}
                </Text>
              </View>
            </View>
            
            {gameState.gamePhase === 'dice-operation' && gameState.diceResults && (
              <>
                <Text style={styles.modalTitle}>Zarları Hesapla</Text>
                <Text style={styles.modalSubtitle}>
                  {gameState.diceResults[0]} ? {gameState.diceResults[1]} = ?
                </Text>
                
                <View style={styles.modalOperationsGrid}>
                  {(['+', '-', '*', '/'] as Operation[]).map((operation) => (
                    <TouchableOpacity
                      key={operation}
                      style={[
                        styles.modalOperationButton,
                        !canUseDiceOperation(operation) && styles.modalOperationButtonDisabled,
                        { borderColor: canUseDiceOperation(operation) ? currentPlayer.color : '#ddd' }
                      ]}
                      onPress={() => selectDiceOperation(operation)}
                      disabled={!canUseDiceOperation(operation)}
                    >
                      <Text style={[
                        styles.modalOperationText,
                        { color: canUseDiceOperation(operation) ? currentPlayer.color : '#ccc' }
                      ]}>
                        {getOperationSymbol(operation)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {gameState.gamePhase === 'final-operation' && gameState.diceCalculationResult !== null && (
              <>
                <Text style={styles.modalTitle}>Ana Sayınla İşlem Yap</Text>
                <Text style={styles.modalSubtitle}>
                  Zar Sonucu: {gameState.diceCalculationResult}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {currentPlayer.currentNumber} ? {gameState.diceCalculationResult} = ?
                </Text>
                
                <View style={styles.modalOperationsGrid}>
                  {(['+', '-', '*', '/'] as Operation[]).map((operation) => (
                    <TouchableOpacity
                      key={operation}
                      style={[
                        styles.modalOperationButton,
                        !canUseFinalOperation(operation) && styles.modalOperationButtonDisabled,
                        { borderColor: canUseFinalOperation(operation) ? currentPlayer.color : '#ddd' }
                      ]}
                      onPress={() => selectFinalOperation(operation)}
                      disabled={!canUseFinalOperation(operation)}
                    >
                      <Text style={[
                        styles.modalOperationText,
                        { color: canUseFinalOperation(operation) ? currentPlayer.color : '#ccc' }
                      ]}>
                        {getOperationSymbol(operation)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            
          </Animated.View>
        </View>
      </Modal>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  homeButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  homeIcon: {
    fontSize: 24,
    color: '#666',
  },

  // Game Layout - Responsive and flexible
  gameLayout: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  // Players Container - Left side, takes remaining space
  playersContainer: {
    flex: 1,
    paddingRight: 12,
  },
  playerSection: {
    marginVertical: 6,
  },
  activePlayerSection: {
    transform: [{ scale: 1.05 }],
  },
  playerCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  activePlayerIndicator: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 15,
    opacity: 0.3,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  playerNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentPlayerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 5,
    letterSpacing: 1.5,
  },

  // Dice Container - Well sized and positioned
  diceContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  diceButton: {},
  diceButtonDisabled: {
    opacity: 0.4,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 15,
  },
  dice: {
    width: 70,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#e9ecef',
  },
  activeDice: {
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
  },
  diceText: {
    fontSize: 22,
    marginBottom: 3,
  },
  diceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
  },

  // Target Section - Always at top, compact
  targetSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 15,
    alignSelf: 'center',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  targetNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },

  currentPlayerWrapper: {
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  currentPlayerGradient: {
    borderRadius: 20,
  },
  currentPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  currentPlayerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPlayerEmoji: {
    fontSize: 18,
  },
  currentPlayerTextContainer: {
    justifyContent: 'center',
  },
  currentPlayerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    opacity: 0.8,
    letterSpacing: 2,
  },
  currentPlayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 4,
    padding: 30,
    minHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  
  // Timer ve Progress Bar
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  timerInfo: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerPhaseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 5,
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  modalSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#495057',
    fontWeight: '500',
  },
  modalOperationsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalOperationButton: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  modalOperationButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    shadowOpacity: 0.05,
  },
  modalOperationText: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  // Game Content
  gameContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },

  // Controls Container - Right side, better proportioned
  controlsContainer: {
    width: width * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  // Spacer - creates space between dice and current player indicator
  spacer: {
    height: 20,
  },

  playerNamesModalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    width: '90%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  playerNameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  playerColorIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerNameInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    fontSize: 16,
    color: '#495057',
    backgroundColor: '#f8f9fa',
  },
  startGameButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 15,
    marginTop: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  startGameButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default NumClashScreen; 