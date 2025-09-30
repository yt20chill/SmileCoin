import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import './global.css';

function App(): JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1">
        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-900 mb-4">
            Tourist Rewards System
          </Text>
          <Text className="text-lg text-gray-600">
            Mobile app initialized with NativeWind (Tailwind CSS)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default App;