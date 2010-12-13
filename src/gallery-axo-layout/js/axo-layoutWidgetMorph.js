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
			Y.each(this._items, function(item, i) {
				var equal = value === i;
				item.set('visible', equal);
				if(equal) {
					this._applySizeFromChild(item);
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
	_afterRemoveChild : function() {
	},

	// applies any applicable sizes from the child to the WidgetMorph 
	_applySizeFromChild : function(child) {
		if(!this.get('tieSize').height) {
			this.set('height', child.get('height'));
		}
		if(!this.get('tieSize').width) {
			this.set('width', child.get('width'));
		}
	},

	// applies any applicable sizes from the WidgetMorph to the child 
	_applySizeToChild : function(child) {
		var tieSize = this.get('tieSize');
		if(tieSize.height) {
			child.set('height', this.get('height'));
		}
		if(tieSize.width) {
			child.set('width', this.get('width'));
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