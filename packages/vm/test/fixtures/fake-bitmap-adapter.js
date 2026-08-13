import {BitmapAdapter as FakeBitmapAdapter} from 'clipcc-svg-renderer';

FakeBitmapAdapter.prototype.resize = function (canvas) {
    return canvas;
};

export default FakeBitmapAdapter;
