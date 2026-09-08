import Constants, { ExecutionEnvironment } from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * True when running inside the Expo Go client (not a dev build or production build).
 * Used to gate native-only modules that are not bundled with Expo Go.
 */
export const IS_EXPO_GO =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Checks if the native `ExpoUI` module is compiled into the current binary.
 * In Expo Go, @expo/ui is not included in the standard Go client and requires a development build.
 */
export const isExpoUIAvailable = (): boolean => {
  if (IS_EXPO_GO) return false;
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

/**
 * Returns true only when running in a native build (not Expo Go) that has
 * the ExpoGlassEffect native module AND the device supports the Liquid Glass API.
 *
 * NEVER returns true in Expo Go — even if expo-glass-effect is bundled,
 * rendering GlassView / GlassContainer on a non-iOS 26 device crashes natively.
 */
export const isGlassEffectAvailable = (): boolean => {
  try {
    const mod = requireOptionalNativeModule('ExpoGlassEffect');
    if (!mod) return false;
    // isGlassEffectAPIAvailable or isLiquidGlassAvailable is a native constant that is true on iOS 26+.
    return Boolean(mod.isGlassEffectAPIAvailable || mod.isLiquidGlassAvailable);
  } catch {
    return false;
  }
};

let cachedGlassEffect: any = null;

/**
 * Returns the expo-glass-effect module only when it is safe to use.
 * Returns null in Expo Go or when the native module is unavailable.
 */
export function getGlassEffect() {
  if (cachedGlassEffect === null) {
    if (isGlassEffectAvailable()) {
      try {
        cachedGlassEffect = require('expo-glass-effect');
      } catch {
        cachedGlassEffect = false;
      }
    } else {
      cachedGlassEffect = false;
    }
  }
  return cachedGlassEffect || null;
}
