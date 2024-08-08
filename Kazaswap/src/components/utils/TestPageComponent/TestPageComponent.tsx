import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import KButton from '../../KButton/KButton';
import Gap from '../../Gap/Gap';
import KModal from '../../KModal/KModal';
import {CircleImage} from '../../CircleImage/CircleImage';
import {PropertyCard} from '../../PropertyCard/PropertyCard';
import ProfileButton from '../../ProfileButton/ProfileButton';
import KTextInput from '../../Form/KTextInput/KTextInput';
import KIcon, {IconName} from '../../KIcon/KIcon';
import FormField from '../../Form/FormField/FormField';
import CheckBox from '../../CheckBox/CheckBox';

export const TestPageComponent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const fromDate = new Date();
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + 7);
  const [passwordIcon, setPasswordIcon] = useState<IconName>('eyeClose');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordErrorText, setPasswordErrorText] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [checked, setChecked] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <ProfileButton
        label="MyPlace"
        icon="location"
        notificationCount={3}
        navigateTo="MyPlace"
      />
      <Gap vertical />
      <ProfileButton
        label="Preferences"
        icon="preferences"
        notificationCount={0}
        navigateTo="Profile"
      />
      <Gap vertical />
      <ProfileButton label="evelyneconnord@gmail.com" icon="email" />
      <Gap vertical />
      <FormField style={{zIndex: 1}} label="Where is your place located?">
        <KTextInput
          onChangeText={() => {}}
          inputStyles={{textAlign: 'left'}}
          leftComponent={<KIcon name="location" />}
          suggestionCallback={() => {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(['London', 'Paris', 'Berlin', 'Amsterdam']);
              }, 500);
            });
          }}
        />
      </FormField>
      <FormField label="Description">
        <KTextInput
          placeholder="Description"
          onChangeText={() => {}}
          multiline
          numberOfLines={6}
          inputStyles={{textAlign: 'left'}}
        />
      </FormField>
      <FormField labelAlign="center" label="Password">
        <KTextInput
          placeholder="password"
          error={passwordErrorText}
          textContentType="password"
          secureTextEntry={!isPasswordVisible}
          autoComplete="password"
          rightComponent={<KIcon name={passwordIcon} />}
          onRightComponentPress={() => {
            setPasswordIcon(
              passwordIcon === 'eyeClose' ? 'eyeOpen' : 'eyeClose',
            );
            setIsPasswordVisible(!isPasswordVisible);
          }}
          onChangeText={setPassword}
          onBlur={() => {
            if (password.length && password.length < 8) {
              setPasswordErrorText('Password too short');
            } else {
              setPasswordErrorText('');
            }
          }}
          onFocus={() => setPasswordErrorText('')}
        />
      </FormField>
      <CheckBox
        name="Test"
        checked={checked}
        onPress={() => setChecked(prev => !prev)}
      />
      <Gap vertical />
      {/* <PropertyCard
        favourite={false}
        location="London"
        // swapFor={['Marseille', 'Brighton', 'Paris', 'Berlin', 'Amsterdam']}
        availableDate={{from: fromDate, to: toDate}}
      /> */}
      <Gap vertical />
      <CircleImage source="" size="xsmall" />
      <Gap vertical />
      <CircleImage source="" size="small" />
      <Gap vertical />
      <CircleImage source="" size="medium" />
      <Gap vertical />
      <CircleImage source="" size="large" />
      <Gap vertical />
      <KButton
        text="Test Button 1"
        onPress={() => console.log('Test Button Pressed')}
      />
      <Gap vertical />
      <KButton
        text="Test Modal 2"
        color="secondary"
        onPress={() => setIsVisible(true)}
      />
      <Gap vertical />
      <KButton
        text="Test Button 3"
        color="tertiary"
        onPress={() => console.log('Test Button Pressed')}
      />
      <Gap vertical />
      <KButton
        text="Test Button"
        color="light"
        onPress={() => console.log('Test Button Pressed')}
      />
      <Gap vertical />
      <KButton
        text="Test Button"
        color="greenLight"
        onPress={() => console.log('Test Button Pressed')}
      />
      <Gap vertical />
      <KButton
        text="+"
        color="greenLight"
        size="small"
        onPress={() => console.log('Test Button Pressed')}
      />
      <Gap vertical />
      <KButton
        text="Test Button"
        color="primary"
        size="large"
        onPress={() => console.log('Test Button Pressed')}
      />
      <Gap vertical />
      <KButton
        text="+"
        color="primary"
        size="xxsmall"
        onPress={() => console.log('Test Button Pressed')}
      />
      <Gap vertical />
      <KButton
        text="Edit"
        color="secondary"
        size="xsmall"
        onPress={() => console.log('Test Button Pressed')}
      />
      <KModal visible={isVisible} setVisibility={setIsVisible}>
        <View style={{height: 200}} />
      </KModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    width: '100%',
    height: '100%',
    // justifyContent: 'space-around',
    // alignItems: 'center',
    // flexDirection: 'column',
    padding: 20,
  },
});
