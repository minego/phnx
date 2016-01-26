var _emojiSelectedGroup = 'people';

function EmojiDialogAssistant(callBackFunc) {
    this.callBackFunc = callBackFunc;
    this.maxRenderEmoji = 600;
    this.emojiListModel = {
        items : []
    };
}

EmojiDialogAssistant.prototype.setup = function(widget) {
    this.emojiListWidget = this.controller.get('emojiList');
    this.controller.setupWidget('emojiList', {
        itemTemplate : "emoji-dialog/emoji-list-entry",
        hasNoWidgets : true,
        renderLimit : this.maxRenderEmoji,
        fixedHeightItems : true,
    }, this.emojiListModel);

    this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
    Mojo.Event.listen(this.emojiListWidget, Mojo.Event.listTap, this.listTapHandler);

    this.controller.setupWidget(Mojo.Menu.viewMenu, this.attributes = {
        spacerHeight : 50,
        menuClass : 'no-fade'
    }, this.model = {
        visible : true,
        items : [{
            toggleCmd : _emojiSelectedGroup,
            items : [{
                icon : "people-emoji",
                command : "people"
            }, {
                icon : "nature-emoji",
                command : "nature"
            }, {
                icon : "events-emoji",
                command : "events"
            }, {
                icon : "symbols-emoji",
                command : "symbols"
            }, {
                icon : "flags-emoji",
                command : "flags"
            }]
        }, {}, {
            icon : "back",
            command : "close"
        }]
    });

    this.handleCommand({type: Mojo.Event.command, command: _emojiSelectedGroup});
}

EmojiDialogAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        if (event.command != 'close')
            _emojiSelectedGroup = event.command;
        switch(event.command) {
            case 'close':
                this.controller.stageController.popScene({
                    selectedEmoji : null
                });
                break;
            case 'people':
                //this.loadEmoji(0, 189)
                //this.loadEmojiUnicode(0, 221)
                this.loadEmojiUnicode(0, 524)
                break;
            case 'nature':
                //this.loadEmoji(189, 305)
                //this.loadEmojiUnicode(221, 494)
                this.loadEmojiUnicode(524, 826)
                break;
            case 'events':
                //this.loadEmoji(305, 535)
                //this.loadEmojiUnicode(494, 767)
                this.loadEmojiUnicode(826, 1160)
                break;
            case 'symbols':
								//this.loadEmoji(535, 637)
								//this.loadEmojiUnicode(767, 950)            
								this.loadEmojiUnicode(1160, 1364)            
                break;
            case 'flags':
                //this.loadEmoji(637, 846)
                //this.loadEmojiUnicode(950, 1168)
                this.loadEmojiUnicode(1364, 1620)
                break;
        }
        
        if (this.emojiListWidget.mojo)        
            this.emojiListWidget.mojo.revealItem(0, false);
    }
}

EmojiDialogAssistant.prototype.loadEmoji = function(start, end) {
    var list = [];
    for (var i = start; i < end; i++) {
        list.push({
            emojiPath : "images/emoji/" + emoji_code[i] + ".png",
            emojiCode : emoji_code[i]
        });
    }

    this.emojiListModel.items = list;
 
    this.controller.modelChanged(this.emojiListModel, this);
}

EmojiDialogAssistant.prototype.loadEmojiUnicode = function(start, end) {
    var list = [];
    for (var i = start; i < end; i++) {
        list.push({
            //emojiPath : "images/emoji/" + emoji_code_unicode[i] + ".png",
            emojiPath : "images/emoji/1.5/" + emoji_code_unicode[i] + ".png",
            emojiCode : emoji_code_unicode[i]
        });
    }

    this.emojiListModel.items = list;
 
    this.controller.modelChanged(this.emojiListModel, this);
}

EmojiDialogAssistant.prototype.listTapHandler = function(event) {
    var myEmojiCode = event.item.emojiCode;
    var myEmojiCode1;
    var myEmojiCode2;
    
    if(myEmojiCode.indexOf('_') > -1){
//    	myEmojiCode1 = myEmojiCode.replace(/([\da-f]+)_000([\da-f]+)/i, '$1');
//    	myEmojiCode2 = myEmojiCode.replace(/([\da-f]+)_000([\da-f]+)/i, '$2');
    	myEmojiCode1 = myEmojiCode.replace(/([\da-f]+)_([\da-f]+)/i, '$1');
    	myEmojiCode2 = myEmojiCode.replace(/([\da-f]+)_([\da-f]+)/i, '$2');
    } else{
    	myEmojiCode1 = myEmojiCode;
    }
    
    //Mojo.Log.info("code1: " + myEmojiCode1);
    //Mojo.Log.info("code2: " + myEmojiCode2);
    
    if (this.callBackFunc) {
        this.callBackFunc({ selectedEmoji : myEmojiCode1,
        										selectedEmoji2 : myEmojiCode2 });
    }
    this.controller.stageController.popScene({
        selectedEmoji : myEmojiCode1,
        selectedEmoji2 : myEmojiCode2
    });
}

EmojiDialogAssistant.prototype.cleanup = function() {
}