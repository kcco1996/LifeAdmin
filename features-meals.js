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
      label: "American Week Set A",
      days: {
        Monday:    { breakfast: "Bagel and cream cheese", lunch: "Burrito (chicken or beef)", dinner: "Cheeseburger and fries", dessert: "Brownie" },
        Tuesday:   { breakfast: "Toast + peanut butter", lunch: "Grilled Cheese Sandwich", dinner: "Fried Chicken (oven/air fryer version) + Chips", dessert: "Apple pie" },
        Wednesday: { breakfast: "Pancakes (microwave mix or ready-made)", lunch: "Hot Dog (quick + oven/microwave)", dinner: "BBQ Ribs (oven or slow cooker)", dessert: "Ice cream sundae" },
        Thursday:  { breakfast: "Toast + jam", lunch: "Chicken Tenders", dinner: "Philly Cheesesteak", dessert: "Chocolate chip cookie" },
        Friday:    { breakfast: "Bagel + coffee", lunch: "Pepperoni Pizza (oven or takeaway)", dinner: "Mac and Cheese", dessert: "Cheesecake" },
        Saturday:  { breakfast: "Eggs + toast", lunch: "Burger or wrap", dinner: "Buffalo Wings", dessert: "Pecan pie" },
        Sunday:    { breakfast: "Pancakes + syrup", lunch: "Roast Chicken (American-style simple roast)", dinner: "Meatloaf + mash", dessert: "Banana pudding" },
      }
    },

               americanWeektwo: {
      label: "American Week Set B",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "Sloppy Joes", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Pot Roast", dinner: "-", dessert: "-" },
      }
    },

                   americanWeekthree: {
      label: "American Week Set C",
      days: {
        Monday:    { breakfast: "-", lunch: "Chicken quesadilla", dinner: "Chicken & Waffles", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "Pulled Pork (slow cooker/oven)", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "Club sandwich", dinner: "Beef tacos", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "Chicken pot pie", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "Cheeseburger" },
        Saturday:   { breakfast: "Eggs + bacon on toast", lunch: "-", dinner: "BBQ Chicken Wings", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "Chili", dessert: "-" },
      }
    },

                   americanWeekfour: {
      label: "American Week Set D",
      days: {
        Monday:    { breakfast: "-", lunch: "Chicken Burrito", dinner: "Fried chicken sandwich & chips", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "Loaded mac and cheese", dinner: "BBQ Brisket (oven/slow cooker)", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "Chicken pasta bake", dinner: "Chicken fajitas", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "Double cheeseburger" },
        Saturday:   { breakfast: "Pancakes + bacon", lunch: "-", dinner: "Loaded nachos", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Fried Chicken Dinner (proper plate)", dinner: "Chicken soup", dessert: "-" },
      }
    },

                   americanWeekfive: {
      label: "American Week Set E",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "Chicken fried steak", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "Chili cheese fries", dinner: "BBQ pulled chicken", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "Chicken Mac and Cheese Bake", dinner: "Nashville hot chicken", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "Reuben sandwich", dinner: "Beef enchiladas", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "Popcorn chicken", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "French toast + syrup", lunch: "-", dinner: "BBQ chicken drumsticks", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Beef brisket sandwich", dinner: "-", dessert: "-" },
      }
    },

                   americanWeeksix: {
      label: "American Week Set F",
      days: {
        Monday:    { breakfast: "-", lunch: "Breakfast burrito", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "Loaded baked potato", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "Bacon cheeseburger", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "Fried chicken tenders", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "BBQ sausages", dinner: "-", dessert: "-" },
      }
    },

                   americanWeekseven: {
      label: "American Week Set G",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "Southern fried chicken dinner", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "Cheesy garlic bread", dinner: "Beef chili mac", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "BBQ chicken pizza", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "Buffalo chicken tenders", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Roast beef sandwich", dinner: "-", dessert: "-" },
      }
    },

                   americanWeekeight: {
      label: "American Week Set H",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "Chicken fried rice", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "Cheese quesadilla", dinner: "Beef sliders", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "Bacon BBQ burger", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Chicken pot roast", dinner: "Tomato soup + bread", dessert: "-" },
      }
    },


            argentinianWeek: {
      label: "Argentinian Week",
      days: {
        Monday:    { breakfast: "Toast + butter + coffee", lunch: "Choripan", dinner: "Steak + chips", dessert: "-" },
        Tuesday:   { breakfast: "Toast + jam", lunch: "Empanadas", dinner: "Milanesa", dessert: "-" },
        Wednesday:  { breakfast: "Pastry + coffee", lunch: "Leftover milanesa", dinner: "Argentinian grilled chicken + roast potatoes", dessert: "-" },
        Thursday:   { breakfast: "Toast + nutella", lunch: "Steak sandwich", dinner: "Asado", dessert: "-" },
        Friday:     { breakfast: "Toast + coffee", lunch: "Chorizo + bread", dinner: "Gnocchi", dessert: "-" },
        Saturday:   { breakfast: "Eggs + toast", lunch: "-", dinner: "Chicken wings", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "Soup + bread", dessert: "-" },
      }
    },

            australianWeek: {
      label: "Australian Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

                 austrianWeek: {
      label: "Austrian Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

             belgianWeek: {
      label: "Belgian Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            brazilianWeek: {
      label: "Brazilian Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

       britishWeek: {
      label: "British Week Set A",
      days: {
        Monday:    { breakfast: "Toast + butter + coffee", lunch: "Sausage roll", dinner: "Chicken + chips", dessert: "Apple crumble" },
        Tuesday:   { breakfast: "Toast + jam", lunch: "Cheese toastie", dinner: "Bangers and mash", dessert: "Sticky toffee pudding" },
        Wednesday: { breakfast: "Pastry + coffee", lunch: "Beans on toast", dinner: "Shepherds pie", dessert: "Trifle" },
        Thursday:  { breakfast: "Toast + nutella", lunch: "Bacon sandwich", dinner: "Chicken tikka masala", dessert: "Jam roly-poly" },
        Friday:    { breakfast: "Toast + coffee", lunch: "Pizza (oven or takeaway)", dinner: "Fish and chips", dessert: "Bread and butter pudding" },
        Saturday:  { breakfast: "Full English breakfast", lunch: "Burger or hot dog", dinner: "Chicken wings", dessert: "Eton mess" },
        Sunday:    { breakfast: "Pastry + coffee", lunch: "Sunday roast", dinner: "Soup + bread", dessert: "Spotted dick" },
      }
    },

              britishWeektwo: {
      label: "British Week Set B",
      days: {
        Monday:    { breakfast: "Toast + peanut butter + coffee", lunch: "Cornish pasty", dinner: "Chicken kiev + chips", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "Tomato soup + bread", dinner: "Steak and ale pie", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "Spaghetti hoops on toast", dinner: "Gammon steak and chips", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "Sausage casserole", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "Scotch egg", dinner: "Steak + chips", dessert: "-" },
        Saturday:   { breakfast: "Bacon + eggs on toast", lunch: "Burger", dinner: "Doner kebab", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Toad in the hole", dinner: "-", dessert: "-" },
      }
    },

                  britishWeekthree: {
      label: "British Week Set C",
      days: {
        Monday:    { breakfast: "-", lunch: "Steak bake", dinner: "Chicken goujons + chips", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "Leek + potato soup", dinner: "Cottage pie", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "Cheese pasta", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "Sausage sandwich", dinner: "Hunters chicken", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "Chicken nuggets", dinner: "Mixed grill", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Lancashire hotpot", dinner: "-", dessert: "-" },
      }
    },

                  britishWeekfour: {
      label: "British Week Set D",
      days: {
        Monday:    { breakfast: "-", lunch: "Chicken bake", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "Ham and cheese toastie", dinner: "Sausage + mash", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "Chicken burger", dinner: "Scampi + chips", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "Loaded fries", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "Roast pork", dinner: "-", dessert: "-" },
      }
    },

            canadianWeek: {
      label: "Canadian Week Set A",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

             canadianWeektwo: {
      label: "Canadian Week Set B",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            chineseWeek: {
      label: "Chinese Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

                 dutchWeek: {
      label: "Dutch Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            filipinoWeek: {
      label: "Filipino Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

        frenchWeek: {
      label: "French Week Set A",
      days: {
        Monday:    { breakfast: "Croissant and coffee", lunch: "Jambon beurre", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

             frenchWeektwo: {
      label: "French Week Set B",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },


             irishWeek: {
      label: "Irish Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },


             irishWeek: {
      label: "Irish Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },


            germanWeek: {
      label: "German Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            greekWeek: {
      label: "Greek Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

    indianWeek: {
      label: "Indian Week Set A",
      days: {
        Monday:    { breakfast: "Masala omelette", lunch: "Chicken kathi roll", dinner: "Butter chicken", dessert: "Gulab jamun" },
        Tuesday:   { breakfast: "Aloo paratha", lunch: "Paneer wrap", dinner: "Lamb rogan josh", dessert: "Kheer" },
        Wednesday: { breakfast: "Poha", lunch: "Chole bhature", dinner: "Chicken tikka masala", dessert: "Rasmalai" },
        Thursday:  { breakfast: "Upma", lunch: "Samosa chaat", dinner: "Biryani", dessert: "Jalebi" },
        Friday:    { breakfast: "Idli", lunch: "Pav bhaji", dinner: "Palak paneer", dessert: "Kulfi" },
        Saturday:  { breakfast: "Dosa", lunch: "Aloo tikki burger", dinner: "Dansak", dessert: "Barfi" },
        Sunday:    { breakfast: "Egg bhurji", lunch: "Keema naan", dinner: "Tandoori chicken", dessert: "Shrikhand" },
      }
    },

            indianWeektwo: {
      label: "Indian Week Set B",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

                indianWeekthree: {
      label: "Indian Week Set C",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

                indianWeekfour: {
      label: "Indian Week Set D",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            irishWeek: {
      label: "Irish Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

    italianWeek: {
      label: "Italian Week",
      days: {
        Monday:    { breakfast: "Cornetto", lunch: "Panini", dinner: "Spaghetti Carbonara", dessert: "Tiramisu" },
        Tuesday:   { breakfast: "Cappuccino and pastry", lunch: "Pizza Margarita", dinner: "Chicken Parmigiana", dessert: "Gelato" },
        Wednesday: { breakfast: "Biscotti and coffee", lunch: "Penne Arrabiata", dinner: "Lasagne", dessert: "Panna cotta" },
        Thursday:  { breakfast: "Ricotta toast", lunch: "Minestrone", dinner: "Spaghetti Bologneise", dessert: "Cannoli" },
        Friday:    { breakfast: "Yoghurt and fruit", lunch: "Arancini", dinner: "Chicken Risotto", dessert: "Affogato" },
        Saturday:  { breakfast: "Frittata", lunch: "Italian style burger", dinner: "Calzone", dessert: "Sfogliatella" },
        Sunday:    { breakfast: "Croissant and espresso", lunch: "Gnocchi", dinner: "Roast chicken with rosemary potatoes", dessert: "Zabaglione" },
      }
    },

             irishWeek: {
      label: "Irish Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },


             irishWeek: {
      label: "Irish Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },


             irishWeek: {
      label: "Irish Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },


              jamaicanWeek: {
      label: "Jamaican Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

    japaneseWeek: {
      label: "Japanese Week",
      days: {
        Monday:    { breakfast: "Tamago toast", lunch: "Chicken katsu sando", dinner: "Chicken katsu curry", dessert: "Dorayaki" },
        Tuesday:   { breakfast: "Onigiri", lunch: "Yakisoba", dinner: "Tonkatsu", dessert: "Mochi" },
        Wednesday: { breakfast: "Japanese omelette", lunch: "Karaage rice bowl", dinner: "Ramen", dessert: "Castella" },
        Thursday:  { breakfast: "Rice and miso soup", lunch: "Takoyaki", dinner: "Teriyaki chicken", dessert: "Taiyaki" },
        Friday:    { breakfast: "Toast and matcha latte", lunch: "Korokke", dinner: "Gyudon", dessert: "Matcha ice cream" },
        Saturday:  { breakfast: "Tamago on toast", lunch: "Curry pan", dinner: "Okonomiyaki", dessert: "Anmitsu" },
        Sunday:    { breakfast: "Fruit sandwich", lunch: "Chicken karaage", dinner: "Hambagu steak", dessert: "Purin" },
      }
    },

            koreanWeek: {
      label: "Korean Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            malaysianWeek: {
      label: "Malaysian Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

    mexicanWeek: {
      label: "Mexican Week Set A",
      days: {
        Monday:    { breakfast: "Huevos rancheros", lunch: "Chicken quesadilla", dinner: "Beef tacos", dessert: "Churros" },
        Tuesday:   { breakfast: "Breakfast burrito", lunch: "Torta", dinner: "Chicken enchiladas", dessert: "Flan" },
        Wednesday: { breakfast: "Molletes", lunch: "Nachos", dinner: "Chilli con carne", dessert: "Tres leches cake" },
        Thursday:  { breakfast: "Scrambled eggs with salsa", lunch: "Chicken taquitos", dinner: "Fajitas", dessert: "Arroz con leche" },
        Friday:    { breakfast: "Chilaquiles", lunch: "Burrito bowl", dinner: "Carnitas tacos", dessert: "Sopapillas" },
        Saturday:  { breakfast: "Quesadilla", lunch: "Tostadas", dinner: "Tamales", dessert: "Buñuelos" },
        Sunday:    { breakfast: "Breakfast tacos", lunch: "Elote snack plate", dinner: "Mole chicken", dessert: "Mexican chocolate cake" },
      }
    },

    
                mexicanWeektwo: {
      label: "Mexican Week Set B",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },


                middleeasternWeek: {
      label: "Middle Eastern Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            moroccanWeek: {
      label: "Moroccan Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

             nepaleseWeek: {
      label: "Nepal Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            peruvianWeek: {
      label: "Peruvian Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

    
            polishWeek: {
      label: "Polish Week Set A",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            portugueseWeek: {
      label: "Portuguese Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

             scandinavianWeek: {
      label: "Scandinavian Week Set A",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

                scandinavianWeektwo: {
      label: "Scandinavian Week Set B",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            singaporeanWeek: {
      label: "Singaporean Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            southafricanWeek: {
      label: "South African Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

        spanishWeek: {
      label: "Spanish Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

                 swissWeek: {
      label: "Swiss Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            thaiWeek: {
      label: "Thai Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            turkishWeek: {
      label: "Turkish Week Set A",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

    
            turkishWeektwo: {
      label: "Turkish Week Set B",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
      }
    },

            vietnameseWeek: {
      label: "Vietnamese Week",
      days: {
        Monday:    { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Tuesday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Wednesday:  { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Thursday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Friday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Saturday:   { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
        Sunday:     { breakfast: "-", lunch: "-", dinner: "-", dessert: "-" },
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