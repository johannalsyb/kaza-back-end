import * as React from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import useAuthentication from '../hooks/useAuthentication';
import Splash from '../screens/Splash';
import Header from '../components/Header';
import {
  NavStackParamList,
  adminScreens,
  authenticatedScreens,
  linking,
  unauthenticatedScreens,
} from './screens';
import variables from '../styles/variables';
import { showComponentAtom, showMessageAtom, showSignInAtom, showSwapNowAtom } from '../atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import SwapNow from '../components/Views/SwapNow';
import KModal from '../components/KModal/KModal';
import UserEvent from '../events/UserEvent';
import Footer from '../components/Footer';
import SignInModal from '../components/Views/SignInModal';
import useConfig from '../hooks/useConfig';
import KText from '../components/KText';

const Stack = createNativeStackNavigator<NavStackParamList>();
export type Handle = {
  navigate: (screen: string, params?:any) => void
}
export default React.forwardRef<Handle, {}>((_, ref) => {
  const {user, isAdmin} = useAuthentication();
  const {config} = useConfig();
  let stack = user ? (isAdmin ? adminScreens : authenticatedScreens) : unauthenticatedScreens;
  const [showSwapNow, setShowSwapNow] = [useAtomValue(showSwapNowAtom), useSetAtom(showSwapNowAtom)];
  const [showSignIn, setShowSignIn] = [useAtomValue(showSignInAtom), useSetAtom(showSignInAtom)];
  const [showMessage, setShowMessage] = [useAtomValue(showMessageAtom), useSetAtom(showMessageAtom)];
  const [showComponentModal, setShowComponentModal] = [useAtomValue(showComponentAtom), useSetAtom(showComponentAtom)];

  const navigationRef = React.createRef<NavigationContainerRef<{[x: string]: any}>>();
  const [route, setRoute] = React.useState<string>();

  React.useImperativeHandle(ref, () => ({
    navigate: (screen, params) => {
      navigationRef.current?.navigate(screen, params)
    },
  }));

  return (
    // <ScrollView contentInsetAdjustmentBehavior="automatic">
    <NavigationContainer
      linking={linking(!!user)}
      fallback={<Splash />}
      ref={navigationRef}
      documentTitle={{
        formatter: (options, route) => `Kazaswap - ${options?.title ?? route?.name}`,
      }}
      onReady={() => {
        const r = navigationRef.current?.getRootState().routes.slice(-1)[0].name
        if(r) setRoute(r)
      }}
      onStateChange={s => {
        const r = s?.routes?.slice(-1)[0]?.name
        if(r) setRoute(r)
      }}>
      <Stack.Navigator
        screenOptions={{
          header: props => <Header {...props} />,
          contentStyle: {
            flexGrow: 1,
            backgroundColor: variables.colors.white,
          },
        }}>
        {Object.entries(stack).map(([name, [comp, title]]) => (
          <Stack.Screen
            key={`nav_${name}`}
            name={name as keyof NavStackParamList}
            component={comp}
            options={{title}}
          />
        ))}
      </Stack.Navigator>
      {/* <Footer route={route}/> */}
      {/* Swap Now navigation modal */}
      {user && <KModal
        visible={showSwapNow}
        setVisibility={() => setShowSwapNow(false)}
        style={{
          backgroundColor: "white",
          padding: 20
        }}
        >
        <SwapNow
            onCancel={() => setShowSwapNow(false)}
            onUpdated={(u) => {
              setShowSwapNow(false)
              new UserEvent("update").emit(u.data)
            }}
            preferences={{
              location: user.swapLocations?.split("\n") || null,
              dateFromTo: user.dateFrom && user.dateTo ? [user.dateFrom, user.dateTo] : null
            }} />
      </KModal>}

      {/* Not signed in navigation modal */}
      {!user && <KModal
        visible={showSignIn}
        setVisibility={() => setShowSignIn(false)}
        style={{
          padding: 20
        }}
        >
        <SignInModal onSelected={(type) => {setShowSignIn(false)}}/>
      </KModal>}

      {/* Component navigation modal */}
      {<KModal
        visible={!!showComponentModal}
        setVisibility={() => setShowComponentModal(null)}
        style={{
          padding: 20,
          backgroundColor: variables.colors.white,
        }}
        >
        {showComponentModal}
      </KModal>}

      {/* Message navigation modal */}
      {<KModal
        visible={!!showMessage}
        setVisibility={() => setShowMessage(null)}
        style={{
          padding: 20
        }}
        >
        <KText>{showMessage}</KText>
      </KModal>}

    </NavigationContainer>
    // </ScrollView>
  );
})
