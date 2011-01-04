/*
Copyright (c) 2010, Axosoft, LLC. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
*/

var Event = Y.Event,
    Lang = Y.Lang,

	ORIENTATION_TO_CONFIG = {
		vertical: {
			_nextHandle : 'b',
			_prevHandle : 't',
			_dimension : 'height',
			_Dimension : 'Height',
			_oppositeDimension : 'width',
			_OppositeDimension : 'Width',
			_offset : 'top',
			_oppositeOffset : 'left'
		},
		horizontal: {
			_nextHandle : 'r',
			_prevHandle : 'l',
			_dimension : 'width',
			_Dimension : 'Width',
			_oppositeDimension : 'height',
			_OppositeDimension : 'Height',
			_offset : 'left',
			_oppositeOffset : 'top'
		}
	},

	CAPITALIZE_DIMENSION = {height : 'Height', width: 'Width'},
	DIMENSION_TO_SIDE1 = {height: 'Top', width: 'Left'},
	DIMENSION_TO_SIDE2 = {height: 'Bottom', width: 'Right'};

/**
 * A base class for layout elements.  A LayoutChild can be made a child of a Layout,
 * creating nested layouts.
 *
 * @param config {Object} Object literal specifying widget configuration properties.
 *
 * @class LayoutChild
 * @constructor
 * @extends Widget
 * @uses WidgetParent, WidgetChild
 */
Y.LayoutChild = Y.Base.create("layoutChild", Y.Widget, [Y.WidgetChild], {
	bindUI : function() {
		// if either resize or parent change, we need to revise resizing
		this.after('resizeChange', this._afterResizeOrParentChange);
		this.after('parentChange', this._afterResizeOrParentChange);

		// call _afterResizeOrParentChange to process the current resize / parent values
		this._afterResizeOrParentChange();

		// after size changes, we will need to notify the parent to refresh its layout
		this.after('heightChange', this._afterSizeChange);
		this.after('widthChange', this._afterSizeChange);

		// TODO: a parent change may require a change of the _batchUpdate property
	},
	
	// override this function from Widget, to work around
	// bug http://yuilibrary.com/projects/yui3/ticket/2529582
	_setAttrUI : function(event) {
		if (event.target === this) {
			Y.LayoutChild.superclass._setAttrUI.apply(this, arguments);
		}
	},

	destructor: function() {
		this._destroyResize();
	},

	// we can set up resizing once we have both a resize attribute and a parent
	_afterResizeOrParentChange : function() {
		var resize = this.get('resize');
		var parent = this.get('parent');

		// either we are revising resize or turning it off - in either case destroy what we have now
		this._destroyResize();

		if (resize && parent) {
			Y.log('turning on resize for ' + this.get('id'), 'layout', 'debug');

			// for now, use the "next" handle (e.g., 'r' for horizontal orientation) unless this is the last child
			var handle = (parent._items[parent._items.length-1] === this) ? parent._prevHandle : parent._nextHandle,
				dimension = parent._dimension;

			// put together the config object for resize
			var config = {
				node: this._getContentWidget().get('boundingBox'),
				height: this.get('height'),
				width: this.get('width'),
				handles: handle,
				wrap: false
			};

			// add any user-supplied parameters
			Y.mix(config, resize);

			// make new resize object
			this._resize = new Y.Resize(config);

			// and plug proxy if requested
			if(config.proxy && Y.ResizeProxy) {
				this._resize.plug(Y.ResizeProxy);
			}

			// when the resize starts, the LayoutChild fires its own method
			this._resize.on('start', function() {
				this.fire('startResize');
			}, this);

			// on resize, change the size - this will trigger resize/place of parent's children
			this._resize.on('resize', function(event) {
				Y.log('resizing ' + dimension + ' to ' + event.info['offset' + CAPITALIZE_DIMENSION[dimension]] + ' from ' + this._getContentWidget().get(dimension), 'layout', 'debug');
				this._getContentWidget().set(dimension, event.info['offset' + CAPITALIZE_DIMENSION[dimension]]);
			}, this);

			// when the resize ends, the LayoutChild fires its own method
			this._resize.on('end', function() {
				this.fire('endResize');
			}, this);
		}
	},

	// returns the widget that contains the main content of the layout node.
	// Among other things, this widget will have the resize object attached to it.
	// defaults to this widget, but can be overridden (e.g., the collapsable layout child
	// makes its expanded view resizabe)
	_getContentWidget : function() {
		return this;
	},

	// setting the batch update to true will allow the size of this widget to be changed,
	// without refreshing its parent's layout
	setBatchUpdate : function(value) {
		this._batchUpdate = Boolean(value);
	},

	// after a size change, unless we are in batch mode, refresh the layout
	_afterSizeChange : function(event) {
		if (event.target === this) {
			if(!this._batchUpdate) {
				var parent = this.get('parent');
				if(parent) {
					// refresh the parent's layout
					parent.sizeAndPlaceChildren();
				}
				else {
					// if this is a layout, refresh
					if(this.sizeAndPlaceChildren) {
						this.sizeAndPlaceChildren();
					}
				}
			}
		}
	},

	_destroyResize : function() {
		if(this._resize) {
			this._resize.destroy();
			delete this._resize;
		}
	}

},
{
	ATTRS : {
		// truthy if the size of this item is determined by avaliable space.
		// Give it a numeric weight that determines how much available space is assigned
		// to this child, or set it to true (equivalent to a weight of 1)
		fluid : {
			value: false,
			validator: function (value) {return Lang.isBoolean(value) || Lang.isNumber(value);}
		},
		// sets up resizing.  Can be e.g. true, or an object with resize parameters like { proxy: true }
		resize : {
			value: false,
			validator: function() {
				return Boolean(Y.Resize);
			},
			lazyAdd: false
		}
	}
});

