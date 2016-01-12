

var prefs = ['webkit-slider-runnable', 'moz-range'];
var styles = []; 
    

var getTrackStyleStr = function(el, j, className) {
  var str = '', 
      min = el.min || 0, 
      perc =  100 * el.value / el.max,
      val = perc + '% 100%';

  for(var i = 0; i < prefs.length; i++) {
    str +=  className + '::-' + prefs[i] + '-track{background-size:' + val + '} ';
  }
  return str;
};

var setDragStyleStr = function(evt) {
  
  var trackStyle = getTrackStyleStr(evt.target, this.index + 1, this.type);  
  styles[this.index].textContent = trackStyle;
};

var initSliderStyles = function(className, self) {
        
        var selectors = Polymer.dom(self.root).querySelectorAll(className)

        for(var i = 0; i < selectors.length; i++) {
          
          var style = document.createElement('style');
          Polymer.dom(self.root).appendChild(style);
          styles.push(style); 
          var b = {}
          b.index =  i;
          b.type = className;
          selectors[i].addEventListener('seekbarchange', setDragStyleStr.bind(b), false);
        }
};
