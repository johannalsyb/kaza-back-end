import React from 'react';
import renderer from 'react-test-renderer';
import {Animated, Text} from 'react-native';
import KModal from './KModal';

jest.useFakeTimers();

describe('KModal', () => {
  it('renders correctly when visible is true', () => {
    // @ts-ignore
    global.requestAnimationFrame(() => {
      const setVisibility = jest.fn();
      const tree = renderer
        .create(
          <KModal visible={true} setVisibility={setVisibility}>
            <Text>Modal Content</Text>
          </KModal>,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  it('renders correctly when visible is false', () => {
    // @ts-ignore
    global.requestAnimationFrame(() => {
      const setVisibility = jest.fn();
      const tree = renderer
        .create(
          <KModal visible={false} setVisibility={setVisibility}>
            <Text>Modal Content</Text>
          </KModal>,
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  it('calls setVisibility with false when overlay is pressed', () => {
    // @ts-ignore
    global.requestAnimationFrame(() => {
      const setVisibility = jest.fn();
      const component = renderer.create(
        <KModal visible={true} setVisibility={setVisibility}>
          <Text>Modal Content</Text>
        </KModal>,
      );
      const overlay = component.root.findByProps({testID: 'modal-overlay'});
      renderer.act(() => {
        overlay.props.onPress();
      });
      expect(setVisibility).toHaveBeenCalledWith(false);
    });
  });

  it('calls setVisibility with false when close button is pressed', () => {
    // @ts-ignore
    global.requestAnimationFrame(() => {
      const setVisibility = jest.fn();
      const component = renderer.create(
        <KModal visible={true} setVisibility={setVisibility}>
          <Text>Modal Content</Text>
        </KModal>,
      );
      const closeButton = component.root.findByProps({testID: 'close-button'});
      renderer.act(() => {
        closeButton.props.onPress();
      });
      expect(setVisibility).toHaveBeenCalledWith(false);
    });
  });

  it('animates translateY when visible changes', () => {
    // @ts-ignore
    global.requestAnimationFrame(() => {
      const setVisibility = jest.fn();
      const component = renderer.create(
        <KModal visible={false} setVisibility={setVisibility}>
          <Text>Modal Content</Text>
        </KModal>,
      );
      const modalView = component.root.findByType(Animated.View);
      const translateY = modalView.props.style[1].transform[0].translateY;
      expect(translateY._value).toBe(300); // Assuming height is 300

      renderer.act(() => {
        component.update(
          <KModal visible={true} setVisibility={setVisibility}>
            <Text>Modal Content</Text>
          </KModal>,
        );
      });
      jest.runAllTimers();
      expect(translateY._value).toBe(0);

      renderer.act(() => {
        component.update(
          <KModal visible={false} setVisibility={setVisibility}>
            <Text>Modal Content</Text>
          </KModal>,
        );
      });
      jest.runAllTimers();
      expect(translateY._value).toBe(300);
    });
  });
});
