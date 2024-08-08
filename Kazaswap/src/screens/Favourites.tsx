import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavStackParamList} from '../navigation/screens';
import KText from '../components/KText';
import {ActivityIndicator, ScrollView, View} from 'react-native';
import Menu from '../components/Menu';
import {useEffect, useState} from 'react';
import Properties from '../api/properties';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import {PropertyCard} from '../components/PropertyCard/PropertyCard';
import useIsMobile from '../hooks/useIsMobile';
import Filters from '../components/Filters';
import variables from '../styles/variables';
import useAuthentication from '../hooks/useAuthentication';
import KIcon from '../components/KIcon/KIcon';
import KButton from '../components/KButton/KButton';
import PropertyList from '../components/Views/Properties/PropertyList';
import useConfig from '../hooks/useConfig';

type Props = NativeStackScreenProps<NavStackParamList, 'Properties'>;

export default ({route, navigation}: Props) => {
  const {user} = useAuthentication()
  const [properties, setProperties] = useState<Property[]>();
  const {isMobile} = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const {config} = useConfig()
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(!user) return setProperties([])
    setLoading(true);
    Properties.favourites.get()
      .then(res => {
        if (!res.data) return;
        setProperties(res.data);
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if(!properties) return <ActivityIndicator color={variables.colors.yellow} />
  return <PropertyList
    loading={loading}
    properties={properties}
    navigation={navigation}
    showSearchBar={false}
    onSearch={() => {}}
    onShowMore={null}
    emptyListView={
      <View style={{
        backgroundColor: variables.colors.greenLight,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <KIcon name="fav" size="xxlarge" style={{
          stroke: "black",
          backgroundColor: "white",
          borderRadius: 100,
          padding: 10,
        }} />
        <KText style={{fontSize: isMobile ? 18 : 25, fontWeight: "bold", marginTop: 20, marginBottom: 20, textAlign: "center"}}>
          {user ? "Haven't found any favourites yet" : "Please login to see your favourites"}
        </KText>
        {user ?
          <>
            <KText style={{maxWidth: isMobile ? "90%" : "25%", textAlign: "center", lineHeight: 20}}>
              No worries! Explore our content, discover your favorites, and start building a personalized collection that speaks to you. 
            </KText>
            <KButton text="Explore" color="primary" onPress={() => {
              navigation.navigate('Home')
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
