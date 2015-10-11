var setData = {count: 0};
var imageNameMapping = {'-generic-' : {}};
var dataPath = 'http://mtgjson.com/json/';

var colorTypeToColor = {
	'W' : 'White',
	'B' : 'Black',
	'G' : 'Green',
	'R' : 'Red',
	'U' : 'Blue',
}
var cards = {};
var maxId = 0;
var maxExtraLandId = 1000;
var basicLands = {};
var sortedCards = [];
var unsaved = false;
if (!manaImages) {
	var manaImages = {
		'X' : 'icons/xmana-16.png',
		'0' : 'icons/0mana-16.png',
		'1' : 'icons/1mana-16.png',
		'2' : 'icons/2mana-16.png',
		'3' : 'icons/3mana-16.png',
		'4' : 'icons/4mana-16.png',
		'5' : 'icons/5mana-16.png',
		'6' : 'icons/6mana-16.png',
	};
}

$(document).ready(function() {
 	if (document.location.href.indexOf('/ranking') != -1)
 		initCardData('ranking', cardSetCheck);
 	else 
 		initCardData('deckbuilding', buildNewDeckBuilderView);
});


function initCardData(type, onFinish) {
	var usedSets = [];

	if (type == 'deckbuilding')
	{
		$('p.titre:eq(0)').each(function(index, title) {
			var setsText = $(title).text().match(/\([^\)]+\)/);
			if (!setsText)
				return;
			var sets = setsText[0].replace('(','').replace(')','').split('-');
			$.each(sets, function(index, set){
				var mtgSet = bestiarySetToMtgFunc(set);
				if ($.inArray(mtgSet, usedSets) == -1)
					usedSets.push(mtgSet);
			})
		});
	
		$('td.ligne01 div').each(function(index, card) {
			var id = card.id;
	
			cards[id] = {};
			cards[id].id = id;
			cards[id].oldCardDiv = $(card);
			cards[id].inDeck = $(this).children('input').val() == '1';
			cards[id].genericLand = false;
			splitCardImageData(cards[id], $(card).find('img').attr('src'));
	
			// 'Fix' incorrect Bestiairy positions
			var pos = parseInt(card.style.marginTop);
			if (cards[id].inDeck && pos < 985)
				card.style.marginTop = 985;
			else if (!cards[id].inDeck && pos > 985)
				card.style.marginTop = 0;
	
			maxId = Math.max(maxId, id);
	
			if ($.inArray(cards[id].set, usedSets) == -1 && !cards[id].genericLand)
				usedSets.push(cards[id].set);
		});
		
		
	}
	
	if (type == 'ranking')
	{
		$('td.ligne00 a[class="hoverZoomLink"]').each(function(index, link) {
			var id = maxId++;
	
			cards[id] = {};
			cards[id].id = id;
			splitCardImageData(cards[id], $(link).attr('href'));
	
			if ($.inArray(cards[id].set, usedSets) == -1 && !cards[id].genericLand)
				usedSets.push(cards[id].set);	
		});
	}

	loadSets(usedSets, function() {
		$.each(cards, function (id, card) {
			if (typeof card === "undefined")
				return;

			if (card.genericLand)
			{
				card.info = basicLands[card.genericLand];
			}
			else if (card.set && imageNameMapping[card.set] &&  card.imageName.toLowerCase() in imageNameMapping[card.set])
			{
				card.info = imageNameMapping[card.set][card.imageName.toLowerCase()];
			}
			else if (card.imageName.toLowerCase() in imageNameMapping['-generic-'])
			{
				card.info = imageNameMapping['-generic-'][card.imageName.toLowerCase()];
			}
			else
			{
				console.log(['Not found...', card.imageName, card]);
			}

			sortedCards.push(card);
		});
		
		sortCards();

		if (onFinish)
			onFinish();
	});
}

