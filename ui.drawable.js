(function($){
/**
 * @class jQuery.ui.drawable
 * @extends jQuery.ui.mouse
 * Draw new blocks dragging across multiple columns and then creating a single block and repainting
 * Implemented as a jQuery UI plugin
 */
$.widget("ui.drawable",$.extend({},$.ui.mouse,{
  /**
   * @constructor {jQuery.ui.drawable} _init
   * Initialize the element, add a class and call _mouseInit() 
   */
  _init : function(){
    this._set_padding();
    this.element.addClass("ui-drawable");
    this._mouseInit();
  },
  /**
   *  @function {protected jQuery.ui.drawable} _mouseStart
   *  Implementation of _mouseStart
   *  Create our drag proxy and position it according to the mouse position
   *  Also record the original position
   *  @param {Event} event
   *  jQuery UI event object
   */
  _mouseStart : function(event){
    this.proxy = $(document.createElement('div'))
    $(document.body).append(this.proxy)
    this.original_position = {x : event.pageX, y : event.pageY }
    this.proxy.addClass('drawing-proxy').css({
      'position':'absolute',
      'top' : this._get_drag_top_position(event),
      'left' : this._get_drag_left_position(event)
    });
    this._trigger('proxy_create',event,{drawable:this,proxy:this.proxy});
  },
  /**
   * @function {protected jQuery.ui.drawable} _mouseDrag
   * Implementation of _mouseDrag.  This adjusts the size of the proxy
   * @param {Event} event
   * jQuery UI event object
   */
  _mouseDrag : function(event){
    var new_dimensions = {
      // when we are dragging down (this.get_direction().y is positive), we change the height
      height : this._get_drag_height(event),
      width : this._get_drag_width(event),
      top : this._get_drag_top_position(event),
      left : this._get_drag_left_position(event)
    }
    // check dimensions
    if(this._trigger('allow_resize',event,{drawable : this, new_dimensions : new_dimensions})){
      this.proxy.css(new_dimensions);
    }
  },
  /**
   * @function {public jQuery.ui.drawable} get_position_from_start
   * Get the x,y difference between the position of the mouse when the drag started
   * and its current position
   * @param {Event} event
   * jQuery UI event object
   * @return {x : (int), y : (int)}
   */
  get_position_from_start : function(event){
    return {
      x : this.original_position.x < event.pageX,
      y : this.original_position.y < event.pageY
    }
  },
 /**
  * @function {protected jQuery.ui.drawable} _set_padding
  * Helper function to set up the padding for the 'drawable' element
  */
  _set_padding : function(){
    this.options.padding = this.options.padding || {}
    if(typeof(this.options.padding) != "object"){
      this.options.padding = {
        top : this.options.padding,
        right : this.options.padding,
        left : this.options.padding,
        bottom : this.options.padding
      }
    }
    sides = ['top','bottom','left','right']
    for(j=0; j<sides.length;j++){
      var i = sides[j];
      this.options.padding[i] = isNaN(parseInt(this.options.padding[i])) ? 0 : parseInt(this.options.padding[i]);
    }
  },
  /**
   * @function {protected jQuery.ui.drawable} _get_drag_height
   * Determine the height of the proxy based on its current height and the drag event
   * @param {Event} event
   * jQuery UI event object
   */
  _get_drag_height : function(event){
    var height = this.proxy.height();
    // keep the height the same if we are above or below the element
    if(event.pageY < this.element.offset().top + this.options.padding.top || event.pageY > (this.element.offset().top + this.element.height() - this.options.padding.bottom)){
      height = height;
    }else{
      height = Math.abs(event.pageY - this.original_position.y);
    }
    // correct for grid
    height = Math.ceil(height / this.options.grid[1]) * this.options.grid[1];

    return height
  },
  /**
   * @function {protected jQuery.ui.drawable} _get_drag_width
   * Determine the height of the proxy based on its current width and the drag event
   * @param {Event} event
   * jQuery UI event object
   */
  _get_drag_width : function(event){
    var width = this.proxy.width();
    if(event.pageX < (this.element.offset().left + this.options.padding.left) || 
      event.pageX > (this.element.offset().left + this.element.width())){
      width = width;
    }else{
      width = Math.abs(event.pageX - this.original_position.x);
    }
    // account for border by subtracting 1 px for each grid block
    var grid_blocks = Math.ceil(width / this.options.grid[0]) 
    return (grid_blocks * this.options.grid[0]) - grid_blocks;
  },
  /**
   * @function {public jQuery.ui.drawable} get_top_offset
   * Determine the current top offset of the proxy relative to the 'drawable' element
   * @return top offset as an integer
   */
  get_top_offset : function(){
    return this.proxy.offset().top - this.element.offset().top - this.options.padding.top;
  },
  /**
   * @function {public jQuery.ui.drawable} get_bottom_offset
   * Determine the current bottom offset of the proxy relative to the 'drawable' element
   * @return bottom offset as an integer
   */
  get_bottom_offset : function(){
    return this.proxy.offset().top + this.proxy.height() - this.element.offset().top - this.options.padding.top
  },
 /**
  * @function {protected jQuery.ui.drawable} _get_drag_top_position
  * Get the new top position for the proxy based on the current position and the drag
  * event.  If the mouse is above the initial click point, we adjust top upwards so
  * that we can drag further up.  If it is below, we keep it the same.  In either case, we use the 
  * grid settings to snap into place
  * @param {Event} event
  * jQuery UI event object
  */ 
  _get_drag_top_position : function(event){
      var top = parseInt(this.proxy.css('top'));
      var element_top = this.element.offset().top

      // if we are above our initial position, we move top along with the event
      if(!this.get_position_from_start(event).y){
        top = parseInt(event.pageY);
      }
      if(top < element_top + this.options.padding.top){
        top = element_top + this.options.padding.top;
      }
      top = (Math.round((top - element_top) / this.options.grid[1]) * this.options.grid[1]) + element_top;
      return top;
  },
  /**
   * @function {protected jQuery.ui.drawable} _get_drag_left_position
   * Get the new left position for the proxy based on the current position and the drag event.  If 
   * the mouse is left of the initial click point, we adjust left along with the mouse so that a left
   * drag is possible.  We use the grid settings to snap into place
   * @param {Event} event
   * jQuery UI event object
   */
  _get_drag_left_position : function(event){
    var left = parseInt(this.proxy.css('left'));
    // if we are left of our initial position, we move the left along with the event
    if(!this.get_position_from_start(event).x){
      left = parseInt(event.pageX);
    }
    if(left < this.element.offset().left + this.options.padding.left){
      left = this.element.offset().left + this.options.padding.left;
    }
    // correct for grid
    left = (Math.floor((left - this.element.offset().left - this.options.padding.left) / this.options.grid[0]) 
      * this.options.grid[0]) + this.element.offset().left + this.options.padding.left;
    // correct for the border
    left += 1
    
    return left
  },
  /**
   * Determine if our proxy currently overlaps another element
   */
  overlaps : function(jquery_object){
    proxy_sides = $.extend(this.proxy.offset(),{
      bottom : this.proxy.offset().top + this.proxy.height(),
      right : this.proxy.offset().left + this.proxy.width()
    });
    object_sides = $.extend(jquery_object.offset(),{
      bottom : jquery_object.offset().top + jquery_object.height(),
      right : jquery_object.offset().left + jquery_object.width()
    })
    if(proxy_sides.right <= object_sides.left || proxy_sides.left >= object_sides.right){
      return false;
    }
    if(proxy_sides.top >= object_sides.bottom || proxy_sides.bottom <= object_sides.top){
      return false;
    }
    return true;
  },
  /**
   * @function {protected jQuery.ui.drawable} _mouseStop
   * Implementation of _mouseStop
   * @param {Event} event
   * jQuery UI event object
   */
  _mouseStop : function(event){
    this._trigger('drawn', event, {drawable:this,proxy:this.proxy});
    this.proxy.remove();
  },
  destroy : function(){
    this._mouseDestroy();
    if(this.proxy){
      this.proxy.remove();
    }
  }
}));

$.extend($.ui.drawable,{
  defaults : {
    distance : 1,
    delay : 0,
    padding : 0,
    grid : [1,1],
    allow_resize : function(){return true;}
  }
});

})(jQuery);
