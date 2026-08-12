/**
 * Contenido de referencia transcrito de la carta en PDF (agosto 2026).
 * Placeholder de la Fase 2: pasará a Supabase (tablas `categorias` /
 * `productos`) en la Fase 3, editable desde /admin. No se han inventado
 * precios ni descripciones fuera de lo que aparece en el PDF original.
 */

export type MenuItem = {
  name: string;
  description: string;
  price: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const COCKTAIL_MENU: MenuSection[] = [
  {
    title: "Especial Casa",
    items: [
      {
        name: "Palomita",
        description:
          "Jimador reposado, limón, zumo de pomelo, sirope de ágave y soda. Cítrico con toques amargos.",
        price: "7,00",
      },
    ],
  },
  {
    title: "Vodka",
    items: [
      {
        name: "Cosmopolitan",
        description: "Belenkaya, limón, zumo de arándanos y Cointreau. Cítrico, alto contenido alcohólico.",
        price: "6,50",
      },
      {
        name: "Mula de Moscú",
        description: "Belenkaya, limón y angostura combinados con ginger beer. Cítrico con toques especiados.",
        price: "6,50",
      },
      {
        name: "Espresso Martini",
        description: "Belenkaya, café, azúcar y Tía María. Notas amargas con sabor a café.",
        price: "6,50",
      },
      {
        name: "Bloody Mary",
        description: 'Belenkaya, limón, zumo de tomate y "salsa secreta". ¡Picante!',
        price: "6,00 / 3,50",
      },
    ],
  },
  {
    title: "Ginebra",
    items: [
      {
        name: "Clover Club",
        description: "Bulldog, limón, sirope de frambuesa y clara de huevo. Cítrico con final dulce.",
        price: "6,50",
      },
      {
        name: "Gin Fizz",
        description: "Bulldog, limón, clara de huevo y soda. Cítrico.",
        price: "6,50",
      },
    ],
  },
  {
    title: "Whisky",
    items: [
      {
        name: "Whisky Sour",
        description: "Wild Turkey, limón, azúcar y clara de huevo. Cítrico-dulce.",
        price: "6,50",
      },
    ],
  },
  {
    title: "Ron",
    items: [
      {
        name: "Mojito",
        description: "Hierbabuena, azúcar moreno, Santísima 3 y soda. Cítrico.",
        price: "6,50",
      },
      {
        name: "Daikiri",
        description: "Santísima 3, limón y azúcar. Cítrico.",
        price: "6,50",
      },
      {
        name: "Piña Colada",
        description: "Santísima 3, limón, zumo de piña y sirope de coco. Dulce.",
        price: "6,50",
      },
      {
        name: "Dark and Stormy",
        description: "Kraken, limón, azúcar, angostura y refresco de ginger beer. Cítrico y especiado. Trago largo.",
        price: "7,00",
      },
    ],
  },
  {
    title: "Tequila",
    items: [
      {
        name: "Margarita",
        description: "Jimador Blanco, limón, azúcar y Cointreau. Cítrico, alto contenido alcohólico.",
        price: "6,50",
      },
    ],
  },
  {
    title: "Pisco",
    items: [
      {
        name: "Pisco Sour",
        description: "Demonio de los Andes, limón, azúcar y clara de huevo. Cítrico-dulce.",
        price: "6,50",
      },
    ],
  },
  {
    title: "Aperitivos",
    items: [
      {
        name: "Vermouth preparado",
        description: "Cinzano, Campari, Bulldog y zumo de naranja.",
        price: "3,20",
      },
      {
        name: "Aperol Spritz",
        description: "Aperol, soda y Cava.",
        price: "3,50",
      },
      {
        name: "Negroni",
        description: "Partes iguales de vermut rojo, Campari y ginebra. Amargo como la vida misma.",
        price: "5,00",
      },
    ],
  },
];

export const FOOD_MENU: MenuSection[] = [
  {
    title: "Ensaladas",
    items: [
      {
        name: "Ensalada Palomita",
        description: "Queso de cabra con rúcula, tomate, cebolla caramelizada y nueces. Vinagreta de pesto.",
        price: "5,50",
      },
      {
        name: "Ensalada de ventresca",
        description: "Rúcula, tartar de tomate, cebolla morada y ajo tierno. Vinagreta de mango.",
        price: "6,00",
      },
    ],
  },
  {
    title: "Picoteo",
    items: [
      {
        name: "Nachos",
        description: "Nachos caseros con pico de gallo, queso ricotta y tartar de tomate.",
        price: "6,00",
      },
      {
        name: "Patatas gajo",
        description: "Con alioli y salsa brava.",
        price: "5,00",
      },
      {
        name: "Nuggets de pollo",
        description: "Caseros, con salsa miel mostaza y barbacoa.",
        price: "6,00",
      },
      {
        name: "Croquetas de jamón",
        description: "Caseras (6 unidades).",
        price: "7,50",
      },
      {
        name: "Croquetas de puerro y queso",
        description: "Caseras (6 unidades).",
        price: "7,50",
      },
    ],
  },
  {
    title: "Rolls",
    items: [
      {
        name: "Sake to Cate",
        description: "Uramaki de salmón con queso crema, aguacate, huevas tobiko y teriyaki.",
        price: "11,00",
      },
      {
        name: "Niku Roll",
        description:
          "Futomaki de solomillo, queso de cabra, cebolla caramelizada y pimiento rojo. Tempurizado, salsa chili dulce.",
        price: "10,00",
      },
    ],
  },
  {
    title: "Guiño al japonés",
    items: [
      {
        name: "Tartar de atún",
        description: "Con guacamole, ajo tierno, aceite de sésamo y alga wakame.",
        price: "10,00",
      },
      {
        name: "Gyozas de pollo",
        description: "Con pimiento rojo y verde, cebolla y salsa chili dulce.",
        price: "8,00",
      },
      {
        name: "Gyozas de verduras",
        description: "Pimiento verde y rojo, zanahoria, cebolla y salsa teriyaki.",
        price: "7,00",
      },
      {
        name: "Pan Bao",
        description: "De carrillera, cebolla morada y cebolla frita (2 unidades).",
        price: "6,50",
      },
    ],
  },
  {
    title: "Tablas",
    items: [
      {
        name: "Tabla de jamón",
        description: "Con pan tumaca.",
        price: "11,00",
      },
      {
        name: "Tabla de quesos",
        description: "Con membrillo.",
        price: "9,00",
      },
    ],
  },
  {
    title: "Postres",
    items: [
      {
        name: "Coulant de chocolate",
        description: "Con helado de vainilla de la Veneciana.",
        price: "6,00",
      },
      {
        name: "Tarta de queso",
        description: "Al horno, con helado de mora de la Veneciana.",
        price: "6,00",
      },
    ],
  },
];