var wizardsImageSetNames = {
	'alpha': 'LEA',
	'beta': 'LEB',
	'unlimited': '2ED',
	'an': 'ARN',
	'antiquities': 'ATQ',
	'revised': '3ED',
	'legends': 'LEG',
	'dark': 'DRK',
	'fe': 'FEM',
	'4e': '4ED',
	'ia': 'ICE',
	'chronicles': 'CHR',
	'homelands': 'HML',
	'alliances': 'ALL',
	'mirage': 'MIR',
	'visions': 'VIS',
	'5e': '5ED',
	'vanguard': 'VAN',
	'portal': 'POR',
	'weatherlight': 'WTH',
	'tempest': 'TMP',
	'stronghold': 'STH',
	'portal2': 'PO2',
	'exodus': 'EXO',
	'uz': 'USG',
	'ul': 'ULG',
	'6e': '6ED',
	'p3k': 'PTK',
	'ud': 'UDS',
	'mm': 'MMQ',
	'nemesis': 'NMS',
	'prophecy': 'PCY',
	'invasion': 'INV',
	'planeshift': 'PLS',
	'7e': '7ED',
	'apocalypse': 'APC',
	'odyssey': 'ODY',
	'torment': 'TOR',
	'judgement': 'JUD',
	'onslaught': 'ONS',
	'legions': 'LGN',
	'scourge': 'SCG',
	'8e': '8ED',
	'mirrodin': 'MRD',
	'darksteel': 'DST',
	'fd': '5DN',
	'chk': 'CHK',
	'bok': 'BOK',
	'sok': 'SOK',
	'9e': '9ED',
	'ravnica': 'RAV',
	'guildpact': 'GPT',
	'dissention': 'DIS',
	'coldsnap': 'CSP',
	'tsp': 'TSP',
	'plc': 'PLC',
	'fut': 'FUT',
	'10e': '10E',
	'lrw': 'LRW',
	'mor': 'MOR',
	/* Hosted via 'general' wizards dir
	'mor': 'SHM',
	'mor': 'EVE',
	'mor': 'ME2',
	'mor': 'ALA',
	'mor': 'CON',
	'mor': 'ARB',
	'mor': 'M10',
	'mor': 'HOP',
	'mor': 'ME3',
	'mor': 'ZEN',
	'mor': 'WWK',
	'mor': 'ROE',
	'mor': 'ARC',
	'mor': 'M11',
	'mor': 'SOM',
	'mor': 'MBS',
	'mor': 'NPH',
	*/

	'unglued': 'UGL',
	'unhinged': 'UNH',
};

function splitCardImageData(card, src)
{
	var data = src.split('/');
	
	card.imageSrc = src;
	card.bestiarySet = data[1].toUpperCase();
	card.set = bestiarySetToMtgFunc(card.bestiarySet);
	card.imageName = data[2].replace('.jpg', '');
	card.genericLand = false;

	// Generic image source
	if (data[2] == 'www.wizards.com')
	{
		if (data[6] in wizardsImageSetNames)
			card.set = wizardsImageSetNames[data[6]];
		else
			card.set = '-generic-';
		card.imageName = data[7].replace('.jpg', '');
		card.imageName = card.imageName.replace(/-/g, '_');
		// Fix some wrong images SRCs
		card.imageName = card.imageName.replace(/_$/, '');
		card.imageName = card.imageName.replace('’', '');
		card.imageName = card.imageName.replace(/Pendrell_Val$/, 'Pendrell_Vale');
	}
	// Some normalizing for better matching
	card.imageName = card.imageName.replace(/_+/g, '_').replace('Æ', 'AE');
	// Any non-standard... remove it.
	card.imageName = card.imageName.replace(/[^a-zA-Z0-9_]/g, '');

	return card;
}

function mtgjsoncallback(data, set)
{
	// Fallback, if jQuery borks
	loadSetData(data, set);
}

var setLoader = {loadedSets: 0, callback: null};
function loadSets(sets, callback, notAsync){
	if ($.inArray('TSP', sets) != -1)
		sets.push('TSB');

	setLoader.loadedSets = sets.length;
	setLoader.callback = callback;
	
	if (sets.indexOf('-generic-') != -1)
	{
		sets = ['-generic-'];
		setLoader.loadedSets = 1;
	}

	for(var i=0; i < sets.length; i++)
	{
		if (setData[sets[i]])
		{
			loadedSets--;
			continue;
		}

		var url = dataPath + (sets[i] == 'CON' ? '_CON' : sets[i]) +'.jsonp';
		
		if (sets[i] == '-generic-')
			 url = dataPath + 'AllSets.jsonp';
		
	    $.ajax({
	        'async': !notAsync,
	        'url': url,
	        'dataType': 'jsonp',
	        'jsonp': false,
	        'scriptCharset': 'utf-8', 
	        'contentType': 'application/json; charset=utf-8',
	        'cache': false,
	    });
	}
}

