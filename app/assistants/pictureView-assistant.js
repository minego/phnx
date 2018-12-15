function PictureViewAssistant(url,username,tweetId,matchId,link_url) {
	this.url = url;
	this.username = username;
	this.tweetId = tweetId;
	this.okToClose = true;
	this.linkUrl = link_url;
	this.current = matchId;
}

PictureViewAssistant.prototype = {
	setup: function() {
		this.handleWindowResizeHandler = this.handleWindowResize.bindAsEventListener(this);
		this.controller.listen(this.controller.window, 'resize', this.handleWindowResizeHandler);
		this.imageViewer = this.controller.get('divImageViewer');
		this.model = {
			onLeftFunction: this.wentLeft.bind(this),
			onRightFunction: this.wentRight.bind(this)
		}
		this.controller.setupWidget('divImageViewer',{},this.model);

		this.closeTapped = this.closeTapped.bind(this);
		this.saveTapped = this.saveTapped.bind(this);	
		//this.controller.listen(this.imageViewer, Mojo.Event.tap, this.closeTapped);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
		this.controller.listen(this.controller.get("save-button"), Mojo.Event.tap, this.saveTapped);
	},
	wentLeft: function(event){
		if (this.current > 0) {
			if(this.linkUrl[0].media_url){		
				this.current--;
				if(this.current > 0 && this.linkUrl[this.current - 1]){
					this.imageViewer.mojo.leftUrlProvided(this.linkUrl[this.current-1].media_url);
				}
				//this.imageViewer.mojo.centerUrlProvided(this.linkUrl[this.current].media_url);
				if (this.linkUrl[this.current + 1]){
					this.imageViewer.mojo.rightUrlProvided(this.linkUrl[this.current+1].media_url);
				}
			}
		}
	},
	wentRight: function(event){
		if (this.current < (this.linkUrl.length - 1)) {
			if(this.linkUrl[0].media_url){
				this.current++;
				if(this.current > 0 && this.linkUrl[this.current - 1]){
					this.imageViewer.mojo.leftUrlProvided(this.linkUrl[this.current-1].media_url);
				}
				//this.imageViewer.mojo.centerUrlProvided(this.linkUrl[this.current].media_url);
				if (this.linkUrl[this.current + 1]){
					this.imageViewer.mojo.rightUrlProvided(this.linkUrl[this.current+1].media_url);
				}
			}
		}
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
		var imgUrl;
		
		if(this.linkUrl){
			if(this.linkUrl[this.current].media_url){
				imgUrl = this.linkUrl[this.current].media_url;
			} else {
				imgUrl = this.url;
			}
			imgFilename = this.username + '_' + this.tweetId + '_' + this.current;
		} else {
			imgUrl = this.url;
			imgFilename = this.username + '_' + this.tweetId;
		}
		var saveParams = {
			target: imgUrl,
			targetDir: '/media/internal/projectmacaw',
			targetFilename: imgFilename,
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
		//Mojo.Log.error('resize, src:' + this.url);
		if (this.imageViewer && this.imageViewer.mojo) {
			this.imageViewer.mojo.manualSize(this.controller.window.innerWidth, this.controller.window.innerHeight);
		}
	},
	activate: function(event) {
		Mojo.Log.info("pictureView linkUrl: ", JSON.stringify(this.linkUrl));
		this.controller.enableFullScreenMode(true);
		this.controller.stageController.setWindowOrientation('free');
		
		if(this.linkUrl){
			if(this.linkUrl[0]){
				if(this.current > 0 && this.linkUrl[this.current - 1]){
					Mojo.Log.info("pictureView line 163...");
					if(this.linkUrl[this.current-1].media_url){

					}
				}
				//this.imageViewer.mojo.centerUrlProvided(this.url);
				Mojo.Log.info("pictureView line 169...");
				Mojo.Log.info("this.linkUrl: ", JSON.stringify(this.linkUrl));
				Mojo.Log.info("this.current: ", JSON.stringify(this.current));
				if(this.linkUrl[this.current].media_url){
					Mojo.Log.info("pictureView line 171...");
					this.imageViewer.mojo.centerUrlProvided(this.linkUrl[this.current].media_url);
				} else {
					this.imageViewer.mojo.centerUrlProvided(this.url);
				}
				if (this.linkUrl[this.current + 1]){
					Mojo.Log.info("pictureView line 177...");
					if(this.linkUrl[this.current + 1].media_url){
						Mojo.Log.info("pictureView line 179...");
						this.imageViewer.mojo.rightUrlProvided(this.linkUrl[this.current+1].media_url);
					}
				}
			} else {
				this.imageViewer.mojo.centerUrlProvided(this.url);
			}
		} else {
			//Profile picture
			this.imageViewer.mojo.centerUrlProvided(this.url);
		}
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
