import React from 'react';
import { View, ViewProps } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export interface NativeGlassViewProps extends ViewProps {
  glassEffectStyle?: string;
  tintColor?: string;
  isInteractive?: boolean;
  children?: React.ReactNode;
}

export function NativeGlassView({
  style,
  children,
  ...props
}: NativeGlassViewProps) {
  if (!isExpoGo) {
    try {
      const { Surface } = require('@expo/ui/jetpack-compose');
      return (
        <View style={style} {...props}>
          <Surface color="#1D1B20" tonalElevation={2}>
            {children}
          </Surface>
        </View>
      );
    } catch {
      // Fall through to plain View fallback
    }
  }

  return (
    <View
      style={[
        {
          backgroundColor: '#1D1B20',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default NativeGlassView;
