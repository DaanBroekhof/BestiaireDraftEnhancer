function addScript(scriptUrl)
{
	var s = document.createElement('script');
	s.type = "text/javascript";
	s.src = scriptUrl;
	s.async = 0;
	s.onload = function() {
	    this.parentNode.removeChild(this);
	};
	(document.head||document.documentElement).appendChild(s);
}

function addScriptBody(scriptBody)
{
	var s = document.createElement('script');
	s.type = "text/javascript";
	s.innerHTML = scriptBody;
	s.async = 0;
	s.onload = function() {
	    this.parentNode.removeChild(this);
	};
	(document.head||document.documentElement).appendChild(s);
}

var body = "var manaImages = []; manaImages['x'] = '"+ chrome.extension.getURL('icons/xmana-16.png') +"';"; 
for (var i = 0; i < 7; i++)
	body += "manaImages['"+ i +"'] = '"+ chrome.extension.getURL('icons/'+i+'mana-16.png') +"';";

addScriptBody(body);

addScript(chrome.extension.getURL('js/jquery/jquery.min.js'));
addScript(chrome.extension.getURL('js/bestiary-deck.js'));