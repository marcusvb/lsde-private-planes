/*
    L.TimeDimension.Layer.Choropleth: show a choropleth with values modified along time
    This is a very simple implementation. The logic of the changes relies on the
    style function of the baselayer.
*/

L.TimeDimension.Layer.Choropleth = L.TimeDimension.Layer.extend({

    initialize: function(layer, options) {
        L.TimeDimension.Layer.prototype.initialize.call(this, layer, options);
        this._loaded = false;
        if (this._baseLayer.getLayers().length === 0) {
            this._baseLayer.on("ready", this._onReadyBaseLayer, this);
        } else {
            this._onReadyBaseLayer();
        }
    },

    _onReadyBaseLayer: function () {
        this._loaded = true;
        this._update();
    },

    onAdd: function (map) {
        L.TimeDimension.Layer.prototype.onAdd.call(this, map);
        map.addLayer(this._baseLayer);
    },

    isReady: function (time) {
        return this._loaded;
    },

    _update: function () {
        if (!this._map)
            return;
        if (!this._loaded) {
            return;
        }
        this._baseLayer.resetStyle();
    },

    _onNewTimeLoading: function(ev) {

    },

});

L.timeDimension.layer.choropleth = function(layer, options) {
    return new L.TimeDimension.Layer.Choropleth(layer, options);
};
