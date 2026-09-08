import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Checks if the native `ExpoUI` module is compiled into the current binary.
 * In Expo Go, @expo/ui is not included in the standard Go client and requires a development build.
 */
export const isExpoUIAvailable = (): boolean => {
  try {
    return Boolean(requireOptionalNativeModule('ExpoUI'));
  } catch {
    return false;
  }
};

let cachedSwiftUI: any = null;
let cachedSwiftUIModifiers: any = null;

export function getSwiftUI() {
  if (cachedSwiftUI === null) {
    if (isExpoUIAvailable()) {
      try {
        cachedSwiftUI = require('@expo/ui/swift-ui');
        cachedSwiftUIModifiers = require('@expo/ui/swift-ui/modifiers');
      } catch {
        cachedSwiftUI = false;
      }
    } else {
      cachedSwiftUI = false;
    }
  }
  return cachedSwiftUI ? { ui: cachedSwiftUI, modifiers: cachedSwiftUIModifiers } : null;
}

let cachedCompose: any = null;

export function getJetpackCompose() {
  if (cachedCompose === null) {
    if (isExpoUIAvailable()) {
      try {
        cachedCompose = require('@expo/ui/jetpack-compose');
      } catch {
        cachedCompose = false;
      }
    } else {
      cachedCompose = false;
    }
  }
  return cachedCompose ? cachedCompose : null;
}