function loadSetData(data, setProvided) {
	var loadedSetNames = [];
	
	if (!('code' in data))
	{
		for (var setCode in data) 
		{
			setData[setCode] = data[setCode];
			setData.count++;
			loadedSetNames.push(setCode);
		}
	}
	else
	{
		setData[data.code] = data;
		setData.count++;
		
		loadedSetNames = [data.code];
	}

	$.each(loadedSetNames, function (x, set) {
		if (imageNameMapping[set])
			return;
		
		imageNameMapping[set] = {};
    	$.each(setData[set].cards, function (i, cardInfo) {
    		var imageName = cardInfo.name;
    		if ('names' in cardInfo)
    		{
    			if (cardInfo.layout == 'double-faced' || cardInfo.layout == 'flip')
    				imageName = cardInfo.names[0];
    			//else if (set == 'PLC')
    			//	imageName = cardInfo.names.join('_');
    			else if (cardInfo.names.length > 3)
    				imageName = cardInfo.names.join('');
    			else
    				imageName = cardInfo.names.join('_');
    		}
    		if (set == '5DN')
    			imageName = imageName.replace('-', '');
    		//if (set == '4ED')
    		//	imageName = imageName.replace('-', '_');
    		imageName = imageName.replace(/\s+|\-|_+/g, '_');
    		//imageName = imageName.replace('Æ', 'AE').replace(/[àáâãäå]/g, 'a').replace(/[ûú]/g, 'u').replace(/[ö]/g, 'o').replace(/[í]/g, 'i').replace(/[é]/g, 'e');
    		imageName = removeDiacritics(imageName); 
    		imageName = imageName.replace(/[^a-zA-Z0-9_]/g, '');
    		imageName = imageName.toLowerCase();
    		
    		imageNameMapping[set][imageName] = cardInfo;
    		imageNameMapping['-generic-'][imageName] = cardInfo;
    		if (set == 'TSB')
    			imageNameMapping['TSP'][imageName] = cardInfo;

			if ('supertypes' in cardInfo && cardInfo.supertypes[0] == 'Basic' && 'subtypes' in cardInfo)
			{
				basicLands[cardInfo.subtypes[0]] = cardInfo;
				cardInfo.set = set;
			}
    	});
	});

	setLoader.loadedSets--;

	if (setLoader.loadedSets == 0)
	{
		setLoader.callback();
	}
}



var colorOrder = {
	'White' : 0,
	'Blue' : 1,
	'Black' : 2,
	'Red' : 3,
	'Green' : 4,
};
var cmcColorOrder = {
	'W' : 0,
	'U' : 1,
	'B' : 2,
	'R' : 3,
	'G' : 4,
};
function getCardOrder(card)
{
	if (!('info' in card))
		return;
	
	var cardOrder = 0;
	if ('colors' in card.info && card.info.colors.length == 1)
		cardOrder = colorOrder[card.info.colors[0]]; // Colored
	else if ('colors' in card.info && card.info.colors.length > 1)
		cardOrder = 5; // Multicolor
	else if ($.inArray('Land', card.info.types) != -1)
	{
		cardOrder = 6; // Land
		if (card.info.rarity != "Basic Land")
			cardOrder += 0.5;
	}
	else if ('manaCost' in card.info)
	{
		// See if there is a single-color in the casting cost, none, or multiple
		var cmcColors = card.info.manaCost.match(/[WBUGR]/gi);
		if (cmcColors == null || cmcColors.length == 0)
			cardOrder = 8; // Colorless
		else if (cmcColors.length == 1)
			cardOrder = cmcColorOrder[cmcColors[0]]; // Colored
		else
			cardOrder = 5; // Multicolor
	}
	else if (card.info.type != 'Conspiracy')
		cardOrder = 7; // Colorless
	else
		cardOrder = 8; // Conspiracy
	
	if ('cmc' in card.info)
		cardOrder += card.info.cmc / 100;

	return cardOrder;
}
function sortCards()
{
	sortedCards.sort(function (a, b) {
		var aCardOrder = getCardOrder(a);
		var bCardOrder = getCardOrder(b);

		return (aCardOrder - bCardOrder) == 0 ? a.info.name.localeCompare(b.info.name) : (aCardOrder - bCardOrder);
	});
}

var columnColorOrder = {
	'Black' : 0,
	'Red' : 1,
	'White' : 2,
	'Blue' : 3,
	'Green' : 4,
};
var columnCmcColorOrder = {
	'B' : 0,
	'R' : 1,
	'W' : 2,
	'U' : 3,
	'G' : 4,
};
function getColorColumn(card)
{
	var col = 0;
	if ('colors' in card.info && card.info.colors.length == 1)
		col = columnColorOrder[card.info.colors[0]];
	else if ('colors' in card.info && card.info.colors.length > 1)
		col = 6;
	else if ($.inArray('Land', card.info.types) !== -1)
		col = 7;
	else if ('manaCost' in card.info)
	{
		// See if there is a single-color in the casting cost, none, or multiple
		var cmcColors = card.info.manaCost.match(/[WBUGR]/gi);
		if (cmcColors == null || cmcColors.length == 0)
			col = 5;
		else if (cmcColors.length == 1)
			col = columnCmcColorOrder[cmcColors[0]];
		else
			col = 6;
	}
	else
	{
		col = 6; // Rest is considered 'multicolor', but should not really occur.
	}
	return col;
}

