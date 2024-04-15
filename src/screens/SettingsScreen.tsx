import React from 'react';
import {Text} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';

export function SettingsScreen(): JSX.Element {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text>Version 2.0.0</Text>
    </ScrollView>
  );
}
