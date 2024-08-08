import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ActivityIndicator, Pressable, ScrollView, View} from 'react-native';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import {NavStackParamList} from '../../../navigation/screens';
import useAuthentication from '../../../hooks/useAuthentication';
import useIsMobile from '../../../hooks/useIsMobile';
import Filters, {
  placeTypeFilters,
  nbBedroomFilters,
  Handle,
} from '../../Filters';
import MapView from '../../MapView';
import variables from '../../../styles/variables';
import {PropertyCard} from '../../PropertyCard/PropertyCard';
import Menu from '../../Menu';
import useConfig from '../../../hooks/useConfig';
import KText from '../../KText';
import KButton from '../../KButton/KButton';
import Footer from '../../Footer';

type PProperty = Property & {bubble?: string};

type Props = {
  properties: PProperty[];
  navigation: NativeStackNavigationProp<
    NavStackParamList,
    'Properties' | 'Matching' | 'Favourites',
    undefined
  >;
  emptyListView: React.ReactNode;
  onSearch: (search: string) => void;
  onShowMore: (() => void) | null;
  showSearchBar?: boolean;
  loading?: boolean;
};

export type PropertyFilter = {
  placeType: string[];
  bedrooms: string[];
  petsFriendlyOnly: string[];
  swapWithWomen: string[];
};

const defaultFilters: PropertyFilter = {
  bedrooms: nbBedroomFilters,
  petsFriendlyOnly: ['false'],
  swapWithWomen: ['false'],
  placeType: placeTypeFilters,
};

