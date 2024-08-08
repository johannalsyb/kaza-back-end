import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import variables from '../../styles/variables';
import KTextInput from '../Form/KTextInput/KTextInput';
import KIcon from '../KIcon/KIcon';
import Dropdown, { DropdownHandle } from '../Dropdown/Dropdown';
import SubHeader from '../SubHeader/SubHeader';
import useIsMobile from '../../hooks/useIsMobile';
import {Pressable, StyleSheet, View, ViewStyle} from 'react-native';
import KText from '../KText';
import KButton from '../KButton/KButton';
import { useSetAtom } from 'jotai';
import { showSignInAtom, showSwapNowAtom } from '../../atoms';
import useAuthentication from '../../hooks/useAuthentication';
import { PropertyFilter } from '../Views/Properties/PropertyList';
import KModal from '../KModal/KModal';
import properties from '../../api/properties';
import autocomplete from '../../api/autocomplete';
import { set } from '../../utils/Storage/storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NavStackParamList } from '../../navigation/screens';

type Props = {
  onShowMap: (show: boolean) => void;
  onFilter: (...filters:{type: keyof PropertyFilter , filters: string[]}[]) => void;
  onClearFilters: () => void;
  onSearch: (search: string) => void;
  filters: PropertyFilter
  showSearchBar?: boolean;
};

export type Handle = {
  setSearch: (search: string) => void;
}

export const placeTypeFilters = ['flat', 'house', 'studio', 'room'];
export const nbBedroomFilters = ['1 BR', '2 BR', '3 BR', '4+'];

