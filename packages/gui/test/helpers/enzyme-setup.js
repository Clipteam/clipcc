import Enzyme from 'enzyme';
import 'jest-localstorage-mock';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({adapter: new Adapter()});
