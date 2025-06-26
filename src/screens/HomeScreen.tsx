import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
  onStartGame: (playerCount: number) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const option1Scale = useRef(new Animated.Value(1)).current;
  const option2Scale = useRef(new Animated.Value(1)).current;
  const option3Scale = useRef(new Animated.Value(1)).current;

  const playerOptions = [
    { count: 2, title: '2 Kişilik Oyun', color: '#FF6B6B', icon: '👥', scale: option1Scale },
    { count: 3, title: '3 Kişilik Oyun', color: '#4ECDC4', icon: '👨‍👩‍👦', scale: option2Scale },
    { count: 4, title: '4 Kişilik Oyun', color: '#45B7D1', icon: '👨‍👩‍👧‍👦', scale: option3Scale },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleOptionPress = (count: number, scale: Animated.Value) => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onStartGame(count);
    });
  };

  const createPulseAnimation = (scale: Animated.Value) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{
                scale: scaleAnim.interpolate({
                  inputRange: [0.8, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <Text style={styles.title}>NumClash</Text>
          <Text style={styles.subtitle}>Matematik ve Strateji Oyunu</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.descriptionContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 30],
                })
              }]
            }
          ]}
        >
          <Text style={styles.descriptionTitle}>Nasıl Oynanır?</Text>
          <Text style={styles.descriptionText}>
            🎲 Zar at ve çıkan sayılarla işlem yap{'\n'}
            🎯 Hedef sayıya ulaşmaya çalış{'\n'}
            ⏱️ Her hamle için sadece 10 saniye var{'\n'}
            🏆 Hedefe ilk ulaşan kazanır!
          </Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          <Animated.Text 
            style={[
              styles.optionsTitle,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 20],
                  })
                }]
              }
            ]}
          >
            Kaç Kişi Oynayacak?
          </Animated.Text>
          
          {playerOptions.map((option, index) => (
            <Animated.View
              key={option.count}
              style={[
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 40 + (index * 10)],
                      })
                    },
                    { scale: option.scale }
                  ]
                }
              ]}
            >
              <TouchableOpacity
                style={[styles.optionButton, { borderColor: option.color }]}
                onPress={() => handleOptionPress(option.count, option.scale)}
                activeOpacity={0.9}
                onPressIn={() => {
                  Animated.spring(option.scale, {
                    toValue: 0.98,
                    tension: 300,
                    friction: 10,
                    useNativeDriver: true,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(option.scale, {
                    toValue: 1,
                    tension: 300,
                    friction: 10,
                    useNativeDriver: true,
                  }).start();
                }}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: option.color }]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      {option.count} oyuncu sırayla oynar
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7],
              }),
            }
          ]}
        >
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Description
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    textAlign: 'left',
  },

  // Options
  optionsContainer: {
    flex: 1,
  },
  optionsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 40,
    marginRight: 20,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },

  // Footer
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeScreen; 