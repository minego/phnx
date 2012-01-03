function WebviewAssistant(url) {
	this.url = url;
}

WebviewAssistant.prototype.setup = function() {
	this.controller.setupWidget('browser',
  this.attributes = {
      url: this.url,
      minFontSize: 18,
      virtualpagewidth: 20,
      virtualpageheight: 10
  },
  this.model = {
  }
); 
	this.reloadModel = {
		icon: 'refresh',
		command: 'refresh'
	};
	this.stopModel = {
		icon: 'load-progress',
		command: 'stop'
	};
	this.cmdMenuModel = {
		visible: true,
		items: [{}, this.reloadModel]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass:'no-fade'}, this.cmdMenuModel);
	Mojo.Event.listen(this.controller.get('browser'),Mojo.Event.webViewLoadProgress, this.loadProgress.bind(this));
	Mojo.Event.listen(this.controller.get('browser'),Mojo.Event.webViewLoadStarted, this.loadStarted.bind(this));
	Mojo.Event.listen(this.controller.get('browser'),Mojo.Event.webViewLoadStopped, this.loadStopped.bind(this));
	Mojo.Event.listen(this.controller.get('browser'),Mojo.Event.webViewLoadFailed, this.loadStopped.bind(this));
};

WebviewAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			case 'refresh':
				this.controller.get('browser').mojo.reloadPage();
				break;
			case 'stop':
				this.controller.get('browser').mojo.stopLoad();
				break;
		}
	}
 };
  //  loadStarted - switch command button to stop icon & command
 //
 WebviewAssistant.prototype.loadStarted = function(event) {
	this.cmdMenuModel.items.pop(this.reloadModel);
	this.cmdMenuModel.items.push(this.stopModel);
	this.controller.modelChanged(this.cmdMenuModel);
	this.currLoadProgressImage = 0;
 };
  //  loadStopped - switch command button to reload icon & command
 WebviewAssistant.prototype.loadStopped = function(event) {
	this.cmdMenuModel.items.pop(this.stopModel);
	this.cmdMenuModel.items.push(this.reloadModel);
	this.controller.modelChanged(this.cmdMenuModel);

	this.controller.get('browser').focus();
	try {
		this.controller.window.PalmSystem.editorFocused(true, 0, 0);
	} catch (e) {
		// This is fine on a phone with a physical keyboard. Trying to work
		// around a bug in webOS 3.x with virtual keyboards in mojo
	}
 };
  //  loadProgress - check for completion, then update progress
 WebviewAssistant.prototype.loadProgress = function(event) {
	var percent = event.progress;
	try {
		if (percent > 100) {
			percent = 100;
		}
		else if (percent < 0) {
			percent = 0;
		}
		// Update the percentage complete
		this.currLoadProgressPercentage = percent;
		// Convert the percentage complete to an image number
		// Image must be from 0 to 23 (24 images available)
		var image = Math.round(percent / 4.1);
		if (image > 23) {
			image = 23;
		}
		// Ignore this update if the percentage is lower than where we're showing
		if (image < this.currLoadProgressImage) {
			return;
		}
		// Has the progress changed?
		if (this.currLoadProgressImage != image) {
			// Cancel the existing animator if there is one
			if (this.loadProgressAnimator) {
				this.loadProgressAnimator.cancel();
				delete this.loadProgressAnimator;
			}
						  // Animate from the current value to the new value
			var icon = this.controller.select('div.load-progress')[0];
			if (icon) {
				this.loadProgressAnimator = Mojo.Animation.animateValue(Mojo.Animation.queueForElement(icon),
											"linear", this._updateLoadProgress.bind(this), {
					from: this.currLoadProgressImage,
					to: image,
					duration: 0.5
				});
			}
		}
	}
	catch (e) {
		Mojo.Log.logException(e, e.description);
	}
 };
  WebviewAssistant.prototype._updateLoadProgress = function(image) {
  // Find the progress image
	image = Math.round(image);
	// Don't do anything if the progress is already displayed
	if (this.currLoadProgressImage == image) {
		return;
	}
	var icon = this.controller.select('div.load-progress');
	if (icon && icon[0]) {
		icon[0].setStyle({'background-position': "0px -" + (image * 48) + "px"});
	}
	this.currLoadProgressImage = image;
 };
WebviewAssistant.prototype.activate = function(event) {
	this.controller.enableFullScreenMode(true);
		this.controller.stageController.setWindowOrientation('free');
};

WebviewAssistant.prototype.deactivate = function(event) {
		if (Mojo.Environment.DeviceInfo.platformVersionMajor < 3) {
			this.controller.stageController.setWindowOrientation('up');
		}
		this.controller.enableFullScreenMode(false);
};

WebviewAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
