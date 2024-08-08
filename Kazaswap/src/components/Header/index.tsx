import {Pressable, StyleSheet, View} from 'react-native';
import useAuthentication from '../../hooks/useAuthentication';
import KIcon from '../KIcon/KIcon';
import {NativeStackHeaderProps} from '@react-navigation/native-stack';
import {NavStackParamList, isHeaderHidden} from '../../navigation/screens';
import variables from '../../styles/variables';
import KText from '../KText';
import useIsMobile from '../../hooks/useIsMobile';
import KButton from '../KButton/KButton';
import {RouteProp, useRoute} from '@react-navigation/native';
import {CircleImage} from '../CircleImage/CircleImage';
import React, {useEffect, useState} from 'react';
import {useCloseFromOutside} from '../../hooks/useCloseFromOutside';
import Notifications from '../Views/Notifications';
import UserEvent from '../../events/UserEvent';
import KSideModal from '../KModal/KSideModal';
import KTextInput from '../Form/KTextInput/KTextInput';
import autocomplete from '../../api/autocomplete';
import PropertySearchEvent from '../../events/PropertySearchEvent';
import useConfig from '../../hooks/useConfig';
import MenuIcon from './MenuIcon';
import HeaderEvent from '../../events/HeaderEvent';
import MenuItem from './MenuItem';
import { shareProperty } from '../../utils/Share';


