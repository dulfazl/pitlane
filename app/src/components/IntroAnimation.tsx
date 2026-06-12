import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../theme';
import { DriftCar } from './DriftCar';

const NATIVE = Platform.OS !== 'web';
const CAR_W = 250;
const CAR_H = (CAR_W * 180) / 660;
const LIGHTS = 5;

// Pit-stop intro: start lights count down, the car sweeps into the pit box,
// gets a lightning wheel change, launches out — and the logo takes the screen.
export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const { width: screenW } = useWindowDimensions();
  const [gone, setGone] = useState(false);

  const lights = useRef(Array.from({ length: LIGHTS }, () => new Animated.Value(0))).current;
  const carX = useRef(new Animated.Value(-CAR_W - 60)).current;
  const carY = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const lines = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);

  const pitCenter = (screenW - CAR_W) / 2;

  const sequence = useMemo(() => {
    const lightsOn = Animated.stagger(140,
      lights.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 90, useNativeDriver: NATIVE })
      )
    );
    const lightsOut = Animated.parallel(
      lights.map((v) =>
        Animated.timing(v, { toValue: 0, duration: 140, useNativeDriver: NATIVE })
      )
    );
    const driveIn = Animated.parallel([
      Animated.timing(carX, {
        toValue: pitCenter,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: NATIVE,
      }),
      Animated.sequence([
        Animated.delay(380),
        Animated.timing(tilt, { toValue: 1, duration: 140, useNativeDriver: NATIVE }),
        Animated.timing(tilt, { toValue: 0, duration: 200, useNativeDriver: NATIVE }),
      ]),
    ]);
    const flash = (up: number) =>
      Animated.sequence([
        Animated.timing(glow, { toValue: up, duration: 80, useNativeDriver: NATIVE }),
        Animated.timing(glow, { toValue: 0.15, duration: 70, useNativeDriver: NATIVE }),
      ]);
    const pitStop = Animated.parallel([
      Animated.sequence([
        Animated.timing(carY, { toValue: -10, duration: 130, useNativeDriver: NATIVE }),
        Animated.delay(380),
        Animated.timing(carY, {
          toValue: 0,
          duration: 180,
          easing: Easing.bounce,
          useNativeDriver: NATIVE,
        }),
      ]),
      Animated.sequence([flash(1), flash(0.9), flash(1)]),
    ]);
    const launch = Animated.parallel([
      Animated.timing(carX, {
        toValue: screenW + 60,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: NATIVE,
      }),
      Animated.sequence([
        Animated.timing(lines, { toValue: 1, duration: 180, useNativeDriver: NATIVE }),
        Animated.timing(lines, { toValue: 0, duration: 420, useNativeDriver: NATIVE }),
      ]),
    ]);
    const reveal = Animated.timing(logo, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: NATIVE,
    });
    const fadeAway = Animated.timing(overlay, {
      toValue: 0,
      duration: 320,
      useNativeDriver: NATIVE,
    });

    return Animated.sequence([
      Animated.delay(250),
      lightsOn,
      Animated.delay(320),
      lightsOut,
      driveIn,
      pitStop,
      Animated.delay(100),
      launch,
      reveal,
      Animated.delay(850),
      fadeAway,
    ]);
  }, [lights, carX, carY, tilt, glow, lines, logo, overlay, pitCenter, screenW]);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    setGone(true);
    onDone();
  }

  useEffect(() => {
    sequence.start(() => finish());
    return () => sequence.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  const rotate = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '2.5deg'] });
  const logoScale = logo.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const lineShift = lines.interpolate({ inputRange: [0, 1], outputRange: [40, -120] });

  // wheel centres in car-local coordinates (matches DriftCar viewBox)
  const wheelY = (144 / 180) * CAR_H - 17;
  const wheels = [(156 / 660) * CAR_W - 17, (560 / 660) * CAR_W - 17];

  return (
    <Animated.View style={[styles.overlay, { opacity: overlay }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish}>
        {/* start lights */}
        <View style={styles.lightsRow}>
          {lights.map((v, i) => (
            <View key={i} style={styles.lightHousing}>
              <Animated.View style={[styles.lightBulb, { opacity: v }]} />
            </View>
          ))}
        </View>

        {/* logo reveal */}
        <Animated.View style={[styles.logoWrap, { opacity: logo, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require('../../assets/pitlane-wordmark.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.logoSub}>YOUR CAR. OUR PITLANE.</Text>
        </Animated.View>

        {/* pit lane scene */}
        <View style={styles.scene}>
          {/* pit box painted on the road */}
          <View style={[styles.pitBox, { left: (screenW - CAR_W - 36) / 2 }]}>
            <Text style={styles.pitBoxText}>PIT</Text>
          </View>

          {/* road line + dashes */}
          <View style={styles.road} />
          <View style={styles.dashRow}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>

          {/* speed lines on launch */}
          <Animated.View
            style={[
              styles.speedLines,
              { opacity: lines, transform: [{ translateX: lineShift }] },
            ]}
          >
            <View style={[styles.speedLine, { width: 90 }]} />
            <View style={[styles.speedLine, { width: 56, marginLeft: 34 }]} />
            <View style={[styles.speedLine, { width: 120, marginLeft: 10 }]} />
          </Animated.View>

          {/* the car */}
          <Animated.View
            style={[
              styles.car,
              { transform: [{ translateX: carX }, { translateY: carY }, { rotate }] },
            ]}
          >
            <DriftCar width={CAR_W} />
            {wheels.map((x, i) => (
              <Animated.View key={i} style={[styles.wheelGlow, { left: x, top: wheelY, opacity: glow }]} />
            ))}
          </Animated.View>
        </View>

        <Text style={styles.skipHint}>Tap to skip</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    zIndex: 100,
  },
  lightsRow: {
    position: 'absolute',
    top: '16%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  lightHousing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#161616',
    borderWidth: 2,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightBulb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange,
  },
  logoWrap: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoImg: { width: 270, height: 50 },
  logoSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 14,
  },
  scene: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: CAR_H + 60,
  },
  car: { position: 'absolute', bottom: 18, left: 0 },
  wheelGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange,
  },
  pitBox: {
    position: 'absolute',
    bottom: 8,
    width: CAR_W + 36,
    height: CAR_H + 26,
    borderWidth: 2,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    borderRadius: 6,
  },
  pitBoxText: {
    position: 'absolute',
    top: 4,
    right: 8,
    color: 'rgba(255, 106, 0, 0.55)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  road: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#222222',
  },
  dashRow: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dash: { width: 26, height: 4, borderRadius: 2, backgroundColor: '#1E1E1E' },
  speedLines: {
    position: 'absolute',
    bottom: 38,
    left: 30,
    gap: 10,
  },
  speedLine: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.orange,
    opacity: 0.8,
  },
  skipHint: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: '#3A3A3A',
    fontSize: 12,
    fontWeight: '600',
  },
});
