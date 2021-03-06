'use strict';

var fs = require('q-io/fs'),
    temp = require('../../../temp'),

    Image = require('../../../image'),
    ScreenUpdater = require('./screen-updater');

module.exports = class DiffScreenUpdater extends ScreenUpdater {
    _processCapture(capture, opts, isRefExists) {
        if (!isRefExists) {
            return;
        }

        var refPath = opts.refPath,
            tmpPath = temp.path({suffix: '.png'}),
            tolerance = opts.tolerance;

        return capture.image.save(tmpPath)
            .then(function() {
                return Image.compare(tmpPath, refPath, {
                        canHaveCaret: capture.canHaveCaret,
                        tolerance: tolerance
                    })
                    .then(function(isEqual) {
                        if (!isEqual) {
                            return fs.copy(tmpPath, refPath);
                        }
                    });
            }.bind(this));
    }
};
