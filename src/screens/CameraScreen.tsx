import React from 'react';
import {Pressable, View} from 'react-native';
import {useAppStackNavigation} from '../navigation/appNavigation';
import {Text} from 'react-native-paper';

export function CameraScreen(): JSX.Element {
  const navigation = useAppStackNavigation();
  return (
    <View>
      <Pressable onPress={() => navigation.push('Settings')}>
        <Text>settings</Text>
      </Pressable>
      <Pressable onPress={() => navigation.push('StripPreview')}>
        <Text>preview</Text>
      </Pressable>
    </View>
  );
}
