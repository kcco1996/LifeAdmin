/* =========================
   Life Admin — features-meals.js
   Meal Planning feature
   ========================= */

(() => {
  "use strict";

  const DAY_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const MEAL_ORDER = ["breakfast", "lunch", "dinner", "dessert"];

  const PRESETS = {
americanWeek: {
americanWeekone: {
  label: "American Week Set A",
  days: {
    Monday:    { breakfast: "Bacon egg and cheese bagel", lunch: "BBQ brisket sandwich", dinner: "American beef burger", dessert: "Brownies" },
    Tuesday:   { breakfast: "Breakfast hash", lunch: "Buffalo chicken sandwich", dinner: "Mac and cheese", dessert: "Apple pie" },
    Wednesday: { breakfast: "Cinnamon French toast", lunch: "Meatball sub", dinner: "BBQ ribs", dessert: "New York cheesecake" },
    Thursday:  { breakfast: "Breakfast burrito", lunch: "Philly cheesesteak wrap", dinner: "Chicken jambalaya", dessert: "Peach cobbler" },
    Friday:    { breakfast: "Hash brown casserole", lunch: "Chili cheese fries", dinner: "Sloppy joes", dessert: "Ghirardelli brownies" },
    Saturday:  { breakfast: "Farmhouse breakfast", lunch: "Fried chicken sandwich", dinner: "Nashville hot chicken", dessert: "Banana split" },
    Sunday:    { breakfast: "Pancake stack", lunch: "Sonoran style nachos", dinner: "BBQ chicken", dessert: "Key lime pie" },
  }
},

americanWeektwo: {
  label: "American Week Set B",
  days: {
    Monday:    { breakfast: "Biscuits and gravy", lunch: "Pulled pork sandwich", dinner: "Tennessee bbq pulled pork", dessert: "Cherry pie" },
    Tuesday:   { breakfast: "Breakfast tacos", lunch: "Green chile cheeseburger", dinner: "Beef chili", dessert: "Boston cream pie" },
    Wednesday: { breakfast: "Green Chile omelette", lunch: "Country fried steak sandwich", dinner: "Chicken fried steak", dessert: "Red velvet cake" },
    Thursday:  { breakfast: "Omelette supreme", lunch: "Classic hot dog", dinner: "Chili cheese dog", dessert: "Black and white cookies" },
    Friday:    { breakfast: "Hash brown stack", lunch: "Hot beef sandwich", dinner: "Prime rib", dessert: "Pecan pie with whipped cream" },
    Saturday:  { breakfast: "Breakfast enchiladas", lunch: "Loaded baked potato", dinner: "Beef burrito", dessert: "Blueberry cobbler" },
    Sunday:    { breakfast: "Chorizo and egg skillet", lunch: "Loaded burrito bowl", dinner: "California burrito", dessert: "Dr pepper cake" },
  }
},

americanWeekthree: {
  label: "American Week Set C",
  days: {
    Monday:    { breakfast: "Breakfast burrito", lunch: "BBQ pulled pork roll", dinner: "Memphis bbq ribs", dessert: "Coca Cola cake" },
    Tuesday:   { breakfast: "Cinnamon French toast", lunch: "Chicken and waffles", dinner: "Fried chicken", dessert: "Gooey butter cake" },
    Wednesday: { breakfast: "Bacon egg and cheese bagel", lunch: "Reuben sandwich", dinner: "Philly cheesesteak", dessert: "Kentucky Derby pie" },
    Thursday:  { breakfast: "Farmhouse breakfast", lunch: "Cheese and bacon loaded wedges", dinner: "Hot brown", dessert: "Bourbon balls" },
    Friday:    { breakfast: "Breakfast hash", lunch: "BBQ wings", dinner: "Stuffed crust meat feast pizza", dessert: "Jack Daniel’s whiskey cake" },
    Saturday:  { breakfast: "Pancake stack", lunch: "Buffalo chicken wings", dinner: "Chicken pot pie", dessert: "Fried peach pie" },
    Sunday:    { breakfast: "Green Chile omelette", lunch: "New York pretzel bites", dinner: "Chicago deep dish pizza", dessert: "Blackout brownie sundae" },
  }
},

americanWeekfour: {
  label: "American Week Set D",
  days: {
    Monday:    { breakfast: "Breakfast tacos", lunch: "Cheese and bacon potato skins", dinner: "Bacon cheeseburger", dessert: "Ghirardelli brownie sundae" },
    Tuesday:   { breakfast: "Hash brown casserole", lunch: "Alabama white sauce wings", dinner: "Stuffed crust pepperoni pizza", dessert: "Peach and blackberry pie" },
    Wednesday: { breakfast: "Biscuits and gravy", lunch: "Hush puppies", dinner: "Chicken gumbo", dessert: "Campfire s’mores cheesecake" },
    Thursday:  { breakfast: "Chorizo and egg skillet", lunch: "Smoked brisket nacho", dinner: "Chimichangas", dessert: "Chocolate cake 24 karat" },
    Friday:    { breakfast: "Omelette supreme", lunch: "Bourbon glazed chicken skewers", dinner: "Bourbon glazed ham", dessert: "Bourbon balls" },
    Saturday:  { breakfast: "Breakfast enchiladas", lunch: "Sonoran hot dog", dinner: "Sonoran style enchiladas", dessert: "Peach cobbler" },
    Sunday:    { breakfast: "Farmhouse breakfast", lunch: "Truffle Mac and cheese bites", dinner: "Cowboy ribeye steak", dessert: "Apple pie" },
  }
},

americanWeekfive: {
  label: "American Week Set E",
  days: {
    Monday:    { breakfast: "Bacon egg and cheese bagel", lunch: "Mumbo sauce wings", dinner: "Georgia peach glazed chicken", dessert: "Georgia peanut brittle cheesecake" },
    Tuesday:   { breakfast: "Breakfast hash", lunch: "Prickly pear glazed chicken wings", dinner: "Prickly pear glazed chicken", dessert: "Cherry pie" },
    Wednesday: { breakfast: "Cinnamon French toast", lunch: "Spicy peach glazed chicken wings", dinner: "Cheerwine glazed chicken", dessert: "Coca Cola cake" },
    Thursday:  { breakfast: "Green Chile omelette", lunch: "Green Chile stew", dinner: "Green chile meatloaf", dessert: "Goo goo cluster pie" },
    Friday:    { breakfast: "Hash brown stack", lunch: "Sonoran style nachos", dinner: "Hatch Chile burger", dessert: "Fried peach pie" },
    Saturday:  { breakfast: "Breakfast burrito", lunch: "Loaded nachos", dinner: "Chili con carne", dessert: "Brownies" },
    Sunday:    { breakfast: "Pancake stack", lunch: "Chicken and sausage gumbo", dinner: "Filet mignon", dessert: "New York cheesecake" },
  }
},

americanWeeksix: {
  label: "American Week Set F",
  days: {
    Monday:    { breakfast: "Breakfast tacos", lunch: "Classic hot dog", dinner: "Kentucky fried chicken", dessert: "Red velvet cake" },
    Tuesday:   { breakfast: "Farmhouse breakfast", lunch: "Grilled cheese melt", dinner: "Spaghetti and meatballs", dessert: "Boston cream pie" },
    Wednesday: { breakfast: "Biscuits and gravy", lunch: "Pork tenderloin sandwich", dinner: "BBQ chicken", dessert: "Blueberry cobbler" },
    Thursday:  { breakfast: "Chorizo and egg skillet", lunch: "Hot beef sandwich", dinner: "New York strip steak", dessert: "Black and white cookies" },
    Friday:    { breakfast: "Hash brown casserole", lunch: "Buffalo chicken sandwich", dinner: "Chicken and waffles", dessert: "Banana split" },
    Saturday:  { breakfast: "Breakfast enchiladas", lunch: "Chili dog", dinner: "Beef chili", dessert: "Pecan pie with whipped cream" },
    Sunday:    { breakfast: "Omelette supreme", lunch: "Loaded burrito bowl", dinner: "Baja fish tacos", dessert: "Key lime pie" },
  }
},

americanWeekseven: {
  label: "American Week Set G",
  days: {
    Monday:    { breakfast: "Bacon egg and cheese bagel", lunch: "BBQ wings", dinner: "Memphis bbq ribs", dessert: "Apple pie" },
    Tuesday:   { breakfast: "Breakfast hash", lunch: "Philly cheesesteak wrap", dinner: "Cowboy ribeye steak", dessert: "Brownies" },
    Wednesday: { breakfast: "Green Chile omelette", lunch: "Fried chicken sandwich", dinner: "Nashville hot chicken", dessert: "Peach cobbler" },
    Thursday:  { breakfast: "Pancake stack", lunch: "Reuben sandwich", dinner: "Prime rib", dessert: "New York cheesecake" },
    Friday:    { breakfast: "Farmhouse breakfast", lunch: "Cheese and bacon loaded wedges", dinner: "Mac and cheese", dessert: "Ghirardelli brownie sundae" },
    Saturday:  { breakfast: "Breakfast burrito", lunch: "Steak fajita wrap", dinner: "Beef burrito", dessert: "Dr pepper cake" },
    Sunday:    { breakfast: "Cinnamon French toast", lunch: "Chicken and waffles", dinner: "Sloppy joes", dessert: "Cherry pie" },
  }
},

americanWeekeight: {
  label: "American Week Set H",
  days: {
    Monday:    { breakfast: "Biscuits and gravy", lunch: "BBQ brisket sandwich", dinner: "BBQ brisket", dessert: "Kentucky Derby pie" },
    Tuesday:   { breakfast: "Hash brown stack", lunch: "Pulled pork sandwich", dinner: "Tennessee bbq pulled pork", dessert: "Jack Daniel’s whiskey cake" },
    Wednesday: { breakfast: "Breakfast tacos", lunch: "Green chile cheeseburger", dinner: "Hatch Chile burger", dessert: "Peach and blackberry pie" },
    Thursday:  { breakfast: "Omelette supreme", lunch: "Buffalo chicken wings", dinner: "Fried chicken", dessert: "Blackout brownie sundae" },
    Friday:    { breakfast: "Breakfast enchiladas", lunch: "Smoked brisket nacho", dinner: "Chicken pot pie", dessert: "Campfire s’mores cheesecake" },
    Saturday:  { breakfast: "Farmhouse breakfast", lunch: "Sonoran hot dog", dinner: "Sonoran style enchiladas", dessert: "Gooey butter cake" },
    Sunday:    { breakfast: "Pancake stack", lunch: "Truffle Mac and cheese bites", dinner: "Chicago deep dish pizza", dessert: "Boston cream pie" },
  }
}

},
argentinianWeek: {
  label: "Argentinian Week",
  days: {
    Monday:    { breakfast: "Medialunas + coffee", lunch: "Hamburguesa criolla", dinner: "Bife de chorizo", dessert: "Alfajores" },
    Tuesday:   { breakfast: "Toast + dulce de leche", lunch: "Milanesa sandwich", dinner: "Milanesa napolitana", dessert: "Flan con dulce de leche" },
    Wednesday: { breakfast: "Pastry + coffee", lunch: "Choripán", dinner: "Locro", dessert: "Chocotorta" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Empanadas de carne", dinner: "Carbonada criolla", dessert: "Panqueques dulce de leche" },
    Friday:    { breakfast: "Eggs + toast", lunch: "Steak sandwich", dinner: "Asado de tira", dessert: "-" },
    Saturday:  { breakfast: "Medialunas + coffee", lunch: "Provoleta with bread", dinner: "Matambre a la pizza", dessert: "-" },
    Sunday:    { breakfast: "Toast + jam", lunch: "Milanesa a caballo", dinner: "Pollo al horno con papas", dessert: "-" },
  }
},

australianWeek: {
  label: "Australian Week",
  days: {
    Monday:    { breakfast: "Big Aussie breakfast", lunch: "Chicken schnitzel burger", dinner: "BBQ beef burger", dessert: "Lamingtons" },
    Tuesday:   { breakfast: "Brekky burger", lunch: "Steak sandwich", dinner: "Steak with pepper sauce", dessert: "Pavlova" },
    Wednesday: { breakfast: "Eggs + toast", lunch: "Meat pie and chips", dinner: "Lamb roast with mint gravy", dessert: "Chocolate mud cake" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Sausage roll", dinner: "BBQ chicken skewers", dessert: "Caramel slice" },
    Friday:    { breakfast: "Eggs + bacon on toast", lunch: "Fish and chips", dinner: "Beef sausages and mash", dessert: "Tim Tam cheesecake" },
    Saturday:  { breakfast: "Brekky burger", lunch: "Chicken parmigiana sandwich", dinner: "Roast chicken dinner", dessert: "Anzac biscuits" },
    Sunday:    { breakfast: "Big Aussie breakfast", lunch: "Burger with the lot", dinner: "BBQ ribs", dessert: "Golden syrup dumplings" },
  }
},

    austrianWeek: {
  label: "Austrian Week",
  days: {
    Monday:    { breakfast: "Kaisersemmel with butter and jam", lunch: "Schnitzel sandwich", dinner: "Wiener schnitzel", dessert: "Sachertorte" },
    Tuesday:   { breakfast: "Toast + butter + coffee", lunch: "Wiener sausage soup", dinner: "Tafelspitz with potatoes", dessert: "Apple strudel" },
    Wednesday: { breakfast: "Pastry + coffee", lunch: "Leberkäse roll", dinner: "Tiroler gröstl", dessert: "Kaiserschmarrn" },
    Thursday:  { breakfast: "Eggs + toast", lunch: "Goulash soup", dinner: "Backhendl", dessert: "Mozart cake" },
    Friday:    { breakfast: "Kaisersemmel with jam", lunch: "Cheese krainer roll", dinner: "Zwiebelrostbraten", dessert: "Topfenstrudel" },
    Saturday:  { breakfast: "Toast + honey + coffee", lunch: "Ham and cheese toastie", dinner: "Käsespätzle", dessert: "Apricot dumplings" },
    Sunday:    { breakfast: "Pastry + coffee", lunch: "Bratwurst roll", dinner: "Roast pork with dumplings", dessert: "Vanillekipferl" },
  }
},
  belgianWeek: {
  label: "Belgian Week",
  days: {
    Monday:    { breakfast: "Belgian pancakes", lunch: "Beef stew and fries", dinner: "Flemish beef stew", dessert: "Belgian waffles" },
    Tuesday:   { breakfast: "Breakfast waffles", lunch: "Beer cheese soup", dinner: "Waterzooi", dessert: "Chocolate truffles" },
    Wednesday: { breakfast: "Toast with Speculoos", lunch: "Gratinated onion soup", dinner: "Stoemp with sausage", dessert: "Speculoos biscuits" },
    Thursday:  { breakfast: "Croissant + coffee", lunch: "Croque monsieur", dinner: "Chicken and leek vol-au-vent", dessert: "Liege syrup tart" },
    Friday:    { breakfast: "Pain au chocolat", lunch: "Cheese croquettes", dinner: "Belgian meatballs in tomato sauce", dessert: "Rice tart" },
    Saturday:  { breakfast: "Eggs + toast", lunch: "Ham and cheese toastie", dinner: "Rabbit stew Belgian style", dessert: "Cuberdons" },
    Sunday:    { breakfast: "Toast + butter + jam", lunch: "Moules mariniere with fries", dinner: "Ardennes pork with potatoes", dessert: "Apple tart" },
  }
},
brazilianWeek: {
  label: "Brazilian Week",
  days: {
    Monday:    { breakfast: "Pão de queijo + coffee", lunch: "Feijão tropeiro", dinner: "Feijoada", dessert: "Brigadeiro" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Grilled chicken and rice", dinner: "Churrasco steak with fries", dessert: "Pudim (caramel flan)" },
    Wednesday: { breakfast: "Ham and cheese toastie", lunch: "Beef pastel (fried pastry)", dinner: "Brazilian sausage and rice", dessert: "Coconut cake" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Chicken coxinha", dinner: "Moqueca (Brazilian fish stew)", dessert: "Quindim" },
    Friday:    { breakfast: "Fried eggs + bread", lunch: "Steak sandwich", dinner: "Frango grelhado (grilled chicken) with rice", dessert: "Chocolate mousse Brazilian style" },
    Saturday:  { breakfast: "Pão de queijo + eggs", lunch: "Rice and beans bowl", dinner: "Picanha steak with chips", dessert: "Doce de leite cake" },
    Sunday:    { breakfast: "Toast + jam", lunch: "Chicken and cheese pastel", dinner: "Brazilian beef stew with potatoes", dessert: "Passion fruit mousse" },
  }
},

      britishWeek: {
  label: "British Week Set A",
  days: {
    Monday:    { breakfast: "Bacon and egg sandwich", lunch: "Sausage roll", dinner: "Bangers and mash", dessert: "Apple crumble" },
    Tuesday:   { breakfast: "Cheese omelette", lunch: "Cheese toastie", dinner: "Shepherds pie", dessert: "Sticky toffee pudding" },
    Wednesday: { breakfast: "Porridge", lunch: "Beans on toast", dinner: "Cottage pie", dessert: "Trifle" },
    Thursday:  { breakfast: "Sausage and egg muffin", lunch: "Cornish pasty", dinner: "Hunters chicken", dessert: "Jam roly poly" },
    Friday:    { breakfast: "Scrambled eggs and toast", lunch: "Fish finger sandwich", dinner: "Fish and chips", dessert: "Bread and butter pudding" },
    Saturday:  { breakfast: "Full English breakfast", lunch: "Fish cake", dinner: "British pub burger", dessert: "Eton mess" },
    Sunday:    { breakfast: "Warm buttered crumpets", lunch: "Jacket potato", dinner: "Sunday roast", dessert: "Spotted dick" },
  }
},

britishWeektwo: {
  label: "British Week Set B",
  days: {
    Monday:    { breakfast: "Boiled eggs and soldiers", lunch: "Steak bake", dinner: "Steak and ale pie", dessert: "Rhubarb crumble" },
    Tuesday:   { breakfast: "Bacon and egg sandwich", lunch: "Tomato soup", dinner: "Glazed gammon ham", dessert: "Bakewell tart" },
    Wednesday: { breakfast: "Cheese omelette", lunch: "Leek and potato soup", dinner: "Gammon and eggs", dessert: "Battenberg cake" },
    Thursday:  { breakfast: "Porridge", lunch: "Cheddar and ale soup", dinner: "Toad in the hole", dessert: "Blueberry crumble" },
    Friday:    { breakfast: "Sausage and egg muffin", lunch: "Hot Stilton soup", dinner: "Fish pie", dessert: "Biscuits and pink custard" },
    Saturday:  { breakfast: "Scrambled eggs and toast", lunch: "Beans on toast", dinner: "Pork and bean casserole", dessert: "Chocolate fudge cake" },
    Sunday:    { breakfast: "Full English breakfast burger", lunch: "Jacket potato", dinner: "Lancashire hotpot", dessert: "Lemon drizzle cake" },
  }
},

britishWeekthree: {
  label: "British Week Set C",
  days: {
    Monday:    { breakfast: "Warm buttered crumpets", lunch: "Cheese toastie", dinner: "Beef wellington", dessert: "Malteasers brownies" },
    Tuesday:   { breakfast: "Boiled eggs and soldiers", lunch: "Cornish pasty", dinner: "Bangers and mash", dessert: "Malteasers cheesecake" },
    Wednesday: { breakfast: "Bacon and egg sandwich", lunch: "Fish finger sandwich", dinner: "Shepherds pie", dessert: "Mars bar cheesecake" },
    Thursday:  { breakfast: "Cheese omelette", lunch: "Steak bake", dinner: "Cottage pie", dessert: "Milky Way cheesecake" },
    Friday:    { breakfast: "Porridge", lunch: "Fish cake", dinner: "Hunters chicken", dessert: "Raspberry cheesecake" },
    Saturday:  { breakfast: "Sausage and egg muffin", lunch: "Cheddar and ale soup", dinner: "Steak and ale pie", dessert: "Rice pudding" },
    Sunday:    { breakfast: "Full English breakfast", lunch: "Beans on toast", dinner: "Sunday roast", dessert: "Treacle tart" },
  }
},

britishWeekfour: {
  label: "British Week Set D",
  days: {
    Monday:    { breakfast: "Scrambled eggs and toast", lunch: "Sausage roll", dinner: "British pub burger", dessert: "Terrys chocolate orange cheesecake" },
    Tuesday:   { breakfast: "Warm buttered crumpets", lunch: "Tomato soup", dinner: "Fish and chips", dessert: "Tipsy laird" },
    Wednesday: { breakfast: "Boiled eggs and soldiers", lunch: "Leek and potato soup", dinner: "Glazed gammon ham", dessert: "Trifle" },
    Thursday:  { breakfast: "Bacon and egg sandwich", lunch: "Hot Stilton soup", dinner: "Toad in the hole", dessert: "Twix cheesecake" },
    Friday:    { breakfast: "Cheese omelette", lunch: "Jacket potato", dinner: "Fish pie", dessert: "Twix sundae" },
    Saturday:  { breakfast: "Porridge", lunch: "Cheese toastie", dinner: "Pork and bean casserole", dessert: "Victoria sponge" },
    Sunday:    { breakfast: "Full English breakfast burger", lunch: "Cornish pasty", dinner: "Lancashire hotpot", dessert: "Apple crumble" },
  }
},
canadianWeek: {
  label: "Canadian Week Set A",
  days: {
    Monday:    { breakfast: "Breakfast poutine", lunch: "Montreal smoked meat sandwich", dinner: "Poutine", dessert: "Beavertails" },
    Tuesday:   { breakfast: "Lumberjack breakfast", lunch: "Pea soup", dinner: "Cedar planked salmon", dessert: "Butter tarts" },
    Wednesday: { breakfast: "Maple syrup pancakes", lunch: "Cheese curds and gravy", dinner: "Maple chili wings", dessert: "Saskatoon berry pie" },
    Thursday:  { breakfast: "Eggs + toast", lunch: "Pea meal bacon roast", dinner: "Tourtiere", dessert: "Nanaimo bars" },
    Friday:    { breakfast: "Bacon and eggs with toast", lunch: "Grilled chicken sandwich", dinner: "French Canadian meat pie", dessert: "Maple pudding cake" },
    Saturday:  { breakfast: "Hash browns + eggs", lunch: "Loaded fries with gravy", dinner: "Roast chicken with gravy and chips", dessert: "Chocolate fudge cake Canadian style" },
    Sunday:    { breakfast: "Breakfast sandwich (egg and bacon)", lunch: "Beef and gravy sandwich", dinner: "Picanha-style steak with fries", dessert: "Maple cheesecake" },
  }
},

canadianWeektwo: {
  label: "Canadian Week Set B",
  days: {
    Monday:    { breakfast: "Eggs + bacon + toast", lunch: "Chicken and gravy roll", dinner: "BBQ chicken with maple glaze", dessert: "Blueberry pie" },
    Tuesday:   { breakfast: "Maple French toast", lunch: "Steak sandwich", dinner: "Beef stew with potatoes", dessert: "Butter tarts ice cream" },
    Wednesday: { breakfast: "Breakfast burrito Canadian style", lunch: "Fish and chips", dinner: "Salmon with rice and vegetables", dessert: "Maple donuts" },
    Thursday:  { breakfast: "Egg muffin sandwich", lunch: "Burger and fries", dinner: "Roast beef with gravy", dessert: "Chocolate brownies" },
    Friday:    { breakfast: "Hash brown breakfast plate", lunch: "Chicken wrap", dinner: "BBQ ribs with fries", dessert: "Caramel tart" },
    Saturday:  { breakfast: "Pancakes + maple syrup", lunch: "Loaded poutine fries", dinner: "Grilled steak with chips", dessert: "Ice cream sundae" },
    Sunday:    { breakfast: "Eggs + sausage + toast", lunch: "Pulled pork sandwich", dinner: "Chicken pot roast", dessert: "Apple pie" },
  }
},

chineseWeek: {
  label: "Chinese Week Set A",
  days: {
    Monday:    { breakfast: "Dim sum", lunch: "Beef chow mein", dinner: "Sweet and sour chicken", dessert: "Egg tart" },
    Tuesday:   { breakfast: "Egg fried rice", lunch: "Pepper beef rice", dinner: "Beef in black bean sauce", dessert: "Steamed custard buns" },
    Wednesday: { breakfast: "Bao buns", lunch: "Roast duck rice", dinner: "Black pepper beef", dessert: "Mango pudding" },
    Thursday:  { breakfast: "Spring rolls + tea", lunch: "Special fried rice", dinner: "Kung Pao chicken", dessert: "Sesame balls" },
    Friday:    { breakfast: "Scallion pancakes", lunch: "Chicken chow mein", dinner: "Peking duck", dessert: "Fortune cookies" },
    Saturday:  { breakfast: "Egg noodles + soy sauce", lunch: "Crispy chilli beef rice", dinner: "Chongqing hot pot", dessert: "Lychee jelly" },
    Sunday:    { breakfast: "Fried rice + egg", lunch: "Duck chow mein", dinner: "Salt and pepper chicken", dessert: "Coconut jelly" },
  }
},

chineseWeektwo: {
  label: "Chinese Week Set B",
  days: {
    Monday:    { breakfast: "Pork buns", lunch: "Beef fried rice", dinner: "Honey chilli chicken", dessert: "Red bean buns" },
    Tuesday:   { breakfast: "Egg drop soup + toast", lunch: "Chicken fried rice", dinner: "Szechuan beef", dessert: "Custard bao" },
    Wednesday: { breakfast: "Rice porridge (congee)", lunch: "Sweet and sour pork rice", dinner: "Teriyaki chicken Chinese style", dessert: "Sesame seed balls" },
    Thursday:  { breakfast: "Bao buns + tea", lunch: "Duck fried rice", dinner: "Crispy shredded beef", dessert: "Mango sago" },
    Friday:    { breakfast: "Scallion pancakes", lunch: "Salt and pepper chicken rice", dinner: "Chicken in black bean sauce", dessert: "Fortune cookies" },
    Saturday:  { breakfast: "Egg fried rice", lunch: "BBQ pork rice", dinner: "Char siu pork", dessert: "Lychee jelly" },
    Sunday:    { breakfast: "Fried noodles + egg", lunch: "Vegetable chow mein", dinner: "Chinese chicken curry", dessert: "Coconut jelly" },
  }
},

 dutchWeek: {
  label: "Dutch Week",
  days: {
    Monday:    { breakfast: "Dutch pancakes", lunch: "Bitterballen", dinner: "Stamppot", dessert: "Speculaas cake" },
    Tuesday:   { breakfast: "Toast + butter + hagelslag", lunch: "Erwtensoep", dinner: "Dutch meatballs with potatoes", dessert: "Stroopwafels cake" },
    Wednesday: { breakfast: "Cheese and ham toastie", lunch: "Broodje kroket", dinner: "Hachee stew with mash", dessert: "Stroopwafels" },
    Thursday:  { breakfast: "Eggs + toast", lunch: "Gouda cheese sandwich", dinner: "Kibbeling with chips", dessert: "Dutch apple pie" },
    Friday:    { breakfast: "Poffertjes", lunch: "Dutch pea soup roll", dinner: "Sausage and potatoes Dutch style", dessert: "Banketstaaf" },
    Saturday:  { breakfast: "Toast + jam + coffee", lunch: "Ham and cheese broodje", dinner: "Chicken satay with fries", dessert: "Tompouce" },
    Sunday:    { breakfast: "Fried eggs on toast", lunch: "Warm sausage roll", dinner: "Beef stew with red cabbage and potatoes", dessert: "Bossche bol" },
  }
},

   filipinoWeek: {
  label: "Filipino Week",
  days: {
    Monday:    { breakfast: "Garlic fried rice + egg (sinangag)", lunch: "Adobo rice bowl", dinner: "Chicken adobo", dessert: "Leche flan" },
    Tuesday:   { breakfast: "Pandesal + eggs", lunch: "Chicken inasal roll", dinner: "Kare Kare", dessert: "Mango float" },
    Wednesday: { breakfast: "Fried eggs + rice", lunch: "Kare Kare bowl", dinner: "Lechon kawali", dessert: "Halo-halo" },
    Thursday:  { breakfast: "Tocino + rice + egg", lunch: "Lechon roll", dinner: "Pork adobo", dessert: "Buko pandan" },
    Friday:    { breakfast: "Longganisa + rice + egg", lunch: "Sisig rice bowl", dinner: "Pork sisig", dessert: "Cassava cake" },
    Saturday:  { breakfast: "Omelette + rice", lunch: "Chicken adobo wrap", dinner: "Chicken inasal with rice", dessert: "Ube cake" },
    Sunday:    { breakfast: "Garlic rice + sausage + egg", lunch: "Grilled pork skewers with rice", dinner: "Beef caldereta", dessert: "Turon (banana fritters)" },
  }
},

      frenchWeek: {
  label: "French Week Set A",
  days: {
    Monday:    { breakfast: "Croissant au beurre", lunch: "Steak baguette", dinner: "Steak frites", dessert: "Crème brûlée" },
    Tuesday:   { breakfast: "Ham and cheese croissant", lunch: "French onion soup", dinner: "Boeuf bourgignon", dessert: "Chocolate mousse" },
    Wednesday: { breakfast: "Pain au chocolat", lunch: "Quiche Lorraine", dinner: "Chicken with mustard sauce", dessert: "Eclair" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Croque monsieur", dinner: "Coq au vin", dessert: "Profiteroles" },
    Friday:    { breakfast: "Pastry + coffee", lunch: "Ham and cheese baguette", dinner: "Duck à la Orange", dessert: "Chocolate lava cake" },
    Saturday:  { breakfast: "Eggs + toast", lunch: "Croque madame", dinner: "Gratin steak and green beans", dessert: "Molten white chocolate pudding" },
    Sunday:    { breakfast: "Toast + jam + coffee", lunch: "Cheese and ham toastie French style", dinner: "Savoury crepes", dessert: "Sweet crepes" },
  }
},

frenchWeektwo: {
  label: "French Week Set B",
  days: {
    Monday:    { breakfast: "Croissant au beurre", lunch: "Chicken baguette", dinner: "Ratatouille", dessert: "Macarons" },
    Tuesday:   { breakfast: "Pain au chocolat", lunch: "Tomato and cheese tart", dinner: "Steak frites", dessert: "Crème brûlée" },
    Wednesday: { breakfast: "Ham and cheese croissant", lunch: "French onion soup", dinner: "Chicken with mustard sauce", dessert: "Chocolate mousse" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Quiche Lorraine", dinner: "Boeuf bourgignon", dessert: "Eclair" },
    Friday:    { breakfast: "Pastry + coffee", lunch: "Steak baguette", dinner: "Coq au vin", dessert: "Profiteroles" },
    Saturday:  { breakfast: "Eggs + toast", lunch: "Croque monsieur", dinner: "Duck à la Orange", dessert: "Chocolate lava cake" },
    Sunday:    { breakfast: "Toast + jam + coffee", lunch: "Savoury crepes", dinner: "Gratin steak and green beans", dessert: "Molten white chocolate pudding" },
  }
},

germanWeek: {
  label: "German Week",
  days: {
    Monday:    { breakfast: "Brötchen with butter and ham", lunch: "Bratwurst roll", dinner: "Sauerbraten", dessert: "Apple strudel" },
    Tuesday:   { breakfast: "Fried eggs + bread", lunch: "Currywurst and fries", dinner: "Schweinshaxe", dessert: "Black Forest gateau" },
    Wednesday: { breakfast: "Cheese and ham toastie", lunch: "Cheese spätzle", dinner: "Zwiebelrostbraten", dessert: "Cherry clafoutis" },
    Thursday:  { breakfast: "Boiled eggs and bread", lunch: "Pork knuckle roll", dinner: "German sausage platter with potatoes", dessert: "Vanilla pudding cake" },
    Friday:    { breakfast: "Toast + butter + coffee", lunch: "Pretzel with melted cheese", dinner: "Bratwurst with mash and gravy", dessert: "Apple cake" },
    Saturday:  { breakfast: "Eggs + toast", lunch: "Chicken schnitzel sandwich", dinner: "Pork schnitzel with fries", dessert: "Donauwelle cake" },
    Sunday:    { breakfast: "Pastry + coffee", lunch: "Ham and cheese sandwich", dinner: "Beef goulash with dumplings", dessert: "German cheesecake" },
  }
},
      greekWeek: {
  label: "Greek Week",
  days: {
    Monday:    { breakfast: "Greek yoghurt with honey", lunch: "Gyros wrap", dinner: "Moussaka", dessert: "Baklava" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Chicken souvlaki wrap", dinner: "Lamb souvlaki with chips", dessert: "Greek honey cake" },
    Wednesday: { breakfast: "Toast + butter + coffee", lunch: "Pork gyros plate", dinner: "Stifado (beef stew)", dessert: "Loukoumades" },
    Thursday:  { breakfast: "Omelette + bread", lunch: "Halloumi wrap", dinner: "Greek grilled chicken with rice", dessert: "Galaktoboureko" },
    Friday:    { breakfast: "Greek yoghurt + fruit", lunch: "Kebab pita wrap", dinner: "Pastitsio", dessert: "Rizogalo (rice pudding)" },
    Saturday:  { breakfast: "Fried eggs + bread", lunch: "Chicken gyros bowl", dinner: "Grilled lamb chops with potatoes", dessert: "Kataifi" },
    Sunday:    { breakfast: "Toast + jam", lunch: "Souvlaki skewers with bread", dinner: "Greek roast chicken and potatoes", dessert: "Semolina cake" },
  }
},

      indianWeek: {
  label: "Indian Week Set A",
  days: {
    Monday:    { breakfast: "Masala omelette", lunch: "Butter chicken rice", dinner: "Butter chicken and keema naan", dessert: "Gulab jamun" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Chicken kathi roll", dinner: "Chicken curry and saag paneer", dessert: "Mango lassi dessert" },
    Wednesday: { breakfast: "Paratha + yoghurt", lunch: "Lamb curry bowl", dinner: "Chicken korma and coconut rice", dessert: "Kheer" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Paneer wrap", dinner: "Chicken tikka masala and garlic naan", dessert: "Rasmalai" },
    Friday:    { breakfast: "Omelette + bread", lunch: "Tandoori chicken roll", dinner: "Lamb dhansak and keema rice", dessert: "Jalebi" },
    Saturday:  { breakfast: "Fried eggs + toast", lunch: "Meat samosas", dinner: "Pork vindaloo and pilau rice", dessert: "Coconut barfi" },
    Sunday:    { breakfast: "Masala omelette", lunch: "Chicken tikka rice bowl", dinner: "Rogan Josh and Bombay potatoes", dessert: "Carrot halwa" },
  }
},

indianWeektwo: {
  label: "Indian Week Set B",
  days: {
    Monday:    { breakfast: "Masala omelette", lunch: "Paneer wrap", dinner: "Tandoori chicken and onion bhaji", dessert: "Gulab jamun" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Butter chicken rice", dinner: "Dal makhani and poppadoms", dessert: "Kheer" },
    Wednesday: { breakfast: "Paratha + yoghurt", lunch: "Chicken kathi roll", dinner: "Chicken jalfrezi and pilau rice", dessert: "Rasmalai" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Lamb curry bowl", dinner: "Chicken tikka balti and naan", dessert: "Jalebi" },
    Friday:    { breakfast: "Omelette + bread", lunch: "Chicken tikka wrap", dinner: "Paneer butter masala and rice", dessert: "Coconut barfi" },
    Saturday:  { breakfast: "Fried eggs + toast", lunch: "Vegetable samosa chaat", dinner: "Lamb bhuna and keema rice", dessert: "Carrot halwa" },
    Sunday:    { breakfast: "Masala omelette", lunch: "Chicken curry rice bowl", dinner: "Pork vindaloo and pilau rice", dessert: "Mango lassi dessert" },
  }
},

indianWeekthree: {
  label: "Indian Week Set C",
  days: {
    Monday:    { breakfast: "Masala omelette", lunch: "Butter chicken rice", dinner: "Rogan Josh and Bombay potatoes", dessert: "Gulab jamun" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Chicken kathi roll", dinner: "Dal makhani and poppadoms", dessert: "Kheer" },
    Wednesday: { breakfast: "Paratha + yoghurt", lunch: "Paneer wrap", dinner: "Butter chicken and keema naan", dessert: "Rasmalai" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Tandoori chicken roll", dinner: "Chicken curry and saag paneer", dessert: "Jalebi" },
    Friday:    { breakfast: "Omelette + bread", lunch: "Lamb curry bowl", dinner: "Keema curry and rice", dessert: "Coconut barfi" },
    Saturday:  { breakfast: "Fried eggs + toast", lunch: "Chicken tikka rice bowl", dinner: "Chicken korma and coconut rice", dessert: "Carrot halwa" },
    Sunday:    { breakfast: "Masala omelette", lunch: "Vegetable samosa chaat", dinner: "Paneer tikka masala and naan", dessert: "Mango lassi dessert" },
  }
},

indianWeekfour: {
  label: "Indian Week Set D",
  days: {
    Monday:    { breakfast: "Masala omelette", lunch: "Paneer wrap", dinner: "Chicken curry and saag paneer", dessert: "Gulab jamun" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Butter chicken rice", dinner: "Chicken tikka masala and garlic naan", dessert: "Kheer" },
    Wednesday: { breakfast: "Paratha + yoghurt", lunch: "Chicken kathi roll", dinner: "Lamb dhansak and keema rice", dessert: "Rasmalai" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Chicken tikka wrap", dinner: "Pork vindaloo and pilau rice", dessert: "Jalebi" },
    Friday:    { breakfast: "Omelette + bread", lunch: "Lamb curry bowl", dinner: "Dal makhani and poppadoms", dessert: "Coconut barfi" },
    Saturday:  { breakfast: "Fried eggs + toast", lunch: "Chicken curry rice bowl", dinner: "Paneer butter masala and rice", dessert: "Carrot halwa" },
    Sunday:    { breakfast: "Masala omelette", lunch: "Tandoori chicken roll", dinner: "Chicken chettinad and rice", dessert: "Mango lassi dessert" },
  }
},
irishWeek: {
  label: "Irish Week Set A",
  days: {
    Monday:    { breakfast: "Full Irish breakfast", lunch: "Boxty", dinner: "Bacon and cabbage", dessert: "Baileys cheesecake" },
    Tuesday:   { breakfast: "Scrambled eggs on soda bread", lunch: "Bacon and cabbage soup", dinner: "Beef and Guinness stew", dessert: "Barmbrack" },
    Wednesday: { breakfast: "Buttered toast + tea", lunch: "Guinness onion soup", dinner: "Dublin coddle", dessert: "Guinness chocolate cake" },
    Thursday:  { breakfast: "Eggs + toast", lunch: "Irish stew soup", dinner: "Colcannon and ham", dessert: "Irish cream brownies" },
    Friday:    { breakfast: "Sausage sandwich", lunch: "Potato soup", dinner: "Irish ribs", dessert: "Irish whiskey trifle" },
    Saturday:  { breakfast: "Fried eggs + soda bread", lunch: "Ham and cheese toastie", dinner: "Irish stew", dessert: "Porter cake" },
    Sunday:    { breakfast: "Bacon and eggs", lunch: "Chicken and leek soup", dinner: "Steak and Guinness pie", dessert: "Apple tart" },
  }
},

irishWeektwo: {
  label: "Irish Week Set B",
  days: {
    Monday:    { breakfast: "Full Irish breakfast", lunch: "Boxty", dinner: "Beef and Guinness stew", dessert: "Porter cake" },
    Tuesday:   { breakfast: "Buttered toast + tea", lunch: "Potato soup", dinner: "Bacon and cabbage", dessert: "Baileys cheesecake" },
    Wednesday: { breakfast: "Eggs + toast", lunch: "Guinness onion soup", dinner: "Steak and Guinness pie", dessert: "Irish cream brownies" },
    Thursday:  { breakfast: "Scrambled eggs on soda bread", lunch: "Bacon and cabbage soup", dinner: "Irish stew", dessert: "Barmbrack" },
    Friday:    { breakfast: "Sausage sandwich", lunch: "Irish stew soup", dinner: "Dublin coddle", dessert: "Guinness chocolate cake" },
    Saturday:  { breakfast: "Fried eggs + soda bread", lunch: "Ham and cheese toastie", dinner: "Colcannon and ham", dessert: "Irish whiskey trifle" },
    Sunday:    { breakfast: "Bacon and eggs", lunch: "Chicken and vegetable soup", dinner: "Irish ribs", dessert: "Apple crumble" },
  }
},


italianWeek: {
  label: "Italian Week Set A",
  days: {
    Monday:    { breakfast: "Ham and cheese panini", lunch: "Arancini", dinner: "Spaghetti carbonara", dessert: "Tiramisu" },
    Tuesday:   { breakfast: "Cornetto", lunch: "Minestrone", dinner: "Margherita pizza", dessert: "Cannoli" },
    Wednesday: { breakfast: "Cappuccino and pastry", lunch: "Pesto pasta", dinner: "Lasagne", dessert: "Panna cotta" },
    Thursday:  { breakfast: "Biscotti and coffee", lunch: "Panini", dinner: "Spaghetti bolognaise", dessert: "Nutella cheesecake" },
    Friday:    { breakfast: "Ricotta toast", lunch: "Gnocchi", dinner: "Risotto", dessert: "Biscoff brownies" },
    Saturday:  { breakfast: "Frittata", lunch: "Italian style burger", dinner: "Salmon tagliatelle", dessert: "Kinder bueno sundae" },
    Sunday:    { breakfast: "Croissant and espresso", lunch: "Tomato and mozzarella toastie", dinner: "Gnocchi al pesto", dessert: "Ferrero rocher cheesecake" },
  }
},

italianWeek2: {
  label: "Italian Week Set B",
  days: {
    Monday:    { breakfast: "Ham and cheese panini", lunch: "Arancini", dinner: "Pesto pasta", dessert: "Biscoff cheesecake" },
    Tuesday:   { breakfast: "Cornetto", lunch: "Tomato soup Italian style", dinner: "Spaghetti carbonara", dessert: "Nutella waffles" },
    Wednesday: { breakfast: "Cappuccino and pastry", lunch: "Panini", dinner: "Lasagne", dessert: "Kinder bueno cheesecake" },
    Thursday:  { breakfast: "Biscotti and coffee", lunch: "Bruschetta with melted mozzarella", dinner: "Risotto", dessert: "Biscoff sundae" },
    Friday:    { breakfast: "Ricotta toast", lunch: "Minestrone", dinner: "Margherita pizza", dessert: "Ferrero rocher sundae" },
    Saturday:  { breakfast: "Frittata", lunch: "Gnocchi", dinner: "Spaghetti bolognaise", dessert: "Nutella cheesecake" },
    Sunday:    { breakfast: "Croissant and espresso", lunch: "Mozzarella and pesto toastie", dinner: "Salmon tagliatelle", dessert: "Kinder bueno waffles" },
  }
},

italianWeek3: {
  label: "Italian Week Set C",
  days: {
    Monday:    { breakfast: "Ham and cheese panini", lunch: "Arancini", dinner: "Gnocchi al pesto", dessert: "Biscoff pancakes" },
    Tuesday:   { breakfast: "Cornetto", lunch: "Panini", dinner: "Pesto pasta", dessert: "Cannoli" },
    Wednesday: { breakfast: "Cappuccino and pastry", lunch: "Tomato and mozzarella toastie", dinner: "Lasagne", dessert: "Kinder bueno pancakes" },
    Thursday:  { breakfast: "Biscotti and coffee", lunch: "Minestrone", dinner: "Spaghetti carbonara", dessert: "Panna cotta" },
    Friday:    { breakfast: "Ricotta toast", lunch: "Bruschetta with melted cheese", dinner: "Risotto", dessert: "Ferrero rocher cheesecake" },
    Saturday:  { breakfast: "Frittata", lunch: "Gnocchi", dinner: "Margherita pizza", dessert: "Nutella waffles" },
    Sunday:    { breakfast: "Croissant and espresso", lunch: "Mozzarella and tomato panini", dinner: "Spaghetti bolognaise", dessert: "Biscoff waffles" },
  }
},


jamaicanWeek: {
  label: "Jamaican Week",
  days: {
    Monday:    { breakfast: "Banana porridge", lunch: "Brown stew chicken roll", dinner: "Brown stew chicken", dessert: "Banana bread" },
    Tuesday:   { breakfast: "Fried eggs + toast", lunch: "Jerk chicken wrap", dinner: "Jerk chicken coconut rice and peas", dessert: "Rum cake" },
    Wednesday: { breakfast: "Toast + butter + coffee", lunch: "Jerk pork roll", dinner: "Jerk pork coconut rice and peas", dessert: "Coconut drops" },
    Thursday:  { breakfast: "Eggs + toast", lunch: "Grilled chicken sandwich", dinner: "Jerk chicken wings", dessert: "Sweet potato pudding" },
    Friday:    { breakfast: "Fried eggs + bread", lunch: "Beef patty", dinner: "Curry goat", dessert: "Plantain fritters" },
    Saturday:  { breakfast: "Toast + jam", lunch: "Chicken patty", dinner: "Oxtail stew", dessert: "Pineapple cake" },
    Sunday:    { breakfast: "Egg sandwich", lunch: "Jerk chicken sandwich", dinner: "Pepper steak", dessert: "Mango pudding" },
  }
},

 japaneseWeek: {
  label: "Japanese Week",
  days: {
    Monday:    { breakfast: "Tamago toast", lunch: "Beef gyudon", dinner: "Chicken katsu", dessert: "Matcha roll cake" },
    Tuesday:   { breakfast: "Japanese omelette and toast", lunch: "Chicken katsu roll", dinner: "Kare raisu", dessert: "Sakura cheesecake" },
    Wednesday: { breakfast: "Egg fried rice", lunch: "Curry udon", dinner: "Okonomiyaki", dessert: "Dorayaki" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Miso soup", dinner: "Ramen", dessert: "Mochi" },
    Friday:    { breakfast: "Tamago on rice", lunch: "Teriyaki chicken rice bowl", dinner: "Teriyaki chicken", dessert: "Castella cake" },
    Saturday:  { breakfast: "Japanese omelette with toast (tamagoyaki style)", lunch: "Chicken karaage bowl", dinner: "Yakisoba", dessert: "Taiyaki" },
    Sunday:    { breakfast: "Rice + fried egg", lunch: "Pork katsu curry bowl", dinner: "Chicken yakitori with rice", dessert: "Japanese custard pudding" },
  }
},

koreanWeek: {
  label: "Korean Week",
  days: {
    Monday:    { breakfast: "Kimchi jjigae bowl", lunch: "Bulgogi rice bowl", dinner: "Bibimbap", dessert: "Hotteok" },
    Tuesday:   { breakfast: "Korean omelette with rice", lunch: "Galbi rice bowl", dinner: "Budae jjigae", dessert: "Bungeoppang" },
    Wednesday: { breakfast: "Egg fried rice Korean style", lunch: "Jjajangmyeon bowl", dinner: "Bulgogi", dessert: "Yakgwa" },
    Thursday:  { breakfast: "Rice + fried egg", lunch: "Kimchi fried rice bowl", dinner: "Galbi", dessert: "Korean rice cake skewers" },
    Friday:    { breakfast: "Toasted ham and egg sandwich", lunch: "Korean bbq roll", dinner: "Jjangmyeon", dessert: "Hodugwaja" },
    Saturday:  { breakfast: "Korean toast sandwich", lunch: "Korean bbq wings", dinner: "Korean fried chicken", dessert: "Hot honey rice cakes" },
    Sunday:    { breakfast: "Gyeran bap (egg rice)", lunch: "Chicken katsu rice bowl Korean style", dinner: "Dakgalbi with rice", dessert: "Sweet red bean buns" },
  }
},

malaysianWeek: {
  label: "Malaysian Week",
  days: {
    Monday:    { breakfast: "Roti canai with curry", lunch: "Chicken nasi lemak", dinner: "Beef rendang", dessert: "Kuih lapis" },
    Tuesday:   { breakfast: "Fried eggs + roti", lunch: "Chicken satay with rice", dinner: "Malaysian peanut curry", dessert: "Cendol" },
    Wednesday: { breakfast: "Egg fried rice Malaysian style", lunch: "Mee goreng", dinner: "Chicken nasi lemak", dessert: "Pandan cake" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Laksa soup", dinner: "Beef rendang", dessert: "Kuih ketayap" },
    Friday:    { breakfast: "Omelette + bread", lunch: "Chicken curry rice bowl", dinner: "Malaysian peanut curry", dessert: "Ais kacang" },
    Saturday:  { breakfast: "Fried rice + egg", lunch: "Nasi goreng", dinner: "Grilled chicken with rice", dessert: "Mango sticky rice Malaysian style" },
    Sunday:    { breakfast: "Roti telur (egg roti)", lunch: "Beef satay with rice", dinner: "Chicken curry with rice", dessert: "Coconut jelly" },
  }
},

    mexicanWeek: {
  label: "Mexican Week Set A",
  days: {
    Monday:    { breakfast: "Chorizo con Huevos", lunch: "Burrito mojado", dinner: "Bean and cheese burrito", dessert: "Churros" },
    Tuesday:   { breakfast: "Ranchero omelette", lunch: "Carne asada tacos", dinner: "Beef tacos", dessert: "Tres leches cake" },
    Wednesday: { breakfast: "Eggs + toast", lunch: "Fajita pasta", dinner: "Chicken fajitas", dessert: "Flan" },
    Thursday:  { breakfast: "Breakfast quesadilla", lunch: "Quesadilla plate", dinner: "Chorizo burrito", dessert: "Sopapillas" },
    Friday:    { breakfast: "Chorizo con Huevos", lunch: "Chicken taco bowl", dinner: "Enchiladas suizas", dessert: "Mexican chocolate cake" },
    Saturday:  { breakfast: "Ranchero omelette", lunch: "Loaded nachos", dinner: "Enchiladas verdes", dessert: "Fried ice cream" },
    Sunday:    { breakfast: "Egg and cheese tortilla wrap", lunch: "Steak burrito bowl", dinner: "Mole poblano", dessert: "Cinnamon sugar tortilla chips" },
  }
},

mexicanWeektwo: {
  label: "Mexican Week Set B",
  days: {
    Monday:    { breakfast: "Chorizo con Huevos", lunch: "Chicken quesadilla plate", dinner: "Tacos al pastor", dessert: "Tres leches cake" },
    Tuesday:   { breakfast: "Ranchero omelette", lunch: "Beef fajita wrap", dinner: "Chicken burrito", dessert: "Flan" },
    Wednesday: { breakfast: "Eggs + toast", lunch: "Carne asada fries", dinner: "Beef tacos", dessert: "Churros" },
    Thursday:  { breakfast: "Breakfast quesadilla", lunch: "Burrito mojado", dinner: "Bean and cheese burrito", dessert: "Sopapillas" },
    Friday:    { breakfast: "Chorizo con Huevos", lunch: "Quesadilla plate", dinner: "Chicken fajitas", dessert: "Mexican chocolate cake" },
    Saturday:  { breakfast: "Ranchero omelette", lunch: "Carne asada tacos", dinner: "Chorizo burrito", dessert: "Fried ice cream" },
    Sunday:    { breakfast: "Egg and cheese tortilla wrap", lunch: "Fajita pasta", dinner: "Enchiladas verdes", dessert: "Cinnamon sugar tortilla chips" },
  }
},

middleeasternWeek: {
  label: "Middle Eastern Week",
  days: {
    Monday:    { breakfast: "Shakshuka with bread", lunch: "Chicken shawarma wrap", dinner: "Chicken mandi (Yemen/Saudi rice)", dessert: "Baklava" },
    Tuesday:   { breakfast: "Eggs + flatbread", lunch: "Beef shawarma wrap", dinner: "Lamb kabsa (Saudi rice dish)", dessert: "Kunafa" },
    Wednesday: { breakfast: "Cheese manakish", lunch: "Chicken kebab wrap", dinner: "Mixed grill with rice (Lebanese)", dessert: "Basbousa" },
    Thursday:  { breakfast: "Omelette + pita", lunch: "Falafel wrap", dinner: "Chicken machboos (Gulf rice dish)", dessert: "Date cake" },
    Friday:    { breakfast: "Eggs + bread + tea", lunch: "Lamb kofta wrap", dinner: "Lamb ouzi (spiced rice with lamb)", dessert: "Halva" },
    Saturday:  { breakfast: "Shakshuka wrap", lunch: "Chicken shawarma rice bowl", dinner: "Grilled chicken with rice and garlic sauce", dessert: "Qatayef" },
    Sunday:    { breakfast: "Fried eggs + flatbread", lunch: "Beef kebab sandwich", dinner: "Chicken biryani Middle Eastern style", dessert: "Maamoul" },
  }
},

moroccanWeek: {
  label: "Moroccan Week",
  days: {
    Monday:    { breakfast: "Khobz with butter and honey", lunch: "Beef tagine rice", dinner: "Beef tagine", dessert: "Chebakia" },
    Tuesday:   { breakfast: "Eggs + msemen", lunch: "Chicken tagine roll", dinner: "Chicken tagine", dessert: "M'hancha" },
    Wednesday: { breakfast: "Moroccan omelette", lunch: "Couscous bowl", dinner: "Couscous royale", dessert: "Sellou" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Spiced lentil soup", dinner: "Lamb tagine", dessert: "Orange cinnamon cake" },
    Friday:    { breakfast: "Fried eggs + khobz", lunch: "Kefta wrap", dinner: "Kefta tagine", dessert: "Ghriba biscuits" },
    Saturday:  { breakfast: "Msemen with honey", lunch: "Chicken shawarma Moroccan style", dinner: "Harira with meat and bread", dessert: "Almond briouats" },
    Sunday:    { breakfast: "Eggs + toast", lunch: "Lamb couscous bowl", dinner: "Mechoui lamb with potatoes", dessert: "Date cake" },
  }
},

  nepaleseWeek: {
  label: "Nepal Week",
  days: {
    Monday:    { breakfast: "Fried eggs + roti", lunch: "Chicken momo dumplings", dinner: "Mutton curry", dessert: "Sel roti" },
    Tuesday:   { breakfast: "Omelette + toast", lunch: "Chicken chow mein Nepalese style", dinner: "Mutton katiya", dessert: "Kheer" },
    Wednesday: { breakfast: "Egg fried rice", lunch: "Buff momo with soup", dinner: "Chicken curry", dessert: "Juju dhau (yoghurt)" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Thukpa noodle soup", dinner: "Pork curry", dessert: "Laddu" },
    Friday:    { breakfast: "Fried eggs + bread", lunch: "Chicken fried rice Nepalese style", dinner: "Chicken tikka curry Nepalese style", dessert: "Barfi" },
    Saturday:  { breakfast: "Egg wrap", lunch: "Veg momo dumplings", dinner: "Goat curry with rice", dessert: "Rice pudding" },
    Sunday:    { breakfast: "Eggs + toast", lunch: "Chow mein with chicken", dinner: "Dal bhat with meat curry", dessert: "Sweet fried bread" },
  }
},

  peruvianWeek: {
  label: "Peruvian Week",
  days: {
    Monday:    { breakfast: "Chicarrón and bread", lunch: "Aji chicken bowl", dinner: "Aji de gallina", dessert: "Alfajores" },
    Tuesday:   { breakfast: "Eggs + bread", lunch: "Lomo saltado roll", dinner: "Lomo saltado", dessert: "Tres leches cake" },
    Wednesday: { breakfast: "Fried eggs + toast", lunch: "Pollo brasa roll", dinner: "Pollo à la brasa", dessert: "Picarones" },
    Thursday:  { breakfast: "Omelette + bread", lunch: "Seco beef bowl", dinner: "Arroz con pollo", dessert: "Suspiro a la limeña" },
    Friday:    { breakfast: "Egg sandwich", lunch: "Empanadas de carne", dinner: "Grilled chicken with rice Peruvian style", dessert: "Mazamorra morada" },
    Saturday:  { breakfast: "Toast + butter + coffee", lunch: "Tamales", dinner: "Peruvian beef stew with rice", dessert: "Arroz con leche" },
    Sunday:    { breakfast: "Fried eggs + bread", lunch: "Chicken rice bowl Peruvian style", dinner: "Seafood rice Peruvian style", dessert: "Coconut flan" },
  }
},

    
polishWeek: {
  label: "Polish Week",
  days: {
    Monday:    { breakfast: "Scrambled egg and kielbasa", lunch: "Kotlet schabowy roll", dinner: "Kotlet schabowy", dessert: "Apple cake" },
    Tuesday:   { breakfast: "Fried eggs + bread", lunch: "Placki and goulash", dinner: "Polish goulash", dessert: "Paczki" },
    Wednesday: { breakfast: "Omelette + toast", lunch: "Zurek", dinner: "Bigos", dessert: "Sernik (cheesecake)" },
    Thursday:  { breakfast: "Egg sandwich", lunch: "Pierogi with meat", dinner: "Chicken schnitzel with potatoes", dessert: "Makowiec" },
    Friday:    { breakfast: "Toast + butter + coffee", lunch: "Kielbasa sandwich", dinner: "Roast pork with cabbage and potatoes", dessert: "Kremowka" },
    Saturday:  { breakfast: "Fried eggs + sausage", lunch: "Pierogi with cheese", dinner: "Beef stew with dumplings", dessert: "Faworki" },
    Sunday:    { breakfast: "Eggs + bread", lunch: "Chicken soup Polish style", dinner: "Stuffed cabbage rolls (golabki)", dessert: "Rice pudding" },
  }
},

portugueseWeek: {
  label: "Portuguese Week",
  days: {
    Monday:    { breakfast: "Bifana breakfast roll", lunch: "Bifana roll", dinner: "Peri peri chicken", dessert: "Pastel de nata" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Chicken Peri peri roll", dinner: "Nando’s dinner", dessert: "Arroz doce" },
    Wednesday: { breakfast: "Ham and cheese toastie", lunch: "Duck rice bowl", dinner: "Piri-piri grilled chicken with rice", dessert: "Bolo de bolacha" },
    Thursday:  { breakfast: "Fried eggs + bread", lunch: "Steak and egg roll", dinner: "Portuguese beef steak with chips", dessert: "Pudim flan" },
    Friday:    { breakfast: "Toast + butter + coffee", lunch: "Peri peri chicken wings", dinner: "Chicken espetada with potatoes", dessert: "Queijadas" },
    Saturday:  { breakfast: "Egg sandwich", lunch: "Peri peri chips", dinner: "Roast chicken Portuguese style", dessert: "Chocolate salami" },
    Sunday:    { breakfast: "Omelette + bread", lunch: "Prego roll", dinner: "Bacalhau com natas", dessert: "Toucinho do céu" },
  }
},

scandinavianWeek: {
  label: "Scandinavian Week Set A",
  days: {
    Monday:    { breakfast: "Eggs + toast", lunch: "Swedish meatball sandwich", dinner: "Swedish meatballs with mash and gravy", dessert: "Cinnamon buns" },
    Tuesday:   { breakfast: "Omelette + bread", lunch: "Danish hot dog", dinner: "Danish pork roast with potatoes", dessert: "Danish pastry" },
    Wednesday: { breakfast: "Fried eggs + bread", lunch: "Norwegian fish soup", dinner: "Norwegian salmon with potatoes", dessert: "Kransekake" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Finnish sausage roll", dinner: "Finnish meatballs with gravy", dessert: "Finnish pancake" },
    Friday:    { breakfast: "Egg sandwich", lunch: "Swedish sausage and mash", dinner: "Beef stew Scandinavian style", dessert: "Sticky chocolate cake (kladdkaka)" },
    Saturday:  { breakfast: "Omelette + toast", lunch: "Danish meatball sandwich", dinner: "Roast chicken with potatoes Nordic style", dessert: "Rice pudding (risalamande)" },
    Sunday:    { breakfast: "Eggs + bread", lunch: "Norwegian fish cakes with bread", dinner: "Icelandic lamb stew", dessert: "Skyr cake" },
  }
},

scandinavianWeektwo: {
  label: "Scandinavian Week Set B",
  days: {
    Monday:    { breakfast: "Eggs + toast", lunch: "Swedish hot dog", dinner: "Swedish meatballs with mash and gravy", dessert: "Kladdkaka" },
    Tuesday:   { breakfast: "Omelette + bread", lunch: "Danish sausage roll", dinner: "Danish pork with crackling and potatoes", dessert: "Danish pastry" },
    Wednesday: { breakfast: "Fried eggs + bread", lunch: "Finnish meat pie (lihapiirakka)", dinner: "Finnish sausage with mash", dessert: "Finnish cinnamon buns" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Norwegian fish soup", dinner: "Norwegian salmon with potatoes", dessert: "Kransekake" },
    Friday:    { breakfast: "Egg sandwich", lunch: "Swedish meatball wrap", dinner: "Scandinavian beef stew with dumplings", dessert: "Rice pudding" },
    Saturday:  { breakfast: "Omelette + toast", lunch: "Danish hot dog", dinner: "Roast chicken Nordic style", dessert: "Chocolate cake Nordic style" },
    Sunday:    { breakfast: "Eggs + bread", lunch: "Finnish sausage sandwich", dinner: "Icelandic lamb stew", dessert: "Skyr dessert" },
  }
},

   singaporeanWeek: {
  label: "Singaporean Week",
  days: {
    Monday:    { breakfast: "Kaya toast and eggs", lunch: "Curry chicken rice", dinner: "Hainanese chicken rice", dessert: "Pandan cake" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Chicken satay rice bowl", dinner: "Laksa", dessert: "Kaya cake" },
    Wednesday: { breakfast: "Toast + butter + coffee", lunch: "Roast chicken rice bowl", dinner: "Char kway teow", dessert: "Coconut jelly" },
    Thursday:  { breakfast: "Omelette + toast", lunch: "Chicken noodle soup Singapore style", dinner: "Beef rendang with rice", dessert: "Mango pudding" },
    Friday:    { breakfast: "Fried eggs + bread", lunch: "Chicken curry noodle bowl", dinner: "Satay chicken with rice", dessert: "Ondeh ondeh" },
    Saturday:  { breakfast: "Kaya toast and eggs", lunch: "Chicken fried rice Singapore style", dinner: "Nasi goreng", dessert: "Sago gula melaka" },
    Sunday:    { breakfast: "Egg sandwich", lunch: "Duck rice bowl", dinner: "Singapore chilli chicken with rice", dessert: "Pandan swiss roll" },
  }
},

southafricanWeek: {
  label: "South African Week",
  days: {
    Monday:    { breakfast: "Boerewors and eggs", lunch: "Boerewors roll", dinner: "Boerewors and pap", dessert: "Peppermint crisp tart" },
    Tuesday:   { breakfast: "Vetkoek and eggs", lunch: "Bunny chow roll", dinner: "Bunny chow", dessert: "Milk tart" },
    Wednesday: { breakfast: "Eggs + toast", lunch: "Cape curry rice bowl", dinner: "Cape Malay curry", dessert: "Malva pudding" },
    Thursday:  { breakfast: "Fried eggs + bread", lunch: "Chakalaka rice bowl", dinner: "Chakalaka chicken", dessert: "Koeksisters" },
    Friday:    { breakfast: "Toast + butter + coffee", lunch: "Vetkoek burger", dinner: "Grilled steak and chips South African style", dessert: "Hertzoggie" },
    Saturday:  { breakfast: "Omelette + toast", lunch: "Vetkoek with curried mince", dinner: "Peri peri chicken and rice", dessert: "Coconut ice" },
    Sunday:    { breakfast: "Egg sandwich", lunch: "Chicken sosatie roll", dinner: "Potjiekos beef stew", dessert: "Queen cake" },
  }
},

spanishWeek: {
  label: "Spanish Week",
  days: {
    Monday:    { breakfast: "Scrambled eggs and chorizo", lunch: "Chorizo al vino", dinner: "Paella de carne", dessert: "Churros and chocolate" },
    Tuesday:   { breakfast: "Spanish omelette (tortilla)", lunch: "Patatas bravas", dinner: "Pollo al ajillo", dessert: "Flan" },
    Wednesday: { breakfast: "Toast + tomato + olive oil", lunch: "Chicken croquettes", dinner: "Spanish grilled pork with potatoes", dessert: "Crema catalana" },
    Thursday:  { breakfast: "Fried eggs + bread", lunch: "Calamari sandwich", dinner: "Seafood paella", dessert: "Spanish rice pudding" },
    Friday:    { breakfast: "Ham and cheese toastie", lunch: "Spanish meatballs", dinner: "Chicken and chorizo rice", dessert: "Basque cheesecake" },
    Saturday:  { breakfast: "Eggs + toast", lunch: "Garlic prawns with bread", dinner: "Spanish steak with chips", dessert: "Tarta de Santiago" },
    Sunday:    { breakfast: "Omelette + bread", lunch: "Chicken empanadas", dinner: "Roast chicken Spanish style", dessert: "Chocolate flan" },
  }
},

swissWeek: {
  label: "Swiss Week",
  days: {
    Monday:    { breakfast: "Bircher muesli warm", lunch: "Cheese fondue bread", dinner: "Cheese fondue", dessert: "Chocolate fondue" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Rosti and egg roll", dinner: "Raclette", dessert: "Swiss chocolate cake" },
    Wednesday: { breakfast: "Fried eggs + bread", lunch: "Ham and cheese sandwich Swiss style", dinner: "Rosti plate", dessert: "Zuger kirschtorte" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Cheese melt sandwich", dinner: "Sausage and rosti", dessert: "Milkybar brownies" },
    Friday:    { breakfast: "Omelette + bread", lunch: "Chicken rosti bowl", dinner: "Swiss steak with potatoes", dessert: "Milkybar cheesecake" },
    Saturday:  { breakfast: "Egg sandwich", lunch: "Grilled cheese Swiss style", dinner: "Chicken schnitzel with rosti", dessert: "Chocolate mousse Swiss style" },
    Sunday:    { breakfast: "Fried eggs + toast", lunch: "Beef sandwich Swiss style", dinner: "Roast pork with potatoes Swiss style", dessert: "Caramel tart" },
  }
},
           taiwanWeek: {
  label: "Taiwanese Week",
  days: {
    Monday:    { breakfast: "Pork bun", lunch: "Beef noodle bowl", dinner: "Beef noodle soup", dessert: "Pineapple cake" },
    Tuesday:   { breakfast: "Egg pancake Taiwanese style", lunch: "Pork chop rice bowl", dinner: "Salt and pepper chicken", dessert: "Bubble tea cake" },
    Wednesday: { breakfast: "Scallion pancake with egg", lunch: "Salt pepper chicken bowl", dinner: "Three cup chicken", dessert: "Mochi" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Three cup chicken bowl", dinner: "Sesame oil chicken", dessert: "Custard bun" },
    Friday:    { breakfast: "Fried egg rice roll", lunch: "Popcorn chicken", dinner: "Taiwanese beef noodles", dessert: "Taiwanese sponge cake" },
    Saturday:  { breakfast: "Pork bun with egg", lunch: "Taiwanese pork belly buns", dinner: "Braised pork rice with egg", dessert: "Sweet taro balls" },
    Sunday:    { breakfast: "Egg fried rice Taiwanese style", lunch: "Chicken rice bowl Taiwanese style", dinner: "Taiwanese fried chicken with rice", dessert: "Peanut mochi" },
  }
},

thaiWeek: {
  label: "Thai Week Set A",
  days: {
    Monday:    { breakfast: "Thai omelette and rice", lunch: "Basil pork rice bowl", dinner: "Massaman curry", dessert: "Mango sticky rice" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Green curry rice bowl", dinner: "Pad Thai with chicken", dessert: "Coconut pancakes" },
    Wednesday: { breakfast: "Fried rice with egg", lunch: "Massaman curry rice", dinner: "Chicken panang curry", dessert: "Thai steamed layer cake" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Pad kra pao", dinner: "Thai green curry", dessert: "Banana roti" },
    Friday:    { breakfast: "Thai omelette wrap", lunch: "Red curry rice bowl", dinner: "Thai red curry", dessert: "Coconut jelly" },
    Saturday:  { breakfast: "Egg fried noodles", lunch: "Moo ping", dinner: "Thai yellow curry", dessert: "Thai custard toast" },
    Sunday:    { breakfast: "Rice + fried egg", lunch: "Thai fish cake", dinner: "Thai peanut chicken burrito", dessert: "Sticky rice with coconut cream" },
  }
},

thaiWeektwo: {
  label: "Thai Week Set B",
  days: {
    Monday:    { breakfast: "Thai omelette and rice", lunch: "Tom yum soup", dinner: "Massaman curry", dessert: "Mango sticky rice" },
    Tuesday:   { breakfast: "Eggs + toast", lunch: "Thai green curry pasta", dinner: "Pad Thai with chicken", dessert: "Coconut pancakes" },
    Wednesday: { breakfast: "Fried rice with egg", lunch: "Thai red curry pasta", dinner: "Chicken panang curry", dessert: "Thai steamed layer cake" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Basil pork rice bowl", dinner: "Thai green curry", dessert: "Banana roti" },
    Friday:    { breakfast: "Thai omelette wrap", lunch: "Green curry rice bowl", dinner: "Thai red curry", dessert: "Coconut jelly" },
    Saturday:  { breakfast: "Egg fried noodles", lunch: "Pad kra pao", dinner: "Thai yellow curry", dessert: "Thai custard toast" },
    Sunday:    { breakfast: "Rice + fried egg", lunch: "Moo ping", dinner: "Thai peanut chicken burrito", dessert: "Sticky rice with coconut cream" },
  }
},
turkishWeek: {
  label: "Turkish Week Set A",
  days: {
    Monday:    { breakfast: "Sucuk and eggs", lunch: "Adana wrap", dinner: "Adana kebab", dessert: "Baklava" },
    Tuesday:   { breakfast: "Menemen and bread", lunch: "Chicken shish wrap", dinner: "Chicken kebab", dessert: "Turkish delight" },
    Wednesday: { breakfast: "Eggs + bread", lunch: "Doner kebab wrap", dinner: "Chicken shish", dessert: "Sutlac" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Kofte sandwich", dinner: "Iskender kebab", dessert: "Kazandibi" },
    Friday:    { breakfast: "Sucuk toastie", lunch: "Lahmacun roll", dinner: "Kofte", dessert: "Revani" },
    Saturday:  { breakfast: "Fried eggs + bread", lunch: "Chicken doner wrap", dinner: "Doner burrito", dessert: "Kunefe" },
    Sunday:    { breakfast: "Cheese omelette Turkish style", lunch: "Gozleme with meat", dinner: "Grilled lamb with rice", dessert: "Lokma" },
  }
},

turkishWeektwo: {
  label: "Turkish Week Set B",
  days: {
    Monday:    { breakfast: "Sucuk and eggs", lunch: "Chicken shish wrap", dinner: "Chicken shish", dessert: "Baklava" },
    Tuesday:   { breakfast: "Menemen and bread", lunch: "Doner kebab wrap", dinner: "Adana kebab", dessert: "Turkish delight" },
    Wednesday: { breakfast: "Eggs + bread", lunch: "Kofte sandwich", dinner: "Kofte", dessert: "Sutlac" },
    Thursday:  { breakfast: "Toast + butter + tea", lunch: "Adana wrap", dinner: "Iskender kebab", dessert: "Kazandibi" },
    Friday:    { breakfast: "Sucuk toastie", lunch: "Chicken doner wrap", dinner: "Chicken kebab", dessert: "Revani" },
    Saturday:  { breakfast: "Fried eggs + bread", lunch: "Lahmacun roll", dinner: "Doner burrito", dessert: "Kunefe" },
    Sunday:    { breakfast: "Cheese omelette Turkish style", lunch: "Gozleme with meat", dinner: "Grilled kofte and rice", dessert: "Lokma" },
  }
},
vietnameseWeek: {
  label: "Vietnamese Week",
  days: {
    Monday:    { breakfast: "Vietnamese steamed pork bun", lunch: "Pho bowl", dinner: "Pho bo", dessert: "Vietnamese custard buns" },
    Tuesday:   { breakfast: "Vietnamese omelette (trung chien)", lunch: "Vietnamese fried dumplings", dinner: "Bo kho", dessert: "Vietnamese sticky rice buns" },
    Wednesday: { breakfast: "Eggs + toast", lunch: "Vietnamese grilled pork skewers", dinner: "Vietnamese caramelised pork with rice", dessert: "Vietnamese baked banana cake" },
    Thursday:  { breakfast: "Toast + butter + coffee", lunch: "Vietnamese spring rolls", dinner: "Lemongrass chicken with rice", dessert: "Che ba mau" },
    Friday:    { breakfast: "Vietnamese baguette with eggs", lunch: "Bo kho roll", dinner: "Vietnamese shaking beef (Bo luc lac)", dessert: "Coconut jelly" },
    Saturday:  { breakfast: "Fried rice with egg", lunch: "Banh mi pork sandwich", dinner: "Grilled pork with vermicelli (Bun thit nuong)", dessert: "Mango sticky rice Vietnamese style" },
    Sunday:    { breakfast: "Pandan pancakes", lunch: "Vietnamese crispy pancakes (Banh xeo)", dinner: "Vietnamese chicken curry", dessert: "Sweet coconut rice pudding" },
  }
},
  };

  function getApp() {
    return window.lifeAdminApp || null;
  }

  function emptyDay() {
    return {
      breakfast: "",
      lunch: "",
      dinner: "",
      dessert: "",
    };
  }

  function defaultMealsState() {
    return {
      version: 1,
      selectedPreset: "",
      weekLabel: "",
      days: {
        Monday: emptyDay(),
        Tuesday: emptyDay(),
        Wednesday: emptyDay(),
        Thursday: emptyDay(),
        Friday: emptyDay(),
        Saturday: emptyDay(),
        Sunday: emptyDay(),
      }
    };
  }

  function ensureMealsInStore(store) {
    if (!store.meals || typeof store.meals !== "object") {
      store.meals = defaultMealsState();
    }

    if (!store.meals.days || typeof store.meals.days !== "object") {
      store.meals.days = defaultMealsState().days;
    }

    for (const day of DAY_ORDER) {
      if (!store.meals.days[day] || typeof store.meals.days[day] !== "object") {
        store.meals.days[day] = emptyDay();
      }

      for (const meal of MEAL_ORDER) {
        store.meals.days[day][meal] = String(store.meals.days[day][meal] ?? "");
      }
    }

    store.meals.selectedPreset = String(store.meals.selectedPreset ?? "");
    store.meals.weekLabel = String(store.meals.weekLabel ?? "");
    store.meals.version = 1;

    return store;
  }

  function getStore() {
    const app = getApp();
    if (!app?.loadStore) return null;
    const store = app.loadStore();
    return ensureMealsInStore(store);
  }

  function saveStore(store) {
    const app = getApp();
    if (!app?.saveStore) return;
    app.saveStore(ensureMealsInStore(store));
  }

  function getMeals() {
    const store = getStore();
    return store ? store.meals : defaultMealsState();
  }

  function saveMeals(meals) {
    const store = getStore();
    if (!store) return;
    store.meals = meals;
    saveStore(store);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getMealsView() {
    return byId("view-meals");
  }

  function getPresetSelect() {
    return byId("mealPlanPresetSelect");
  }

  function getWeekNameInput() {
    return byId("mealPlanWeekName");
  }

  function getApplyPresetBtn() {
    return byId("btnMealPlanApplyPreset");
  }

  function getClearBtn() {
    return byId("btnMealPlanClear");
  }

  function getPresetBadge() {
    return byId("mealPlanPresetBadge");
  }

  function getMealInput(day, meal) {
    return getMealsView()?.querySelector(
      `.meal-input[data-day="${day}"][data-meal="${meal}"]`
    ) || null;
  }

  function fillPresetOptions() {
    const select = getPresetSelect();
    if (!select) return;

    const current = select.value || "";
    const options = [
      `<option value="">Choose a preset…</option>`,
      ...Object.entries(PRESETS).map(
        ([key, preset]) => `<option value="${key}">${preset.label}</option>`
      )
    ];

    select.innerHTML = options.join("");

    if (current && PRESETS[current]) {
      select.value = current;
    }
  }

  function renderMeals() {
    const meals = getMeals();
    const view = getMealsView();
    if (!view) return;

    fillPresetOptions();

    const presetSelect = getPresetSelect();
    const weekNameInput = getWeekNameInput();
    const presetBadge = getPresetBadge();

    if (presetSelect) {
      presetSelect.value = meals.selectedPreset || "";
    }

    if (weekNameInput) {
      weekNameInput.value = meals.weekLabel || "";
    }

    if (presetBadge) {
      presetBadge.textContent = meals.selectedPreset
        ? (PRESETS[meals.selectedPreset]?.label || "Preset")
        : "Preset";
    }

    for (const day of DAY_ORDER) {
      for (const meal of MEAL_ORDER) {
        const input = getMealInput(day, meal);
        if (!input) continue;
        input.value = meals.days?.[day]?.[meal] ?? "";
      }
    }
  }

  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const meals = defaultMealsState();
    meals.selectedPreset = presetKey;
    meals.weekLabel = preset.label;

    for (const day of DAY_ORDER) {
      meals.days[day] = {
        breakfast: preset.days?.[day]?.breakfast ?? "",
        lunch: preset.days?.[day]?.lunch ?? "",
        dinner: preset.days?.[day]?.dinner ?? "",
        dessert: preset.days?.[day]?.dessert ?? "",
      };
    }

    saveMeals(meals);
    renderMeals();
  }

  function clearWeek() {
    const meals = defaultMealsState();
    saveMeals(meals);
    renderMeals();
  }

  function saveSingleMeal(day, meal, value) {
    const meals = getMeals();
    if (!meals.days[day]) meals.days[day] = emptyDay();
    meals.days[day][meal] = String(value ?? "");
    saveMeals(meals);
  }

  function saveWeekLabel(value) {
    const meals = getMeals();
    meals.weekLabel = String(value ?? "");
    saveMeals(meals);
  }

  function saveSelectedPreset(value) {
    const meals = getMeals();
    meals.selectedPreset = String(value ?? "");
    saveMeals(meals);
  }

  let eventsWired = false;

  function wireMealsEvents() {
    if (eventsWired) return;
    eventsWired = true;

    const view = getMealsView();
    if (!view) return;

    getApplyPresetBtn()?.addEventListener("click", () => {
      const key = getPresetSelect()?.value || "";
      if (!key) return;
      applyPreset(key);
    });

    getClearBtn()?.addEventListener("click", () => {
      if (!confirm("Clear the whole meal week?")) return;
      clearWeek();
    });

    getPresetSelect()?.addEventListener("change", (e) => {
      saveSelectedPreset(e.target.value || "");
      renderMeals();
    });

    getWeekNameInput()?.addEventListener("input", (e) => {
      saveWeekLabel(e.target.value || "");
    });

    view.addEventListener("input", (e) => {
      const input = e.target.closest(".meal-input[data-day][data-meal]");
      if (!input) return;

      const day = input.getAttribute("data-day");
      const meal = input.getAttribute("data-meal");
      if (!day || !meal) return;

      saveSingleMeal(day, meal, input.value);
    });

    window.addEventListener("lifeadmin:datachanged", () => {
      renderMeals();
    });
  }

  function initMealsFeature() {
    fillPresetOptions();
    wireMealsEvents();
    renderMeals();

    if (window.lifeAdminApp) {
      window.lifeAdminApp.renderMeals = renderMeals;
    }
  }

  window.renderMeals = renderMeals;
  window.initMealsFeature = initMealsFeature;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMealsFeature);
  } else {
    initMealsFeature();
  }
})();