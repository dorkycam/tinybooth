import 'react-native-gesture-handler';
import React from 'react';
import {MainStack} from './src/navigation/MainStack';
import {NavigationContainer} from '@react-navigation/native';

function App(): React.JSX.Element {
  return (
    // <SafeAreaView style={backgroundStyle}>
    //   {/* STATUS BAR STYLING */}
    //   <StatusBar
    //     barStyle={isDarkMode ? 'light-content' : 'dark-content'}
    //     backgroundColor={backgroundStyle.backgroundColor}
    //   />
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
    // </SafeAreaView>
  );
}

export default App;