export default forwardRef<Handle, Props>(
  (
    {
      properties,
      navigation,
      emptyListView,
      onSearch,
      onShowMore,
      loading,
      showSearchBar = true,
    },
    ref,
  ) => {
    const [showMap, setShowMap] = useState(false);
    const [columns, setColumns] = useState(0);
    const [filters, setFilters] = useState<PropertyFilter>(defaultFilters);
    const [contentHeight, setContentHeight] = useState(-1);
    const [scrollViewHeight, setScrollViewHeight] = useState(-1);

    const {isMobile} = useIsMobile();
    const {user, isAdmin} = useAuthentication();

    const {config, overlay} = useConfig();

    const filtersRef = useRef<Handle>(null);
    useImperativeHandle(ref, () => ({
      setSearch: (search: string) => {
        filtersRef.current?.setSearch(search);
      },
    }));

    const calculateNumberOfColumns = (width: number) => {
      const columnCount = Math.floor(width / variables.propertyCardWidth);
      return columnCount > 0 ? columnCount : 1;
    };

    useEffect(() => {
      if (showMap) {
        // force rerender
        setShowMap(false);
        setTimeout(() => setShowMap(true), 0);
      }
    }, [filters]);

    const propertiesFiltered =
      properties?.filter(p => {
        let visible = true;
        if (!filters['placeType'].includes(p.type)) visible = false;
        if (
          filters['bedrooms'][0] !== 'any' &&
          parseInt(filters['bedrooms'][0]) > p.bedrooms
        )
          visible = false;
        if (filters['petsFriendlyOnly'][0] === 'true' && !p.pets)
          visible = false;
        if (
          filters['swapWithWomen'][0] === 'true' &&
          !(p.owner.gender === 'female')
        )
          visible = false;
        return visible;
      }) || [];

    const isContentSmallerThanScreen = () => {
      if (contentHeight === -1 || scrollViewHeight === -1) return false;
      return contentHeight < scrollViewHeight;
    };

    return (
      <>
        <View style={{backgroundColor: 'black', zIndex: 1}}>
          <Filters
            ref={filtersRef}
            showSearchBar={showSearchBar}
            filters={filters}
            onShowMap={setShowMap}
            onFilter={(...nfilters) => {
              const ufilters = {...filters};
              nfilters.forEach(({type, filters}) => {
                ufilters[type] = filters;
              });
              setFilters(ufilters);
            }}
            onSearch={onSearch}
            onClearFilters={() => {
              onSearch('');
              setFilters(defaultFilters);
            }}
          />
        </View>
        {showMap ? (
          <MapView
            lat={30}
            lng={20}
            points={propertiesFiltered?.map(p => ({
              lat: p.approxLat || 0,
              lng: p.approxLon || 0,
              property: p,
            }))}
            zoom={2.5}
            style={{
              width: '100%',
              height: '100%',
              borderTopRightRadius: 20,
              borderTopLeftRadius: 20,
            }}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{
              backgroundColor: variables.colors.greenLight,
              borderTopLeftRadius: isMobile ? 0 : 20,
              borderTopRightRadius: isMobile ? 0 : 20,
            }}
            onLayout={e => {
              setColumns(calculateNumberOfColumns(e.nativeEvent.layout.width));
              setScrollViewHeight(e.nativeEvent.layout.height);
            }}
            contentContainerStyle={{
              flexDirection: 'column',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: isMobile ? variables.spacing.xsmall : 0,
              flex: isContentSmallerThanScreen() ? 1 : undefined, // This is what should change based on the size of the view
              display: 'flex',
            }}>
            <View
              onLayout={e => {
                setContentHeight(e.nativeEvent.layout.height);
              }}
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: variables.spacing.xsmall,
                // flex: 1,
                display: 'flex',
                width: '100%',
              }}>
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={variables.colors.white}
                  style={{marginTop: 20}}
                />
              ) : propertiesFiltered.length ? (
                <>
                  {propertiesFiltered.map((property, i) => {
                    let {images, owner, city, country, id} = property;
                    images = Array.isArray(images) ? images.join(',') : images;
                    return (
                      <View
                        style={[
                          {
                            padding: isMobile ? 0 : 20,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                          isMobile && {
                            width: '100%',
                            marginBottom: 10,
                          },
                        ]}
                        key={`property-${i}`}>
                        <PropertyCard
                          property={property}
                          favourite={
                            user &&
                            user.favourites &&
                            property &&
                            user.favourites.includes(property.id)
                              ? true
                              : false
                          }
                          onPress={() =>
                            navigation.navigate('Property', {id, property})
                          }
                          photo={`${id}/${images.split(',')[0]}`}
                          avatar={`${owner.id}/${owner.primaryImage}`}
                          location={`${city}`}
                          swapFor={owner.swapLocations || 'Flexible'}
                          availableDate={{
                            from: owner.dateFrom
                              ? new Date(owner.dateFrom)
                              : null,
                            to: owner.dateTo ? new Date(owner.dateTo) : null,
                          }}
                        />
                        {property.bubble ? (
                          <KText
                            style={{
                              position: 'absolute',
                              top: isMobile ? 0 : 5,
                              right: 0,
                              backgroundColor: variables.colors.orange,
                              color: 'white',
                              padding: 5,
                              borderRadius: 30,
                              zIndex: 10,
                              fontSize: 12,
                            }}>
                            {property.bubble}
                          </KText>
                        ) : null}
                      </View>
                    );
                  })}
                  {onShowMore && (
                    <View
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <KButton
                        onPress={onShowMore}
                        color="primary"
                        style={{
                          width: isMobile ? '100%' : 'auto',
                          paddingHorizontal: 10,
                          display: 'flex',
                          marginTop: isMobile ? 10 : 0,
                        }}
                        icon="arrowDown"
                        iconStyle={{stroke: 'white'}}
                        textStyle={{color: 'white'}}
                        text="Load More"
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={{width: '100%'}}>{emptyListView}</View>
              )}
              {Array.from(
                {
                  length: columns <= properties.length + 1 ? columns : 0,
                },
                (_, i) => (
                  <View
                    key={`empty-${i}`}
                    style={{
                      width: variables.propertyCardWidth,
                      marginHorizontal: isMobile ? 0 : 20,
                    }}
                  />
                ),
              )}
            </View>
            {isMobile ? (
              <View style={{height: 100, width: '100%'}} />
            ) : (
              <View style={{flex: 1}} />
            )}
            <View
              style={{
                display: 'flex',
                flex: 1,
                width: '100%',
                justifyContent: 'flex-end',
              }}>
              <Footer route={navigation.getState().routes[0].name} />
            </View>
          </ScrollView>
        )}

        <Menu navigate={navigation.navigate} />
      </>
    );
  },
);
