import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Dimensions, Animated, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import Svg, { Polygon, Circle, Rect } from 'react-native-svg';

const STAR_SIZE = 50;
const COMET_SIZE = 40;
const COMET_SPEED = 3000;

const loadFonts = async () => {
  await Font.loadAsync({
    'Cinzel-SemiBold': require('./assets/fonts/Cinzel/static/Cinzel-SemiBold.ttf'),
  });
};

const App = () => {
  const [stars, setStars] = useState([]);
  const [comets, setComets] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showMainScreen, setShowMainScreen] = useState(true);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [cometInterval, setCometInterval] = useState(null); 
  const scoreTextRef = useRef(null);

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const onChange = ({ window }) => {
      setWidth(window.width);
      setHeight(window.height);
    };
    Dimensions.addEventListener('change', onChange);
    return () => {
      Dimensions.removeEventListener('change', onChange);
    };
  }, []);

  useEffect(() => {
    loadFonts().then(() => setIsFontLoaded(true)); 
  }, []);

  useEffect(() => {
    if (!showMainScreen) {
      const starInterval = setInterval(addStar, 500);
      setCometInterval(setCometTimeout()); 

      return () => {
        clearInterval(starInterval);
        clearTimeout(cometInterval);
      };
    }
  }, [showMainScreen]);

  const setCometTimeout = () => {
    if (gameOver) return;

    const randomTime = getRandomTime();
    const cometTimeout = setTimeout(() => {
      addComet();
      setCometTimeout();
    }, randomTime);

    return cometTimeout;
  };

  const addStar = () => {
    if (gameOver) return;

    // Get the score text dimensions
    const scoreTextHeight = scoreTextRef.current ? scoreTextRef.current.offsetHeight : 0;

    const x = Math.random() * (width - STAR_SIZE);
    const y = Math.random() * (height - STAR_SIZE - scoreTextHeight);
    const color = getRandomColor();
    const starId = Math.random().toString();
    const fadeAnim = new Animated.Value(0);

    setStars(prevStars => [
      ...prevStars,
      { id: starId, x, y, color, fadeAnim },
    ]);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Fade out animation after 4 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Remove star after fading out
      setTimeout(() => {
        setStars(prevStars => prevStars.filter(star => star.id !== starId));
      }, 1000);
    }, 4000);
  };

  const addComet = () => {
    if (gameOver) return;

    // Get score text dimensions
    const scoreTextHeight = scoreTextRef.current ? scoreTextRef.current.offsetHeight : 0;

    const x = Math.random() * (width - COMET_SIZE);
    const y = Math.random() * (height - COMET_SIZE - scoreTextHeight);

    setComets(prevComets => [
      ...prevComets,
      { id: Math.random().toString(), x, y },
    ]);

    setTimeout(() => {
      setComets(prevComets => prevComets.filter(comet => comet.x !== x && comet.y !== y));
    }, COMET_SPEED);
  };

  const getRandomTime = () => {
    const possibleTimes = [1000, 2000, 3000, 4000, 5000, 6000];
    return possibleTimes[Math.floor(Math.random() * possibleTimes.length)];
  };

  const getRandomColor = () => {
    const colors = ['#ffc45c', '#6cbdff', '#ffffff', '#ff515f', '#ff00ff'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleStarTap = (id) => {
    if (gameOver) return; // Prevent user interaction

    setStars(prevStars => prevStars.filter(star => star.id !== id));
    setScore(prevScore => prevScore + 1);
  };

  const handleCometTap = () => {
    if (gameOver) return; // Prevent user interaction

    setGameOver(true);
  };

  const handlePlayAgain = () => {
    setScore(0);
    setStars([]);
    setComets([]);
    setGameOver(false);
    setCometInterval(setCometTimeout()); // Restart comet rendering
  };

  const handleQuit = () => {
    setGameOver(false);
    setScore(0);
    setStars([]);
    setComets([]);
    setShowMainScreen(true); // Show main screen again
    clearInterval(cometInterval); // Clear previous comet interval
    setCometInterval(setCometTimeout()); // Restart comet rendering interval
  };

  const renderStars = () => {
    return stars.map(star => (
      <TouchableOpacity
        key={star.id}
        style={{ position: 'absolute', left: star.x, top: star.y }}
        onPress={() => handleStarTap(star.id)}
      >
        <Animated.View style={{ opacity: star.fadeAnim }}>
          <Svg height={STAR_SIZE} width={STAR_SIZE}>
            <Circle cx={25} cy={25} r={25} fill={star.color} style={styles.glow} />
            <Polygon
              points="25,0 31,15 50,18 35,29 40,50 25,39 10,50 15,29 0,18 19,15"
              fill={star.color}
            />
          </Svg>
        </Animated.View>
      </TouchableOpacity>
    ));
  };

  const renderComets = () => {
    return comets.map(comet => (
      <View
        key={comet.id}
        style={{ position: 'absolute', left: comet.x, top: comet.y }}
      >
        <TouchableOpacity onPress={handleCometTap}>
          <Svg height={COMET_SIZE} width={COMET_SIZE}>
            <Rect x={0} y={0} width={COMET_SIZE} height={COMET_SIZE} fill="darkgrey" />
          </Svg>
        </TouchableOpacity>
      </View>
    ));
  };

  const renderGameOverDialog = () => {
    return (
      <Modal transparent={true} animationType="fade" visible={gameOver}>
        <View style={styles.modalContainer}>
          <View style={styles.gameOverBox}>
            <Text style={styles.normalText}>You tapped a comet!</Text>
            <br></br><br></br>
            <Text style={styles.gameOverText}>Your score: {score}</Text>
            <br></br><br></br>
            <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
              <Text style={styles.buttonText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
              <Text style={styles.buttonText}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMainScreen = () => {
    return (
      <View style={styles.mainScreen}>
        <Text style={styles.gametitleText}>Starcatcher</Text>
        <br></br>
        <br></br>
        <TouchableOpacity style={styles.playButton} onPress={() => setShowMainScreen(false)}>
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        <br></br>
        <br></br>
        <Text style={styles.normalText}>Tap the stars, but don't tap the grey square comets!</Text>
      </View>
    );
  };

  if (!isFontLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      {showMainScreen ? (
        renderMainScreen()
      ) : (
        <>
          <TouchableOpacity style={styles.quitButtonTopLeft} onPress={handleQuit}>
            <Text style={styles.buttonText}>Quit</Text>
          </TouchableOpacity>
          <Text style={styles.score} ref={scoreTextRef}>Score: {score}</Text>
          {renderStars()}
          {renderComets()}
          {renderGameOverDialog()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0073',
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    position: 'absolute',
    top: 15,
    right: 15,
    fontSize: 30,
    color: '#fff',
    fontFamily: 'Cinzel-SemiBold',
    fontWeight: 'bold',
  },
  glow: {
    filter: 'blur(5px)',
  },
  gametitleText: {
    fontSize: 90,
    color: '#fff',
    fontFamily: 'Cinzel-SemiBold',
    textAlign: 'center',
    textShadowColor: 'gold',
    textShadowRadius: 20,
    textShadowOffset: {width: 5, height: 5},
  },
  normalText: {
    fontSize: 30,
    color: '#fff',
    fontFamily: 'Didot',
    textAlign: 'center',
    textShadowColor: 'white',
    textShadowRadius: 40,
    textShadowOffset: {width: 5, height: 5},
  },
  mainScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'green',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 35,
    color: '#fff',
    fontFamily: 'Cinzel-SemiBold',
  },
  playAgainButton: {
    backgroundColor: 'green',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginVertical: 10,
  },
  quitButton: {
    backgroundColor: 'red',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginVertical: 10,
  },
  gameOverText: {
    fontSize: 35,
    color: '#fff',
    fontFamily: 'Cinzel-SemiBold',
    textAlign: 'center',
  },
  quitButtonTopLeft: {
    position: 'absolute',
    top: 15,
    left: 15,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  gameOverBox: {
    backgroundColor: '#1e1e1e',
    padding: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'white',
    shadowRadius: 30,
    shadowOffset: {width: 5, height: 5},
  },
});

export default App;