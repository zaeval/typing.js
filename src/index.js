// options = {isBackspace: false, isCursor: false}

class Typing {
    constructor(
        el,
        texts,
        speed,
        delay,
        sync = {},
        options = {
            isBackspace: false,
            isCursor: false,
            isLoop: false,
            backSpeed: 50,
            backDelay: 300,
        },
        onNextCharacter = (instance) => {
        },
        onDone = (instance) => {
        },
        onNextText = (instance) => {
        },
    ) {
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

        const REGISTER = {name: this._taskId, instance: this};
        if (this._groupId != null) {
            if (Typing.threadPool[this._groupId] == null) Typing.threadPool[this._groupId] = [];
            Typing.threadPool[this._groupId].push(REGISTER);
        }
    }

    htmlToElement(html) {
        const template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }

    enter() {
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
            setTimeout(() => {
                this._isClean = false;
                this.enter();
            }, this.speed);

        } else {
            this._shouldNext = true;

            if (this._groupId != null) {
                if (this.shouldWait()) {
                    setTimeout(() => {
                        this.enter();
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
                setTimeout(() => {
                    this._isClean = true;
                    this.backspace();
                }, this.delay);
            } else {
                this._onNextText(this);

                setTimeout(() => {
                    this._isClean = true;
                    this.enter();
                }, this.delay);
            }
        }
    }

    backspace() {
        if (this.$el.textContent == " " || this.$el.textContent == "") {
            this._shouldNext = true;
            if (this._groupId != null) {
                if (this.shouldWait()) {
                    setTimeout(() => {
                        this.backspace();
                    }, 10);
                    return;
                }
            }

            setTimeout(() => {
                this._isClean = true;
                this.enter();
            }, this._options.backDelay);
            return;
        }
        this._shouldNext = false;
        if (this.$el.textContent.length == 1 && !this._options.isCursor) {
            this.$el.textContent = " ";
        } else {
            this.$el.textContent = this.$el.textContent.slice(0, -1);
        }
        setTimeout(() => {
            this.backspace();
        }, this._options.backSpeed);
    }

    shouldWait() {
        let _shouldWait = false;

        Typing.threadPool[this._groupId].forEach(
            (cur, idx, arr) => {
                if (!cur.instance._shouldNext) {
                    _shouldWait = true;
                }
            }
        );
        return _shouldWait;
    }

    start() {
        this.enter();
    }
}

Typing.threadPool = {'groupId': []};
