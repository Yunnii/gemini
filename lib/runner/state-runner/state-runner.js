'use strict';

var inherit = require('inherit'),
    _ = require('lodash'),
    Runner = require('../runner'),

    RunnerEvents = require('../../constants/runner-events'),
    PrivateEvents = require('../private-events');

var StateRunner = inherit(Runner, {
    __constructor: function(state, browserSession, config) {
        this._state = state;
        this._browserSession = browserSession;
        this._config = config;
        this._stateInfo = {
            suite: state.suite,
            state: state,
            browserId: browserSession.browser.id,
            sessionId: browserSession.browser.sessionId
        };
    },

    run: function(stateProcessor) {
        var _this = this;

        _this.emit(RunnerEvents.BEGIN_STATE, this._stateInfo);

        var session = this._browserSession;

        return session.runActions(this._state.actions)
            .then(function() {
                return session.prepareScreenshot(_this._state, {coverage: _this._config.isCoverageEnabled()});
            })
            .fail(function(e) {
                return session.extendWithPageScreenshot(e)
                    .thenReject(e);
            })
            .then(function(page) {
                return _this._capture(stateProcessor, page);
            })
            .fail(function(e) {
                _.extend(e, _this._stateInfo);

                return _this.emit(RunnerEvents.ERROR, e);
            })
            .fin(function() {
                _this.emit(RunnerEvents.END_STATE, _this._stateInfo);
            });
    },

    _capture: function(stateProcessor, page) {
        return stateProcessor.exec(this._state, this._browserSession, page)
            .then(function(result) {
                this.emit(PrivateEvents.STATE_RESULT, _.extend(result, this._stateInfo));
            }.bind(this));
    }
});

module.exports = StateRunner;
