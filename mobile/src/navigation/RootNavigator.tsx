import React from 'react';
import {NavigationContainer, DarkTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Text} from 'react-native';
import {HomeScreen} from '../screens/HomeScreen';
import {ScoutScreen} from '../screens/ScoutScreen';
import {WalletScreen} from '../screens/WalletScreen';
import {TokenDetailScreen} from '../screens/TokenDetailScreen';
import {colors} from '../theme/tokens';
import type {RootStackParamList, TabParamList} from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.primary,
  },
};

function TabIcon({label, focused}: {label: string; focused: boolean}) {
  return (
    <Text style={{color: focused ? colors.foreground : colors.muted, fontSize: 11}}>
      {label}
    </Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.muted,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({focused}) => <TabIcon label="●" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scout"
        component={ScoutScreen}
        options={{
          tabBarLabel: 'Scout',
          tabBarIcon: ({focused}) => <TabIcon label="◈" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({focused}) => <TabIcon label="◇" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.background},
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          contentStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TokenDetail"
          component={TokenDetailScreen}
          options={({route}) => ({
            title: route.params.symbol,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
