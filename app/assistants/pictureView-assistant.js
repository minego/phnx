function PictureViewAssistant(url,username,img_uid) {
	this.url = url;
	this.username = username;
	this.img_uid = img_uid;
	this.okToClose = true;
}

PictureViewAssistant.prototype = {
	setup: function() {
		this.handleWindowResizeHandler = this.handleWindowResize.bindAsEventListener(this);
		this.controller.listen(this.controller.window, 'resize', this.handleWindowResizeHandler);
		this.imageViewer = this.controller.get('divImageViewer');
		this.controller.setupWidget('divImageViewer',
			this.attributes = {
				noExtractFS: true
			},
			this.model = {
				onLeftFunction: function (){
					//TODO: show other images in the tweet OR other images by that user
				},
				onRightFunction: function (){

				}
			}
		);

		this.closeTapped = this.closeTapped.bind(this);
		this.saveTapped = this.saveTapped.bind(this);	
		//this.controller.listen(this.imageViewer, Mojo.Event.tap, this.closeTapped);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
		this.controller.listen(this.controller.get("save-button"), Mojo.Event.tap, this.saveTapped);
	},
	handleCommand: function(event) {
		if (event.type === Mojo.Event.back) {
			this.closeTapped();
			event.stop();
		}
	},
	closeTapped: function() {
		if(this.okToClose) {
			this.controller.stageController.popScene();
		}
	},
	saveTapped: function() {
		//download it
		this.okToClose = false;
		var that = this;
		var saveParams = {
			target: this.url,
			targetDir: '/media/internal/projectmacaw',
			targetFilename: this.username + '_' + this.img_uid,
			keepFilenameOnRedirect: false,
			subscribe: true
		};
		this.controller.serviceRequest('palm://com.palm.downloadmanager/', {
			method: 'download',
			parameters: saveParams,
			onSuccess: function(resp) {
				//Mojo.Log.error(JSON.stringify(resp));
				if(resp.completed){
					if(resp.completionStatusCode === 200) {
						//Mojo.Log.error('completed SUCCESSFULLY');
						var imgType = resp.mimetype.substring(resp.mimetype.lastIndexOf('/')+1).replace('jpeg','jpg');
						that.controller.serviceRequest('palm://ca.canucksoftware.filemgr/', {
							method: 'rename',
							parameters: {
								from: saveParams.targetDir+'/'+saveParams.targetFilename,
								to: saveParams.targetDir+'/'+saveParams.targetFilename+'.'+imgType
							},
							onSuccess: function(payload) {
								//yay! service request was successful
							},
							onFailure: function(err) {
								//Mojo.Controller.errorDialog(err.errorText);
							}
						});
						banner('Photo Saved!');
						that.okToClose = true;
						if (Mojo.Environment.DeviceInfo.modelNameAscii === "TouchPad") {
							setTimeout(function() {
								that.controller.enableFullScreenMode(true);
							}, 7000);
						}
					} else {
						//Mojo.Log.error('completed UN-SUCCESSFULLY');
						that.okToClose = true;
						banner('Problem saving photo');
						if (Mojo.Environment.DeviceInfo.modelNameAscii === "TouchPad") {
							setTimeout(function() {
								that.controller.enableFullScreenMode(true);
							}, 7000);
						}
					}
				}
			},
			onFailure: function(e) {
				//Mojo.Log.error(JSON.stringify(e));
				banner('Problem saving photo');
				that.okToClose = true;
				if (Mojo.Environment.DeviceInfo.modelNameAscii === "TouchPad") {
					setTimeout(function() {
						that.controller.enableFullScreenMode(true);
					}, 7000);
				}
			}
		});
		if (Mojo.Environment.DeviceInfo.modelNameAscii === "TouchPad") {
			this.controller.enableFullScreenMode(false);
		}
		banner('Saving photo...');
	},
	handleWindowResize: function(event) {
		if (this.imageViewer && this.imageViewer.mojo) {
			this.imageViewer.mojo.manualSize(this.controller.window.innerWidth, this.controller.window.innerHeight);
		}
	},
	activate: function(event) {
		this.controller.enableFullScreenMode(true);
		this.controller.stageController.setWindowOrientation('free');
		this.imageViewer.mojo.centerUrlProvided(this.url);
		this.imageViewer.mojo.manualSize(Mojo.Environment.DeviceInfo.screenWidth, Mojo.Environment.DeviceInfo.screenHeight);
	},
	deactivate: function(event) {
		if (Mojo.Environment.DeviceInfo.platformVersionMajor < 3) {
			this.controller.stageController.setWindowOrientation('up');
		}
		this.controller.enableFullScreenMode(false);
	},
	cleanup: function(event) {
		this.controller.stopListening(this.controller.window, 'resize', this.handleWindowResizeHandler);
		//this.controller.stopListening(this.imageViewer, Mojo.Event.tap, this.closeTapped);
		this.controller.stopListening(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
		this.controller.stopListening(this.controller.get("save-button"), Mojo.Event.tap, this.saveTapped);
	}
};
