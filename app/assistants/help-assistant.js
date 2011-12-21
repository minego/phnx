function HelpAssistant() {
	
}

HelpAssistant.prototype.setup = function() {
	var appMenu = [
			Mojo.Menu.editItem,
			{
				label: 'Contact Support',
				command: 'cmdSupport'
			}
		];

		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: true, items: appMenu});
		this.controller.get('version').update(Mojo.appInfo.version);

		this.closeTapped = this.closeTapped.bind(this);
		this.controller.listen(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
};

HelpAssistant.prototype.closeTapped = function(event) {
		this.controller.stageController.popScene();
	};

HelpAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening(this.controller.get("close-button"), Mojo.Event.tap, this.closeTapped);
};
