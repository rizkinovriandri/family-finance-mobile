import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// Lapisan yang meniru splash native (gambar splash-icon.png selebar 260 di atas latar gelap yang
// sama) lalu memudar keluar — supaya perpindahan dari splash native ke layar pertama terasa mulus.
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!visible) return null;

  function handleLayout() {
    SplashScreen.hideAsync().finally(() => {
      opacity.value = withTiming(0, { duration: 400 }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(setVisible, false);
      });
    });
  }

  return (
    <Animated.View onLayout={handleLayout} pointerEvents="none" style={[styles.overlay, animatedStyle]}>
      <Image style={styles.image} source={require('@/assets/images/splash-icon.png')} contentFit="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#080D14',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  image: {
    width: 260,
    height: 260,
  },
});
