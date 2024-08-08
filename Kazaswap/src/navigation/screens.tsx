import {TestPageComponent} from '../components/utils/TestPageComponent/TestPageComponent';
import Error404 from '../screens/Error404';
import Splash from '../screens/Splash';
import Login from '../screens/Auth/Login';
import Auth from '../screens/Auth';
import Register from '../screens/Auth/Register';
import Account from '../screens/Account';
import Onboarding from '../screens/Onboarding';
import Success from '../screens/Onboarding/Success';
import Matching from '../screens/Matching';
import Favourites from '../screens/Favourites';
import Home from '../screens/Home';
import {useAtomValue} from 'jotai';
import {showHeaderAtom} from '../atoms';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import ResetPassword from '../screens/Auth/ResetPassword';
import Property from '../screens/Property';
import {Property as PP} from '@kazaswap/common/lib/types/api/properties';
import Chats from '../screens/Chats';
import Admin from '../screens/Admin';
import Verify from '../screens/Auth/Verify';
import Legal from '../screens/Legal';
import Blog from '../screens/Blog';

export type NavStackParamList = {
  Auth: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Verify: {type: "email" | "phone", token: string};
  Home: {map?: boolean} | undefined;
  Test: undefined;
  Splash: undefined;
  Error404: undefined;
  Properties: undefined;
  Account: {edit?: boolean};
  Myplace: {edit?: boolean, preview?: boolean};
  History: undefined;
  Onboarding: {step?: number};
  Success: undefined;
  Matching: undefined;
  Favourites: undefined;
  Property: {id: string; property?: PP};
  Chats: undefined;
  Chat: {id: string};
  Swap: {id: string};
  Admin: {tab?: string};
  Legal: undefined,
  Blog: undefined,
  Article: {slug: string},
};

export const isHeaderHidden = (
  name: keyof NavStackParamList,
  isMobile = false,
) => {
  const visible = useAtomValue(showHeaderAtom);
  if (!visible) return true;
  const screens = [
    'Auth',
    'Login',
    'SignUp',
    'ForgotPassword',
    'ResetPassword',
    'Splash',
    'Onboarding',
    'Success',
  ];
  if (isMobile) {
    screens.push('Account');
    // screens.push('History');
    // screens.push('Myplace');
    screens.push('Chats')
    screens.push('Chat')
    screens.push('Swap')
    screens.push('Property')
  }
  return screens.includes(name);
};

export const isFooterHidden = (name: keyof NavStackParamList, isMobile = false) => {
  if(isMobile) return true;
  const screens = [
    'Auth',
    'Login',
    'SignUp',
    'ForgotPassword',
    'ResetPassword',
    'Splash',
    'Onboarding',
    'Success',
  ];
  return screens.includes(name);
}

export const linking = (loggedIn: boolean) => {
  const screens: {[key: string]: any} = {
    Home: '',
    Login: 'login',
    SignUp: 'register',
    ForgotPassword: 'forgotpassword',
    ResetPassword: 'resetpassword',
    Test: 'test',
    Splash: 'splash',
    Account: 'account',
    Myplace: 'myplace',
    History: 'swaps',
    Onboarding: 'onboarding',
    Success: 'success',
    Matching: 'matching',
    Favourites: 'favourites',
    Chats: 'chats',
    Chat: {
      path: 'chats/:id',
      stringify: {
        id: (id: string) => id,
      },
    },
    Property: {
      path: 'property/:id/:property?',
      stringify: {
        property: (property: PP) => '',
      },
    },
    Swap: {
      path: 'swaps/:id',
      stringify: {
        id: (id: string) => id,
      },
    },
    Verify: 'verify',
    Error404: '*',
    Admin: 'admin',
    Terms: 'terms-of-use',
    Confidentiality: 'confidentiality',
    Blog: 'blog',
    Article: {
      path: 'blog/:slug',
      stringify: {
        slug: (slug: string) => slug,
      },
    },
  };

  return {
    prefixes: ['https://kazaswap.co', 'kazaswap://'],
    config: {screens},
  };
};

type Screens = {[key:string]: [(p?:any) => React.JSX.Element | null, string?]}

export const openScreens:Screens = {
  Error404: [Error404, "Woops!"],
  Test: [TestPageComponent],
  Splash: [Splash],
  Home: [Home, "Home"],
  Matching: [Matching, "Matches"],
  Favourites: [Favourites, "Favourites"],
  Property: [Property, "Property"],
  Chats: [Chats, "Chats"],
  Verify: [Verify, "Verification"],
  Terms: [Legal, "Terms of Use"],
  Confidentiality: [Legal, "Confidentiality"],
  Blog: [Blog, "Blog"],
  Article: [Blog, "Blog Article"],
  ResetPassword: [ResetPassword, "Reset Password"],
};

export const authenticatedScreens:Screens = {
  Account: [Account, "My Account"],
  History: [Account, "My swap history"],
  Myplace: [Account, "My place"],
  Onboarding: [Onboarding, "Welcome !"],
  Success: [Success, "Congratulations !"],
  Chat: [Chats, "Chats"],
  Swap: [Account, "Swap"],
  ...openScreens,
};

export const unauthenticatedScreens:Screens = {
  // 'Auth': [Auth, ],
  Login: [Login, "Sign In"],
  SignUp: [Register, "Register"],
  ForgotPassword: [ForgotPassword, "Forgot Password"],
  ...openScreens,
};


export const adminScreens:Screens = {
  Admin: [Admin, "Admin"],
  ...authenticatedScreens
};