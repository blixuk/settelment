/*:
 * @plugindesc Allows changing item prices mid-game via plugin command.
 * @author Feldherren
 *
 * @param Item Sell Price Dependent on Shop Price
 * @desc Sets whether the item sell price in shops is dependent on the shop value, or the database value
 * @default shop
 *
 * @param Item Sell Price Multiplier
 * @desc Default multiplier to use when calculating sell price.
 * @default 0.5
 *
 * @param Sell Price Multiplier Affects Explicitly Set Prices
 * @desc Whether the sell price multiplier affects explicitly set buy prices; true/false
 * @default false
 *
 * @param Item Buy Price Multiplier
 * @desc Default multiplier to use when calculating buy price.
 * @default 1.0
 *
 * @param Buy Price Multiplier Affects Explicitly Set Prices
 * @desc Whether the buy price multiplier affects explicitly set sell prices; true/false
 * @default false
 *
 * @help Item Price Control v1.4.2, by Feldherren (rpaliwoda AT googlemail.com)
 
Changelog:
1.4.2:	fixed bug where category sell multipliers weren't being applied; instead
		category buy multipliers were applied when trying to sell items.
1.4.1:	fixed bug where attempting to sell items would cause an error, and another
		issue where attempting to sell items with item price determined by shop
		price, when the item was not in the shop, would result in a price of 0
		being offered, and a related issue where selling price wasn't properly
		calculated for weapons and armour. Also fixed a bug where database buying 
		price wasn't getting the buying multiplier applied.
1.4.0:	can now set categories for items, weapons and armor via notebox tags,
		and apply a modifier for entire categories of items
1.3.2:	fixed issue where buying price was not changed for an item after 
		attempting to explicitly change buying price for it
1.3.1:	fixed issue where plugin commands referred to an entirely different 
		script
1.3.0:	changed how buying price was being determined, is now displayed properly 
		in shop item list
1.2.0:	can now set item buy price multipler via plugin parameter and command
1.1.0:	can now explicitly set item buy and sell prices
1.0.0:	initial commit
 
Allows you to set whether item selling price is calculated based on the 
database price, or the shop price; by default RPG Maker MV only has the 
selling price dependent on the database price, even if the shop has a 
custom price for the item in question.

Allows you to change the sell-price and buy-price multiplier 
from game start (as a plugin parameter), and mid-game (via plugin command).
Note:if you change the buying price multiplier, and have selling price 
determined by shop price (and not explicitly set for an item), this will 
affect selling price. For example, if you have a buying price multiplier
of 1.1, a selling price multiplier of 1.0, and the item price is set to
20, the item will both buy and sell for 22.

Allows you to outright set buy and sell prices (which overrides 
the above settings), and unset the same.

Allows you to set categories for items, weapons and armor, and set multipliers
to be applied to all bought or sold items with that category.

Note that all applicable multipliers are applied, not just one. For example, 
a general multiplier of 1.1 and a category multiplier of 1.1 effectively 
become a total multiplier of 1.21.

Notebox tags:
Items, Weapons and Armor:
<category:name>
<category:name,name>
Assigns a category to the item, weapon or armour. Multiple categories
can be separated via commas.

Plugin commands:
SETSELLPRICEDEPENDENCY [shop|database]
Changes whether the sell price is dependent on the shop value, or the 
database value, of an item.
SELLINGMULTIPLIER [float]
Changes the sell-price multiplier to the specified float. 
CATEGORYSELLINGMULTIPLIER [category] [float]
Changes the sell-price multiplier for the specified category to the 
specified float. 
SELLINGMULTIPLIERAFFECTSSETPRICES [true|false]
Sets whether the selling multiplier is applied to explicitly-set prices.
BUYINGMULTIPLIER [float]
Changes the buy-price multiplier to the specified float. 
CATEGORYBUYINGMULTIPLIER [category] [float]
Changes the sell-price multiplier for the specified category to the 
specified float. 
BUYINGMULTIPLIERAFFECTSSETPRICES [true|false]
Sets whether the buying multiplier is applied to explicitly-set prices.
SETSELLPRICE [item|weapon|armor] [id] [price]
Sets the selling price for the item/weapon/armor with the specified ID 
to the given price.
UNSETSELLPRICE [item|weapon|armor] [id]
Unsets a defined selling price for the item/weapon/armor with the 
specified ID.
SETBUYPRICE [item|weapon|armor] [id] [price]
Sets the buying price for the item/weapon/armor with the specified ID 
to the given price.
UNSETBUYPRICE [item|weapon|armor] [id]
Unsets a defined buying price for the item/weapon/armor with the 
specified ID.

Free for use with commercial projects, though I'd appreciate being
contacted if you do use it in any games, just to know.
 */ 
