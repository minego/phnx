function RilLoginAssistant() {
	 var cookie = new Mojo.Model.Cookie("RilUser");
    try {
        this.rilUser = cookie.get();
    } catch (e) {Mojo.Log.error("this.rilUser");}
    var cookie = new Mojo.Model.Cookie("RilPass");
    try {
        this.rilPass = cookie.get();
    } catch (e) {Mojo.Log.error("this.rilPass");}
    var cookie = new Mojo.Model.Cookie("IppUser");
    try {
        this.ippUser = cookie.get();
    } catch (e) {Mojo.Log.error("this.ippUser");}
    var cookie = new Mojo.Model.Cookie("IppPass");
    try {
        this.ippPass = cookie.get();
    } catch (e) {Mojo.Log.error("this.ippPass");}
}

RilLoginAssistant.prototype.setup = function() {
    this.controller.setupWidget("rilUserFieldId",
		this.attributes = {
			hintText: $L("ReadItLater Username"),
			multiline: false,
			enterSubmits: false,
			autoFocus: false,
            textCase: Mojo.Widget.steModeLowerCase
		},
		this.RilUserValue = {
			value: this.rilUser,
			disabled: false
		}
	);

	this.controller.setupWidget("rilPassFieldId",
    this.attributes = {
        hintText: $L("ReadItLater Password"),
        multiline: false,
        enterSubmits: false,
        autoFocus: false,
        textCase: Mojo.Widget.steModeLowerCase
    },
    this.RilPassValue = {
        value: this.rilPass,
        disabled: false
    }
);
	this.controller.setupWidget("ippUserFieldId",
	this.attributes = {
        hintText: $L("Instapaper Email"),
        multiline: false,
        enterSubmits: false,
        autoFocus: false,
        textCase: Mojo.Widget.steModeLowerCase
    },
    this.IpUserValue = {
        value: this.ippUser,
        disabled: false
    }
);
	this.controller.setupWidget("ippPassFieldId",
	this.attributes = {
        hintText: $L("Instapaper Password"),
        multiline: false,
        enterSubmits: false,
        autoFocus: false,
        textCase: Mojo.Widget.steModeLowerCase
    },
    this.IpPassValue = {
        value: this.ippPass,
        disabled: false
    }
);
	 this.controller.setupWidget("loginRil",
         this.attributes = {
         	type: Mojo.Widget.defaultButton
             },
         this.model = {
             label : "Login to ReaditLater",
             disabled: false
         }
     );
	 this.controller.setupWidget("loginIp",
         this.attributes = {
         	type: Mojo.Widget.defaultButton
             },
         this.model = {
             label : "Login to Instapaper",
             disabled: false
         }
     );
     this.controller.setupWidget("back",
         this.attributes = {
            type: Mojo.Widget.defaultButton
             },
         this.model = {
             label : "Back",
             disabled: false
         }
     );

    Mojo.Event.listen(this.controller.get('loginRil'), Mojo.Event.tap,
this.logIntoRil.bindAsEventListener(this));
    Mojo.Event.listen(this.controller.get('loginIp'), Mojo.Event.tap,
this.logIntoIp.bindAsEventListener(this));
Mojo.Event.listen(this.controller.get('back'), Mojo.Event.tap,
this.backButton.bindAsEventListener(this));




};

RilLoginAssistant.prototype.logIntoRil = function(event) {
    this.rilUser = this.RilUserValue.value;
    this.rilPass = this.RilPassValue.value;
    var cookie = new Mojo.Model.Cookie("RilUser");
    cookie.put(this.rilUser);
    var cookie = new Mojo.Model.Cookie("RilPass");
    cookie.put(this.rilPass);
    banner("Set ReadItLater Username and Pass...");
};

RilLoginAssistant.prototype.logIntoIp = function() {
    this.ippUser = this.IpUserValue.value;
    this.ippPass = this.IpPassValue.value;
    var cookie = new Mojo.Model.Cookie("IppUser");
    cookie.put(this.ippUser);
    var cookie = new Mojo.Model.Cookie("IppPass");
    cookie.put(this.ippPass);
    banner("Set Instapaper Username and Pass...");
};

RilLoginAssistant.prototype.backButton = function(event) {
        this.controller.stageController.popScene();
};
RilLoginAssistant.prototype.activate = function(event) {
};

RilLoginAssistant.prototype.deactivate = function(event) {
};

RilLoginAssistant.prototype.cleanup = function() {
	this.rilUser = this.RilUserValue.value;
	this.rilPass = this.RilPassValue.value;
	this.ippUser = this.IpUserValue.value;
	this.ippPass = this.IpPassValue.value;
	var cookie = new Mojo.Model.Cookie("RilUser");
	cookie.put(this.rilUser);
	var cookie = new Mojo.Model.Cookie("RilPass");
	cookie.put(this.rilPass);
	var cookie = new Mojo.Model.Cookie("IppUser");
	cookie.put(this.ippUser);
	var cookie = new Mojo.Model.Cookie("IppPass");
	cookie.put(this.ippPass);
};
