var _emojiSelectedGroup = 'people';
var myEmojiStringFinal ="";

function EmojiDialogAssistant(callBackFunc,opts) {
    this.callBackFunc = callBackFunc;
    this.maxRenderEmoji = 620;
    this.opts = opts;
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
    this.listHoldHandler = this.listHoldHandler.bindAsEventListener(this);
    Mojo.Event.listen(this.emojiListWidget, Mojo.Event.hold, this.listHoldHandler);


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
            	if(this.opts.held == false){
                this.controller.stageController.popScene({
                    selectedEmoji : null
                });
              } else {
                var tmpFinalString = myEmojiStringFinal;
                myEmojiStringFinal = "";
                if (this.callBackFunc) {
					    	   this.callBackFunc({ 
        							emojiStringFinal : tmpFinalString });
    						}
								this.controller.stageController.popScene({
									//selectedEmoji : myEmojiCode1,
									//selectedEmoji2 : myEmojiCode2,
									//emojiString : myEmojiString,
									emojiStringFinal : tmpFinalString
								});
							}
              break;
            case 'people':
                //this.loadEmoji(0, 189)
                //this.loadEmojiUnicode(0, 221)
                //this.loadEmojiUnicode(0, 524)
                //this.loadEmojiUnicode(0, 616)  //full with skins
                this.loadEmojiUnicode(0, 266)  //without skins
                break;
            case 'nature':
                //this.loadEmoji(189, 305)
                //this.loadEmojiUnicode(221, 494)
                //this.loadEmojiUnicode(524, 826)
                //this.loadEmojiUnicode(616, 812)  //full with skins
                this.loadEmojiUnicode(266, 462)  //without skins
                break;
            case 'events':
                //this.loadEmoji(305, 535)
                //this.loadEmojiUnicode(494, 767)
                //this.loadEmojiUnicode(826, 1160)
                //this.loadEmojiUnicode(812, 1324)  //full with skins
                this.loadEmojiUnicode(462, 909)  //without skins
                break;
            case 'symbols':
								//this.loadEmoji(535, 637)
								//this.loadEmojiUnicode(767, 950)            
								//this.loadEmojiUnicode(1160, 1364)
								//this.loadEmojiUnicode(1324, 1531)  //full with skins
								this.loadEmojiUnicode(909, 1116)  //without skins
                break;
            case 'flags':
                //this.loadEmoji(637, 846)
                //this.loadEmojiUnicode(950, 1168)
                //this.loadEmojiUnicode(1364, 1620)
                //this.loadEmojiUnicode(1531, 1788)  //full with skins
                this.loadEmojiUnicode(1116, 1373)  //without skins
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
		var prefs	= new LocalStorage();
		var emojiSkinTone = prefs.read('emojiSkinTone');
		
		if(!emojiSkinTone){
			emojiSkinTone = "";
		}

    for (var i = start; i < end; i++) {
    		var tmpEmojiCode = emoji_code_unicode[i];
    		if(skinnableEmojiHashTable.getItem(tmpEmojiCode)){
    			tmpEmojiCode = tmpEmojiCode + emojiSkinTone;
    		}
        list.push({
            //emojiPath : "images/emoji/" + emoji_code_unicode[i] + ".png",
            emojiPath : "images/emoji/" + tmpEmojiCode + ".png",
            emojiCode : tmpEmojiCode
        });
    }

    this.emojiListModel.items = list;
 
    this.controller.modelChanged(this.emojiListModel, this);
}

EmojiDialogAssistant.prototype.listTapHandler = function(event) {
    var myEmojiCode = event.item.emojiCode;
    var myEmojiCode1;
    var myEmojiCode2;
    var myEmojiString;
		//var myEmojiStringFinal ="";
		var myEmojiStringElems = [];
		
    
    if(myEmojiCode.indexOf('_') > -1){
//    	myEmojiCode1 = myEmojiCode.replace(/([\da-f]+)_000([\da-f]+)/i, '$1');
//    	myEmojiCode2 = myEmojiCode.replace(/([\da-f]+)_000([\da-f]+)/i, '$2');
    	myEmojiCode1 = myEmojiCode.replace(/([\da-f]+)_([\da-f]+)/i, '$1');
    	myEmojiCode2 = myEmojiCode.replace(/([\da-f]+)_([\da-f]+)/i, '$2');
    } else{
    	myEmojiCode1 = myEmojiCode;
    }
    if(emojiSpecialMultiHashTable.getItem(myEmojiCode)){
    	myEmojiString = emojiSpecialMultiHashTable.getItem(myEmojiCode);
    } else {
    	myEmojiString = myEmojiCode;
    }
    
		myEmojiStringElems = myEmojiString.split("_");
	 for(var i=0; i<myEmojiStringElems.length; i++){
     myEmojiStringFinal = myEmojiStringFinal + convertUnicodeCodePointsToString(['0x' + myEmojiStringElems[i]]);
   }
    //Mojo.Log.error("myEmojiCode: " + myEmojiCode);
    //Mojo.Log.error("myEmojiCodeUC: " + emojiSpecialMultiHashTable.getItem(myEmojiCode));
    //Mojo.Log.info("code1: " + myEmojiCode1);
    //Mojo.Log.info("code2: " + myEmojiCode2);
    
    //if(skinnableEmojiHashTable.getItem(myEmojiCode)){
    //	Mojo.Log.error("Tap Skinnable!!  myEmojiCode: " + myEmojiCode + "\n");
    //}
    
    if(this.opts.held == false) {
    	var tmpFinalString = myEmojiStringFinal;
      myEmojiStringFinal = "";
    	if (this.callBackFunc) {
        this.callBackFunc({ selectedEmoji : myEmojiCode1,
        										selectedEmoji2 : myEmojiCode2,
        										emojiString : myEmojiString,
        										emojiStringFinal : tmpFinalString });
    	}
    	this.controller.stageController.popScene({
        selectedEmoji : myEmojiCode1,
        selectedEmoji2 : myEmojiCode2,
        emojiString : myEmojiString,
        emojiStringFinal : tmpFinalString
    	});
  	}
}

