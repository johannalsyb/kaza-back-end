import React, {
  forwardRef,
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Gap from '../../Gap/Gap';
import variables from '../../../styles/variables';
import {useCloseFromOutside} from '../../../hooks/useCloseFromOutside';

const fetchSuggestionsAfterXSeconds = 1;

export type AutocompleteType =
  | 'email'
  | 'password'
  | 'password-new'
  | 'name'
  | 'name-given'
  | 'name-family'
  | 'tel';

export interface KInputProps extends TextInputProps {
  autoComplete?: AutocompleteType;
  leftComponent?: React.ReactNode;
  onLeftComponentPress?: () => void;
  error?: string | ReactNode;
  inputStyles?: TextStyle | null;
  topStyle?: ViewStyle;
  rightComponent?: React.ReactNode | null;
  onRightComponentPress?: () => void;
  onChangeText?: ((text: string) => void) | undefined;
  setError?: (error: ReactElement | null) => void;
  editable?: boolean;
  suggestionCallback?: (text: string) => Promise<string[]>;
  onSuggestionSelected?: (text: string) => void;
  attachments?: React.ReactNode[];
}

const KTextInput = forwardRef<TextInput, KInputProps>(
  (
    {
      autoComplete = 'email',
      error = undefined,
      inputStyles = null,
      rightComponent = null,
      textContentType = 'emailAddress',
      autoCapitalize = 'none',
      onBlur,
      onChangeText,
      onFocus,
      setError = null,
      onLeftComponentPress = () => console.log('Left Component Pressed'),
      onRightComponentPress = () => console.log('Right Component Pressed'),
      leftComponent = null,
      editable = true,
      topStyle = {},
      suggestionCallback,
      onSuggestionSelected,
      attachments,
      ...rest
    },
    ref,
  ) => {
    const timeoutId = useRef<NodeJS.Timeout | null>(null);
    const [focused, setFocused] = useState(false);
    const [suggestionList, setSuggestionList] = useState<string[]>([]);
    const [textIndexHovered, setTextIndexHovered] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const closeSuggestionRef = useCloseFromOutside(
      showSuggestions,
      setShowSuggestions,
    );
    const [loading, setLoading] = useState(false);

    const additional = {} as KInputProps;
    if (Platform.OS === 'android') {
      additional.autoComplete = autoComplete; // Android specific value. Can extend this for any other platform specific values.
    }

    const handleSuggestion = async (text: string) => {
      if (!suggestionCallback) return;
      clearTimeout(timeoutId.current as NodeJS.Timeout);
      if (text.length > 2) {
        setLoading(true);
        timeoutId.current = setTimeout(async () => {
          try {
            const suggestions = await suggestionCallback(text);
            setSuggestionList(
              suggestions.length ? suggestions : ['No place found!'],
            );
          } catch (err) {
            console.log(err);
            // setSuggestionList(['testtt']);
          } finally {
            setLoading(false);
          }
        }, fetchSuggestionsAfterXSeconds * 1000);
      } else {
        setSuggestionList([]);
      }
    };

    useEffect(() => {
      if (suggestionList.length) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, [suggestionList]);

    return (
      <SafeAreaView
        ref={closeSuggestionRef}
        style={{
          position: 'relative',
          backgroundColor: form.colors.background.default,
          borderRadius: form.input.borderRadius,
          borderWidth: form.input.borderWidth,
          borderColor: form.colors.border.default,
          ...topStyle,
        }}>
        {leftComponent && (
          <Pressable
            onPress={onLeftComponentPress}
            style={styles.leftComponent}>
            {leftComponent}
            <Gap />
          </Pressable>
        )}
        <TextInput
          ref={ref}
          allowFontScaling={false}
          placeholderTextColor={form.colors.placeholder}
          style={[
            styles.formInput,
            focused ? styles.formFocused : {},
            !!error ? styles.formError : {},
            leftComponent ? {paddingLeft: form.input.paddingLeft} : {},
            inputStyles,
          ]}
          onChangeText={value => {
            setError && setError(null);
            onChangeText && onChangeText(value);
            handleSuggestion(value);
          }}
          editable={editable}
          onFocus={e => {
            setFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur && onBlur(e);
          }}
          autoCapitalize={autoCapitalize}
          selectionColor={form.colors.border.focus}
          textContentType={textContentType}
          {...additional}
          {...rest}
        />

        {(loading || rightComponent) && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              ...styles.rightComponent,
            }}>
            {/* Loading spinner */}
            {loading && (
              <ActivityIndicator color={variables.colors.borderGray} />
            )}

            {/* far right component on text input */}
            {rightComponent && (
              <Pressable onPress={onRightComponentPress}>
                <Gap />
                {rightComponent}
              </Pressable>
            )}
          </View>
        )}

        {!!error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {showSuggestions && (
          <View style={styles.suggestion}>
            {suggestionList.map((suggestion, index) => (
              <Pressable
                disabled={suggestion === 'No place found!'}
                key={`suggestion_${index}`}
                onPress={() => {
                  onChangeText && onChangeText(suggestion);
                  setSuggestionList([]);
                  onSuggestionSelected && onSuggestionSelected(suggestion);
                }}
                onHoverIn={() => setTextIndexHovered(index)}
                onHoverOut={() => setTextIndexHovered(-1)}
                style={[
                  styles.textSuggestionContainer,
                  textIndexHovered === index && {
                    backgroundColor: variables.colors.yellow,
                  },
                ]}>
                <Text style={styles.textSuggestion} key={index}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {attachments && attachments.length ? (
          <ScrollView contentContainerStyle={{margin: 1}} horizontal={true}>
            {attachments.map((attachment, index) => attachment)}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    );
  },
);

const {form} = variables;

const styles = StyleSheet.create({
  errorContainer: {
    position: 'absolute',
    bottom: -6,
    width: '100%',
    display: 'flex',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  formError: {
    borderColor: form.colors.border.error,
  },
  formFocused: {
    borderColor: form.colors.border.focus,
  },
  formInput: {
    textAlign: 'center',
    lineHeight: form.input.lineHeight,
    fontSize: form.input.fontSize,
    outlineStyle: 'none',
    overflow: 'hidden',
    padding: form.input.padding,
    fontFamily: variables.font.family.regular,
    borderRadius: form.input.borderRadius,
  },
  errorText: {
    color: variables.colors.white,
    fontSize: 11,
    borderRadius: form.input.borderRadius,
    backgroundColor: form.colors.background.error,
    paddingHorizontal: variables.spacing.xxsmall,
  },
  leftComponent: {
    position: 'absolute',
    left: variables.spacing.xsmall,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightComponent: {
    position: 'absolute',
    right: variables.spacing.xsmall,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestion: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 52,
    width: '100%',
    zIndex: 100,
  },
  textSuggestionContainer: {
    padding: 8,
    borderRadius: 30,
  },
  textSuggestion: {},
});

export default KTextInput;
