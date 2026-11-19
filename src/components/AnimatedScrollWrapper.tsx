import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Animated, Dimensions, Easing, ScrollViewProps } from 'react-native';

const { width } = Dimensions.get('window');

export interface AnimatedScrollWrapperRef {
  close: (callback?: () => void) => void;
}

interface AnimatedScrollProps extends ScrollViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  smooth?: boolean;
}

const AnimatedScrollWrapper = forwardRef<AnimatedScrollWrapperRef, AnimatedScrollProps>(
  ({ children, delay = 0, duration = 250, smooth = false, contentContainerStyle, style, ...rest }, ref) => {
    const slideAnim = useRef(new Animated.Value(width)).current;
    const enterEasing = smooth ? Easing.out(Easing.cubic) : Easing.linear;
    const exitEasing = smooth ? Easing.in(Easing.cubic) : Easing.linear;

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        delay,
        easing: enterEasing,
        useNativeDriver: true,
      }).start();
    }, [slideAnim, delay, duration, enterEasing]);

    useImperativeHandle(ref, () => ({
      close: (callback) => {
        Animated.timing(slideAnim, {
          toValue: width,
          duration,
          easing: exitEasing,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && callback) callback();
        });
      }
    }), [slideAnim, duration, exitEasing]);

    return (
      <Animated.ScrollView
        style={[
          style,
          { transform: [{ translateX: slideAnim }] }
        ]}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        {...rest}
      >
        {children}
      </Animated.ScrollView>
    );
  }
);

export default AnimatedScrollWrapper;