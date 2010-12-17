/*
Copyright (c) 2010, Axosoft, LLC. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
*/

/**
 * An extension indended to be used on a WidgetParent, which shows at most one of it children.  The size of the WidgetMorph can be
 * determined by the currently shown child, or vice versa.
 *
 * @param config {Object} Object literal specifying widget configuration properties.
 *
 * @class WidgetMorph
 * @constructor
 * @uses WidgetParent
 */
var WidgetMorph = function(config) {
	this.after('addChild', this._afterAddChild);
	this.after('removeChild', this._afterRemoveChild);

	this.after('heightChange', this._applySizeToChildren);
	this.after('widthChange', this._applySizeToChildren);
};

WidgetMorph.ATTRS = {
	// ties the size of a particular dimension between the WidgetMorph and the currently shown child.
	tieSize : {
		value : {}	
	},
	// index of the currently shown child (null if none is shown)
	shownChildIndex : {
		setter: function(value) {
			Y.each(this._items, function(child, i) {
				var equal = value === i;
				child.set('visible', equal);
				if(equal) {
					this._applySizeFromChild(child);
					if(!this.get('tieSize').height) {
						child.after('heightChange', this._afterChildSizeChange, this);
					}
					if(!this.get('tieSize').width) {
						child.after('widthChange', this._afterChildSizeChange, this);
					}
				}
				else {
					child.detach('heightChange', this._afterChildSizeChange, this);
					child.detach('widthChange', this._afterChildSizeChange, this);
				}
			}, this);			
		}
	}
};

WidgetMorph.prototype = {
	// we shouldn't need both a boundingBox and a contentBox for this...
	// or should we make that true for the children instead?
	CONTENT_TEMPLATE : null,

	// shows a particular child
	showChild : function(index) {
		this.set('shownChildIndex', index);
	},

	// invoked after a child is added.
	_afterAddChild : function(event) {
		var child = event.child;

		// child will be hidden...
		child.set('visible', false);

		// unless we have no child showing yet
		if(!Lang.isNumber(this.get('shownChildIndex'))) {
			this.set('shownChildIndex', 0);
		}

		// apply any applicable sizes to the new child
		this._applySizeToChild(child);
	},

	// after a child is removed, we may need to change which child is displayed
	_afterRemoveChild : function(event) {
		var child = event.child;

		child.detach('heightChange', this._afterChildSizeChange, this);
		child.detach('widthChange', this._afterChildSizeChange, this);
	},

	_afterChildSizeChange : function(event) {
		this._applySizeFromChild(event.target);
	},

	// applies any applicable sizes from the child to the WidgetMorph 
	_applySizeFromChild : function(child) {
		if(!this.get('tieSize').height) {
			var height = child.get('height');
			Y.log('Applying height ' + height + ' from child to MorphWidget', 'debug', 'layout');
			this.set('height', height);
		}
		if(!this.get('tieSize').width) {
			var width = child.get('width');
			Y.log('Applying width ' + width + ' from child to MorphWidget', 'debug', 'layout');
			this.set('width', width);
		}
	},

	// applies any applicable sizes from the WidgetMorph to the child 
	_applySizeToChild : function(child) {
		var tieSize = this.get('tieSize');
		if(tieSize.height) {
			var height = this.get('height');
			Y.log('Applying height ' + height + ' from MorphWidget to child', 'debug', 'layout');
			child.set('height', height);
		}
		if(tieSize.width) {
			var width = this.get('width');
			Y.log('Applying width ' + width + ' from MorphWidget to child', 'debug', 'layout');
			child.set('width', width);
		}
	},

	// applies sizes of the WidgetMorph to all of the children
	_applySizeToChildren : function() {
		Y.each(this._items, function(child) {
			this._applySizeToChild(child);
		}, this);
	}

};

Y.WidgetMorph = WidgetMorph;