var bestiarySetToMtg = {

	// -------- Modern Masters --------
	'MOM' : 'MMA',
	// -------- Shards of Alara Block Magic --------
	'REB' : 'ARB',
	'CFX' : 'CON',
	// -------- Lorwyn Block Magic --------
	'LOR' : 'LRW',
	// -------- Time Spiral Block Magic --------
	'PC' : 'PLC',
	// -------- Coldsnap Block Magic --------
	'CS' : 'CSP',
	// -------- Ravnica Block Magic--------
	'GP' : 'GPT',
	// -------- Magic Edition --------
	'9E' : '9ED',
	// -------- Mirrodin Block Magic --------
	'FD' : '5DN',
	'DS' : 'DST',
	'MR' : 'MRD',
	// -------- Magic Edition --------
	'8E' : '8ED',
	// -------- Onslaught Block Magic --------
	'SC' : 'SCG',
	'LE' : 'LGN',
	'ON' : 'ONS',
	// -------- Odyssey Block Magic --------
	'JU' : 'JUD',
	'TO' : 'TOR',
	'OD' : 'ODY',
	// -------- Magic Edition --------
	'7E' : '7ED',
	// -------- Invasion Block Magic --------
	'AP' : 'APC',
	'PS' : 'PLS',
	'IN' : 'INV',
	// -------- Masquerade Block Magic --------
	'PY' : 'PCY',
	'NE' : 'NMS',
	'MM' : 'MMQ',
	// -------- Magic Edition --------
	'6E' : '6ED',
	// -------- Artifacts  Block Magic --------
	'UD' : 'UDS',
	'UL' : 'ULG',
	'US' : 'USG',
	// -------- Rajh Block Magic --------
	'EX' : 'EXO',
	'ST' : 'STH',
	'TP' : 'TMP',
	// -------- Magic Edition --------
	'5E' : '5ED',
	// -------- Mirage Block Magic --------
	'WE' : 'WTH',
	'VI' : 'VIS',
	'MI' : 'MIR',
	// -------- Ice Age Block Magic --------
	'AL' : 'ALL',
	'HL' : 'HML',
	'IA' : 'ICE',
	// -------- Magic Edition --------
	'4E' : '4ED',
	// -------- Early Sets --------
	'FE' : 'FEM',
	'DK' : 'DRK',
	'LG' : 'LEG',
	'R' : '3ED',
	'AQ' : 'ATQ',
	'AN' : 'ARN',
	'U' : '2ED',
	'B' : 'LEB',
	'A' : 'LEA',
	// -------- Others --------
	'UHN' : 'UNH',
	'UG' : 'UGL',
	'CH' : 'CHR',
	
};

var bestiarySetNonSet = {
	// -------- Special --------
	'CUB' : '-generic-',
	'CU2' : '-generic-',
};

function bestiarySetToMtgFunc(set)
{
	if (bestiarySetNonSet[set.toUpperCase()])
		return '-generic-';
	
	return bestiarySetToMtg[set.toUpperCase()] ? bestiarySetToMtg[set.toUpperCase()] : set;
}

function cardSetCheck()
{
	if (console)
	{
		console.log(sortedCards.length +' matched cards');
	}
}

