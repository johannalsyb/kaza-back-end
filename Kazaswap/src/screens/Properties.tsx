import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavStackParamList} from '../navigation/screens';
import KText from '../components/KText';
import {ActivityIndicator, View} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import Properties from '../api/properties';
import useIsMobile from '../hooks/useIsMobile';
import variables from '../styles/variables';
import PropertyList from '../components/Views/Properties/PropertyList';
import KIcon from '../components/KIcon/KIcon';
import PropertySearchEvent from '../events/PropertySearchEvent';
import { search } from '../components/KIcon/icons';
import useConfig from '../hooks/useConfig';
import { set } from '../utils/Storage/storage';
import { Handle } from '../components/Filters';
import Footer from '../components/Footer';

type Props = NativeStackScreenProps<NavStackParamList, 'Properties'>;

export default ({route, navigation}: Props) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const {isMobile} = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const {config, overlay} = useConfig()
  const [loading, setLoading] = useState(false);
  const propListRef = useRef<Handle>(null);

  const findProperties = ({
    page = currentPage,
    search = undefined
  }:{
    page?:number,
    search?: string
  }) => {
    setLoading(true);
    Properties.find({page, search})
      .then(res => {
        if (!res.data) return;
        setProperties(res.data);
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    findProperties({});
    PropertySearchEvent.addListener((search) => {
      propListRef.current?.setSearch(search);
      findProperties({search, page: 1})
    })
  }, []);

  useEffect(() => {
    if(currentPage > 1) {
      Properties.find({page: currentPage}) // TODO: Might be a bug here if more properties in a given location than the limit... might require the search params 
      .then(res => {
        if (!res.data) return;
        setProperties([...properties, ...res.data]);
      })
      .catch(err => {
        console.log(err);
      });
    }
  }, [currentPage]);

  if(!properties) return <ActivityIndicator color={variables.colors.yellow} />

  return <PropertyList
    ref={propListRef}
    loading={loading}
    properties={properties}
    navigation={navigation}
    onSearch={search => {
      findProperties({search: search.length ? search : undefined, page:1})
    }}
    onShowMore={config && properties.length >= config.query.limit*currentPage ? () => setCurrentPage(currentPage+1): null}
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
          We are sorry!
        </KText>
        <KText style={{maxWidth: isMobile ? "90%" : "25%", textAlign: "center", lineHeight: 20}}>
          There are no places for your search request yet. 
        </KText>
      </View>
    }/>
};
