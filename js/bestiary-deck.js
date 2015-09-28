var setData = {count: 0};
var imageNameMapping = {'-generic-' : {}};
var dataPath = 'http://mtgjson.com/json/';
var dataProxyPath = 'http://yarr.me/mtg-json-p/';

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

$(document).ready(function() {
	//checkBestiarySets();
	initCardData(buildNewDeckBuilderView);
});


function initCardData(onFinish) {
	var usedSets = [];

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
		var data = $(card).find('img').attr('src').split('/');

		cards[id] = {};
		cards[id].id = id;
		cards[id].oldCardDiv = $(card);
		cards[id].imageSrc = $(card).find('img').attr('src');
		cards[id].bestiarySet = data[1].toUpperCase();
		cards[id].set = bestiarySetToMtgFunc(cards[id].bestiarySet);
		cards[id].imageName = data[2].replace('.jpg', '');
		cards[id].colorType = cards[id].oldCardDiv.attr('title');
		cards[id].inDeck = $(this).children('input').val() == '1';
		cards[id].genericLand = false;

		var pos = parseInt(card.style.marginTop);

		// 'Fix' incorrect Bestiairy positions
		if (cards[id].inDeck && pos < 985)
			card.style.marginTop = 985;
		else if (!cards[id].inDeck && pos > 985)
			card.style.marginTop = 0;

		// Generic image source
		if (data[2] == 'www.wizards.com')
		{
			cards[id].set = '-generic-';
			cards[id].imageName = data[7].replace('.jpg', '');
			cards[id].imageName = cards[id].imageName.replace(/-/g, '_');
			// Fix some wrong images SRCs
			cards[id].imageName = cards[id].imageName.replace(/_$/, '');
			cards[id].imageName = cards[id].imageName.replace('’', '');
			cards[id].imageName = cards[id].imageName.replace(/Pendrell_Val$/, 'Pendrell_Vale');
		}
		// Some normalizing for better matching
		cards[id].imageName = cards[id].imageName.replace(/__/g, '_').replace('Æ', 'AE');

		maxId = Math.max(maxId, id);

		if ($.inArray(cards[id].set, usedSets) == -1 && !cards[id].genericLand)
			usedSets.push(cards[id].set);
	});

	loadSets(usedSets, function() {
		$.each(cards, function (id, card) {
			if (typeof card === "undefined")
				return;

			if (card.genericLand)
			{
				card.info = basicLands[card.genericLand];
			}
			else if (card.set && card.imageName.toLowerCase() in imageNameMapping[card.set])
			{
				card.info = imageNameMapping[card.set][card.imageName.toLowerCase()];
			}
			else if (card.imageName.toLowerCase() in imageNameMapping['-generic-'])
			{
				card.info = imageNameMapping['-generic-'][card.imageName.toLowerCase()];
			}
			else
			{
				console.log(['Not found...', card.imageName]);
			}

			sortedCards.push(card);
		});


		sortCards();

		if (onFinish)
			onFinish();
	});
}

function loadSets(sets, callback, notAsync){
	if ($.inArray('TSP', sets) != -1)
		sets.push('TSB');

	var loadedSets = sets.length;

	for(var i=0; i < sets.length; i++)
	{
		if (setData[sets[i]] || sets[i] == '-generic-')
		{
			loadedSets--;
			continue;
		}

		var url = dataPath + (sets[i] == 'CON' ? '_CON' : sets[i]) +'.jsonp';
	    $.ajax({
	        'async': !notAsync,
	        'url': url,
	        'dataType': 'jsonp',
	        'jsonp': true,
	        'jsonpCallback': 'mtgjsoncallback',
	        'contentType': 'application/json; charset=utf-8',
	        'cache': false,
	        'success': function (data) {
	        	var set = data.code;
	            setData[set] = data;
            	setData.count++;
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
            		imageName = imageName.replace(/\s+|\-/g, '_');
            		imageName = imageName.replace('\u00C6', 'AE').replace('á', 'a').replace('û', 'u').replace('ö', 'o').replace('â', 'a').replace('ú', 'u').replace('í', 'i');
            		imageName = imageName.replace(/[^a-zA-Z0-9_é\"\-\!\.]/g, '');
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

            	loadedSets--;

            	if (loadedSets == 0)
 	            {
 	            	callback();
 	            }
	        }
	    });
	}
}



var colorOrder = {
	'White' : 0,
	'Blue' : 1,
	'Black' : 2,
	'Red' : 3,
	'Green' : 4,
};
function getCardOrder(card)
{
	var cardOrder = 0;
	if ('colors' in card.info && card.info.colors.length == 1)
		cardOrder = colorOrder[card.info.colors[0]];
	else if ('colors' in card.info && card.info.colors.length > 1)
		cardOrder = 5;
	else if ($.inArray('Land', card.info.types) == -1)
		cardOrder = 6;
	else if (card.info.type != 'Conspiracy')
		cardOrder = 7;
	else
		cardOrder = 8;

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
function getColorColumn(card)
{
	var col = 0;
	if ('colors' in card.info && card.info.colors.length == 1)
		col = columnColorOrder[card.info.colors[0]];
	else if ('colors' in card.info && card.info.colors.length > 1)
		col = 6;
	else if ($.inArray('Land', card.info.types) !== -1)
		col = 7;
	else if ($.inArray('Artifact', card.info.types) !== -1)
		col = 5;
	else
		col = 6; // Rest is 'multicolor'
	return col;
}

var bestiarySetToMtg = {

	// -------- Modern Masters --------
	'MoM' : 'MMA',
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
	// -------- Special --------
	/*'CUB' : 'CUB',
	'CU2' : 'CU2',
	'BR' : 'BR',
	'BD' : 'BD',
	'P4' : 'P4',
	'P3' : 'P3',
	'P2' : 'P2',
	'PT' : 'PT',*/
};

function bestiarySetToMtgFunc(set)
{
	return bestiarySetToMtg[set] ? bestiarySetToMtg[set] : set;
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


function checkBestiarySets()
{
	var i = 0;
	$.each(bestiarySetToMtg, function (bstSet, set){
		loadSets([set], function() {
			$.get(dataProxyPath +'/BestiaryData/get-bestiary-ranking.php?setRanking='+bstSet, function(data) {
				var found = 0;
				var notFound = 0;
				$('tr td.ligne00 a', $(data)).each(function(index, cardLink) {
					var data = $(cardLink).attr('href').split('/');
					var imageName = '';
					if (data[0] == 'images')
					{
						imageName = data[2].replace('.jpg', '');
					}
					else if (data[2] == 'www.wizards.com')
					{
						imageName = data[7].replace('.jpg', '');
						imageName = imageName.replace(/-/g, '_');
						// Fix some wrong images SRCs
						imageName = imageName.replace(/_$/, '');
						imageName = imageName.replace('’', '');
						imageName = imageName.replace(/Pendrell_Val$/, 'Pendrell_Vale');
					}
					else if (data[0].match(/^graph_/))
					{
						return;
					}
					else
					{
						console.log([set, 'Not recognized: '+  $(cardLink).attr('href'), data, $(cardLink).attr('href')]);
						return false;
					}

					// Some normalizing for better matching
					imageName = imageName.replace(/__/g, '_').replace('Æ', 'AE');

					if (imageNameMapping[set][imageName.toLowerCase()] == undefined) {
						console.log([set, 'Not found: '+  imageName, data, $(cardLink).attr('href')]);
						notFound++;
						//return false;
					}
					else {
						//console.log('Found: '+ imageName);
						found++;
					}
				});
				console.log([set, 'Found', found, 'Not Found', notFound]);
			});
		}, true);
	});
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