function buildNewDeckBuilderView()
{
	// Hide original table
	$('table:eq(2)').addClass('hidden');
	// Hide lands table
	$('table:eq(3)').addClass('hidden');
	// Hide submit button
	$('input[type=submit]').addClass('hidden');
	// Add style sheet
	addCss();
	//$('head').append('<link rel=stylesheet type="text/css" href="'+ cssPath +'css/additional.css" />');

	// Trim top whitespace
	//$('center:eq(0)').hide();
	$('form[action="https://www.paypal.com/cgi-bin/webscr"]').css({position: 'absolute', right: '10px', top: '10px'});
	$('center:eq(0) + br').hide();
	$('p.infos:eq(1)').hide();
	$('p.infos:eq(1) + br, p.infos:eq(1) + br + br').hide();
	$('p.titre + br').hide();
	$('p#export').hide();

	$('p.titre').append(' - <a href="index.php" class="titre">Menu</a>');

	$('p.titre + br + p.infos').hide();

	// Make new table
	var newTable = $('<table class="new-deckbuilder small"></table>');
	newTable.append($('<tr><td colspan="9" class="titre">Build Deck Nouveau</td></tr>'));
	$.each(['pool', 'deck'], function(index, type) {
		newTable.append($('<tr class="'+type+' color-header"><td class="titre" 	width="50">Color</td><td class="titre"><img src="images/logonoir.gif" title="Black" alt="Black"><span class="col-count"></span></td><td class="titre"><img src="images/logorouge.gif" title="Red" alt="Red"><span class="col-count"></span></td><td class="titre"><img src="images/logoblanc.gif" title="White" alt="White"><span class="col-count"></span></td><td class="titre"><img src="images/logobleu.gif" title="Blue" alt="Blue"><span class="col-count"></span></td><td class="titre"><img src="images/logovert.gif" title="Green" alt="Green"><span class="col-count"></span></td><td class="titre"><img src="images/logoarto.gif" title="" alt=""><span class="col-count"></span></td><td class="titre"><img src="images/logomulti.gif" title="" alt=""><span class="col-count"></span></td><td class="titre"><img src="images/logoland.gif" title="" alt=""><span class="col-count"></span></td></tr>'));
		newTable.append($('<tr class="'+type+' cmc-header"><td class="titre" width="50">CMC</td><td class="titre"><img src="'+ manaImages['0'] +'"><span class="col-count"></span></td><td class="titre"><img src="'+ manaImages['1'] +'"><span class="col-count"></span></td><td class="titre"><img src="'+ manaImages['2'] +'"><span class="col-count"></span></td><td class="titre"><img src="'+ manaImages['3'] +'"><span class="col-count"></span></td><td class="titre"><img src="'+ manaImages['4'] +'"><span class="col-count"></span></td><td class="titre"><img src="'+ manaImages['5'] +'"><span class="col-count"></span></td><td class="titre"><img src="'+ manaImages['6'] +'"><img src="'+ manaImages['x'] +'"><span class="col-count"></span></td><td class="titre"><img src="images/logoland.gif" title="" alt=""><span class="col-count"></span></td></tr>'));
		newTable.append($('<tr class="'+type+' cards"><td class="titre info">'+ type +'<br><span class="count-total">17</span><br><br>C: <span class="count-total-creatures">13</span><br>O: <span class="count-total-spells">10</span><br>L: <span class="count-total-lands">17</span><br><br> <span class="split">Split</span></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01 lands"><table class="land-split"><tr><td class="land-swamp"><img src="images/logonoir.gif"></td><td class="land-mountain"><img src="images/logorouge.gif"></td><td class="land-plains"><img src="images/logoblanc.gif"></td><td class="land-island"><img src="images/logobleu.gif"></td><td class="land-forest"><img src="images/logovert.gif"></td><td><img src="images/logoland.gif"></td></tr><tr><td class="land-swamp">0</td><td class="land-mountain">0</td><td class="land-plains">0</td><td class="land-island">0</td><td class="land-forest">0</td><td>0</td></tr></table></td></tr>'))
		newTable.append($('<tr class="'+type+' cards spells"><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td><td class="ligne01"></td></tr>'))
	});
	$('table:eq(2)').after(newTable);
	// Add deck-specific actions
	$('table tr.deck.cards td.info').append('<br><br><input type="button" value="Save" class="save-deck" disabled="disabled"><span class="export"><br><br>Export:<br><a href="output_txt.php?type=app" class="export-apprentice" target="_blank">Appr</a><br><a href="output_txt.php?type=mws" class="export-mws" target="_blank">MWS</a></span>');
	// Add 'ajax submit button' fixer
	$('form[action="build.php"]').append('<input type="hidden" value="Save your deck" name="Valid" name="hidden-submit">');

	// Fill Pool Cards
	$.each(sortedCards, function (index, card) {
		if (!card.info)
			return;

		var cardDiv = $('<div class="card"></div>').append($('<img>').attr('src', card.imageSrc));
		cardDiv.data('card', card);
		card.newCardDiv = cardDiv;
	});

	setCardsView('pool', 'color');
	setCardsView('deck', 'cmc');

	$('.pool.color-header td, .pool.cmc-header td').click(function(event){
		event.preventDefault();
		setCardsView(
			'pool',
			$('tr.pool.cmc-header').is(":visible") ? 'color' : 'cmc',
			$('tr.pool.cards.spells').is(":visible")
		);
	});
	$('.deck.color-header td, .deck.cmc-header td').click(function(event){
		event.preventDefault();
		setCardsView(
			'deck',
			$('tr.deck.cmc-header').is(":visible") ? 'color' : 'cmc',
			$('tr.deck.cards.spells').is(":visible")
		);
	});

	$('.cards').on('click', 'div.card', function(event) {
		var card = $(this).data('card');
		if (card)
		{
			card.inDeck = !card.inDeck;
			setCardsView('pool', $('tr.pool.cmc-header').is(":visible") ? 'cmc' : 'color', $('tr.pool.cards.spells').is(":visible"));
			setCardsView('deck', $('tr.deck.cmc-header').is(":visible") ? 'cmc' : 'color', $('tr.deck.cards.spells').is(":visible"));
			// Keep track old style
			if (card.oldCardDiv)
				Switch(card.id);

			unsaved = true;
			$('input.save-deck').removeAttr('disabled');
			$('.export').hide();
		}
	});

	$('.pool.cards td.titre span.split').click(function(event) {
		event.preventDefault();
		setCardsView(
			'pool',
			$('tr.pool.cmc-header').is(":visible") ? 'cmc' : 'color',
			!$('tr.pool.cards.spells').is(":visible")
		);
		return false;
	});
	$('.deck.cards td.titre span.split').click(function(event) {
		event.preventDefault();
		setCardsView(
			'deck',
			$('tr.deck.cmc-header').is(":visible") ? 'cmc' : 'color',
			!$('tr.deck.cards.spells').is(":visible")
		);
		return false;
	});

	$('table.land-split td').click(function(event){
		var addLandCard = null;
		if ($(this).hasClass('land-swamp'))
			addLandCard = basicLands['Swamp'];
		else if ($(this).hasClass('land-mountain'))
			addLandCard = basicLands['Mountain'];
		else if ($(this).hasClass('land-plains'))
			addLandCard = basicLands['Plains'];
		else if ($(this).hasClass('land-island'))
			addLandCard = basicLands['Island'];
		else if ($(this).hasClass('land-forest'))
			addLandCard = basicLands['Forest'];

		if (addLandCard)
		{
			var cardDiv = $('<div class="card"></div>').append($('<img>').attr('src', 'images/'+ addLandCard.set.toLowerCase() +'/'+ addLandCard.name +'.jpg'));

			maxExtraLandId++;
			var id = maxExtraLandId;

			cards[id] = {};
			cards[id].id = id;
			cards[id].oldCardDiv = null;
			cards[id].imageSrc = cardDiv.find('img').attr('src');
			cards[id].bestiarySet = addLandCard.set;
			cards[id].set = bestiarySetToMtgFunc(addLandCard.set);
			cards[id].imageName = addLandCard.name;
			cards[id].colorType = 'L';
			cards[id].inDeck = $(this).parents('.deck').length > 0;

			cards[id].newCardDiv = cardDiv;
			cards[id].info = addLandCard;

			cardDiv.data('card', cards[id]);

			sortedCards.push(cards[id]);

			sortCards();

			setCardsView('pool', $('tr.pool.cmc-header').is(":visible") ? 'cmc' : 'color', $('tr.pool.cards.spells').is(":visible"));
			setCardsView('deck', $('tr.deck.cmc-header').is(":visible") ? 'cmc' : 'color', $('tr.deck.cards.spells').is(":visible"));

			unsaved = true;
			$('input.save-deck').removeAttr('disabled');
			$('.export').hide();
		}
	});

	$('input.save-deck').click(function() {
		// Add any unsaved deck lands
		$.each(cards, function (key, card) {
			if (card.inDeck && !card.oldCardDiv)
			{
				if (card.info == basicLands.Swamp)
					AddSwamp();
				else if (card.info == basicLands.Mountain)
					AddMountain();
				else if (card.info == basicLands.Plains)
					AddPlains();
				else if (card.info == basicLands.Island)
					AddIsland();
				else if (card.info == basicLands.Forest)
					AddForest();
			}
		});

		var form = $('form[action="build.php"]');
		//var submit = $('form[action="build.php"] input[type=submit]');
		//form.serializeArray().push({name: submit.attr('name'), vakue: submit.val()});
		var exportUrl = $(this).attr('href');
		$.ajax({
			type: 'POST',
			url: form.attr('action'),
			data: form.serialize(),
			success: function (data) {
				unsaved = false;
				$('input.save-deck').attr('disabled', 'disabled');
				$('.export').show();
				var newPage = $($.parseHTML(data));
				// Copy any new
				newPage.find('td.ligne01 div').each(function(index, card) {
					var id = card.id;
					var data = $(card).find('img').attr('src').split('/');

					// Already exists, ignore
					if (id in cards)
						return;

					// Copy new cards to current main HTML
					var genericLand = false;
					card = $(card);
					$('td.ligne01:eq(0)').append(card);
					if (data[2] == 'www.wizards.com' && data[3] == 'global')
					{
						genericLand = data[7].replace('.jpg', '');
					}
					console.log(genericLand);
					$.each(cards, function (oldCardId, oldCard) {
						if (!oldCard.oldCardDiv)
							console.log([oldCard.info, basicLands[genericLand], oldCard.info == basicLands[genericLand]]);
						if (!oldCard.oldCardDiv && oldCard.info == basicLands[genericLand])
						{
							console.log([oldCard.id, card, id]);
							oldCard.oldCardDiv = card;
							cards[card.id] = oldCard;
							delete cards[oldCard.id];
							oldCard.id = id;
							maxId = Math.max(maxId, id);

							return false;
						}
					});
				});

				document.getElementById('swamp').value = 0;
				document.getElementById('forest').value = 0;
				document.getElementById('plains').value = 0;
				document.getElementById('mountain').value = 0;
				document.getElementById('island').value = 0;

				setCardsView('pool', $('tr.pool.cmc-header').is(":visible") ? 'cmc' : 'color', $('tr.pool.cards.spells').is(":visible"));
				setCardsView('deck', $('tr.deck.cmc-header').is(":visible") ? 'cmc' : 'color', $('tr.deck.cards.spells').is(":visible"));
			},
		});
	});

	$('a.export-apprentice, a.export-mws').click(function() {
		var link = $(this);
		if (unsaved)
		{
			event.preventDefault();
			var exportUrl = $(this).attr('href');
			$('input.save-deck').click();
		}
	});
}

