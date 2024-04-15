import React from 'react';
import {Pressable, Text} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {useAppStackNavigation} from '../navigation/appNavigation';

export function CameraScreen(): JSX.Element {
  const navigation = useAppStackNavigation();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Pressable onPress={() => navigation.push('Settings')}>
        <Text>settings</Text>
      </Pressable>
      <Pressable onPress={() => navigation.push('StripPreview')}>
        <Text>preview</Text>
      </Pressable>
    </ScrollView>
  );
}
