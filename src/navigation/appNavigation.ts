import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

/**
 * TODO: Add the other stack pages to this
 */
export type RootStackParamList = {
  Camera: undefined;
  Settings: undefined;
  StripPreview: undefined;
};

type AvailableStacks = keyof RootStackParamList;

export function useAppStackNavigation() {
  return useNavigation<StackNavigationProp<RootStackParamList>>();
}

export function useAppRoute() {
  return useRoute<RouteProp<RootStackParamList, AvailableStacks>>();
}