function setCardsView(type, view, split)
{
	var countCol = [0, 0, 0, 0, 0, 0, 0, 0];
	var countType = {
		'creatures' : 0,
		'lands' : 0,
		'spells' : 0,
	};
	var countLandType = {
		'Swamp' : 0,
		'Mountain' : 0,
		'Plains' : 0,
		'Island' : 0,
		'Forest' : 0,
		'Others' : 0,
	};

	if (split)
	{
		$('tr.'+type+'.cards').addClass('split');
		$('tr.'+type+'.cards td.titre').attr('rowspan', 2);
		$('tr.'+type+'.cards td.lands').attr('rowspan', 2);
	}
	else
	{
		$('tr.'+type+'.cards').removeClass('split');
		$('tr.'+type+'.cards td.titre').attr('rowspan', 1);
		$('tr.'+type+'.cards td.lands').attr('rowspan', 1);
	}

	$.each(sortedCards, function (index, card) {
		var col = 0;
		if (view == 'cmc')
		{
			$('tr.'+type+'.cmc-header').show();
			$('tr.'+type+'.color-header').hide();

			if (card.cmcOrder == undefined)
			{
				var cmc = card.info.cmc ? card.info.cmc : 0;
				if (cmc > 6)
					cmc = 6;
				if (!card.info || $.inArray('Land', card.info.types) !== -1)
					cmc = 7;
				card.cmcOrder = cmc;
			}
			col = card.cmcOrder;
		}
		else if (view == 'color')
		{
			$('tr.'+type+'.cmc-header').hide();
			$('tr.'+type+'.color-header').show();
			if (card.colorColumn == undefined)
				card.colorColumn = getColorColumn(card);
			col = card.colorColumn;
		}

		if ((type != 'pool') != (card.inDeck))
			return;

		var splitType = '';
		if ('types' in card.info && $.inArray('Creature', card.info.types) != -1)
		{
			countType.creatures++;
			splitType = '';
		}
		else if ('types' in card.info && $.inArray('Land', card.info.types) != -1)
		{
			countType.lands++;
			splitType = '';

			if ('supertypes' in card.info && card.info.supertypes[0] == 'Basic' && 'subtypes' in card.info && card.info.subtypes[0] in countLandType)
				countLandType[card.info.subtypes[0]]++;
			else
				countLandType['Others']++;
		}
		else
		{
			countType.spells++;
			splitType = '.spells';
		}

		if (!split)
			splitType = '';

		countCol[col]++;

		$($('tr.'+type+'.cards'+ splitType).children('td')[col + (splitType == '' ? 1 : 0)]).append(card.newCardDiv);
	});

	$('tr.'+type+'.cmc-header td span.col-count').each(function (index, td) {
		$(this).text(countCol[index]);
	});
	$('tr.'+type+'.color-header td span.col-count').each(function (index, td) {
		$(this).text(countCol[index]);
	});

	$('tr.'+type+' span.count-total-creatures').text(countType.creatures);
	$('tr.'+type+' span.count-total-spells').text(countType.spells);
	$('tr.'+type+' span.count-total-lands').text(countType.lands);
	$('tr.'+type+' span.count-total').text(countType.creatures + countType.lands + countType.spells);
	$('tr.'+type+' table.land-split tr:eq(1) td:eq(0)').text(countLandType.Swamp);
	$('tr.'+type+' table.land-split tr:eq(1) td:eq(1)').text(countLandType.Mountain);
	$('tr.'+type+' table.land-split tr:eq(1) td:eq(2)').text(countLandType.Plains);
	$('tr.'+type+' table.land-split tr:eq(1) td:eq(3)').text(countLandType.Island);
	$('tr.'+type+' table.land-split tr:eq(1) td:eq(4)').text(countLandType.Forest);
	$('tr.'+type+' table.land-split tr:eq(1) td:eq(5)').text(countLandType.Others);
}