(function(){
	var parameters = PluginManager.parameters('FELD_ItemPriceControl');
	
	var shopSellPriceDependentOnShopBuyPrice = (parameters["Item Sell Price Dependent on Shop Price"] == 'shop');
	var generalSellMultiplier = parseFloat(parameters["Item Sell Price Multiplier"]);
	var generalBuyMultiplier = parseFloat(parameters["Item Buy Price Multiplier"]);
	var explicitSellPriceAffectedByMultiplier = (parameters["Sell Price Multiplier Affects Explicitly Set Prices"] == 'true');
	var explicitBuyPriceAffectedByMultiplier = (parameters["Buy Price Multiplier Affects Explicitly Set Prices"] == 'true');
	
	var categoryBuyMultipliers = new Object();
	var categorySellMultipliers = new Object();
	
	var itemBuyPrices = new Object();
	var weaponBuyPrices = new Object();
	var armorBuyPrices = new Object();
	
	var itemSellPrices = new Object();
	var weaponSellPrices = new Object();
	var armorSellPrices = new Object();
	
	var oldPrice = Window_ShopBuy.prototype.price;
	Window_ShopBuy.prototype.price = function(item) {
		var buyingPrice = oldPrice.call(this, item);
		// calculating buyMultiplier
		var buyMultiplier = generalBuyMultiplier;
		var categories = [];
		if (item.meta.category)
		{
			categories = item.meta.category.split(',');
		}
		for (i in categories)
		{
			if (categories[i] in categoryBuyMultipliers)
			{
				buyMultiplier = buyMultiplier * categoryBuyMultipliers[categories[i]];
			}
		}
		buyingPrice = buyingPrice * buyMultiplier;
		if (DataManager.isItem(item)/* && this._item.itypeId === 1*/) // item
		{
			if (item.id in itemBuyPrices)
			{
				buyingPrice = itemBuyPrices[item.id];
				if (explicitBuyPriceAffectedByMultiplier)
				{
					buyingPrice = buyingPrice * buyMultiplier;
				}
			}
		}
		else if (DataManager.isWeapon(item)) // weapon
		{
			if (item.id in weaponBuyPrices)
			{
				buyingPrice = weaponBuyPrices[this._item.id];
				if (explicitBuyPriceAffectedByMultiplier)
				{
					buyingPrice = buyingPrice * buyMultiplier;
				}
			}
		}
		else if (DataManager.isArmor(item)) // armor
		{
			if (item.id in armorBuyPrices)
			{
				buyingPrice = armorBuyPrices[item.id];
				if (explicitBuyPriceAffectedByMultiplier)
				{
					buyingPrice = buyingPrice * buyMultiplier;
				}
			}
		}
		return Math.floor(buyingPrice);
	};

	// new sellingPrice function
	var oldSellingPrice = Scene_Shop.prototype.sellingPrice;
	Scene_Shop.prototype.sellingPrice = function() {
		// calls the old method.
		var sellingPrice = oldSellingPrice.call(this);
		// calculating sellMultiplier
		var sellMultiplier = generalSellMultiplier;
		var categories = [];
		console.log(this._item); // good
		console.log(this._item.meta.category); // good
		if (this._item.meta.category)
		{
			categories = this._item.meta.category.split(',');
		}
		console.log(categories);
		for (i in categories)
		{
			console.log(i);
			if (categories[i] in categorySellMultipliers)
			{
				console.log(categorySellMultipliers[categories[i]]);
				sellMultiplier = sellMultiplier * categorySellMultipliers[categories[i]];
			}
		}
		console.log(categorySellMultipliers);		
		console.log(sellMultiplier);
		
		// this._buyWindow._shopGoods is an array of arrays
		// each array in the array is an item/weapon/armour in the shop
		// index 0 is item type: 0 for item, 1 for weapon, 2 for armour
		// index 1 is item ID within the category
		
		var itemType = null;
		if (DataManager.isItem(this._item)/* && this._item.itypeId === 1*/) // item
		{
			itemType = 0;
		}
		else if (DataManager.isWeapon(this._item)) // weapon
		{
			itemType = 1;
		}
		else if (DataManager.isArmor(this._item)) // armor
		{
			itemType = 2;
		}
		
		var itemInShop = false
		for (var i in this._buyWindow._shopGoods)
		{
			if (this._buyWindow._shopGoods[i][0] === itemType)
			{
				if (this._buyWindow._shopGoods[i][1] === this._item.id)
				{
					itemInShop = true;
					break;
				}
			}
		}
		
		// check that shopSellPriceDependentOnShopBuyPrice is true
		if (shopSellPriceDependentOnShopBuyPrice) // dependent on shop value
		{
			if (itemInShop)
			{
				// item is in shop, use shop price for calculating sell value
				sellingPrice = this._buyWindow.price(this._item) * sellMultiplier;
			}
			else
			{
				// item is not in shop, use database price for calculating sell value
				sellingPrice = this._item.price * sellMultiplier;
			}
		}
		else // dependent on database value
		{
			// selling prices are dependent on database value
			sellingPrice = this._item.price * sellMultiplier;
		}
		
		if (DataManager.isItem(this._item)/* && this._item.itypeId === 1*/) // item
		{
			if (this._item.id in itemSellPrices)
			{
				sellingPrice = itemSellPrices[this._item.id];
				if (explicitSellPriceAffectedByMultiplier)
				{
					sellingPrice = sellingPrice * sellMultiplier;
				}
			}
		}
		else if (DataManager.isWeapon(this._item)) // weapon
		{
			if (this._item.id in weaponSellPrices)
			{
				sellingPrice = weaponSellPrices[this._item.id];
				if (explicitSellPriceAffectedByMultiplier)
				{
					sellingPrice = sellingPrice * sellMultiplier;
				}
			}
		}
		else if (DataManager.isArmor(this._item)) // armor
		{
			if (this._item.id in armorSellPrices)
			{
				sellingPrice = armorSellPrices[this._item.id];
				if (explicitSellPriceAffectedByMultiplier)
				{
					sellingPrice = sellingPrice * sellMultiplier;
				}
			}
		}
		
		return Math.floor(sellingPrice);
	};

	var FELD_ItemPriceControl_aliasPluginCommand = Game_Interpreter.prototype.pluginCommand;

	Game_Interpreter.prototype.pluginCommand = function(command, args)
	{

		FELD_ItemPriceControl_aliasPluginCommand.call(this,command,args);
		if(command == "SETSELLPRICEDEPENDENCY" && args[0] != null)
		{
			if (args[0] == 'shop')
			{
				shopSellPriceDependentOnShopBuyPrice = true;
			}
			else
			{
				shopSellPriceDependentOnShopBuyPrice = false;
			}
		}
		else if(command == "SELLINGMULTIPLIER" && args[0] != null)
		{
			generalSellMultiplier = parseFloat(args[0]);
		}
		else if(command == "CATEGORYSELLINGMULTIPLIER" && args[0] != null && args[1] != null)
		{
			categorySellMultipliers[args[0]] = parseFloat(args[1]);
			// console.log("selling: ", args[0], args[1]);
			// console.log("selling: ", categorySellMultipliers);
		}
		else if(command == "SELLINGMULTIPLIERAFFECTSSETPRICES" && args[0] != null)
		{
			if (args[0] == 'true')
			{
				explicitSellPriceAffectedByMultiplier = true;
			}
			else
			{
				explicitSellPriceAffectedByMultiplier = false;
			}
		}
		else if(command == "BUYINGMULTIPLIER" && args[0] != null)
		{
			generalBuyMultiplier = parseFloat(args[0]);
		}
		else if(command == "CATEGORYBUYINGMULTIPLIER" && args[0] != null && args[1] != null)
		{
			categoryBuyMultipliers[args[0]] = parseFloat(args[1]);
			// console.log("buying: ", args[0], args[1]);
			// console.log("buying: ", categoryBuyMultipliers);
		}
		else if(command == "BUYINGMULTIPLIERAFFECTSSETPRICES" && args[0] != null)
		{
			if (args[0] == 'true')
			{
				explicitBuyPriceAffectedByMultiplier = true;
			}
			else
			{
				explicitBuyPriceAffectedByMultiplier = false;
			}
		}
		else if(command == "SETSELLPRICE" && args[0] != null && args[1] != null && args[2] != null)
		{
			if (args[0] == 'item')
			{
				itemSellPrices[parseInt(args[1])] = parseInt(args[2]);
			}
			else if (args[0] == 'weapon')
			{
				weaponSellPrices[parseInt(args[1])] = parseInt(args[2]);
			}
			else if (args[0] == 'armor')
			{
				armorSellPrices[parseInt(args[1])] = parseInt(args[2]);
			}
		}
		else if(command == "SETBUYPRICE" && args[0] != null && args[1] != null && args[2] != null)
		{
			if (args[0] == 'item')
			{
				itemBuyPrices[parseInt(args[1])] = parseInt(args[2]);
			}
			else if (args[0] == 'weapon')
			{
				weaponBuyPrices[parseInt(args[1])] = parseInt(args[2]);
			}
			else if (args[0] == 'armor')
			{
				armorBuyPrices[parseInt(args[1])] = parseInt(args[2]);
			}
		}
		else if(command == "UNSETSELLPRICE" && args[0] != null && args[1] != null)
		{
			if (args[0] == 'item')
			{
				delete itemSellPrices[parseInt(args[1])];
			}
			else if (args[0] == 'weapon')
			{
				delete weaponSellPrices[parseInt(args[1])];
			}
			else if (args[0] == 'armor')
			{
				delete armorSellPrices[parseInt(args[1])];
			}
		}
		else if(command == "UNSETBUYPRICE" && args[0] != null && args[1] != null)
		{
			if (args[0] == 'item')
			{
				delete itemBuyPrices[parseInt(args[1])];
			}
			else if (args[0] == 'weapon')
			{
				delete weaponBuyPrices[parseInt(args[1])];
			}
			else if (args[0] == 'armor')
			{
				delete armorBuyPrices[parseInt(args[1])];
			}
		}
	}
})();