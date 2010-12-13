Y.LayoutChildCollapsableClip = Y.Base.create("layoutChildCollapsableClip", Y.Widget, [Y.WidgetChild], {}, {});
Y.LayoutChildCollapsableContent = Y.Base.create("layoutChildCollapsableContent", Y.Widget, [Y.WidgetChild], {}, {});

/**
 * A collapsable layout child.
 *
 * @param config {Object} Object literal specifying widget configuration properties.
 *
 * @class LayoutChildCollapsable
 * @constructor
 * @uses WidgetParent, WIdgetMorph
 */
Y.LayoutChildCollapsable = Y.Base.create("layoutChildCollapsable", Y.LayoutChild, [Y.WidgetParent, Y.WidgetMorph],
{
	initializer: function(config) {
		// how we tie the size of the layout child and its content depends on the orientation
		// of the layout... which depends on the parent.
		this.after('parentChange', this._tieSize);
		this._tieSize();
	},

	// ties the size of the layout child and its content / clip
	_tieSize : function() {
		var parent = this.get('parent');
		if(parent) {
			var content = new Y.LayoutChildCollapsableContent(),
				clip = new Y.LayoutChildCollapsableClip(),
				dimension = parent._dimension;

			// set up content and clip widgets
			// the initial dimension of the layout child determines the dimension of the content
			content.set(dimension, this.get(dimension));
			clip.set(dimension, 50); // for now
			this.add(content);
			this.add(clip);

			// in the dimension opposite the layout, the size of the layout child will always determine the size of the content/clip
			var tieSize = {};
			tieSize[parent._oppositeDimension] = true;
			this.set('tieSize', tieSize);

			// apply the opposite dimension... TODO: this should happen automatically on tieSize change
			this._applySizeToChildren();
		}
	},

	toggle: function() {
		this.set('collapsed', !this.get('collapsed'));
	}
}
,
{
	ATTRS : {
		// just a conversion to/from shownChildIndex
		collapsed : {
			setter: function(value) { this.set('shownChildIndex', Number(value)); },
			getter: function() { return Boolean(this.get('shownChildIndex')); }
		
		}
	}
}
);
