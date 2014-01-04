/*
	Toasters are slide-up mini scenes.
	Using the ToasterChain class to keep track of history.

	This particular file is a module of functions that
	each Toaster class inherits.
*/
var Toaster = {
	render: function(obj, template) {
		var content = Mojo.View.render({
			object: obj,
			template: template
		});

		// Append to the Toasters container
		get('toasters').innerHTML = get('toasters').innerHTML + content;
	},
	show: function() {
		if (this.shim) {
			get('shim').removeClassName('ignore');
			get('shim').addClassName('show');
		} else {
			get('shim').addClassName('ignore');
			get('shim').removeClassName('show');
		}
		this.setup();
		var toasterHeight = get(this.nodeId).offsetHeight;
		var newBottom = 0-(toasterHeight);
		get(this.nodeId).setStyle({'-webkit-transition-duration': (toasterHeight/800) + 's' });
		get(this.nodeId).setStyle({'bottom': 0 + 'px'});
		this.animateShow();
	},
	hide: function() {
		var toasterHeight = get(this.nodeId).offsetHeight;
		var newBottom = 0-(toasterHeight);
		get(this.nodeId).setStyle({'bottom': newBottom + 'px'});
		get(this.nodeId).setStyle({'-webkit-transition-duration': (toasterHeight/800) + 's' });
		this.animateHide();
		this.cleanup(); // kill those evil listeners!
	},
	animateShow: function() {
		// CSS Animation method
		var n;

		if ((n = get(this.nodeId))) {
			n.addClassName('show');
		}
	},
	animateHide: function() {
		// CSS animation
		get(this.nodeId).removeClassName('show');
	},
	destroy: function() {
		// hide the toaster if it's visible
		this.hide();
		var id = this.id;
		setTimeout(function(){
			var toaster;

			if ((toaster = get('toaster-' + id))) {
				toaster.remove();
			}
		}, 1300);
	},
	setup: function() {

	},
	cleanup: function() {

	}
};
