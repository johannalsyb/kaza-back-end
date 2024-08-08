import React from 'react';
import renderer from 'react-test-renderer';
import KButton from './KButton';
import {Text} from 'react-native';

describe('KButton', () => {
  it('renders correctly with text', () => {
    const tree = renderer
      .create(<KButton text="Click me" onPress={() => {}} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with children', () => {
    const tree = renderer
      .create(
        <KButton onPress={() => {}}>
          <Text>Click me</Text>
        </KButton>,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('calls onPress when pressed', () => {
    const handlePress = jest.fn();
    const component = renderer.create(
      <KButton onPress={handlePress}>Click me</KButton>,
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('applies default styles', () => {
    const component = renderer.create(
      <KButton onPress={() => {}}>Click me</KButton>,
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('applies custom styles', () => {
    const customStyles = {backgroundColor: 'blue', borderRadius: 10};
    const component = renderer.create(
      <KButton style={customStyles} onPress={() => {}}>
        Click me
      </KButton>,
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
