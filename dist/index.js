"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// options = {isBackspace: false, isCursor: false}

var Typing = function () {
    function Typing(el, texts, speed, delay) {
        var sync = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
        var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {
            isBackspace: false,
            isCursor: false,
            isLoop: false,
            backSpeed: 50,
            backDelay: 300
        };
        var onNextCharacter = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : function (instance) {};
        var onDone = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : function (instance) {};
        var onNextText = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : function (instance) {};

        _classCallCheck(this, Typing);

        this.$el = el;
        this.$el.classList.add("typing-object");
        if (options.isCursor) {
            this.$el.classList.add("typing-cursor");
        }

        this.texts = texts;
        this.speed = speed;
        this.delay = delay;

        this._options = options;

        this._nowText = 0;
        this._nowCharacter = 0;

        this._taskId = sync.taskId;
        this._groupId = sync.groupId;

        this._shouldNext = false;
        this._isClean = false;

        this._onNextText = onNextText;
        this._onNextCharacter = onNextCharacter;
        this._onDone = onDone;

        var REGISTER = { name: this._taskId, instance: this };
        if (this._groupId != null) {
            if (Typing.threadPool[this._groupId] == null) Typing.threadPool[this._groupId] = [];
            Typing.threadPool[this._groupId].push(REGISTER);
        }
    }

    _createClass(Typing, [{
        key: "htmlToElement",
        value: function htmlToElement(html) {
            var template = document.createElement('template');
            html = html.trim(); // Never return a text node of whitespace as the result
            template.innerHTML = html;
            return template.content.firstChild;
        }
    }, {
        key: "enter",
        value: function enter() {
            var _this = this;

            if (this._isClean) {
                this._shouldNext = false;
                this.$el.textContent = " ";
                this._nowCharacter = 0;
            }
            if (this._nowCharacter < this.texts[this._nowText].length) {
                this._onNextCharacter(this);

                if (this._nowCharacter == 0) {
                    this.$el.textContent = this.texts[this._nowText].charAt(this._nowCharacter);
                } else {
                    this.$el.textContent += this.texts[this._nowText].charAt(this._nowCharacter);
                }
                this._nowCharacter++;
                setTimeout(function () {
                    _this._isClean = false;
                    _this.enter();
                }, this.speed);
            } else {
                this._shouldNext = true;

                if (this._groupId != null) {
                    if (this.shouldWait()) {
                        setTimeout(function () {
                            _this.enter();
                        }, 10);
                        return;
                    }
                }

                this._nowText++;
                if (this._nowText == this.texts.length) {
                    this._onDone(this);

                    if (this._options.isLoop) {
                        this._nowText %= this.texts.length;
                    } else {
                        return;
                    }
                }
                if (this._options.isBackspace) {
                    //TODO : onBackspace event trigger
                    setTimeout(function () {
                        _this._isClean = true;
                        _this.backspace();
                    }, this.delay);
                } else {
                    this._onNextText(this);

                    setTimeout(function () {
                        _this._isClean = true;
                        _this.enter();
                    }, this.delay);
                }
            }
        }
    }, {
        key: "backspace",
        value: function backspace() {
            var _this2 = this;

            if (this.$el.textContent == " " || this.$el.textContent == "") {
                this._shouldNext = true;
                if (this._groupId != null) {
                    if (this.shouldWait()) {
                        setTimeout(function () {
                            _this2.backspace();
                        }, 10);
                        return;
                    }
                }

                setTimeout(function () {
                    _this2._isClean = true;
                    _this2.enter();
                }, this._options.backDelay);
                return;
            }
            this._shouldNext = false;
            if (this.$el.textContent.length == 1 && !this._options.isCursor) {
                this.$el.textContent = " ";
            } else {
                this.$el.textContent = this.$el.textContent.slice(0, -1);
            }
            setTimeout(function () {
                _this2.backspace();
            }, this._options.backSpeed);
        }
    }, {
        key: "shouldWait",
        value: function shouldWait() {
            var _shouldWait = false;

            Typing.threadPool[this._groupId].forEach(function (cur, idx, arr) {
                if (!cur.instance._shouldNext) {
                    _shouldWait = true;
                }
            });
            return _shouldWait;
        }
    }, {
        key: "start",
        value: function start() {
            this.enter();
        }
    }]);

    return Typing;
}();

Typing.threadPool = { 'groupId': [] };

