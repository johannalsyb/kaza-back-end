import React, {useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import useAuthentication from './hooks/useAuthentication';
import ToastManager from './components/Toast/ToastManager';
import Navigation, { Handle } from './navigation';
import './components/KText';
import KText from './components/KText';
import {ClickOutsideProvider} from 'react-native-click-outside';
import useConfig from './hooks/useConfig';
import './utils/';
import variables from './styles/variables';
import KIcon from './components/KIcon/KIcon';
import { OnboardingInfo } from '@kazaswap/common/lib/types/api/auth';
import { toastSuccess } from './components/Toast/Toast';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    // backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    backgroundColor: variables.colors.greenLight,
  };

  const authentication = useAuthentication();
  const config = useConfig();
  const {isAuthLoading, user} = authentication;
  const navRef = useRef<Handle>(null)

  useEffect(() => {
    authentication.check(true)
    .then(uu => {
      /* 19/06/2024 - We stop redirecting to onboarding */ 
      // if(uu && uu.onboarding) {
      //   const onboarding = JSON.parse(uu.onboarding) as OnboardingInfo
      //   console.log(onboarding)
      //   if(!onboarding.completed) {
      //     setTimeout(() => {
      //       console.log("Navigating to onboarding")
      //       navRef.current?.navigate("Onboarding", {step: onboarding.step})
      //     }, 200)
      //   }
      // }
    })
    config.load();
  }, []);

  return (
    <SafeAreaView
      style={[
        backgroundStyle,
        {
          height: '100%',
        },
      ]}>
      <ClickOutsideProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <ToastManager>
          {isAuthLoading ? <View style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <KIcon name="logoText2" size={120} style={{}} />
            <ActivityIndicator color={"black"} />
          </View> : <Navigation ref={navRef}/>}
        </ToastManager>
      </ClickOutsideProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
