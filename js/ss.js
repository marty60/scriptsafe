// Credits and ideas: NotScripts, AdBlock Plus for Chrome, Ghostery, KB SSL Enforcer
var savedBeforeloadEvents = new Array();
var timer;
var iframe = 0;
// initialize settings object with default settings (that are overwritten by the actual user-set values later on)
var SETTINGS = {
	"MODE": "block",
	"LISTSTATUS": 'false',
	"DOMAINSTATUS": '-1',
	"WHITELIST": '',
	"BLACKLIST": '',
	"WHITELISTSESSION": '',
	"BLACKLISTSESSION": '',
	"SCRIPT": true,
	"NOSCRIPT": true,
	"OBJECT": true,
	"APPLET": true,
	"EMBED": true,
	"IFRAME": true,
	"FRAME": true,
	"AUDIO": true,
	"VIDEO": true,
	"IMAGE": false,
	"ANNOYANCES": false,
	"ANNOYANCESMODE": "relaxed",
	"ANTISOCIAL": false,
	"PRESERVESAMEDOMAIN": false,
	"WEBBUGS": true,
	"LINKTARGET": "off",
	"EXPERIMENTAL": "0",
	"REFERRER": true
};
const reStartWProtocol = /^[^\.\/:]+:\/\//i; // credit: NotScripts
function block(event) {
	var el = event.target;
	var elSrc = getElSrc(el);
	if (!elSrc) return;
	var elType = el.nodeName.toUpperCase();
	elSrc = elSrc.toLowerCase();
	var thirdPartyCheck;
	var elementStatusCheck;
	var domainCheckStatus;
	var absoluteUrl = relativeToAbsoluteUrl(elSrc);
	var elWidth = $(el).attr('width');
	var elHeight = $(el).attr('height');
	var elStyle = $(el).attr('style');
	var baddiesCheck = baddies(absoluteUrl, localStorage['annoyancesmode'], localStorage['antisocial']);
	if (SETTINGS['DOMAINSTATUS'] == '1') {
		elementStatusCheck = true;
		thirdPartyCheck = true;
		domainCheckStatus = '1';
	} else {
		domainCheckStatus = domainCheck(absoluteUrl, 1);
		if (domainCheckStatus == '0') thirdPartyCheck = false;
		else thirdPartyCheck = thirdParty(absoluteUrl);
		if ((domainCheckStatus != '0' && (domainCheckStatus == '1' || (domainCheckStatus == '-1' && SETTINGS['MODE'] == 'block'))) || ((SETTINGS['ANNOYANCES'] == 'true' && (SETTINGS['ANNOYANCESMODE'] == 'strict' || (SETTINGS['ANNOYANCESMODE'] == 'relaxed' && domainCheckStatus != '0'))) && baddiesCheck == '1') || (SETTINGS['ANTISOCIAL'] == 'true' && baddiesCheck == '2'))
			elementStatusCheck = true;
		else elementStatusCheck = false;
	}
	if (elSrc.substr(0,17) != 'chrome-extension:' && (elType == "A" || elType == "IFRAME" || elType == "FRAME" || (elType == "SCRIPT" && SETTINGS['EXPERIMENTAL'] == '0') || elType == "EMBED" || elType == "OBJECT" || elType == "IMG") && elementStatusCheck && (
		(
			(
				(
					(elType == "IFRAME" && SETTINGS['IFRAME'] == 'true')
					|| (elType == "FRAME" && SETTINGS['FRAME'] == 'true')
					|| (elType == "EMBED" && SETTINGS['EMBED'] == 'true')
					|| (elType == "OBJECT" && SETTINGS['OBJECT'] == 'true')
					|| (elType == "SCRIPT" && SETTINGS['SCRIPT'] == 'true' && SETTINGS['EXPERIMENTAL'] == '0')
					|| (elType == "VIDEO" && SETTINGS['VIDEO'] == 'true')
					|| (elType == "AUDIO" && SETTINGS['AUDIO'] == 'true')
					|| (elType == "IMG" && SETTINGS['IMAGE'] == 'true')
					|| (elType == "A" && SETTINGS['REFERRER'] == 'true')
				)
				&& (
					(SETTINGS['PRESERVESAMEDOMAIN'] == 'true' && (thirdPartyCheck || domainCheckStatus == '1' || baddiesCheck))
					|| SETTINGS['PRESERVESAMEDOMAIN'] == 'false'
				)
				
			)
		)
		|| (
			SETTINGS['WEBBUGS'] == 'true'
			&& (elType == "IMG" || elType == "IFRAME" ||  elType == "FRAME" || elType == "EMBED" || elType == "OBJECT")
			&& (thirdPartyCheck || domainCheckStatus == '1' || baddiesCheck)
			&& (
				(typeof elWidth !== 'undefined' && elWidth <= 5 && typeof elHeight !== 'undefined' && elHeight <= 5)
				|| (typeof elStyle !== 'undefined' && elStyle.match(/(.*?;\s*|^\s*?)(height|width)\s*?:\s*?[0-5]\D.*?;\s*(height|width)\s*?:\s*?[0-5]\D/i))
			)
		)
		|| (
			SETTINGS['REFERRER'] == 'true' && elType == "A" && (thirdPartyCheck || domainCheckStatus == '1' || baddiesCheck)
	))) {
			if (SETTINGS['REFERRER'] == 'true' && elType == "A" && (thirdPartyCheck || domainCheckStatus == '1' || baddiesCheck)) {
				$(el).attr("rel","noreferrer");
			} else {
				event.preventDefault();
				if (SETTINGS['WEBBUGS'] == 'true' && (thirdPartyCheck || domainCheckStatus == '1' || baddiesCheck) && (elType == "IFRAME" || elType == "FRAME" || elType == "EMBED" || elType == "OBJECT" || elType == "IMG") && ((typeof elWidth !== 'undefined' && elWidth <= 5 && typeof elHeight !== 'undefined' && elHeight <= 5) || (typeof elStyle !== 'undefined' && elStyle.match(/(.*?;\s*|^\s*?)(height|width)\s*?:\s*?[0-5]\D.*?;\s*(height|width)\s*?:\s*?[0-5]\D/i)))) {
					elType = "WEBBUG";
				}
				chrome.extension.sendRequest({reqtype: "update-blocked", src: absoluteUrl, node: elType});
				$(el).remove();
			}
		} else {
			if (SETTINGS['EXPERIMENTAL'] == '0' && elSrc.substr(0,11) != 'javascript:' && elSrc.substr(0,17) != 'chrome-extension:' && (elType == "IFRAME" || elType == "FRAME" || elType == "EMBED" || elType == "OBJECT" || elType == "SCRIPT")) {
				chrome.extension.sendRequest({reqtype: "update-allowed", src: absoluteUrl, node: elType});
			}
		}
}
function postLoadCheck(el) {
	var elSrc = getElSrc(el);
	if (!elSrc) return false;
	elSrc = elSrc.toLowerCase();
	var thirdPartyCheck;
	var domainCheckStatus;
	var absoluteUrl = relativeToAbsoluteUrl(elSrc);
	if (SETTINGS['DOMAINSTATUS'] == '1') {
		domainCheckStatus = '1';
		thirdPartyCheck = true;
	} else {
		domainCheckStatus = domainCheck(absoluteUrl, 1);
		if (domainCheckStatus == '0') thirdPartyCheck = false;
		else thirdPartyCheck = thirdParty(absoluteUrl);
	}
	if (elSrc.substr(0,17) != 'chrome-extension:' && elementStatus(absoluteUrl, SETTINGS['MODE']) && (((SETTINGS['PRESERVESAMEDOMAIN'] == 'true' && (thirdPartyCheck || domainCheckStatus == '1')) || SETTINGS['PRESERVESAMEDOMAIN'] == 'false')))
		return true;
	return false;
}
function fallbackRemover(tag) {
	var elements = document.getElementsByTagName(tag);
	for (var i = 0; i < elements.length; i++) {
		var elSrc = getElSrc(elements[i]);
		if (elSrc) {
			elSrc = elSrc.toLowerCase();
			var domainCheckStatus;
			var thirdPartyCheck;
			var absoluteUrl = relativeToAbsoluteUrl(elSrc);
			if (SETTINGS['DOMAINSTATUS'] == '1') {
				domainCheckStatus = '1';
				thirdPartyCheck = true;
			} else {
				domainCheckStatus = domainCheck(absoluteUrl, 1);
				if (domainCheckStatus == '0') thirdPartyCheck = false;
				else thirdPartyCheck = thirdParty(absoluteUrl);
			}
			if (elementStatus(absoluteUrl, SETTINGS['MODE']) && ((SETTINGS['PRESERVESAMEDOMAIN'] == 'true' && (thirdPartyCheck || domainCheckStatus == '1')) || SETTINGS['PRESERVESAMEDOMAIN'] == 'false')) {
				if (elements[i].src) elements[i].src = "";
				if (elements[i].parentNode) elements[i].parentNode.removeChild(elements[i]);
				chrome.extension.sendRequest({reqtype: "update-blocked", src: elSrc, node: tag});
			} else {
				chrome.extension.sendRequest({reqtype: "update-allowed", src: elSrc, node: tag});
			}
		}
	}
}
function domainCheck(domain, req) {
	if (!domain) return '-1';
	if (req === undefined) {
		var baddiesCheck = baddies(domain, SETTINGS['ANNOYANCESMODE'], SETTINGS['ANTISOCIAL']);
		if ((SETTINGS['ANNOYANCES'] == 'true' && SETTINGS['ANNOYANCESMODE'] == 'strict' && baddiesCheck == '1') || (SETTINGS['ANTISOCIAL'] == 'true' && baddiesCheck == '2')) return '1';
	}
	var domainname = extractDomainFromURL(domain);
	if (req != '2') {
		if (SETTINGS['MODE'] == 'block' && in_array(domainname, SETTINGS['WHITELISTSESSION'])) return '0';
		if (SETTINGS['MODE'] == 'allow' && in_array(domainname, SETTINGS['BLACKLISTSESSION'])) return '1';
	}
	if (in_array(domainname, SETTINGS['WHITELIST'])) return '0';
	if (in_array(domainname, SETTINGS['BLACKLIST'])) return '1';
	if (req === undefined) {
		if (SETTINGS['ANNOYANCES'] == 'true' && SETTINGS['ANNOYANCESMODE'] == 'relaxed' && baddiesCheck) return '1';
	}
	return '-1';
}
function blockreferrer() {
	$("a[rel!='noreferrer']").each(function() {
		var elSrc = getElSrc(this);
		if (elSrc) {
			elSrc = elSrc.toLowerCase();
			var domainCheckStatus;
			var thirdPartyCheck;
			var absoluteUrl = relativeToAbsoluteUrl(elSrc);
			if (SETTINGS['DOMAINSTATUS'] == '1') {
				domainCheckStatus = '1';
				thirdPartyCheck = true;
			} else {
				domainCheckStatus = domainCheck(absoluteUrl, 1);
				if (domainCheckStatus == '0') thirdPartyCheck = false;
				else thirdPartyCheck = thirdParty(absoluteUrl);
			}
			if (thirdPartyCheck && domainCheckStatus != '0') {
				$(this).attr("rel","noreferrer");
			}
		}
	});
}
function ScriptSafe() {
	if (SETTINGS['LINKTARGET'] != 'off') {
		var linktrgt;
		if (SETTINGS['LINKTARGET'] == 'same') linktrgt = '_self';
		else if (SETTINGS['LINKTARGET'] == 'new') linktrgt = '_blank';
		$("a").attr("target", linktrgt);
	}
	if (SETTINGS['NOSCRIPT'] == 'true') {
		$("noscript").each(function() { chrome.extension.sendRequest({reqtype: "update-blocked", src: $(this).html(), node: 'NOSCRIPT'}); $(this).hide(); }); // hiding instead of removing as removing seems to periodically crash tabs. Not a huge loss as the listener script should filter any inserted content (e.g. iframes, webbugs).
	}
	if (SETTINGS['APPLET'] == 'true') $("applet").each(function() { var elSrc = getElSrc(this); if (elSrc) { elSrc = elSrc.toLowerCase(); if (postLoadCheck(this)) { chrome.extension.sendRequest({reqtype: "update-blocked", src: elSrc, node: 'APPLET'}); $(this).remove(); } else { chrome.extension.sendRequest({reqtype: "update-allowed", src: elSrc, node: 'APPLET'}); } } });
	if (SETTINGS['VIDEO'] == 'true') fallbackRemover("VIDEO"); // jquery can't select and beforeload doesn't catch video/audio tags :(
	if (SETTINGS['AUDIO'] == 'true') fallbackRemover("AUDIO"); // ^
	if (SETTINGS['SCRIPT'] == 'true' && SETTINGS['EXPERIMENTAL'] == '0') {
		clearUnloads();
		$("script").each(function() { var elSrc = getElSrc(this); if (elSrc) { elSrc = elSrc.toLowerCase(); if (postLoadCheck(this)) { chrome.extension.sendRequest({reqtype: "update-blocked", src: elSrc, node: 'SCRIPT'}); $(this).remove(); } else { if (elSrc.substr(0,11) != 'javascript:' && elSrc.substr(0,17) != 'chrome-extension:') { chrome.extension.sendRequest({reqtype: "update-allowed", src: elSrc, node: "SCRIPT"}); } } } });
		if ((SETTINGS['PRESERVESAMEDOMAIN'] == 'false' || (SETTINGS['PRESERVESAMEDOMAIN'] == 'true' && SETTINGS['DOMAINSTATUS'] == '1'))) {
			$("a[href^='javascript']").attr("href","javascript:;");
			$("[onClick]").removeAttr("onClick");
			$("[onAbort]").removeAttr("onAbort");
			$("[onBlur]").removeAttr("onBlur");
			$("[onChange]").removeAttr("onChange");
			$("[onDblClick]").removeAttr("onDblClick");
			$("[onDragDrop]").removeAttr("onDragDrop");
			$("[onError]").removeAttr("onError");
			$("[onFocus]").removeAttr("onFocus");
			$("[onKeyDown]").removeAttr("onKeyDown");
			$("[onKeyPress]").removeAttr("onKeyPress");
			$("[onKeyUp]").removeAttr("onKeyUp");
			$("[onLoad]").removeAttr("onLoad");
			$("[onMouseDown]").removeAttr("onMouseDown");
			$("[onMouseMove]").removeAttr("onMouseMove");
			$("[onMouseOut]").removeAttr("onMouseOut");
			$("[onMouseOver]").removeAttr("onMouseOver");
			$("[onMouseUp]").removeAttr("onMouseUp");
			$("[onMove]").removeAttr("onMove");
			$("[onReset]").removeAttr("onReset");
			$("[onResize]").removeAttr("onResize");
			$("[onSelect]").removeAttr("onSelect");
			$("[onSubmit]").removeAttr("onSubmit");
			$("[onUnload]").removeAttr("onUnload");
		}
	}
}
function loaded() {
	$('body').unbind('DOMNodeInserted.ScriptSafe');
	$('body').bind('DOMNodeInserted.ScriptSafe', block);
	if (SETTINGS['LISTSTATUS'] == 'true') {
		ScriptSafe();
	}
}
function getElSrc(el) {
	switch (el.nodeName.toUpperCase()) {
		case 'OBJECT': // credit: NotScripts
			if (el.codeBase) codeBase = el.codeBase;	
			if (el.data) {
				if (reStartWProtocol.test(el.data)) return el.data;
				else return codeBase;				
			}
			var plist = el.getElementsByTagName('param');
			for (var i=0; i < plist.length; i++) {
				var paramName = plist[i].name.toLowerCase();
				if (paramName === 'movie' || paramName === 'src' || paramName === 'codebase' || paramName === 'data')
					return plist[i].value;
				else if (paramName === 'code' || paramName === 'url')
					return plist[i].value;
			}
			return window.location.href;
			break;
		case 'EMBED': // credit: NotScripts
			var codeBase = window.location.href;
			if (el.codeBase) codeBase = el.codeBase;
			if (el.src)	{
				if (reStartWProtocol.test(el.src)) return el.src;
				else return codeBase;
			}
			if (el.data) {
				if (reStartWProtocol.test(el.data)) return el.data;
				else return codeBase;				
			}
			if (el.code) {
				if (reStartWProtocol.test(el.code)) return el.code;
				else return codeBase;			
			}
			return window.location.href;
			break;
		case 'APPLET':
			return el.code;
			break;
		case 'A':
			return el.href;
			break;
		case 'PARAM':
			return el.value;
			break;
		default:
			return el.src;
			break;
	}
}
function injectAnon(f) { // credit: NotScripts - eventually phase out
    var script = document.createElement("script");
	script.type = "text/javascript";
    script.textContent = "(" + f + ")();";
    document.documentElement.appendChild(script);
}
function mitigate() { // credit: NotScripts - eventually phase out
	injectAnon(function(){
		for (var i in window) {
			try {
				var jsType = typeof window[i];
				switch (jsType.toUpperCase()) {					
					case "FUNCTION": 
						if (window[i] !== window.location) {
							if (window[i] === window.open || (window.showModelessDialog && window[i] === window.showModelessDialog))
								window[i] = function(){return true;};
							else if (window[i] === window.onbeforeunload)
								window.onbeforeunload = null;
							else if (window[i] === window.onunload)
								window.onunload = null;								
							else
								window[i] = function(){return "";};
						}
						break;							
				}			
			} catch(err) {}		
		}
		for (var i in document) {
			try {
				var jsType = typeof document[i];
				switch (jsType.toUpperCase()) {					
					case "FUNCTION":
						document[i] = function(){return "";};
						break;					
				}			
			} catch(err) {}		
		}
		try {
			eval = function(){return "";};				
			unescape = function(){return "";};
			String = function(){return "";};
			parseInt = function(){return "";};
			parseFloat = function(){return "";};
			Number = function(){return "";};
			isNaN = function(){return "";};
			isFinite = function(){return "";};
			escape = function(){return "";};
			encodeURIComponent = function(){return "";};
			encodeURI = function(){return "";};
			decodeURIComponent = function(){return "";};
			decodeURI = function(){return "";};
			Array = function(){return "";};
			Boolean = function(){return "";};
			Date = function(){return "";};
			Math = function(){return "";};
			Number = function(){return "";};
			RegExp = function(){return "";};
			var oNav = navigator;
			navigator = function(){return "";};
			oNav = null;			
		} catch(err) {}
	});
}
function clearUnloads() { // credit: NotScripts
	clearTimeout(timer);
	var keepGoing = (window.onbeforeunload || window.onunload);
	window.onbeforeunload = null;
	window.onunload = null;
	if (keepGoing) timer = setTimeout("clearUnloads()", 5000);
}
function saveBeforeloadEvent(e) {
	savedBeforeloadEvents.push(e);
}
document.addEventListener("beforeload", saveBeforeloadEvent, true);
if (window.self != window.top) iframe = 1;
chrome.extension.sendRequest({reqtype: "get-settings", iframe: iframe}, function(response) {
    document.removeEventListener("beforeload", saveBeforeloadEvent, true);
	if (typeof response === 'object' && response.status == 'true') {
		SETTINGS['MODE'] = response.mode;
		SETTINGS['ANNOYANCES'] = response.annoyances;
		SETTINGS['ANNOYANCESMODE'] = response.annoyancesmode;
		SETTINGS['ANTISOCIAL'] = response.antisocial;
		SETTINGS['WHITELIST'] = response.whitelist;
		SETTINGS['BLACKLIST'] = response.blacklist;	
		SETTINGS['WHITELISTSESSION'] = response.whitelistSession;
		SETTINGS['BLACKLISTSESSION'] = response.blackListSession;
		SETTINGS['SCRIPT'] = response.script;
		SETTINGS['PRESERVESAMEDOMAIN'] = response.preservesamedomain;
		SETTINGS['EXPERIMENTAL'] = response.experimental;
		SETTINGS['DOMAINSTATUS'] = domainCheck(window.location.href, 1);
		if (SETTINGS['EXPERIMENTAL'] == '0' && (((SETTINGS['PRESERVESAMEDOMAIN'] == 'false' || (SETTINGS['PRESERVESAMEDOMAIN'] == 'true' && SETTINGS['DOMAINSTATUS'] == '1')) && response.enable == 'true' && SETTINGS['SCRIPT'] == 'true' && SETTINGS['DOMAINSTATUS'] != '0') || ((SETTINGS['ANNOYANCES'] == 'true' && (SETTINGS['ANNOYANCESMODE'] == 'strict' || (SETTINGS['ANNOYANCESMODE'] == 'relaxed' && SETTINGS['DOMAINSTATUS'] != '0')) && baddies(window.location.hostname, SETTINGS['ANNOYANCESMODE'], SETTINGS['ANTISOCIAL']) == '1') || (SETTINGS['ANTISOCIAL'] == 'true' && baddies(window.location.hostname, SETTINGS['ANNOYANCESMODE'], SETTINGS['ANTISOCIAL']) == '2'))))
			mitigate();
		SETTINGS['LISTSTATUS'] = response.enable;
		SETTINGS['NOSCRIPT'] = response.noscript;
		SETTINGS['OBJECT'] = response.object;
		SETTINGS['APPLET'] = response.applet;
		SETTINGS['EMBED'] = response.embed;
		SETTINGS['IFRAME'] = response.iframe;
		SETTINGS['FRAME'] = response.frame;
		SETTINGS['AUDIO'] = response.audio;
		SETTINGS['VIDEO'] = response.video;
		SETTINGS['IMAGE'] = response.image;
		SETTINGS['WEBBUGS'] = response.webbugs;
		SETTINGS['LINKTARGET'] = response.linktarget;
		SETTINGS['REFERRER'] = response.referrer;
		document.addEventListener("beforeload", block, true);
		for (var i = 0; i < savedBeforeloadEvents.length; i++)
			block(savedBeforeloadEvents[i]);
	}
	delete savedBeforeloadEvents;
});
