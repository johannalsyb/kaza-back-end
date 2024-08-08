import React from 'react';
import renderer from 'react-test-renderer';
import {CircleImage} from './CircleImage';

const source = 'https://picsum.photos/200/300';

// describe('CircleImage', () => {
//   it('renders correctly with default size', () => {
//     const tree = renderer.create(<CircleImage source={source} />);
//     expect(tree.toJSON()).toMatchSnapshot();
//   });

//   it('renders correctly with custom size', () => {
//     const tree = renderer.create(<CircleImage source={source} size="large" />);
//     expect(tree.toJSON()).toMatchSnapshot();
//   });

//   it('renders correctly with default source', () => {
//     const tree = renderer.create(<CircleImage source="" />);
//     expect(tree.toJSON()).toMatchSnapshot();
//   });

//   it('renders correctly with custom source', () => {
//     const tree = renderer.create(<CircleImage source={source} />);
//     expect(tree.toJSON()).toMatchSnapshot();
//   });
// });