const Filters = forwardRef<Handle, Props>(({
  onShowMap,
  onFilter,
  onClearFilters,
  filters,
  onSearch,
  showSearchBar = true
}, ref) => {
  const route = useRoute<RouteProp<NavStackParamList>>()
  const navigation = useNavigation()

  //@ts-expect-error
  const [showMap, setShowMap] = useState(route.params?.map || false);
  const {isMobile} = useIsMobile();
  const setShowSwapNow = useSetAtom(showSwapNowAtom);
  const setShowSignIn = useSetAtom(showSignInAtom);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [search, setSearch] = useState<string>("");
  const {user} = useAuthentication();
  const isFavourites = route.name === "Favourites"

  const flatFilterRef = React.createRef<DropdownHandle>()
  const brFilterRef = React.createRef<DropdownHandle>()

  useEffect(() => {
    onShowMap?.(showMap);
  }, [showMap]);

  useEffect(() => {
    if(!route) return
    //@ts-expect-error
    setShowMap(!!route.params?.map)
  }, [route])

  useImperativeHandle(ref, () => ({
    setSearch
  }));

  const nbFilters = (ffilters: PropertyFilter) => {
    let nb = 0
    if(ffilters["placeType"].length !== placeTypeFilters.length) nb++
    if(ffilters["petsFriendlyOnly"][0] !== "false") nb++
    if(ffilters["swapWithWomen"][0] !== "false") nb++
    if(ffilters["bedrooms"].length !== nbBedroomFilters.length) nb++
    if(search.length) nb++
    return nb
  }

  const clearFilters = () => {
    setSearch('')
    onSearch('')
    onFilter(
      {type: "placeType", filters: placeTypeFilters},
      {type: "petsFriendlyOnly", filters: ["false"]},
      {type: "swapWithWomen", filters: ["false"]},
      {type: "bedrooms", filters: nbBedroomFilters},
    )
    flatFilterRef.current && flatFilterRef.current.setSelectedItems(["any"])
    brFilterRef.current && brFilterRef.current.setSelectedItems(["any"])
  }

  const filterCount = nbFilters(filters)

  const flatTypeView = <Dropdown
    ref={flatFilterRef}
    // multiple={true}
    // selectedIndexes={placeTypeFilters.map(i => ffilters.placeType.includes(i))}
    style={{
      backgroundColor: variables.colors.blackLight,
      // width: isMobile ? "50%" : "auto",
      // width: "100%",
      flex: 1,
      height: 40,
      zIndex: 2,
      marginLeft: isMobile ? 10 : 0,
    }}
    dropdownStyle={{
      width: isMobile ? "100%" : "auto",
    }}
    onChange={(values) => onFilter({type: "placeType", filters: values[0] === "any" ? placeTypeFilters : values})}
    leftIcon="placeType"
    leftIconStyle={{stroke: "white"}}
    items={['any'].concat(placeTypeFilters)}
  />

  const filtersView = (ffilters:PropertyFilter) => <>
    {!isMobile && flatTypeView}
    <View style={{margin: 5, display: isMobile ? "flex" : "none"}} />
    <KButton
      color={ffilters.petsFriendlyOnly[0] === "true" ? "tertiary" : "light"}
      onPress={() => onFilter({type: "petsFriendlyOnly", filters: ffilters.petsFriendlyOnly[0] === "false" ? ["true"] : ["false"]})}
      style={{flexDirection: 'row', marginLeft: 10, width: isMobile ? "80%" : "auto", paddingLeft: 5, paddingRight: 5, height: 40, borderWidth: 1, borderColor: variables.colors.blackLight}}
      icon='pet'
      iconSize='medium'
      text="Pet Friendly" />
    <View style={{margin: 5, display: isMobile ? "flex" : "none"}} />
    <KButton
      color={ffilters.swapWithWomen[0] === "true" ? "tertiary" : "light"}
      onPress={() => onFilter({type: "swapWithWomen", filters: ffilters.swapWithWomen[0] === "true" ? ["false"] : ["true"]})}
      style={{flexDirection: 'row', marginLeft: 10, width: isMobile ? "80%" : "auto", paddingLeft: 5, paddingRight: 5, height: 40, borderWidth: 1, borderColor: variables.colors.blackLight}}
      icon='woman'
      iconSize='medium'
      text="Swap with women" />
    <View style={{margin: 5, display: isMobile ? "flex" : "none"}} />
    <Dropdown
      // multiple={true}
      // selectedIndexes={placeTypeFilters.map(i => filters.placeType.includes(i))}
      ref={brFilterRef}
      style={{
        backgroundColor: variables.colors.blackLight,
        width: isMobile ? "80%" : "auto",
        height: 40,
        zIndex: 1,
        marginLeft: 10,
      }}
      dropdownStyle={{
        width: isMobile ? "100%" : "auto",
      }}
      onChange={(values) => onFilter({type: "bedrooms", filters: values[0] === "any" ? nbBedroomFilters : values})}
      leftIcon="bed"
      leftIconStyle={{stroke: "white"}}
      items={['any'].concat(nbBedroomFilters)}
    />
    {filterCount > 0 && !isMobile ? clearFiltersView() : null}
  </>

  const clearFiltersView = () => <Pressable
    style={[
      styles.lightCircle,
      {
        marginLeft: isMobile ? 8.5 : 10,
        marginRight: 2.5,
        backgroundColor: variables.colors.orange,
        borderColor: variables.colors.orange,
        // position: !isMobile ? "absolute" : undefined,
        // right: 50
      },
    ]}
    onPress={clearFilters}>
    <KIcon
      name="crossCircle"
      size="large"
      style={{
        transform: "scale(1.5)"
      }}
    />
  </Pressable>

  const filterView = filtersView(filters)

  return (
    <SubHeader>
      <View style={{flexDirection: 'row', display: "flex", flex: isMobile ? 1 : undefined}}>
        {!isMobile ? <KTextInput
              placeholder="Search for a city or country"
              topStyle={{width: 290, height: !showSearchBar ? 0 : 40, marginRight: 10, flex: 1, opacity: !showSearchBar ? 0 : 1, justifyContent: "center"}}
              inputStyles={{textAlign: 'left'}}
              editable={showSearchBar}
              leftComponent={<KIcon name="search" size="medium" />}
              value={search}
              onChangeText={(text) => setSearch(text)}
              suggestionCallback={(text) => {
                return autocomplete.zone(text)
                .then((res) => {
                  return res.data.results.map((r: any) => r.description)
                })
              }}
              onSuggestionSelected={(text) => {
                onSearch(text)
                setSearch(text)
              }}
            />
        : <View style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
        }}>
            <Pressable
              style={[
                styles.lightCircle,
                {marginLeft: 2.5, marginRight: 2.5},
                {backgroundColor: variables.colors.black},
              ]}
              onPress={() => setShowFilterModal(true)}>
              <KIcon
                name="filters"
                size="large"
                style={{stroke: "white"}}
              />
              <View style={{
                position: "absolute",
                top: 8,
                right: -10,
                width: 20,
                height: 20,
                borderRadius: 50,
                backgroundColor: variables.colors.orange,
                display: filterCount ? "flex" : "none",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <KText style={{color: "white", fontSize: 10}}>{filterCount}</KText>
              </View>
            </Pressable>
            {flatTypeView}
            {filterCount > 0 && isMobile ? clearFiltersView() : null}
            <KModal
              visible={showFilterModal}
              setVisibility={() => setShowFilterModal(false)}
              style={{backgroundColor: variables.colors.greenLight, padding: 20}}
              >
              {filterView}
            </KModal>
          </View>
          }
      </View>
      {!isMobile ? <View style={{
      display: "flex",
      flexDirection: "row",
      justifyContent: "center"
    }}>{filterView}</View> : null}
      <View style={{
        flexDirection: 'row',
        alignItems: "center",
        width: isMobile ? "auto": 260,
        justifyContent: "flex-end"
      }}>
        <Pressable
          style={[
            styles.lightCircle,
            {marginLeft: 2.5, marginRight: 2.5},
            {
              backgroundColor: !showMap ? variables.colors.black : isMobile ? "white" : "transparent",
              borderColor: isMobile ? !showMap ? variables.colors.black : "white" : variables.colors.black,
            },
          ]}
          onPress={() => {
            // setShowMap(false)
            //@ts-expect-error
            navigation.navigate(route.name)
          }}>
          <KIcon
            name="cards"
            size="large"
            style={!showMap ? {color: variables.colors.white} : {}}
          />
        </Pressable>
        {/* <View style={{flex: 1}} /> */}
        <Pressable
          style={[
            styles.lightCircle,
            {marginLeft: 2.5, marginRight: 2.5},
            {
              backgroundColor: showMap ? variables.colors.black : isMobile ? "white" : "transparent",
              borderColor: isMobile ? showMap ? variables.colors.black : "white" : variables.colors.black,
            },
          ]}
          onPress={() => {
            // setShowMap(true)
            //@ts-expect-error
            navigation.navigate(route.name, {map: true})
          }}>
          <KIcon
            name="maps"
            size="large"
            style={showMap ? {
              color: variables.colors.white
            } : {}}
          />
        </Pressable>
        {/* {!isMobile ? <KButton
          color="secondary"
          onPress={() => user ? setShowSwapNow(true) : setShowSignIn(true)}
          style={{flexDirection: 'row', marginLeft: 10}}>
          <KIcon name="logo" size="medium" style={{stroke: 'black'}} />
          <KText>Swap Now</KText>
        </KButton> : null} */}
      </View>
    </SubHeader>
  );
});

export default Filters;

const styles = StyleSheet.create({
  lightCircle: {
    borderWidth: 1,
    borderRadius: 50,
    padding: 10,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
