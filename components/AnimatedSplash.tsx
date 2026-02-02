// components/AnimatedSplash.tsx
// Animated Splash Screen - 12 seconds
// 1. Icon appears first with rotation
// 2. Letters appear one by one: A U X I T E
// 3. Full logo flash
// 4. Slogan: "DIGITIZED TRADITION"

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish?: () => void;
  duration?: number;
}

// Letter data for AUXITE
const LETTERS = ['A', 'U', 'X', 'I', 'T', 'E'];

export default function AnimatedSplash({ onFinish, duration = 12000 }: AnimatedSplashProps) {
  // Animation values
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;
  
  // Letter animations
  const letterOpacities = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const letterScales = useRef(LETTERS.map(() => new Animated.Value(0.3))).current;
  const letterTranslateY = useRef(LETTERS.map(() => new Animated.Value(30))).current;
  
  // Full logo
  const fullLogoOpacity = useRef(new Animated.Value(0)).current;
  const fullLogoScale = useRef(new Animated.Value(0.7)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  
  // Slogan
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const sloganTranslateY = useRef(new Animated.Value(40)).current;
  
  // Underline
  const underlineWidth = useRef(new Animated.Value(0)).current;
  
  // Fade out
  const fadeOut = useRef(new Animated.Value(1)).current;
  
  // Ring effect
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  
  // Second ring
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  // State to control visibility
  const [showLetters, setShowLetters] = useState(false);
  const [showFullLogo, setShowFullLogo] = useState(false);

  useEffect(() => {
    // ========================================
    // TIMELINE FOR 12 SECONDS
    // ========================================
    // 0-1000ms: Icon appears with rotation
    // 1000-1800ms: Ring effects
    // 1800-5000ms: Letters appear (500ms each)
    // 5000-5500ms: Flash effect
    // 5500-7000ms: Full logo appears
    // 7500-9000ms: Slogan + underline
    // 11000-12000ms: Fade out
    // ========================================

    // 1. Icon entrance (0-1000ms)
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Icon pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    setTimeout(() => pulseAnimation.start(), 800);

    // 2. Ring effects (1000-1800ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 2,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 800);

    // Second ring
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ring2Opacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Scale, {
          toValue: 2.5,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(ring2Opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 1200);

    // 3. Show letters (1800-5000ms)
    setTimeout(() => {
      setShowLetters(true);
      
      // Animate each letter with 500ms delay
      LETTERS.forEach((_, index) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(letterOpacities[index], {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.spring(letterScales[index], {
              toValue: 1,
              tension: 80,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(letterTranslateY[index], {
              toValue: 0,
              duration: 350,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: true,
            }),
          ]).start();
        }, index * 450);
      });
    }, 1800);

    // 4. Flash effect (5000-5500ms)
    setTimeout(() => {
      pulseAnimation.stop();
      
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, 5000);

    // 5. Transition to full logo (5500-7000ms)
    setTimeout(() => {
      // Fade out icon and letters
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        ...letterOpacities.map(opacity =>
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          })
        ),
      ]).start(() => {
        setShowLetters(false);
        setShowFullLogo(true);
        
        // Show full logo with bounce
        Animated.parallel([
          Animated.timing(fullLogoOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(fullLogoScale, {
            toValue: 1,
            tension: 35,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 5500);

    // 6. Slogan animation (7500-9000ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(sloganTranslateY, {
          toValue: 0,
          tension: 35,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Underline animation
      setTimeout(() => {
        Animated.timing(underlineWidth, {
          toValue: 200,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      }, 300);
    }, 7500);

    // 7. Fade out and finish (11000-12000ms)
    setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish?.();
      });
    }, duration - 800);

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const iconRotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#080f1a', '#0f172a', '#1a2744']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background glow */}
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundGlow2} />

        {/* Ring effects */}
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ring2Opacity,
              transform: [{ scale: ring2Scale }],
              borderColor: '#10b98150',
            },
          ]}
        />

        {/* Icon + Letters Container */}
        {!showFullLogo && (
          <View style={styles.iconLettersContainer}>
            {/* Animated Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  opacity: iconOpacity,
                  transform: [
                    { scale: Animated.multiply(iconScale, iconPulse) },
                    { rotate: iconRotateInterpolate },
                  ],
                },
              ]}
            >
              {/* Icon circle with A */}
              <View style={styles.iconCircle}>
                <View style={styles.iconInner}>
                  <Text style={styles.iconLetter}>A</Text>
                  <View style={styles.iconDiamond} />
                </View>
              </View>
            </Animated.View>

            {/* Letters: UXITE (A is in the icon) */}
            {showLetters && (
              <View style={styles.lettersRow}>
                {LETTERS.slice(1).map((letter, index) => (
                  <Animated.Text
                    key={letter}
                    style={[
                      styles.letter,
                      {
                        opacity: letterOpacities[index + 1],
                        transform: [
                          { scale: letterScales[index + 1] },
                          { translateY: letterTranslateY[index + 1] },
                        ],
                      },
                    ]}
                  >
                    {letter}
                  </Animated.Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Flash effect */}
        <Animated.View
          style={[
            styles.flash,
            { opacity: flashOpacity },
          ]}
        />

        {/* Full Logo */}
        {showFullLogo && (
          <Animated.View
            style={[
              styles.fullLogoContainer,
              {
                opacity: fullLogoOpacity,
                transform: [{ scale: fullLogoScale }],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/auxite-wallet-logo.png')}
              style={styles.fullLogo}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        {/* Slogan */}
        <Animated.View
          style={[
            styles.sloganContainer,
            {
              opacity: sloganOpacity,
              transform: [{ translateY: sloganTranslateY }],
            },
          ]}
        >
          <Text style={styles.slogan}>DIGITIZED TRADITION</Text>
          <Animated.View style={[styles.underline, { width: underlineWidth }]} />
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <LoadingDots />
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ============================================
// LOADING DOTS COMPONENT
// ============================================
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]).start();
      }, 200);

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]).start();
      }, 400);
    };

    animateDots();
    const interval = setInterval(animateDots, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#10b981',
    opacity: 0.04,
  },
  backgroundGlow2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: '#10b981',
    opacity: 0.02,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  iconLettersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLetter: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: -2,
  },
  iconDiamond: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#9ca3af',
    marginTop: -4,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letter: {
    fontSize: 48,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 6,
    marginHorizontal: 2,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
  fullLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullLogo: {
    width: 300,
    height: 110,
    // No tintColor - keeps original colors
  },
  sloganContainer: {
    position: 'absolute',
    bottom: 200,
    alignItems: 'center',
  },
  slogan: {
    fontSize: 15,
    fontWeight: '400',
    color: '#64748b',
    letterSpacing: 8,
  },
  underline: {
    height: 2,
    backgroundColor: '#10b981',
    marginTop: 14,
    borderRadius: 1,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 110,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  version: {
    position: 'absolute',
    bottom: 50,
    color: '#475569',
    fontSize: 12,
  },
});
