/* To avoid CSS expressions while still supporting IE 7 and IE 6, use this script */
/* The script tag referencing this file must be placed before the ending body tag. */

/* Use conditional comments in order to target IE 7 and older:
	<!--[if lt IE 8]><!-->
	<script src="ie7/ie7.js"></script>
	<!--<![endif]-->
*/

(function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon-video\'">' + entity + '</span>' + html;
	}
	var icons = {
		'icon-play3': '&#xe907;',
		'icon-pause2': '&#xe908;',
		'icon-stop2': '&#xe909;',
		'icon-backward2': '&#xe90a;',
		'icon-forward3': '&#xe90b;',
		'icon-first': '&#xe90c;',
		'icon-last': '&#xe90d;',
		'icon-previous2': '&#xe90e;',
		'icon-next2': '&#xe90f;',
		'icon-eject': '&#xe910;',
		'icon-volume-high': '&#xe911;',
		'icon-volume-medium': '&#xe912;',
		'icon-volume-low': '&#xe913;',
		'icon-volume-mute': '&#xe914;',
		'icon-volume-mute2': '&#xe915;',
		'icon-volume-increase': '&#xe916;',
		'icon-volume-decrease': '&#xe917;',
		'0': 0
		},
		els = document.getElementsByTagName('*'),
		i, c, el;
	for (i = 0; ; i += 1) {
		el = els[i];
		if(!el) {
			break;
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
}());
