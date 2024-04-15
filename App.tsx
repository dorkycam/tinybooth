import 'react-native-gesture-handler';
import React from 'react';
import {MainStack} from './src/navigation/MainStack';
import {NavigationContainer} from '@react-navigation/native';

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}

export default App;
