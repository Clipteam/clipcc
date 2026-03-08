const FakeBitmapAdapter = require('clipcc-svg-renderer').BitmapAdapter;

FakeBitmapAdapter.prototype.resize = function (canvas) {
    return canvas;
};

module.exports = FakeBitmapAdapter;
