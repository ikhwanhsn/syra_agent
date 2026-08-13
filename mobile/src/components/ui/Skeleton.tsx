import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, type ViewStyle} from 'react-native';
import {colors, radii} from '../../theme/tokens';

export function Skeleton({style}: {style?: ViewStyle}) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.box, {opacity}, style]} />;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.border,
    borderRadius: radii.sm,
    height: 16,
  },
});
