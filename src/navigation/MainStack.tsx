import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {CameraScreen} from '../screens/CameraScreen';
import {TBHeader} from './TBHeader';
import {SettingsScreen} from '../screens/SettingsScreen';
import {StripPreviewScreen} from '../screens/StripPreviewScreen';

const Stack = createStackNavigator();

export function MainStack() {
  return (
    <Stack.Navigator initialRouteName="CameraScreen">
      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{
          header: TBHeader,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          animationEnabled: true,
          presentation: 'modal',
          header: props => <TBHeader {...props} closeButton />,
        }}
      />
      <Stack.Screen
        name="StripPreview"
        component={StripPreviewScreen}
        options={{
          title: 'Preview',
          animationEnabled: true,
          header: props => <TBHeader {...props} backButton />,
        }}
      />
    </Stack.Navigator>
  );
}
