

var prefs = ['webkit-slider-runnable', 'moz-range'];
var styles = []; 
    

var getTrackStyleStr = function(el, j, className) {
  var str = '', 
      min = el.min || 0, 
      perc = (el.max) ? (100*(el.value - min)/(el.max - min)) : el.value, 
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

var initSliderStyles = function(className) {
        
        var selectors = document.querySelectorAll(className);

        for(var i = 0; i < selectors.length; i++) {
          
          var style = document.createElement('style');
          document.body.appendChild(style);
          styles.push(style); 

          var b = {}
          b.index =  i;
          b.type = className;
          selectors[i].addEventListener('change', setDragStyleStr.bind(b), false);
        }
};