function addCss()
{
	$('head').append('<style type="text/css">\
	table.hidden, input.hidden { visibility: hidden; height: 0; padding: 0; margin: 0; font-size: 0; }\
	table.hidden * { visibility: hidden; height: 0; padding: 0; margin: 0; font-size: 0; }\
	tr.hidden-row { visibility: hidden; height: 0px; padding: 0; xdisplay: block; }\
	tr.hidden-row td { padding: 0; height: 0 !important; overflow: hidden; line-height: 0; }\
	tr.cards div.card { display: block; height: 30px; margin: 0; padding: 0; }\
	tr.cards td { overflow: hidden; width: 203px; }\
	tr.cards td.info { width: 50px; }\
	tr.cards td:hover { overflow: visible; }\
	tr.cards div.card img { display: block; width: 203px; }\
	tr.cards div.card:hover img { position: relative; }\
	tr.cards td.titre { vertical-align: top; padding-top: 20px; }\
	tr.cards td.titre span.split:hover,	tr.color-header td.titre:hover,	tr.cmc-header td.titre:hover { cursor: pointer; }\
	tr.color-header td.titre:first-child,	tr.cmc-header td.titre:first-child { color: white; }\
	tr.color-header:hover td.titre:first-child,	tr.cmc-header:hover td.titre:first-child { color: red; }\
	tr.cards td.titre { text-transform: capitalize; }\
	tr.cards div.card { cursor: pointer; }\
	tr.cards td.titre span.split { color: white; }\
	tr.cards td.titre span.split:hover { color: red; }\
	tr.cards { height: 900px; }\
	tr.cards.split { height: 449px; }\
	tr.cards.spells { display: none; }\
	tr.cards.spells.split { display: table-row; }\
	table.small { width: auto; }\
	table.small tr.cards div.card { height: 21px; width: 170px; }\
	table.small tr.cards { height: 450px; }\
	table.small tr.cards.split { height: 224px; }\
	table.small tr.cards td { width: 170px; }\
	table.small tr.cards td.info { width: 50px; }\
	table.small tr.cards div.card img { width: 170px; }\
	td span.col-count { display: inline-block; padding-left: 5px; width: 15px; height: 15px; text-align: right; vertical-align: top; }\
	tr.cmc-header img { width: 15px; height: 15px; }\
	table.land-split { width: 100%; margin-bottom: 1px; border-collapse: collapse; }\
	table.land-split td { background-color: #990000; text-align: center; color: #FFBBBB; font-weight: bold; font-size: 13px; border: 2px solid #999999; cursor: pointer; }\
	</style>');
}

