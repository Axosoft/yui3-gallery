// various CSS class names and HTML templates
var getClassName = Y.ClassNameManager.getClassName,
	LAYOUT_CHILD = 'layoutChild',
	classNames = {
		buttons : getClassName(LAYOUT_CHILD, 'buttons'),
		collapseButton : getClassName(LAYOUT_CHILD, 'button', 'collapse'),
		expandButton : getClassName(LAYOUT_CHILD, 'button', 'expand')
	},
	BUTTONS_TEMPLATE = Y.substitute('<div class="{cssClass}"></div>', {'cssClass': classNames.buttons}),
	CONTENT_HEADER_TEMPLATE = '{label}' + BUTTONS_TEMPLATE;

// syncUI code shared between LayoutChildStd and LayoutChildCollapsableStd
var _syncUIImpl = function() {
	// compose the header
	var headerContent = Y.substitute(Y.LayoutChildStd.CONTENT_HEADER_TEMPLATE, {label: this.get('label')});
	this._getContentWidget().setStdModContent(Y.WidgetStdMod.HEADER, headerContent);
};

// a regular LayoutChild extended with the standard module format section and generated header
Y.LayoutChildStd = Y.Base.create(LAYOUT_CHILD, Y.LayoutChild, [Y.WidgetStdMod], {
	syncUI: function() {
		Y.LayoutChildStd.superclass.syncUI.apply(this, arguments);
		_syncUIImpl.apply(this, arguments);
	}
},
{
	ATTRS: {
		label: {
		}
	},

	BUTTONS_TEMPLATE: BUTTONS_TEMPLATE,
	CONTENT_HEADER_TEMPLATE: CONTENT_HEADER_TEMPLATE
});

// for collapsable layout children, we need to extend both the clip and the content with WidgetStdMod
Y.LayoutChildCollapsableContentStd = Y.Base.create("layoutChildCollapsableContent", Y.LayoutChildCollapsableContent, [Y.WidgetStdMod], {}, {});
Y.LayoutChildCollapsableClipStd = Y.Base.create("layoutChildCollapsableClip", Y.LayoutChildCollapsableClip, [Y.WidgetStdMod], {}, {});

// LayoutChildCollapsable extended with the standard module format sections and generated header
Y.LayoutChildCollapsableStd = Y.Base.create(LAYOUT_CHILD, Y.LayoutChildCollapsable, [Y.WidgetStdMod], {
	
	syncUI: function() {
		Y.LayoutChildCollapsableStd.superclass.syncUI.apply(this, arguments);
		_syncUIImpl.apply(this, arguments);

		this._addButton(this._getContentWidget(), Y.LayoutChildCollapsableStd.COLLAPSE_ICON_TEMPLATE);

		var headerContent = Y.substitute(Y.LayoutChildCollapsableStd.CLIP_HEADER_TEMPLATE, {label: this.get('label')});
		var clipWidget = this._getClipWidget();
		clipWidget.setStdModContent(Y.WidgetStdMod.HEADER, headerContent);
		
		this._addButton(clipWidget, Y.LayoutChildCollapsableStd.EXPAND_ICON_TEMPLATE);
	},

	_makeContentWidget: function() {
		return new Y.LayoutChildCollapsableContentStd();
	},

	_makeClipWidget: function() {
		return new Y.LayoutChildCollapsableClipStd();
	},

	_addButton: function(widget, buttonTemplate) {
		var buttons = widget.get('boundingBox').one('.'+classNames.buttons);
		var button = Y.Node.create(buttonTemplate);
		button.on('click', this.toggle, this);
		buttons.append(button);		
	}

},
{
	ATTRS: {
		label: {
		}
	},

	CLIP_HEADER_TEMPLATE: Y.substitute('<div class="{cssClass}"></div>', {cssClass: classNames.buttons}),
	COLLAPSE_ICON_TEMPLATE: Y.substitute('<div class="{cssClass}"></div>', {cssClass: classNames.collapseButton}),
	EXPAND_ICON_TEMPLATE: Y.substitute('<div class="{cssClass}"></div>', {cssClass: classNames.expandButton})
});