/**
 * Class for 1xN or Nx1 layouts.  A Layout can contain a number of LayoutChild units,
 * which get displayed horizontaly or vertically.
 *
 * @param config {Object} Object literal specifying widget configuration properties.
 *
 * @class Layout
 * @constructor
 * @extends LayoutChild
 */
Y.Layout = Y.Base.create("layout", Y.LayoutChild, [Y.WidgetParent], {

	renderUI : function() {
		// apply class, e.g. yui3-layout-vertical
		this.get('boundingBox').addClass(this.getClassName(this.get('orientation')));
	},

	bindUI : function() {
		Y.Layout.superclass.bindUI.apply(this);

		// listen to window resizing if needed
		if(this.get('sizeToWindow')) {
			this._windowResizeHandle = Y.after('resize', this._sizeAndPlace, window, this);
		}
	},

	syncUI : function() {
		// A root layout will size and place its children anyway, so no need to do it during render
		if(this.isRoot()) {
			this._sizeAndPlace();
		}
	},

	destructor : function() {
		this._windowResizeHandle.detach();
	},

	// override the batch update function to also set batch update values for the children
	setBatchUpdate : function(value) {
		// for efficiency, if this layout is already in the desired batch update mode, assume the children are also in that mode
		if(Boolean(value) !== this._batchUpdate) {
			Y.Layout.superclass.setBatchUpdate.apply(this, arguments);
			Y.each(this._items, function(child) {
				child.setBatchUpdate(value);
			});
		}
	},

	_sizeAndPlace : function() {
		// size to window if needed
		this._sizeToWindow();

		// then process the children
		this.sizeAndPlaceChildren();
	},

	_sizeToWindow : function() {
		if(this.get('sizeToWindow')) {
			var bb = this.get('boundingBox');

			this.set('height', bb.get('winHeight'));
			this.set('width', bb.get('winWidth'));
		}
	},

	// sizes and places child units
	sizeAndPlaceChildren : function() {
		var children = this._items,
			dimension = this._dimension,
			oppositeDimension = this._oppositeDimension,
			offset = this._offset,
			oppositeOffset = this._oppositeOffset;

		this.setBatchUpdate(true);

		// get the inner dimensions of the content box
		// contentDimension this dimension is in the orientation of the layout (e.g., width for a horizontal layout)
		// oppositeContentDimension is the opposite dimension (e.g., height for horizontal layout
		var contentDimension = this._getInnerContentDimension(dimension),
			oppositeContentDimension = this._getInnerContentDimension(oppositeDimension);

		Y.log(dimension + ' is ' + contentDimension, 'debug', 'layout');
		Y.log(oppositeDimension + ' is ' + oppositeContentDimension, 'debug', 'layout');

		// get the outer dimensions of the children, and compute the total of unfluid children, and count of fluid ones
		var sizes = [];
		var unfluidTotal = 0;
		var fluidWeight = 0;
		Y.Array.each(children, function(child, position) {
			sizes[position] = parseInt(child.get(dimension), 10);
			var fluid = child.get('fluid');
			if(fluid) {
				var weight = Number(fluid);
				fluidWeight+= weight;
				sizes[position] = weight;
			} else {
				unfluidTotal += sizes[position];
			}
		});

		var fluidUnit = (contentDimension - unfluidTotal)  / fluidWeight;

		// size the fluid children, and set the offsets and the opposite dimension for all units
		var o=this._getBoundaryDimension(dimension);
		var oppositeO=this._getBoundaryDimension(oppositeDimension);
		Y.Array.each(children, function(child, position) {
			Y.log('sizing and placing child at position ' + position, 'debug', 'layout');

			var fluid = child.get('fluid');
			if(fluid) {
				sizes[position] = fluidUnit * sizes[position];
				Y.log('seting ' + dimension + ' to ' + sizes[position], 'debug', 'layout');
				child.set(dimension, sizes[position] + "px");
			}

			Y.log('setting ' + oppositeDimension + ' to ' + oppositeContentDimension, 'debug', 'layout');
			child.set(oppositeDimension, oppositeContentDimension + "px");
			Y.log('setting ' + offset + ' to ' + o, 'debug', 'layout');
			child.get('boundingBox').setStyle(offset, o);
			Y.log('setting ' + oppositeOffset + ' to ' + oppositeO, 'debug', 'layout');
			child.get('boundingBox').setStyle(oppositeOffset, oppositeO);
			o += sizes[position];

			// if the child is a layout, size and place its children recursively
			if(child.sizeAndPlaceChildren) {
				Y.log('sizing and placing chuldren of child', 'debug', 'layout');
				child.sizeAndPlaceChildren();
			}
		});

		this.setBatchUpdate(false);
	},

	// gets the inner size of the contentBox (how much content fits inside) in the dimension
	// broken if a margin is applied to the contentBox
	_getInnerContentDimension : function(dimension) {
		var cb = this.get('contentBox');
		return cb.get('client' + CAPITALIZE_DIMENSION[dimension]) - this._getBothSidesOf(cb, 'margin', dimension) - this._getBothSidesOf(cb, 'padding', dimension);
	},

	// returns padding+border+margin size of 1st side the contentBox in the dimension
	_getBoundaryDimension : function(dimension) {
		var cb = this.get('contentBox');
		return this._getFirstSideOf(cb, 'margin', dimension) + this._getFirstSideOf(cb, 'border', dimension) + this._getFirstSideOf(cb, 'padding', dimension);
	},

	// gets both sides of margin or padding in the dimension
	_getBothSidesOf : function(cb, boxElement, dimension) {
		return this._valueOf(cb.getComputedStyle(boxElement + DIMENSION_TO_SIDE1[dimension])) + this._valueOf(cb.getComputedStyle(boxElement + DIMENSION_TO_SIDE2[dimension]));
	},

	// gets both sides of margin, border, or padding in the dimension
	_getFirstSideOf : function(cb, boxElement, dimension) {
		var suffix = boxElement == 'border' ? 'Width' : "";
		return this._valueOf(cb.getComputedStyle(boxElement + DIMENSION_TO_SIDE1[dimension] + suffix));
	},

	_valueOf : function(string) {
		return string ? parseInt(string, 10) : 0;
	}

},
{
	ATTRS : {
		// orientation of the layout.  'horizontal' or 'vertical'
		orientation: {
			value:'horizontal',
			validator:function(value) { return value==='horizontal' || value==='vertical'; },
			setter: function(value) {
				// mix in properties appropriate for the orientation
				Y.mix(this, ORIENTATION_TO_CONFIG[value]);
			},
			lazyAdd: false,
			writeOnce: 'initOnly'
		},
		// whether the size of this widget is tied to the window size
		sizeToWindow : {
			value:false,
			validator:Lang.isBoolean,
			writeOnce: 'initOnly'
		}
	}
});
