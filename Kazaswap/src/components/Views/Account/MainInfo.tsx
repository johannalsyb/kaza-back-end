import {ActivityIndicator, Pressable, View, Text, TextStyle, LayoutChangeEvent} from 'react-native';
import KText from '../../KText';
import variables from '../../../styles/variables';
import {PropertyCard} from '../../PropertyCard/PropertyCard';
import {CircleImage} from '../../CircleImage/CircleImage';
import KIcon, {IconName} from '../../KIcon/KIcon';
import {Creds} from '../../forms/auth/Register';
import {Api, User} from '@kazaswap/common';
import useIsMobile from '../../../hooks/useIsMobile';
import VerifyButton from '../../VerifyButton';
import {IconText} from '../../IconText/IconText';
import Gap from '../../Gap/Gap';
import {useEffect, useState} from 'react';
import KButton from '../../KButton/KButton';
import Footer from '../../Footer';
import { useRoute } from '@react-navigation/native';
import useConfig from '../../../hooks/useConfig';
import users from '../../../api/users';
import { showComponentAtom } from '../../../atoms';
import { useSetAtom } from 'jotai';
import VerifyPhone from '../../VerifyPhone';
import { toastSuccess } from '../../Toast/Toast';
import useAuthentication from '../../../hooks/useAuthentication';