/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
 var defaultDiacriticsRemovalap = [
     {'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
     {'base':'AA','letters':'\uA732'},
     {'base':'AE','letters':'\u00C6\u01FC\u01E2'},
     {'base':'AO','letters':'\uA734'},
     {'base':'AU','letters':'\uA736'},
     {'base':'AV','letters':'\uA738\uA73A'},
     {'base':'AY','letters':'\uA73C'},
     {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
     {'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
     {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779'},
     {'base':'DZ','letters':'\u01F1\u01C4'},
     {'base':'Dz','letters':'\u01F2\u01C5'},
     {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
     {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
     {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
     {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
     {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
     {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
     {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
     {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
     {'base':'LJ','letters':'\u01C7'},
     {'base':'Lj','letters':'\u01C8'},
     {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
     {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
     {'base':'NJ','letters':'\u01CA'},
     {'base':'Nj','letters':'\u01CB'},
     {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
     {'base':'OI','letters':'\u01A2'},
     {'base':'OO','letters':'\uA74E'},
     {'base':'OU','letters':'\u0222'},
     {'base':'OE','letters':'\u008C\u0152'},
     {'base':'oe','letters':'\u009C\u0153'},
     {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
     {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
     {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
     {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
     {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
     {'base':'TZ','letters':'\uA728'},
     {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
     {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
     {'base':'VY','letters':'\uA760'},
     {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
     {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
     {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
     {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
     {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
     {'base':'aa','letters':'\uA733'},
     {'base':'ae','letters':'\u00E6\u01FD\u01E3'},
     {'base':'ao','letters':'\uA735'},
     {'base':'au','letters':'\uA737'},
     {'base':'av','letters':'\uA739\uA73B'},
     {'base':'ay','letters':'\uA73D'},
     {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
     {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
     {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
     {'base':'dz','letters':'\u01F3\u01C6'},
     {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
     {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
     {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
     {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
     {'base':'hv','letters':'\u0195'},
     {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
     {'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
     {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
     {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
     {'base':'lj','letters':'\u01C9'},
     {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
     {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
     {'base':'nj','letters':'\u01CC'},
     {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
     {'base':'oi','letters':'\u01A3'},
     {'base':'ou','letters':'\u0223'},
     {'base':'oo','letters':'\uA74F'},
     {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
     {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
     {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
     {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
     {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
     {'base':'tz','letters':'\uA729'},
     {'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
     {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
     {'base':'vy','letters':'\uA761'},
     {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
     {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
     {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
     {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
 ];

 var diacriticsMap = {};
 for (var i=0; i < defaultDiacriticsRemovalap.length; i++){
     var letters = defaultDiacriticsRemovalap[i].letters;
     for (var j=0; j < letters.length ; j++){
         diacriticsMap[letters[j]] = defaultDiacriticsRemovalap[i].base;
     }
 }

 // "what?" version ... http://jsperf.com/diacritics/12
 function removeDiacritics (str) {
     return str.replace(/[^\u0000-\u007E]/g, function(a){ 
        return diacriticsMap[a] || a; 
     });
 }