import React from 'react';
import {Pressable, Text} from 'react-native';
import TestRenderer, {ReactTestRendererJSON} from 'react-test-renderer';
import CheckBox from './CheckBox';

describe('CheckBox', () => {
  const onPressMock = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with unchecked state', () => {
    const tree = TestRenderer.create(
      <CheckBox name="Test Checkbox" onPress={onPressMock} />,
    ).toJSON() as ReactTestRendererJSON;

    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with checked state', () => {
    const tree = TestRenderer.create(
      <CheckBox name="Test Checkbox" checked onPress={onPressMock} />,
    ).toJSON() as ReactTestRendererJSON;

    expect(tree).toMatchSnapshot();
  });

  it('calls onPress when checkbox is pressed', () => {
    const tree = TestRenderer.create(
      <CheckBox name="Test Checkbox" onPress={onPressMock} />,
    );

    const checkbox = tree.root.findByType(Pressable);
    checkbox.props.onPress();

    expect(onPressMock).toHaveBeenCalled();
  });

  it('displays the checkbox name', () => {
    const checkboxName = 'Test Checkbox';
    const tree = TestRenderer.create(
      <CheckBox name={checkboxName} onPress={onPressMock} />,
    );

    const text = tree.root.findByType(Text);
    expect(text.props.children).toBe(checkboxName);
  });
});
