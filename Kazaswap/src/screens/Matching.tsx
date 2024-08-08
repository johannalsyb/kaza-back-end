import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavStackParamList} from '../navigation/screens';
import KText from '../components/KText';
import {ActivityIndicator, ScrollView, View} from 'react-native';
import {useEffect, useState} from 'react';
import Properties from '../api/properties';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import useIsMobile from '../hooks/useIsMobile';
import variables from '../styles/variables';
import useAuthentication from '../hooks/useAuthentication';
import KIcon from '../components/KIcon/KIcon';
import KButton from '../components/KButton/KButton';
import PropertyList from '../components/Views/Properties/PropertyList';
import useConfig from '../hooks/useConfig';
import { Api } from '@kazaswap/common';
import { PublicProperty } from '@kazaswap/common/lib/types/Property';
import { useSetAtom } from 'jotai';
import { showSwapNowAtom } from '../atoms';

type Props = NativeStackScreenProps<NavStackParamList, 'Matching'>;

export default ({route, navigation}: Props) => {
  const {user} = useAuthentication()
  const [properties, setProperties] = useState<Api.Matches.Match[]>();
  const {isMobile} = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const {config} = useConfig()
  const [loading, setLoading] = useState(false);
  const setShowSwapNow = useSetAtom(showSwapNowAtom);


  useEffect(() => {
    if(!user) return setProperties([])
    setLoading(true);
    Properties.matches.get()
      .then(res => {
        if (!res.data) return;
        setProperties( 
          res.data.matches
        );
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if(!properties) return <ActivityIndicator color={variables.colors.yellow} />
  return <PropertyList
    loading={loading}
    properties={properties.map(p => ({...(p.property as unknown as Property), bubble: !p.seen ? "NEW" : undefined}))}
    navigation={navigation}
    onSearch={() => {}}
    onShowMore={null}
    showSearchBar={false}
    emptyListView={
      <View style={{
        backgroundColor: variables.colors.greenLight,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}>
        {/* <KIcon name="fav" size="xxlarge" style={{
          stroke: "black",
          backgroundColor: "white",
          borderRadius: 100,
          padding: 10,
        }} /> */}
        <KText style={{fontSize: isMobile ? 18 : 25, fontWeight: "bold", marginTop: 20, marginBottom: 20, textAlign: "center"}}>
          {user ? "No matches for today" : "Please login to see your matches"}
        </KText>
        {user ?
          <>
            <KText style={{maxWidth: isMobile ? "90%" : "25%", textAlign: "center", lineHeight: 20}}>
              You can edit your availabilities to find matches that suit your schedule.
            </KText>
            <KButton text="Edit availabilities" color="primary" onPress={() => {
                setShowSwapNow(true)
            }} style={{marginTop: 20}}/>
          </>
        :  <View style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              width: "30%",
              marginTop: 20,
          }}>
            <KButton text="Sign in" color="light" onPress={() => {
              navigation.navigate('Login')
            }} style={{borderColor: "white"}}/>
            <KButton text="Register" color="primary" onPress={() => {
              navigation.navigate('SignUp')
            }}/>
        </View>}
      </View>
    }/>
};
