import React, {CSSProperties, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Pressable, StyleSheet, Switch, TextInput, TextStyle, View, ViewStyle} from 'react-native';
import variables from '../../styles/variables';
import KIcon, {IconName} from '../KIcon/KIcon';
import KText from '../KText';
import useIsMobile from '../../hooks/useIsMobile';
import {useCloseFromOutside} from '../../hooks/useCloseFromOutside';
import KTextInput from '../Form/KTextInput/KTextInput';

type Props = {
  style?: ViewStyle;
  leftIcon?: IconName;
  leftIconStyle?: CSSProperties;
  items: string[];
  selectedIndex?: number;
  selectedIndexes?: boolean[];
  multiple?: boolean;
  multipleMinimum?: number;
  capitalize?: boolean;
  dropdownStyle?: ViewStyle;
  onChange?: (items: string[]) => void;
  textStyle?: TextStyle
  iconStyle?: CSSProperties
  selectedTextManipulationFunction?: (item: string) => string
  showSearch?: boolean
};

export type DropdownHandle = {
  setSelectedItems: (items: string[]) => void;
}

const Dropdown = React.forwardRef<DropdownHandle, Props>(({
  style,
  leftIcon,
  leftIconStyle = {},
  items,
  selectedIndex = 0,
  selectedIndexes = new Array(items.length).fill(true),
  multiple = false,
  multipleMinimum = 1,
  capitalize = true,
  dropdownStyle = {},
  textStyle = {},
  iconStyle = {},
  selectedTextManipulationFunction = (i) => i,
  onChange,
  showSearch = false
}, ref) => {
  const {isMobile} = useIsMobile();
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [itemHoveredIndex, setItemHoveredIndex] = useState<number>(-1);
  const [search, setSearch] = useState<string>('');
  const sItems = multiple ? items.map((i, ii) => selectedIndexes[ii] && i).filter(t => !!t) : [items[selectedIndex] || items[0]]

  const [selectedItems, setSelectedItems] = useState<string[]>(sItems);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const closeSuggestionRef = useCloseFromOutside(
    isDropdownOpen,
    setIsDropdownOpen,
  );

  const searchRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    setSelectedItems,
  }));

  useEffect(() => {
    onChange?.(selectedItems);
  }, [selectedItems]);

  return (
    <Pressable
      ref={closeSuggestionRef}
      onPress={() => setIsDropdownOpen(!isDropdownOpen)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.container,
        {
          backgroundColor: isHovered ? '#232527' : variables.colors.black,
        },
        style,
      ]}>
      {leftIcon && (
        <KIcon
          name={leftIcon}
          size="medium"
          style={{
            color: variables.colors.white,
            opacity: 0.6,
            marginRight: 5,
            ...leftIconStyle
          }}
        />
      )}
      <KText
        style={[{
          color: variables.colors.white,
        }, textStyle]}>
        {selectedItems.length === 0 ? 'None' : (selectedItems.length === items.length ? 
          "Any" : (selectedItems.length > 1
          ? `${selectedItems.length} selected`
          : selectedTextManipulationFunction(capitalize && selectedItems[0] ? selectedItems[0].capitalize() : selectedItems[0])))}
      </KText>
      {isDropdownOpen && (
        <View style={[
          styles.dropdown,
          dropdownStyle
        ]}>
          {showSearch && <KTextInput
            editable={true}
            ref={searchRef}
            placeholder="Type the country..."
            style={{height: 44, marginLeft: 10, marginRight: 10,
              //@ts-ignore
              outlineWidth: 0
            }}
            onChangeText={t => setSearch(t)}
            selectTextOnFocus={true}
            onLayout={e => searchRef.current?.focus()}
            inputStyles={{marginBottom: 10}}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Enter') {
                if (itemHoveredIndex > -1) {
                  if(multiple) {
                    if (selectedItems.includes(items[itemHoveredIndex])) {
                      const narr = selectedItems.filter((i) => i !== items[itemHoveredIndex])
                      if(narr.length >= multipleMinimum) {
                        setSelectedItems(narr);
                      }
                    } else {
                      setSelectedItems([...new Set([...selectedItems, items[itemHoveredIndex]])]);
                    }
                  } else {
                    setSelectedItems([items[itemHoveredIndex]]);
                  }
                }
                setIsDropdownOpen(false);
              }else if(nativeEvent.key === 'Escape') {
                setIsDropdownOpen(false);
              } else if(nativeEvent.key === 'ArrowDown') {
                setItemHoveredIndex(itemHoveredIndex + 1 > items.length - 1 ? itemHoveredIndex : itemHoveredIndex + 1)
              } else if(nativeEvent.key === 'ArrowUp') {
                setItemHoveredIndex(itemHoveredIndex - 1 < 0 ? itemHoveredIndex : itemHoveredIndex - 1)
              }
            }}
          />}
          {items.filter(i => search.length ? i.toLowerCase().includes(search.toLowerCase()) : true).map((item, i) => (
            <Pressable
              key={`dropdown-item-${i}`}
              onHoverIn={() => setItemHoveredIndex(i)}
              onHoverOut={() => setItemHoveredIndex(-1)}
              style={{
                padding: 15,
                borderRadius: 30,
                backgroundColor:
                  itemHoveredIndex === i
                    ? variables.colors.yellow
                    : 'transparent',
              }}
              onPress={() => {
                if(multiple) {
                  if (selectedItems.includes(item)) {
                    const narr = selectedItems.filter((i) => i !== item)
                    if(narr.length >= multipleMinimum) {
                      setSelectedItems(narr);
                    }
                  } else {
                    setSelectedItems([...new Set([...selectedItems, item])]);
                  }
                } else {
                  setSelectedItems([item]);
                }
                setIsDropdownOpen(false);
              }}>
              <KText style={{
                color: selectedItems.includes(item) || !multiple ? variables.colors.black : variables.colors.grey,
              }}>{capitalize ? item.capitalize() : item}
              </KText>
            </Pressable>
          ))}
        </View>
      )}
      <KIcon
        name="arrowDown"
        size="medium"
        style={{color: variables.colors.white, opacity: 0.6, ...iconStyle}}
      />
    </Pressable>
  );
})

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'space-between',
    padding: 15,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: variables.colors.white,
    width: 'auto',
    padding: 15,
    borderRadius: 15,
    boxShadow: '15px 15px 55px 0px rgba(77, 75, 63, 0.25)',
  },
});

export default Dropdown;
