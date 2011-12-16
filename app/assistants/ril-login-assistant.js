function RilLoginAssistant() {
}

RilLoginAssistant.prototype.setup = function() {
this.loginRil = {
        'attributes': {
            'label': 'Log into ReadItLater',
            'type': Mojo.Widget.activityButton
        },
        'model': {
            'disabled': false
        }
    };
this.loginIp = {
        'attributes': {
            'label': 'Log into InstaPaper',
            'type': Mojo.Widget.activityButton
        },
        'model': {
            'disabled': false
        }
    };
    this.controller.setupWidget("rilUserFieldId",
    this.attributes = {
        hintText: $L("ReadItLater Username"),
        multiline: false,
        enterSubmits: false,
        autoFocus: true
    },
    this.RilUserValue = {
        value: "",
        disabled: false
    }
);
	this.controller.setupWidget("rilPassFieldId",
    this.attributes = {
        hintText: $L("ReadItLater Password"),
        multiline: false,
        enterSubmits: false,
        autoFocus: false
    },
    this.model = {
        value: "",
        disabled: false
    }
);
	this.controller.setupWidget("ippUserFieldId",
	this.attributes = {
        hintText: $L("InstaPaper Username"),
        multiline: false,
        enterSubmits: false,
        autoFocus: false
    },
    this.model = {
        value: "",
        disabled: false
    }
);
	this.controller.setupWidget("ippPassFieldId",
	this.attributes = {
        hintText: $L("InstaPaper Password"),
        multiline: false,
        enterSubmits: false,
        autoFocus: false
    },
    this.model = {
        value: "",
        disabled: false
    }
);
    this.controller.setupWidget('loginRil', this.loginRil.attributes, this.loginRil.model);
    this.controller.setupWidget('loginIp', this.loginIp.attributes, this.loginIp.model);
    Mojo.Event.listen(this.controller.get("rilUserFieldId"), Mojo.Event.propertyChange, this.handleUpdateRilUser/*.bindAsEventListener(this)*/);
    Mojo.Event.listen(this.controller.get("rilPassFieldId"), Mojo.Event.propertyChange, this.handleUpdateRilPw/*.bindAsEventListener(this)*/);
    Mojo.Event.listen(this.controller.get("ippUserFieldId"), Mojo.Event.propertyChange, this.handleUpdateIpUser/*.bindAsEventListener(this)*/);
    Mojo.Event.listen(this.controller.get("ippPassFieldId"), Mojo.Event.propertyChange, this.handleUpdateIpPass/*.bindAsEventListener(this)*/);
    Mojo.Event.listen(this.controller.get('loginRil'), Mojo.Event.tap, this.logIntoRil/*.bindAsEventListener(this)*/);
    Mojo.Event.listen(this.controller.get('loginIp'), Mojo.Event.tap, this.logIntoIp/*.bindAsEventListener(this)*/);




};    

RilLoginAssistant.prototype.logIntoRil = function(event) {
     this.controller.get('loginRil').mojo.activate();
    Mojo.Log.info(this.RilUserValue.value);
    this.controller.get('loginRil').mojo.deactivate();
};

/*RilLoginAssistant.prototype.handleUpdateRilUser = function(event) {

    Mojo.Log.info(document.getElementById("rilUserFieldId").value)
};*/

RilLoginAssistant.prototype.logIntoIp = function(event) {
	 this.controller.get('loginIp').mojo.activate();
 
    this.controller.get('loginIp').mojo.deactivate();
};

RilLoginAssistant.prototype.activate = function(event) {
	
};

RilLoginAssistant.prototype.deactivate = function(event) {
	
};

RilLoginAssistant.prototype.cleanup = function(event) {
	
};