let ueNotificationListenerId: string | undefined = undefined
let ueNewMatchListenerId: string | undefined = undefined
export default (
  props: NativeStackHeaderProps & {
    force?: boolean;
    title?: string | React.ReactNode;
    leftComponent?: React.ReactNode;
    rightComponent?: React.ReactNode;
  },
) => {
  const auth = useAuthentication();
  const user = auth.user;
  const isAdmin = auth.isAdmin
  const {isMobile} = useIsMobile();
  const {overlay} = useConfig();
  const hidden = props.force
    ? false
    : isHeaderHidden(props.route.name as any, isMobile);
  const [menuVisible, setMenuVisible] = useState(false);
  const popupMenuRef = useCloseFromOutside(menuVisible, setMenuVisible);

  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const popupNotificationsRef = useCloseFromOutside(
    notificationsVisible,
    setNotificationsVisible,
  );
  const ur = parseInt(localStorage.getItem("unreadNotifications") || "0")
  const nm = parseInt(localStorage.getItem("newMatches") || "0")
  const [bubbles, setBubbles] = useState<{notifications: number, matches: number}>({notifications: ur, matches: nm});
  const [showMobileSearchBar, setShowMobileSearchBar] =
    useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const route = useRoute<RouteProp<NavStackParamList>>();
  const isExplore = route.name === 'Home' || route.name === 'Property';
  const isChat = route.name === 'Chats' || route.name === 'Chat';
  const isFavourites = route.name === 'Favourites';

  const searchAvailable = !isFavourites;

  let title: React.ReactNode =
    typeof props.title === 'string' ? (
      <KText>{props.title}</KText>
    ) : (
      props.title
    );
  let leftButton: "search" | "back" | "none" = "search";
  let rightButton: "notifications" | "edit" | "none" | "share" = "notifications";
  let headerText = 'Swap Your Place';
  let editFn = () => {}

  if(route.name === "Home") {
    rightButton = user ? "notifications" : "none"
  } else if(route.name === "Property") {
    leftButton = "back"
    rightButton = "none"
  } else if(route.name === "Account") {
    leftButton = "none"
    rightButton = "edit"
    editFn = () => HeaderEvent.emit("edit", "user")
  } else if(route.name === "Myplace") {
    leftButton = "back"
    const isPreview = !!((route.params as {preview?: boolean}).preview)
    rightButton = isPreview ? "share" : "edit"
    headerText = 'My Place'
    editFn = () => {
      isPreview ?  HeaderEvent.emit("share", "property") :
      HeaderEvent.emit("edit", "property")
    }
  } else if (route.name === 'History') {
    leftButton = "back"
    rightButton = "none"
    headerText = 'Swap History'
  } else if (route.name === 'Matching') {
    headerText = 'Matches'
  } else if (route.name === 'Favourites') {
    headerText = 'Favourites'
  } else if (route.name === 'Chats') {
    headerText = 'Chat'
  }

  if (!title) {
    if (isExplore) headerText = 'Explore';
    title = <KText>{headerText}</KText>;
  }

  useEffect(() => {
    if(ueNotificationListenerId) UserEvent.removeListener('notification', ueNotificationListenerId);
    ueNotificationListenerId = UserEvent.addListener('notification', u => {
      localStorage.setItem("unreadNotifications", `${u.unreadNotifications || 0}`)
      setBubbles({...bubbles, notifications: u.unreadNotifications || 0});
    })


    if(ueNewMatchListenerId) UserEvent.removeListener('match', ueNewMatchListenerId);
    ueNewMatchListenerId = UserEvent.addListener('match', u => {
      localStorage.setItem("newMatches", `${u.newMatches || 0}`)
      setBubbles({...bubbles, matches: u.newMatches || 0});
    })

    return () => {
      if (ueNotificationListenerId) UserEvent.removeListener('notification', ueNotificationListenerId);
      if (ueNewMatchListenerId) UserEvent.removeListener('match', ueNewMatchListenerId);
    };
  }, []);

  const searchIcon = () => <MenuIcon icon="search"
    onPress={() => {
      if (!searchAvailable) return;
      setShowMobileSearchBar(true);
    }}
    style={{
      opacity: !searchAvailable ? 0 : 1,
      // flex: 1
    }} />
  const notificationsIcon = () => <MenuIcon icon="bell" onPress={() => setNotificationsVisible(true)} bubble={bubbles.notifications}/>
  const editIcon = (fn: () => void) => <MenuIcon icon="edit" onPress={fn} iconStyle={{stroke: variables.colors.yellow, backgroundColor: "black"}}/>
  const shareIcon = (fn: () => void) => <MenuIcon icon="share" onPress={fn}/>
  const backIcon = () => <MenuIcon icon="back" onPress={() => {
    if(route.name === "Myplace") HeaderEvent.emit("back", "")
    // else {
      else props.navigation.canGoBack() ? props.navigation.goBack() : props.navigation.navigate("Home")
    // }
  }}/>
  const emptyIcon = () => <View style={{width: 30, height: 30}} />

  const notificationsView = () => {
    if (!user) return null;
    if (isMobile)
      return (
        <KSideModal
          visible={notificationsVisible}
          onClose={visible => {
            setNotificationsVisible(false);
          }}>
          <Notifications unreadNotifications={bubbles.notifications || 0} />
        </KSideModal>
      );
    return (
      <View
        ref={popupNotificationsRef}
        style={[
          styles.popupmenu,
          {
            width: isMobile ? '100%' : 400,
            maxHeight: isMobile ? 'auto' : 400,
            top: isMobile ? 0 : 65,
          },
          {display: notificationsVisible ? undefined : 'none'},
        ]}>
        {isMobile ? null : (
          <View style={[styles.triangle, {right: 92, position: 'absolute'}]} />
        )}
        <Notifications unreadNotifications={bubbles.notifications || 0} />
      </View>
    );
  };

  const topMenu = [
    {
      onPress: () => props.navigation.navigate('Home'),
      selected: isExplore,
      icon: "search",
      text: "Explore",
      bubble: 0,
      hidden: false
    },
    {
      onPress: () => props.navigation.navigate('Favourites'),
      selected: route.name === 'Favourites',
      icon: "fav",
      text: "Favourites",
      bubble: 0,
      hidden: false
    },
    {
      onPress: () => props.navigation.navigate('Matching'),
      selected: route.name === 'Matching',
      icon: "matching",
      text: "Matches",
      bubble: bubbles.matches,
      hidden: user?.role.includes("admin")
    },
    {
      onPress: () => props.navigation.navigate('Chats'),
      selected: route.name === 'Chats' || route.name === 'Chat',
      icon: "chat",
      text: "Chats",
      bubble: bubbles.notifications,
      hidden: false
    },
  ]

  const menu = [
    {
      onPress: () => props.navigation.navigate('Account'),
      icon: "profile",
      text: "My Profile"
    },
    {
      onPress: () => props.navigation.navigate('Myplace', {edit: undefined, preview: isMobile ? undefined : true}),
      icon: "location",
      text: "My Place"
    },
    {
      onPress: () => props.navigation.navigate('History'),
      icon: "history",
      text: "Swap History"
    }
  ]
  if(["admin", "superadmin"].includes(user?.role || "") && !isMobile) menu.push({
    onPress: () => props.navigation.navigate('Admin'),
    icon: "review",
    text: "Admin"
  })

  const menuItemView = (icon: string, text: string, onPress: () => void) => <KText
    key={text}
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
      marginTop: 5,
    }}
    onPress={onPress}>
    <KIcon
      name={icon as any}
      size="medium"
      style={{
        marginRight: 5,
        stroke: variables.colors.blackLight,
      }}
    />
    {text}
  </KText>

  if (hidden) return null;

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        // justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        backgroundColor: isMobile ? variables.colors.greenLight : 'black',
        padding: isMobile ? 5 : 20,
        // flex: 1,
      }}>

      {isMobile && overlay && (!user || !isAdmin) && <View style={{
        width:"100%",
        height: "100%",
        position: "absolute",
        top: 0,
        zIndex: 100,
        //@ts-ignore
        backdropFilter: "blur(3px)",
        //@ts-ignore
        webkitBackdropFilter: "blur(3px)"
      }} />}

      {isMobile && showMobileSearchBar ? (
        <>
          <KTextInput
            placeholder="Search for a city or country"
            topStyle={{flex: 1, height: 40, marginRight: 10, justifyContent: "center"}}
            inputStyles={{textAlign: 'left'}}
            leftComponent={<KIcon name="search" size="medium" />}
            value={search}
            onChangeText={text => setSearch(text)}
            autoFocus={true}
            suggestionCallback={text => {
              return autocomplete.zone(text).then(res => {
                return res.data.results.map((r: any) => r.description);
              });
            }}
            onSuggestionSelected={text => {
              // onSearch(text)
              setSearch(text);
              new PropertySearchEvent().emit(text);
            }}
          />
          <KIcon
            name="crossCircle"
            size="medium"
            onPress={() => {
              setSearch('');
              setShowMobileSearchBar(false);
            }}
            style={{
              backgroundColor: 'black',
              borderRadius: 50,
              padding: 5,
              stroke: 'white',
            }}
          />
        </>
      ) : (
        <>
          {isMobile ? (
            props.leftComponent || <>
              {leftButton === "search" ? searchIcon() : null}
              {leftButton === "back" ? backIcon() : null}
              {leftButton === "none" ? emptyIcon() : null}
            </>
          ) : (
            <View style={{flex: .5}}>
              <KIcon
                name="logoText2"
                width={130}
                height={40}
                onPress={() => {
                  props.navigation.navigate('Home');
                }}
                style={{
                  fill: 'white',
                }}
              />
            </View>
          )}

          {isMobile ? <KText style={{flex: isMobile ? 1 : undefined, textAlign: "center"}}>{title}</KText>
            : <View
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {topMenu.map(m => <MenuItem
                key={m.text}
                onPress={m.onPress}
                selected={m.selected}
                text={m.text}
                icon={m.icon}
                bubble={m.bubble}
                />)}
            </View>
          }

          <View
            style={{
              flexDirection: 'row',
              flex: isMobile ? undefined : .5,
              justifyContent: 'flex-end',
            }}>
            <View style={{
              flexDirection: 'row',
            }}>
              {!isMobile ? (
                user ? (
                  <>
                    {notificationsIcon()}
                    <Pressable
                      onPress={() => {
                        if (!menuVisible) setMenuVisible(true);
                      }}>
                      <CircleImage
                        thumbnail={true}
                        imageId={`${user.id}/${user.primaryImage}`}
                        type="users"
                        style={{width: 45, height: 45, marginLeft: 10}}
                      />
                    </Pressable>
                    <View
                      ref={popupMenuRef}
                      style={[
                        styles.popupmenu,
                        {display: menuVisible ? undefined : 'none'},
                      ]}>
                      <View
                        style={[
                          styles.triangle,
                          {right: 15, position: 'absolute'},
                        ]}
                      />

                      {menu.map(m => menuItemView(m.icon, m.text, m.onPress))}
                      <View
                        style={{
                          height: 0,
                          borderWidth: 1,
                          borderColor: variables.colors.grey,
                          borderStyle: 'dashed',
                          marginBottom: 5,
                          marginTop: 5,
                        }}></View>
                        {menuItemView("logout", "Logout", () => auth.logout())}
                    </View>
                  </>
                ) : (
                  <>
                    <KButton
                      text="Register"
                      icon="register"
                      color="primary"
                      textStyle={{fontSize: 12}}
                      style={{width: "auto"}}
                      onPress={() => {
                        props.navigation.navigate('SignUp');
                      }}
                    />
                    <KButton
                      text="Sign In"
                      icon="login"
                      iconStyle={{stroke: 'white'}}
                      color="tertiary"
                      style={{backgroundColor: "transparent"}}
                      textStyle={{fontSize: 12}}
                      onPress={() => {
                        props.navigation.navigate('Login');
                      }}
                    />
                  </>
                )
              ) : (
                props.rightComponent || (
                  <>
                    {user ? <>
                      {rightButton === "notifications" ? notificationsIcon() : null}
                      {rightButton === "edit" ? editIcon(editFn) : null}
                      {rightButton === "none" ? emptyIcon() : null}
                      {rightButton === "share" ? shareIcon(editFn) : null}
                    </> : (
                      emptyIcon()
                    )}
                  </>
                )
              )}
            </View>
          </View>

          {notificationsView()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  popupmenu: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 55,
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    width: 200,
    right: 0,
    boxShadow: '15px 15px 55px 0px rgba(77, 75, 63, 0.25)',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 6,
    top: -6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
  },
});