EmojiDialogAssistant.prototype.listHoldHandler = function(event) {
		//event.stop();
		event.preventDefault();
		this.currTarget=event.target;		
		this.currItem = this.controller.get('emojiList').mojo.getItemByNode(this.currTarget);
    
    //var myEmojiCode = event.item.emojiCode;
    var myEmojiCode = this.currItem.emojiCode;
    var myEmojiCode1;
    var myEmojiCode2;
    var myEmojiString;
		//var myEmojiStringFinal ="";
		var myEmojiStringElems = [];
		var myEmojiStringElems2 = [];
		var emojiSkinItems = [];
		var emojiSkinList = ["","_1F3FB","_1F3FC","_1F3FD","_1F3FE","_1F3FF"];
		var i;
		
		myEmojiStringElems2 = myEmojiCode.split("_");
		if(skinnableEmojiHashTable.getItem(myEmojiStringElems2[0])){
			for (i=0; i < emojiSkinList.length; i++) {
				emojiSkinItems.push({
					label: "",
					command: myEmojiStringElems2[0] + emojiSkinList[i],
					secondaryIconPath: "images/emoji/" + myEmojiStringElems2[0]+emojiSkinList[i] + ".png"
				});
			}

			this.controller.popupSubmenu({
				placeNear:	this.currTarget,
				items: emojiSkinItems,
				onChoose: function(command) {
					if(command){
						myEmojiCode = command;
		
   					if(myEmojiCode.indexOf('_') > -1){
//   				 	myEmojiCode1 = myEmojiCode.replace(/([\da-f]+)_000([\da-f]+)/i, '$1');
//    				myEmojiCode2 = myEmojiCode.replace(/([\da-f]+)_000([\da-f]+)/i, '$2');
   					 	myEmojiCode1 = myEmojiCode.replace(/([\da-f]+)_([\da-f]+)/i, '$1');
				    	myEmojiCode2 = myEmojiCode.replace(/([\da-f]+)_([\da-f]+)/i, '$2');
   					} else{
    					myEmojiCode1 = myEmojiCode;
				    }
    				if(emojiSpecialMultiHashTable.getItem(myEmojiCode)){
  				  	myEmojiString = emojiSpecialMultiHashTable.getItem(myEmojiCode);
    				} else {
    					myEmojiString = myEmojiCode;
				    }
    
						myEmojiStringElems = myEmojiString.split("_");
						for(var i=0; i<myEmojiStringElems.length; i++){
     					myEmojiStringFinal = myEmojiStringFinal + convertUnicodeCodePointsToString(['0x' + myEmojiStringElems[i]]);
				  	}
				    //Mojo.Log.error("myEmojiCode: " + myEmojiCode);
    				//Mojo.Log.error("myEmojiCodeUC: " + emojiSpecialMultiHashTable.getItem(myEmojiCode));
    				//Mojo.Log.info("code1: " + myEmojiCode1);
    				//Mojo.Log.info("code2: " + myEmojiCode2);
    
    				if(this.opts.held == false) {
    					var tmpFinalString = myEmojiStringFinal;
     					myEmojiStringFinal = "";
  				  	if (this.callBackFunc) {
        				this.callBackFunc({ selectedEmoji : myEmojiCode1,
        														selectedEmoji2 : myEmojiCode2,
        														emojiString : myEmojiString,
        														emojiStringFinal : tmpFinalString });
    					}
    					this.controller.stageController.popScene({
        				selectedEmoji : myEmojiCode1,
       					selectedEmoji2 : myEmojiCode2,
     				   	emojiString : myEmojiString,
				        emojiStringFinal : tmpFinalString
  				  	});
				  	}
					}
				}	.bind(this)
			});
		}
}

EmojiDialogAssistant.prototype.cleanup = function() {
}