type Props = {
  creds?: {user: User; creds: Creds};
  property?: Api.Properties.PrivateProperty;
  onEditProfilePressed?: () => void;
  onEditPropertyPressed?: () => void;
  onHomePressed?: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

const MAX_CHARS = 200;
const PADDING_H_MOBILE=10

export default (props: Props) => {
  const {isMobile} = useIsMobile();
  const isDescriptionTooLong =
    (props.creds?.creds.hobby?.length || 0) > MAX_CHARS;

  const [setShowModalComponent] = [useSetAtom(showComponentAtom)];
  const [readMore, setReadMore] = useState(isDescriptionTooLong);
  const [property, setProperty] = useState(props.property);
  const route = useRoute()

  const {config} = useConfig()
  const auth = useAuthentication()

  useEffect(() => {
    if(props.property) setProperty(props.property)

  }, [props.property])

  const formatTextDescription = (text: string, style:TextStyle = {}) => {
    const str = readMore ? text.slice(0, MAX_CHARS).concat('...') : text
    return (
      <KText style={{...style}}>
        {str}
        {isDescriptionTooLong && (
          <Pressable onPress={() => setReadMore(prev => !prev)}>
            <Text style={{textDecorationLine: 'underline'}}>
              {readMore ? 'Read more' : 'Read less'}
            </Text>
          </Pressable>
        )}
      </KText>
    );
  };

  if (!props.creds) return <ActivityIndicator />;

  const user = props.creds.user;

  const img = `${user?.id}/${
    props.creds.creds.image || props.creds.creds.primaryImage
  }`;
  const propImage = property
    ? `${property.id}/${
        property.images.includes(',')
          ? (property.images + '').split(',')[0]
          : property.images
      }`
    : undefined;

  let propAddress = property?.address.split(',').slice(1).join();
  if(!propAddress || propAddress.length === 0) propAddress = `${property?.city ? property?.city+"," : ""} ${property?.country || ""}`

  const noAddress = propAddress.trim().length === 0;

  const EditProfileText = (text: string, iconName: IconName) => (
    <Pressable onPress={() => props.onEditProfilePressed?.()}>
      <IconText
        text={text}
        textStyle={{textDecorationLine: 'underline'}}
        iconName={iconName}
        size="medium"
      />
    </Pressable>
  );

  const phoneValid =
    props.creds.creds.phone &&
    props.creds.creds.phone.number &&
    props.creds.creds.phone.number.length &&
    props.creds.creds.phone.code;
  const phone = phoneValid
    ? `${props.creds.creds.phone.code}${props.creds.creds.phone.number}`
    : undefined;

  const marginVertical = isMobile ? 10 : 20;

  return (
    <View
      onLayout={e => props.onLayout && props.onLayout(e)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: isMobile ? 0 : 20,
        paddingRight: isMobile ? 0 : 20,
      }}>
      <View
        style={{
          width: '100%',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'stretch',
          justifyContent: isMobile ? undefined : 'center',
          // maxWidth: 1800,
        }}>
        {/* The yellow box */}
        <View
          style={[
            {
              backgroundColor: variables.colors.yellow,
              borderRadius: isMobile ? 0 : 20,
              borderBottomRightRadius: 20,
              borderBottomLeftRadius: 20,
              flex: 1,
              marginRight: isMobile ? 0 : 20,
              marginBottom: isMobile ? marginVertical : 0,
              padding: 20,
              justifyContent: 'center',
              flexDirection: "column",
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? undefined : 900,
              // minHeight: isMobile ? undefined : 300,
            },
            !isMobile && {alignItems: 'center'},
          ]}>
          {/* The user picture */ }
          <View
            style={[{marginBottom: marginVertical, marginTop: marginVertical},
              isMobile && {
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <CircleImage
              style={{
                // aspectRatio: 1,
                borderRadius: 200,
                height: 150,
                width: 150,
                borderWidth: 3,
                borderColor: 'white',
                borderStyle: 'solid',
              }}
              imageId={img}
              type="users"
            />
          </View>
          {/* The user name and description */}
          <View
            style={{
              flex: 1,
              // height: '90%',
              marginBottom: marginVertical,
              alignItems: 'center',
            }}>
            <KText style={{fontSize: 40, marginBottom: marginVertical, fontWeight: 'bold'}}>
              {props.creds.creds.firstName}
            </KText>

            {noAddress ? null : <IconText
                iconName="location"
                size="medium"
                text={propAddress}
                style={{overflow: 'visible'}}
              />}
            
            <View style={{alignContent: "center", marginTop: marginVertical*2, marginBottom: marginVertical}}>
              {props.creds.creds.hobby ? (
                formatTextDescription(props.creds.creds.hobby, {textAlign: "center"})
              ) : (
                EditProfileText('Add a description', 'defaultIconSmile')
              )}
            </View>

            <View style={{alignContent: "center", marginTop: marginVertical, marginBottom: marginVertical}}>
              {props.creds.creds.job ? (
                <IconText
                  size="medium"
                  iconName="job"
                  text={props.creds.creds.job}
                />
              ) : (
                EditProfileText('Add your job', 'job')
              )}
            </View>

            {/* The user contact information */}
            <View
              style={{
                flex: isMobile ? undefined : 1,
                // maxWidth: isMobile ? undefined : 300,
                marginLeft: 0,
                width: '100%',
                marginTop: isMobile ? marginVertical : 10,
                flexDirection: isMobile ? "column-reverse" : "row",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <View style={{marginLeft: 10, marginRight: 10, flexDirection: "row"}}>
                  {phoneValid ? ( <>
                    <IconText size="medium" text={phone} iconName="phone" />
                    {config?.features.sms ? <VerifyButton type="phone" onSent={() => {
                      setShowModalComponent(<VerifyPhone onVerified={() => {
                        toastSuccess("Phone verified successfully")
                        auth.check(true)
                        .catch(err => console.error(err))
                        .finally(() => setShowModalComponent(null))
                      }} />)
                    }}/> : null}
                    </>
                  ) : (
                    EditProfileText('Add a phone number', 'phone')
                  )}
                  {/* <VerifyButton type="phone" /> */}
                </View>
                <View style={{
                  marginLeft: 10,
                  marginRight: 10,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: isMobile ? 10 : 0
                }}>
                  <IconText
                    size="medium"
                    text={props.creds.creds.email}
                    iconName="email"
                  />
                  <VerifyButton type="email" />
                  {/* {user.emailVerified ? <KIcon name="tickWobbly" size="medium" /> : null} */}
                </View>
            </View>
          </View>

          <KButton
            color={isMobile ? "light" : "primary"}
            onPress={() => props.onEditProfilePressed && props.onEditProfilePressed()}
            style={{
              flexDirection: 'row',
              borderWidth: isMobile ? 0 : 1,
              marginTop: marginVertical,
              marginBottom: marginVertical,
              // borderColor: variables.colors.borderGray,
              position: isMobile ? "absolute" : "relative",
              right: isMobile ? 20 : "auto",
              top: isMobile ? 10 : "auto",
            }}
            size={isMobile ? 'small' : 'medium'}>
            <KIcon name="edit" size="large" style={{stroke: isMobile ? "black" : variables.colors.yellow}}/>
            {!isMobile && <KText style={{color: "white"}}>Edit Profile</KText>}
          </KButton>

          {isMobile && <KButton
            color="light"
            onPress={() => props.onHomePressed && props.onHomePressed()}
            style={{flexDirection: 'row', borderWidth: isMobile ? 0 : 1, borderColor: variables.colors.borderGray, position: "absolute", left: 20, top: 20}}
            size={'small'}>
            <KIcon name="search" size="large" />
          </KButton>}

        </View>
        {/* <View style={[{
          paddingHorizontal: isMobile ? PADDING_H_MOBILE : 0,
          width: isMobile ? '100%' : 'auto',
        },
        !isMobile ? {maxHeight: 294} : {marginBottom: 20}
        ]}>
          <PropertyCard
            // style={!isMobile ? {maxHeight: 294} : {marginBottom: 20}}
            favourite={false}
            photo={propImage}
            avatar={img}
            swapFor={user?.swapLocations}
            location={
              props.property
                ? `${props.property?.city}, ${props.property.country}`
                : '?'
            }
            userId={user?.id}
            availableDate={
              user && user.dateFrom && user.dateTo
                ? {from: new Date(user.dateFrom), to: new Date(user.dateTo)}
                : undefined
            }
            onEditPressed={props.onEditPropertyPressed}
          />
        </View> */}
      </View>
      <View
        style={{
          display: 'flex',
          flex: 1,
          width: '100%',
          justifyContent: 'flex-end',
        }}>
        <Footer route={route.name} />
      </View>
    </View>
  );
};
