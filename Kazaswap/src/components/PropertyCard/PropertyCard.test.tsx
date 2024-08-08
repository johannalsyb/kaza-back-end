import React from 'react';
import renderer from 'react-test-renderer';
import {PropertyCard} from './PropertyCard';

// describe('PropertyCard', () => {
//   const mockOnPress = jest.fn();

//   const mockData = {
//     avatar: 'avatar.jpg',
//     photo: 'photo.jpg',
//     availableDate: {
//       from: new Date('2022-01-01'),
//       to: new Date('2022-01-07'),
//     },
//     swapFor: ['Item 1', 'Item 2'],
//     location: 'New York',
//     testID: 'property-card',
//     onPress: mockOnPress,
//   };

//   it('renders correctly with provided data', () => {
//     const component = renderer.create(<PropertyCard {...mockData} />);
//     const tree = component.toJSON();

//     expect(tree).toMatchSnapshot();
//   });

//   it('calls onPress when pressed', () => {
//     const component = renderer.create(<PropertyCard {...mockData} />);
//     const instance = component.root;
//     const propertyCard = instance.findByProps({testID: 'property-card'});

//     propertyCard.props.onPress();

//     expect(mockOnPress).toHaveBeenCalled();
//   });
// });
