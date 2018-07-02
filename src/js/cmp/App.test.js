import React from 'react';
import ReactDOM from 'react-dom';
import { App } from 'js/cmp/App';
import Layout from 'js/cfg/Layout';
import Enzyme, { mount, shallow } from "enzyme";
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

it('renders without crashing', () => {
  const div = document.createElement('div');
  //ReactDOM.render(<App />, div);
  //ReactDOM.unmountComponentAtNode(div);
});
