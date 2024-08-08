import {ActivityIndicator, Linking, ScrollView, View} from 'react-native';
import KButton from '../../components/KButton/KButton';
import useAuthentication from '../../hooks/useAuthentication';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavStackParamList} from '../../navigation/screens';
import variables from '../../styles/variables';
import KText from '../../components/KText';
import KIcon from '../../components/KIcon/KIcon';
import {Link, useRoute} from '@react-navigation/native';
import MainInfo from '../../components/Views/Account/MainInfo';
import History from '../../components/Views/Account/History';
import React, {useEffect, useState} from 'react';
import EditProfile from '../../components/Views/Account/EditProfile';
import {parsePhone} from '../../utils/phone';
import KSideModal from '../../components/KModal/KSideModal';
import useIsMobile from '../../hooks/useIsMobile';
import {Creds} from '../../components/forms/auth/Register';
import users from '../../api/users';
import EditProperty from '../../components/Views/Account/EditProperty';
import {Api} from '@kazaswap/common';
import {toastError} from '../../components/Toast/Toast';
import {useSetAtom} from 'jotai';
import {showSwapNowAtom} from '../../atoms';
import UserEvent from '../../events/UserEvent';
import useConfig from '../../hooks/useConfig';
import HeaderEvent from '../../events/HeaderEvent';
import MyPlace from './MyPlace';
import { shareProperty } from '../../utils/Share';
import Menu from '../../components/Menu';

type Props = NativeStackScreenProps<
  NavStackParamList,
  'Account' | 'Swap' | 'History' | 'Myplace'
>;

let shareEvId: string | undefined = undefined

