import React from 'react';
import {Text} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';

export function StripPreviewScreen(): JSX.Element {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text>Strip Preview Screen</Text>
    </ScrollView>
  );
}
