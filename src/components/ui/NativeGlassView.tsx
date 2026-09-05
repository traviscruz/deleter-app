import React from 'react';
import { View, ViewProps } from 'react-native';

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
  return (
    <View
      style={[
        {
          backgroundColor: '#18181c',
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