export default (props: Props) => {
  const {route} = props;
  const [modal, setModal] = useState<'user' | 'property' | 'swap' | null>(null);
  const {isMobile} = useIsMobile();
  const [user, setUser] = useState<{user: Api.Users.Me; creds: Creds}>();
  // const [property, setProperty] = useState<Property>()
  const [prop, setProp] = useState<Api.Properties.PrivateProperty>();
  const [loading, setLoading] = useState(false);
  const [ueListenerId, setUeListenerId] = useState<string>();
  const setShowSwapNow = useSetAtom(showSwapNowAtom);
  const {logout, properties} = useAuthentication();
  const {config} = useConfig();

  const [contentHeight, setContentHeight] = useState(-1);
  const [scrollViewHeight, setScrollViewHeight] = useState(-1);

  const swapId = (route.params as Readonly<{id: string}>)?.id;
  const edit = (route.params as Readonly<{edit: boolean}>)?.edit;

  useEffect(() => {
    if (!prop) {
      setLoading(true);
      loadProperty().finally(() => {
        setLoading(false);
      });
    }
    if (!user) loadUser();
    if (!ueListenerId) {
      setUeListenerId(
        UserEvent.addListener('update', u => {
          loadUser();
        }),
      );
    }

    const evId = HeaderEvent.addListener("edit", (data) => {
      if (data === "user") setModal("user")
      if (data === "property") setModal("property")
    })

    return () => {
      if (ueListenerId) UserEvent.removeListener('update', ueListenerId);
      if (evId) HeaderEvent.removeListener("edit", evId)
      if (shareEvId) HeaderEvent.removeListener("share", shareEvId)
    };
  }, []);

  useEffect(() => {
    if(!ueListenerId) return // wait til first load
    props.navigation.setParams({edit: modal ? true : undefined})
  }, [modal])

  useEffect(() => {
    if(edit && user && prop && !modal) {
      if(props.route.name === "Account") setModal("user")
      else if(props.route.name === "Myplace") setModal("property")
    }

    if(prop) {
      if(shareEvId) HeaderEvent.removeListener("share", shareEvId)
      shareEvId = HeaderEvent.addListener("share", (data) => {
        if (data === "property") {
          shareProperty(`${window.location.origin}/property/${prop?.id}`)
        }
      })
    }
  }, [user, prop])

  const loadProperty = (changeHidden?:boolean) => {
    return properties.reload(changeHidden)
      .then((array) => {
        const p = array[0];
        if (!p) return;
        setProp(p);
      })
      .catch(err => {
        toastError('An error occured while fetching your property');
      });
  };

  const loadUser = () => {
    return users.me
      .get()
      .then(({data}) => Promise.all([data, parsePhone(data.phone)]))
      .then(([user, phone]) =>
        setUser({
          user,
          creds: {
            email: user!.email,
            firstName: user!.firstName,
            gender: user!.gender,
            image: user!.primaryImage,
            job: user!.job,
            hobby: user!.hobby,
            phoneVerified: user!.phoneVerified,
            emailVerified: user!.emailVerified,
            password: '',
            phone: phone || {
              code: '+1',
              number: '',
            },
          },
        }),
      );
  };

  const EditProfileView = !user ? (
    <ActivityIndicator />
  ) : (
    <EditProfile
      style={{
        width: isMobile ? '100%' : '90%',
      }}
      creds={user.creds}
      onChange={c => setUser({user: user.user, creds: c})}
      onClose={() => setModal(null)}
      onUpdated={() => {
        setModal(null);
        loadUser();
      }}
    />
  );

  const EditPropertyView = !prop ? (
    <ActivityIndicator />
  ) : (
    <EditProperty
      style={{
        width: isMobile ? '100%' : '90%',
      }}
      verified={prop.verified}
      property={{
        id: prop.id,
        location: prop.address,
        type: prop.type,
        amenities: prop.amenities.split(','),
        petFriendly: prop.pets,
        size: prop.sizeM2,
        bathrooms: prop.bathrooms,
        bedrooms: prop.bedrooms,
        beds: prop.beds,
        bedroomsBeds: JSON.parse(prop.bedArrangements),
        pics: (prop.images as string).split(','),
        private: !!prop.private,
        childrenAllowed: !!prop.childrenAllowed,
        smokingAllowed: !!prop.smokingAllowed,
        lat: prop.lat,
        lon: prop.lon,
      }}
      onClose={() => setModal(null)}
      onUpdated={(np) => {
        setModal(null);
        loadProperty(np.private !== prop.private ? np.private : undefined);
      }}
    />
  );

  const onEditPropertyPressed = () => setModal('property');
  const onEditProfilePressed = () => setModal('user');

  const EditProfileText = (text: string) => (
    <KText
      style={{textDecorationLine: 'underline'}}
      onPress={() => onEditProfilePressed()}>
      {text} <KIcon name="edit" />
    </KText>
  );

  const isHistory = route.name === 'History' || route.name === 'Swap';

  const phoneValid =
    user &&
    user.creds.phone &&
    user.creds.phone.number &&
    user.creds.phone.number.length &&
    user.creds.phone.code;
  const phone = phoneValid
    ? `${user.creds.phone.code}${user.creds.phone.number}`
    : undefined;

  const menu = [
    {
      text: 'My Profile',
      icon: 'user',
      onPress: () => props.navigation.navigate('Account', {edit: undefined}),
      active: route.name === 'Account',
    },
    {
      text: 'My Place',
      icon: 'placeType',
      onPress: () => props.navigation.navigate('Myplace', {edit: undefined, preview: isMobile ? undefined : true}),
      active: route.name === 'Myplace',
    },
    {
      text: 'Swap History',
      icon: 'history',
      onPress: () => props.navigation.navigate('History'),
      active: isHistory,
    },
  ]

  const isContentSmallerThanScreen = () => {
    if (contentHeight === -1 || scrollViewHeight === -1) return false;
    return contentHeight < scrollViewHeight;
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flex: isMobile ? undefined : 1,
        width: '100%',
        backgroundColor: isMobile ? variables.colors.greenLight : variables.colors.greenLight,
      }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isMobile ? variables.colors.greenLight : 'black',
      }}>
      {isMobile ? 
        <></>
      : <View
        style={{
          display: 'flex',
          width: '100%',
          backgroundColor: isMobile ? variables.colors.yellow : 'black',
        }}>
          <View style={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: isMobile ? variables.colors.yellow : 'white',
            flex: 1,
            display: "flex",
            flexDirection: 'row',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 20,
            paddingRight: 20,
            justifyContent: 'space-around',
          }}>
            <View style={{flex: 1}}></View>
            <View style={{flexDirection: isMobile ? 'column' : 'row'}}>
              {menu.map((m, i) => (
                <KButton
                  key={`menu_${i}`}
                  color={m.active ? 'tertiary' : 'light'}
                  text={m.text}
                  icon={m.icon as any}
                  onPress={m.onPress}
                  style={{marginRight: 10}}
                />
              ))}
            </View>

            <View style={{flex: 1, justifyContent: "flex-end", flexDirection: "row"}}>
              {/* {route.name === "Myplace" && <>
                <KButton
                  color="light"
                  onPress={() => setModal('property')}
                  style={{flexDirection: 'row', borderWidth: isMobile ? 0 : 1, borderColor: variables.colors.borderGray}}
                  size={isMobile ? 'small' : 'medium'}>
                  <KIcon name="edit" size="large" />
                  {isMobile ? null : <KText>Edit property</KText>}
                </KButton>
              </>} */}
            </View>
        </View>
      </View>}

      <ScrollView
        onLayout={e => {
          setScrollViewHeight(e.nativeEvent.layout.height);
        }}
        contentContainerStyle={{
          paddingTop: isMobile ? 0 : 10,
          // flex: 1,
          flex: isContentSmallerThanScreen() ? 1 : undefined, // This is what should change based on the size of the view
          width: '100%',
        }}
        style={{
          display: 'flex',
          flex: 1,
          backgroundColor: variables.colors.greenLight,
        }}>
        {route.name === 'Account' && (<>
          <MainInfo
            onLayout={e => {
              setContentHeight(e.nativeEvent.layout.height);
            }}
            property={prop}
            creds={user}
            onEditPropertyPressed={() => setModal('property')}
            onEditProfilePressed={() => setModal('user')}
            onHomePressed={() => props.navigation.navigate('Home')}
          />
          {/* <KButton
            icon="support"
            text={config?.emails.support || 'Contact support'}
            onPress={() => {
              Linking.openURL(`mailto:${config?.emails.support}`);
            }}
            style={{
              backgroundColor: variables.colors.darkYellow,
              width: isMobile ? '100%' : '100%',
              display: 'flex',
              paddingLeft: 5,
              marginBottom: isMobile ? 10 : 0,
              marginTop: 10,
              alignItems: 'flex-start',
            }}
            color="greenLight" /> */}

          </>
        )}
        {route.name === "Myplace" && <MyPlace
          onEditPropertyPressed={onEditPropertyPressed}
          onPropertyEdited={loadProperty}
          privateProperty={prop}
          id={prop?.id}
          onBackPressed={() => props.navigation.navigate("Account", {edit: undefined})}
          navigation={props.navigation}
          />}
        {isHistory && <History />}


      </ScrollView>

      {isMobile && route.name === "Account" && (
        <View
          style={{
            alignItems: 'center',
            width: '100%',
            backgroundColor: variables.colors.greenLight,
            paddingHorizontal: isMobile ? 10 : "5%"
          }}>
            {menu.map((m, i) => (
              <KButton
                color={'light'}
                text={m.text}
                icon={m.icon as any}
                onPress={m.onPress}
                key={`menu_${i}`}
                style={{
                  width: '100%',
                  display: m.active ? 'none' : 'flex',
                  borderWidth: 0,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  paddingLeft: 5,
                  paddingRight: 15,
                  marginBottom: 5,
                  marginTop: 5,
                }}
              />
            ))}

          {/* <KButton
            color={'light'}
            onPress={() => {}}
            style={{
              width: '100%',
              borderWidth: 0,
              alignItems: 'center',
              paddingLeft: 10,
              paddingRight: 10,
              marginBottom: 10,
              marginTop: 5,
              flexDirection: 'row',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <KIcon name="email" size="large" />
              <KText>{user?.creds.email}</KText>
            </View>
            <VerifyButton type="email" />
          </KButton> */}

          {/* <KButton
            color={'light'}
            onPress={() => {}}
            icon="phone"
            style={{
              width: '100%',
              borderWidth: 0,
              alignItems: 'center',
              paddingLeft: 10,
              paddingRight: 10,
              marginBottom: 10,
              flexDirection: 'row',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
            {phoneValid ? (
              <View
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <KIcon name="phone" size="large" />
                  <KText>{phone}</KText>
                </View>
                <VerifyButton type="phone" />
              </View>
            ) : (
              EditProfileText('Add a phone number')
            )}
          </KButton> */}
        </View>
      )}

      {props.route.name === "Account" ? <>
        <View
          style={{
            width: '100%',
            display: isMobile && route.name !== "Account" ? "none" : 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 10,
            paddingRight: 10,
            marginTop: 5,
            backgroundColor: variables.colors.greenLight,
          }}>
          <KButton
            icon="support"
            text={config?.emails.support || 'Contact support'}
            onPress={() => {
              Linking.openURL(`mailto:${config?.emails.support}`);
            }}
            style={{
              backgroundColor: variables.colors.darkYellow,
              width: isMobile ? '100%' : 'auto',
              display: isMobile ? 'flex' : "none",
              paddingLeft: 5,
              marginBottom: isMobile ? 10 : 0,
              alignItems: 'flex-start',
            }}
            color="greenLight" />

          <KButton
            icon="logout"
            text="Log out"
            onPress={logout}
            style={{
              backgroundColor: variables.colors.darkYellow,
              width: isMobile ? '100%' : 'auto',
              display: isMobile ? 'flex' : "none",
              paddingLeft: 5,
              marginBottom: isMobile ? 10 : 0,
              alignItems: 'flex-start',
            }}
            color="greenLight"
          />
        </View>

      </> : null}

      {isMobile ? <>
        <View style={{height: 90}}></View>
        <Menu navigate={props.navigation.navigate} style={{
          // position: "fixed"
        }}/>
      </> : null}

      <KSideModal
        style={{
          padding: 20,
        }}
        visible={!!modal}
        onClose={() => setModal(null)}>
        {modal === 'user' && EditProfileView}
        {modal === 'property' && EditPropertyView}
      </KSideModal>
    </ScrollView>
  );
};
