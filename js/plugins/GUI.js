
(function() {


    var _Scene_Map_Start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_Start.call(this);
        this._myWindow = new My_Window(0, 200);
        this.addWindow(this._myWindow);
    };

    var _Scene_Map_Update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_Update.call(this);
        this._myWindow.refresh();

    }

    function My_Window() {
        this.initialize.apply(this, arguments);
    }

    My_Window.prototype = Object.create(Window_Base.prototype);
    My_Window.prototype.constructor = My_Window;

    My_Window.prototype.initialize = function(x, y) {
        Window_Base.prototype.initialize.call(this, x, y, this.windowWidth(), this.windowHeight());

        this.refresh();

    }

    My_Window.prototype.refresh = function() {
        this.contents.clear();
        this.drawIcon(0, 0, )
        this.drawText("Gold: " + $gameParty.gold(), 0, 0, this.windowWidth(), 'left');
        this.drawText("Stone: " + $gameVariables.value(41), 0, 40, this.windowWidth(), 'left');
        this.drawText("Wood: " + $gameVariables.value(43), 0, 80, this.windowWidth(), 'left');
	this.drawText("Crop: " + $gameVariables.value(44), 0, 120, this.windowWidth(), 'left');

    }

    My_Window.prototype.windowWidth = function() {
        return 240;
    }

    My_Window.prototype.windowHeight = function() {
        return 200;
    }

})();
