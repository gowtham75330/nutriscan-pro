export interface NutritionInfo {
  name: string;
  emoji: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goodFat: number;
  badFat: number;
  vitamins: string[];
  minerals: string[];
  healthTip: string;
  /** grams of dietary fiber for the current serving (optional — undefined if unknown) */
  fiber?: number;
  /** grams of sugar for the current serving */
  sugar?: number;
  /** sodium in mg for the current serving */
  sodium?: number;
  /** human-readable serving label, e.g. "1 idli (35g)" */
  servingLabel?: string;
}

export const foodCategories = [
  { key: "all", label: "All", emoji: "🍽️" },
  { key: "fruits", label: "Fruits", emoji: "🍎" },
  { key: "vegetables", label: "Vegetables", emoji: "🥦" },
  { key: "grains", label: "Grains & Bread", emoji: "🍚" },
  { key: "protein", label: "Protein", emoji: "🍗" },
  { key: "dairy", label: "Dairy", emoji: "🥛" },
  { key: "south-indian", label: "South Indian", emoji: "🫓" },
  { key: "north-indian", label: "North Indian", emoji: "🍛" },
  { key: "snacks", label: "Snacks & Fast Food", emoji: "🍕" },
  { key: "drinks", label: "Drinks", emoji: "🧃" },
];

export const nutritionDatabase: Record<string, NutritionInfo> = {
  // === FRUITS ===
  apple: { name: "Apple", emoji: "🍎", category: "fruits", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, goodFat: 0.3, badFat: 0, vitamins: ["C", "K", "B6"], minerals: ["Potassium", "Manganese"], healthTip: "Rich in fiber and antioxidants. An apple a day keeps the doctor away!" },
  banana: { name: "Banana", emoji: "🍌", category: "fruits", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, goodFat: 0.3, badFat: 0.1, vitamins: ["B6", "C", "A"], minerals: ["Potassium", "Magnesium", "Manganese"], healthTip: "Great pre-workout snack! High in potassium for heart and muscle health." },
  orange: { name: "Orange", emoji: "🍊", category: "fruits", calories: 62, protein: 1.2, carbs: 15, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "B1", "B9"], minerals: ["Potassium", "Calcium"], healthTip: "Excellent vitamin C source. Boosts immunity and skin health." },
  mango: { name: "Mango", emoji: "🥭", category: "fruits", calories: 99, protein: 1.4, carbs: 25, fat: 0.6, goodFat: 0.4, badFat: 0.2, vitamins: ["A", "C", "E", "K"], minerals: ["Potassium", "Magnesium"], healthTip: "King of fruits! Rich in vitamin A. Eat in moderation due to natural sugars." },
  grapes: { name: "Grapes", emoji: "🍇", category: "fruits", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "K", "B6"], minerals: ["Potassium", "Copper"], healthTip: "Rich in resveratrol antioxidant. Supports heart health." },
  watermelon: { name: "Watermelon", emoji: "🍉", category: "fruits", calories: 46, protein: 0.9, carbs: 12, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["A", "C", "B5"], minerals: ["Potassium", "Magnesium"], healthTip: "92% water — excellent for hydration! Low calorie and refreshing." },
  papaya: { name: "Papaya", emoji: "🍈", category: "fruits", calories: 59, protein: 0.9, carbs: 15, fat: 0.4, goodFat: 0.3, badFat: 0.1, vitamins: ["C", "A", "B9", "E"], minerals: ["Potassium", "Magnesium", "Calcium"], healthTip: "Contains papain enzyme — great for digestion. Very rich in vitamin C." },
  pomegranate: { name: "Pomegranate", emoji: "🫐", category: "fruits", calories: 83, protein: 1.7, carbs: 19, fat: 1.2, goodFat: 1, badFat: 0.2, vitamins: ["C", "K", "B9"], minerals: ["Potassium", "Manganese"], healthTip: "Powerful antioxidants. Supports heart health and reduces inflammation." },
  pineapple: { name: "Pineapple", emoji: "🍍", category: "fruits", calories: 82, protein: 0.9, carbs: 22, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "B6", "A"], minerals: ["Manganese", "Copper"], healthTip: "Contains bromelain enzyme. Aids digestion and reduces inflammation." },
  guava: { name: "Guava", emoji: "🍐", category: "fruits", calories: 68, protein: 2.6, carbs: 14, fat: 1, goodFat: 0.7, badFat: 0.3, vitamins: ["C", "A", "B3", "B6"], minerals: ["Potassium", "Magnesium"], healthTip: "4x more vitamin C than orange! Great for immunity and skin." },
  coconut: { name: "Coconut", emoji: "🥥", category: "fruits", calories: 354, protein: 3.3, carbs: 15, fat: 33, goodFat: 28, badFat: 5, vitamins: ["B6", "C", "E"], minerals: ["Manganese", "Iron", "Copper"], healthTip: "High in healthy MCT fats. Coconut water is great for hydration." },

  // === VEGETABLES ===
  carrot: { name: "Carrot", emoji: "🥕", category: "vegetables", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["A", "K", "C", "B6"], minerals: ["Potassium", "Biotin"], healthTip: "Excellent for eye health due to beta-carotene. Eat raw or cooked." },
  tomato: { name: "Tomato", emoji: "🍅", category: "vegetables", calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "K", "A", "B9"], minerals: ["Potassium", "Manganese"], healthTip: "Rich in lycopene antioxidant. Cooking increases lycopene absorption." },
  potato: { name: "Potato", emoji: "🥔", category: "vegetables", calories: 161, protein: 4.3, carbs: 37, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "B6", "B3"], minerals: ["Potassium", "Manganese", "Phosphorus"], healthTip: "Good source of energy. Baked or boiled is healthier than fried." },
  onion: { name: "Onion", emoji: "🧅", category: "vegetables", calories: 44, protein: 1.2, carbs: 10, fat: 0.1, goodFat: 0.1, badFat: 0, vitamins: ["C", "B6", "B9"], minerals: ["Potassium", "Manganese"], healthTip: "Contains quercetin — anti-inflammatory. Supports heart health." },
  broccoli: { name: "Broccoli", emoji: "🥦", category: "vegetables", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, goodFat: 0.4, badFat: 0.2, vitamins: ["C", "K", "A", "B9"], minerals: ["Potassium", "Iron", "Calcium"], healthTip: "Superfood! High in fiber and cancer-fighting compounds. Steam for best nutrition." },
  spinach: { name: "Spinach", emoji: "🥬", category: "vegetables", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, goodFat: 0.3, badFat: 0.1, vitamins: ["A", "C", "K", "B9"], minerals: ["Iron", "Calcium", "Magnesium"], healthTip: "Iron-rich superfood. Pair with vitamin C for better iron absorption." },
  beetroot: { name: "Beetroot", emoji: "🟣", category: "vegetables", calories: 44, protein: 1.7, carbs: 10, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "B9", "B6"], minerals: ["Manganese", "Potassium", "Iron"], healthTip: "Improves blood flow and stamina. Great for athletes and heart health." },
  cabbage: { name: "Cabbage", emoji: "🥬", category: "vegetables", calories: 25, protein: 1.3, carbs: 6, fat: 0.1, goodFat: 0.1, badFat: 0, vitamins: ["C", "K", "B6"], minerals: ["Manganese", "Calcium"], healthTip: "Low calorie, high fiber. Great for weight management and gut health." },
  cucumber: { name: "Cucumber", emoji: "🥒", category: "vegetables", calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, goodFat: 0.1, badFat: 0, vitamins: ["K", "C", "A"], minerals: ["Potassium", "Magnesium"], healthTip: "95% water content. Excellent for hydration and cooling the body." },
  mushroom: { name: "Mushroom", emoji: "🍄", category: "vegetables", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, goodFat: 0.2, badFat: 0.1, vitamins: ["D", "B3", "B5", "B2"], minerals: ["Selenium", "Copper", "Potassium"], healthTip: "One of the few natural vitamin D sources. Great meat substitute." },
  "ladies finger": { name: "Ladies Finger (Okra)", emoji: "🌿", category: "vegetables", calories: 33, protein: 1.9, carbs: 7, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "K", "A", "B9"], minerals: ["Magnesium", "Manganese", "Calcium"], healthTip: "Rich in soluble fiber. Helps control blood sugar and cholesterol." },
  "bitter gourd": { name: "Bitter Gourd", emoji: "🥒", category: "vegetables", calories: 17, protein: 1, carbs: 3.7, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["C", "A", "B9"], minerals: ["Potassium", "Zinc", "Iron"], healthTip: "Excellent for controlling blood sugar. Traditional diabetes management food." },
  drumstick: { name: "Drumstick (Moringa)", emoji: "🌿", category: "vegetables", calories: 37, protein: 2.1, carbs: 8.5, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["A", "C", "B2", "B6"], minerals: ["Calcium", "Iron", "Magnesium"], healthTip: "Superfood with 7x more vitamin C than oranges. Great for bones and immunity." },

  // === GRAINS & BREAD ===
  rice: { name: "Rice", emoji: "🍚", category: "grains", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, goodFat: 0.2, badFat: 0.1, vitamins: ["B1", "B3", "B6"], minerals: ["Manganese", "Selenium", "Magnesium"], healthTip: "Good energy source. Choose brown rice for more fiber and nutrients." },
  chapati: { name: "Chapati", emoji: "🫓", category: "grains", calories: 104, protein: 3, carbs: 18, fat: 3, goodFat: 2, badFat: 1, vitamins: ["B1", "B3", "E"], minerals: ["Iron", "Magnesium", "Phosphorus"], healthTip: "Whole wheat — rich in fiber. Great source of complex carbohydrates." },
  bread: { name: "Bread", emoji: "🍞", category: "grains", calories: 79, protein: 2.7, carbs: 15, fat: 1, goodFat: 0.4, badFat: 0.6, vitamins: ["B1", "B3", "B9"], minerals: ["Iron", "Selenium"], healthTip: "Choose whole grain bread for more fiber and nutrients." },
  oats: { name: "Oats", emoji: "🥣", category: "grains", calories: 154, protein: 5.4, carbs: 27, fat: 2.6, goodFat: 2, badFat: 0.6, vitamins: ["B1", "B5", "B9"], minerals: ["Manganese", "Phosphorus", "Iron", "Magnesium"], healthTip: "Heart-healthy! Beta-glucan fiber lowers cholesterol. Great breakfast choice." },
  corn: { name: "Corn", emoji: "🌽", category: "grains", calories: 96, protein: 3.4, carbs: 21, fat: 1.5, goodFat: 1, badFat: 0.5, vitamins: ["B1", "B9", "C"], minerals: ["Magnesium", "Potassium", "Manganese"], healthTip: "Good source of fiber and antioxidants. Boiled corn is healthier than buttered." },

  // === PROTEIN SOURCES ===
  egg: { name: "Egg", emoji: "🥚", category: "protein", calories: 78, protein: 6, carbs: 0.6, fat: 5, goodFat: 3, badFat: 2, vitamins: ["A", "B12", "D", "E"], minerals: ["Selenium", "Zinc", "Iron"], healthTip: "Complete protein with all essential amino acids. Boiled is healthier than fried." },
  chicken: { name: "Chicken", emoji: "🍗", category: "protein", calories: 239, protein: 27, carbs: 0, fat: 14, goodFat: 8, badFat: 6, vitamins: ["B3", "B6", "B12"], minerals: ["Selenium", "Phosphorus", "Zinc"], healthTip: "Lean protein source. Grilled or baked is healthier than fried." },
  fish: { name: "Fish", emoji: "🐟", category: "protein", calories: 206, protein: 22, carbs: 0, fat: 12, goodFat: 10, badFat: 2, vitamins: ["D", "B12", "B3"], minerals: ["Selenium", "Phosphorus", "Iodine"], healthTip: "Excellent omega-3 source. Supports heart and brain health." },
  mutton: { name: "Mutton", emoji: "🥩", category: "protein", calories: 294, protein: 25, carbs: 0, fat: 21, goodFat: 9, badFat: 12, vitamins: ["B12", "B3", "B6"], minerals: ["Iron", "Zinc", "Selenium"], healthTip: "Rich in iron and B12. High in saturated fat — eat in moderation." },
  prawns: { name: "Prawns", emoji: "🦐", category: "protein", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, goodFat: 0.2, badFat: 0.1, vitamins: ["B12", "E", "B3"], minerals: ["Selenium", "Zinc", "Iodine"], healthTip: "Very low in fat, high in protein. Rich in omega-3 and iodine." },
  "soya chunks": { name: "Soya Chunks", emoji: "🫘", category: "protein", calories: 336, protein: 52, carbs: 33, fat: 0.5, goodFat: 0.3, badFat: 0.2, vitamins: ["B1", "B2", "B9", "K"], minerals: ["Iron", "Calcium", "Phosphorus", "Magnesium"], healthTip: "Excellent plant protein! Great meat alternative. Rich in iron and calcium." },
  paneer: { name: "Paneer", emoji: "🧀", category: "protein", calories: 265, protein: 18, carbs: 1.2, fat: 21, goodFat: 9, badFat: 12, vitamins: ["A", "B12", "D"], minerals: ["Calcium", "Phosphorus", "Selenium"], healthTip: "High in protein and calcium. Choose low-fat paneer for fewer calories." },
  tofu: { name: "Tofu", emoji: "🧈", category: "protein", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, goodFat: 3.5, badFat: 1.3, vitamins: ["B1", "B2", "B9"], minerals: ["Calcium", "Iron", "Manganese"], healthTip: "Plant-based protein powerhouse. Low calorie and cholesterol-free." },
  "dal": { name: "Dal (Lentils)", emoji: "🥘", category: "protein", calories: 116, protein: 9, carbs: 20, fat: 0.4, goodFat: 0.2, badFat: 0.2, vitamins: ["B9", "B1", "B6"], minerals: ["Iron", "Manganese", "Phosphorus", "Potassium"], healthTip: "Excellent plant protein. Pair with rice for complete amino acid profile." },

  // === DAIRY ===
  milk: { name: "Milk", emoji: "🥛", category: "dairy", calories: 149, protein: 8, carbs: 12, fat: 8, goodFat: 3, badFat: 5, vitamins: ["A", "D", "B12", "B2"], minerals: ["Calcium", "Phosphorus", "Potassium"], healthTip: "Complete food for strong bones. Choose low-fat for fewer calories." },
  curd: { name: "Curd / Yogurt", emoji: "🥛", category: "dairy", calories: 98, protein: 11, carbs: 3.6, fat: 4.3, goodFat: 2.5, badFat: 1.8, vitamins: ["B2", "B12", "D"], minerals: ["Calcium", "Phosphorus", "Potassium"], healthTip: "Excellent probiotic food. Great for digestion and gut health." },
  buttermilk: { name: "Buttermilk", emoji: "🥤", category: "dairy", calories: 40, protein: 3.3, carbs: 4.8, fat: 0.9, goodFat: 0.5, badFat: 0.4, vitamins: ["B12", "B2", "A"], minerals: ["Calcium", "Potassium", "Phosphorus"], healthTip: "Low calorie probiotic drink. Excellent for digestion especially after meals." },
  ghee: { name: "Ghee", emoji: "🧈", category: "dairy", calories: 112, protein: 0, carbs: 0, fat: 12.7, goodFat: 5, badFat: 7.7, vitamins: ["A", "D", "E", "K"], minerals: ["Calcium"], healthTip: "Pure fat. Use in moderation. Contains butyrate which supports gut health." },
  cheese: { name: "Cheese", emoji: "🧀", category: "dairy", calories: 113, protein: 7, carbs: 0.4, fat: 9, goodFat: 3, badFat: 6, vitamins: ["A", "B12", "B2", "K"], minerals: ["Calcium", "Phosphorus", "Zinc"], healthTip: "High in calcium and protein. Choose aged cheese for probiotics." },

  // === SOUTH INDIAN ===
  dosa: { name: "Dosa", emoji: "🥞", category: "south-indian", calories: 150, protein: 4, carbs: 20, fat: 5, goodFat: 2, badFat: 3, vitamins: ["B-complex", "C"], minerals: ["Iron", "Calcium"], healthTip: "Fermented food with good probiotics. Balanced with sambar and chutney." },
  idli: { name: "Idli", emoji: "🫓", category: "south-indian", calories: 39, protein: 2, carbs: 8, fat: 0.2, goodFat: 0.1, badFat: 0.1, vitamins: ["B1", "B2", "B9"], minerals: ["Iron", "Calcium"], healthTip: "Low calorie fermented food. One of the healthiest breakfast options!" },
  vada: { name: "Vada", emoji: "🍩", category: "south-indian", calories: 179, protein: 6, carbs: 15, fat: 11, goodFat: 4, badFat: 7, vitamins: ["B6", "C", "B1"], minerals: ["Iron", "Potassium", "Magnesium"], healthTip: "Deep fried snack. Rich in protein from dal. Try air-fried for less fat." },
  pongal: { name: "Pongal", emoji: "🍲", category: "south-indian", calories: 150, protein: 4, carbs: 22, fat: 5, goodFat: 3, badFat: 2, vitamins: ["B1", "B3", "B6"], minerals: ["Iron", "Magnesium", "Phosphorus"], healthTip: "Comfort food with rice and lentils. Ven Pongal is lighter than sweet." },
  upma: { name: "Upma", emoji: "🥣", category: "south-indian", calories: 170, protein: 4, carbs: 25, fat: 6, goodFat: 3, badFat: 3, vitamins: ["B1", "B3", "E"], minerals: ["Iron", "Magnesium", "Selenium"], healthTip: "Made from semolina. Add vegetables for extra nutrition." },
  uttapam: { name: "Uttapam", emoji: "🥞", category: "south-indian", calories: 180, protein: 5, carbs: 26, fat: 6, goodFat: 2.5, badFat: 3.5, vitamins: ["B-complex", "C"], minerals: ["Iron", "Calcium"], healthTip: "Thick dosa with vegetables on top. More nutritious than plain dosa." },
  sambar: { name: "Sambar", emoji: "🍲", category: "south-indian", calories: 65, protein: 3.5, carbs: 9, fat: 1.5, goodFat: 1, badFat: 0.5, vitamins: ["C", "B9", "A"], minerals: ["Iron", "Magnesium", "Potassium"], healthTip: "Lentil-vegetable stew. Rich in protein and fiber. Very nutritious!" },
  rasam: { name: "Rasam", emoji: "🥣", category: "south-indian", calories: 30, protein: 1, carbs: 5, fat: 0.5, goodFat: 0.3, badFat: 0.2, vitamins: ["C", "A", "B6"], minerals: ["Iron", "Manganese"], healthTip: "Spiced tamarind soup. Low calorie, aids digestion. Great when you have a cold." },
  puttu: { name: "Puttu", emoji: "🍚", category: "south-indian", calories: 210, protein: 3.5, carbs: 38, fat: 5, goodFat: 4, badFat: 1, vitamins: ["B1", "B3", "E"], minerals: ["Iron", "Manganese"], healthTip: "Steamed rice and coconut. Add less coconut for fewer calories." },
  appam: { name: "Appam", emoji: "🥞", category: "south-indian", calories: 120, protein: 2.5, carbs: 22, fat: 2, goodFat: 1.5, badFat: 0.5, vitamins: ["B-complex", "C"], minerals: ["Iron", "Calcium"], healthTip: "Fermented rice pancake. Light and easy to digest. Pair with stew." },
  "kozhukattai": { name: "Kozhukattai", emoji: "🥟", category: "south-indian", calories: 95, protein: 2, carbs: 18, fat: 1.5, goodFat: 1, badFat: 0.5, vitamins: ["B1", "B6"], minerals: ["Iron", "Calcium"], healthTip: "Steamed rice dumpling. Healthy festival sweet with coconut and jaggery." },
  "lemon rice": { name: "Lemon Rice", emoji: "🍋", category: "south-indian", calories: 180, protein: 3, carbs: 30, fat: 5, goodFat: 3, badFat: 2, vitamins: ["C", "B1", "B6"], minerals: ["Iron", "Manganese"], healthTip: "Tangy flavored rice with turmeric and peanuts. Good travel food." },
  "curd rice": { name: "Curd Rice", emoji: "🍚", category: "south-indian", calories: 150, protein: 5, carbs: 22, fat: 4, goodFat: 2, badFat: 2, vitamins: ["B12", "B2", "C"], minerals: ["Calcium", "Phosphorus"], healthTip: "Cooling probiotic food. Excellent for digestion and summer days." },

  // === NORTH INDIAN ===
  biryani: { name: "Biryani", emoji: "🍛", category: "north-indian", calories: 320, protein: 15, carbs: 40, fat: 12, goodFat: 5, badFat: 7, vitamins: ["B12", "A", "D"], minerals: ["Iron", "Zinc", "Calcium"], healthTip: "Moderate portion recommended. Rich in spices with anti-inflammatory properties." },
  parotta: { name: "Parotta", emoji: "🫓", category: "north-indian", calories: 260, protein: 5, carbs: 35, fat: 12, goodFat: 4, badFat: 8, vitamins: ["B1", "B3"], minerals: ["Iron", "Calcium"], healthTip: "Made with refined flour and oil. Enjoy in moderation." },
  "butter chicken": { name: "Butter Chicken", emoji: "🍛", category: "north-indian", calories: 240, protein: 18, carbs: 8, fat: 15, goodFat: 6, badFat: 9, vitamins: ["A", "B12", "B6", "D"], minerals: ["Iron", "Zinc", "Phosphorus"], healthTip: "Rich and creamy. High in protein but also fat. Pair with roti over naan." },
  "palak paneer": { name: "Palak Paneer", emoji: "🥬", category: "north-indian", calories: 180, protein: 12, carbs: 8, fat: 12, goodFat: 5, badFat: 7, vitamins: ["A", "C", "K", "B12"], minerals: ["Iron", "Calcium", "Magnesium"], healthTip: "Nutritious spinach curry with paneer. Rich in iron and calcium." },
  "chole": { name: "Chole (Chickpea Curry)", emoji: "🥘", category: "north-indian", calories: 210, protein: 9, carbs: 27, fat: 7, goodFat: 4, badFat: 3, vitamins: ["B9", "B6", "C"], minerals: ["Iron", "Manganese", "Phosphorus"], healthTip: "High in plant protein and fiber. Great for vegetarian diets." },
  naan: { name: "Naan", emoji: "🫓", category: "north-indian", calories: 262, protein: 9, carbs: 45, fat: 5, goodFat: 2, badFat: 3, vitamins: ["B1", "B3", "B9"], minerals: ["Iron", "Selenium"], healthTip: "Refined flour bread baked in tandoor. Choose whole wheat naan when possible." },
  "rajma": { name: "Rajma (Kidney Bean Curry)", emoji: "🫘", category: "north-indian", calories: 180, protein: 8, carbs: 25, fat: 5, goodFat: 3, badFat: 2, vitamins: ["B9", "B1", "K"], minerals: ["Iron", "Manganese", "Potassium"], healthTip: "High fiber, high protein. Great vegetarian protein source with rice." },
  "aloo gobi": { name: "Aloo Gobi", emoji: "🥔", category: "north-indian", calories: 130, protein: 3, carbs: 15, fat: 7, goodFat: 4, badFat: 3, vitamins: ["C", "B6", "K"], minerals: ["Potassium", "Manganese"], healthTip: "Potato and cauliflower curry. Moderate calories. Rich in vitamin C." },

  // === SNACKS & FAST FOOD ===
  pizza: { name: "Pizza", emoji: "🍕", category: "snacks", calories: 285, protein: 12, carbs: 36, fat: 10, goodFat: 4, badFat: 6, vitamins: ["A", "B12", "K"], minerals: ["Calcium", "Iron", "Sodium"], healthTip: "High in sodium and saturated fats. Enjoy occasionally with a salad." },
  burger: { name: "Burger", emoji: "🍔", category: "snacks", calories: 354, protein: 20, carbs: 29, fat: 17, goodFat: 6, badFat: 11, vitamins: ["B12", "B6", "Niacin"], minerals: ["Iron", "Zinc", "Phosphorus"], healthTip: "High in saturated fats. Choose grilled over fried, add veggies." },
  samosa: { name: "Samosa", emoji: "🔺", category: "snacks", calories: 262, protein: 4, carbs: 24, fat: 17, goodFat: 5, badFat: 12, vitamins: ["B6", "C"], minerals: ["Potassium", "Iron"], healthTip: "Deep fried — high in bad fats. Try baked samosas as healthier alternative." },
  pasta: { name: "Pasta", emoji: "🍝", category: "snacks", calories: 220, protein: 8, carbs: 43, fat: 1.3, goodFat: 0.5, badFat: 0.8, vitamins: ["B1", "B9", "B3"], minerals: ["Iron", "Manganese", "Selenium"], healthTip: "Choose whole wheat pasta for more fiber. Pair with vegetables." },
  poori: { name: "Poori", emoji: "🫓", category: "snacks", calories: 200, protein: 4, carbs: 23, fat: 10, goodFat: 3, badFat: 7, vitamins: ["B1", "B3"], minerals: ["Iron", "Calcium"], healthTip: "Deep fried bread. Choose chapati as a healthier alternative." },
  "french fries": { name: "French Fries", emoji: "🍟", category: "snacks", calories: 312, protein: 3.4, carbs: 41, fat: 15, goodFat: 4, badFat: 11, vitamins: ["C", "B6", "B3"], minerals: ["Potassium", "Manganese"], healthTip: "Very high in trans fats. Baked fries are a much healthier option." },
  "sandwich": { name: "Sandwich", emoji: "🥪", category: "snacks", calories: 250, protein: 10, carbs: 28, fat: 11, goodFat: 4, badFat: 7, vitamins: ["B1", "B9", "C"], minerals: ["Iron", "Calcium", "Sodium"], healthTip: "Healthy with whole grain bread and veggies. Avoid excess mayo." },
  "cake": { name: "Cake", emoji: "🍰", category: "snacks", calories: 350, protein: 5, carbs: 50, fat: 15, goodFat: 4, badFat: 11, vitamins: ["A", "B2", "E"], minerals: ["Calcium", "Phosphorus"], healthTip: "High in sugar and fat. Enjoy in small portions during celebrations." },
  "ice cream": { name: "Ice Cream", emoji: "🍦", category: "snacks", calories: 207, protein: 3.5, carbs: 24, fat: 11, goodFat: 3, badFat: 8, vitamins: ["A", "B2", "D"], minerals: ["Calcium", "Phosphorus"], healthTip: "High in sugar and fat. Choose fruit-based sorbets for fewer calories." },
  "chocolate": { name: "Chocolate", emoji: "🍫", category: "snacks", calories: 546, protein: 5, carbs: 60, fat: 31, goodFat: 12, badFat: 19, vitamins: ["B2", "B3", "E"], minerals: ["Iron", "Magnesium", "Copper"], healthTip: "Dark chocolate (70%+) has antioxidants. Milk chocolate is high in sugar." },
  salad: { name: "Salad", emoji: "🥗", category: "snacks", calories: 65, protein: 3, carbs: 8, fat: 2, goodFat: 1.5, badFat: 0.5, vitamins: ["A", "C", "K", "E"], minerals: ["Potassium", "Iron", "Folate"], healthTip: "Packed with vitamins and fiber. Keep dressing light for best benefits." },

  // === DRINKS ===
  tea: { name: "Tea", emoji: "🍵", category: "drinks", calories: 50, protein: 0.5, carbs: 10, fat: 1, goodFat: 0.5, badFat: 0.5, vitamins: ["B2", "C"], minerals: ["Manganese", "Potassium"], healthTip: "Contains antioxidants. Green tea has more benefits. Limit sugar." },
  coffee: { name: "Coffee", emoji: "☕", category: "drinks", calories: 70, protein: 1, carbs: 10, fat: 2, goodFat: 1, badFat: 1, vitamins: ["B2", "B3", "B5"], minerals: ["Manganese", "Potassium", "Magnesium"], healthTip: "Boosts metabolism and focus. Limit to 3 cups/day. Black coffee is lowest calorie." },
  "fruit juice": { name: "Fresh Fruit Juice", emoji: "🧃", category: "drinks", calories: 112, protein: 0.5, carbs: 26, fat: 0.3, goodFat: 0.2, badFat: 0.1, vitamins: ["C", "A", "B9"], minerals: ["Potassium", "Magnesium"], healthTip: "Natural sugars. Eat whole fruit for fiber. Avoid added sugar." },
  "coconut water": { name: "Coconut Water", emoji: "🥥", category: "drinks", calories: 46, protein: 1.7, carbs: 9, fat: 0.5, goodFat: 0.4, badFat: 0.1, vitamins: ["C", "B2", "B6"], minerals: ["Potassium", "Sodium", "Magnesium"], healthTip: "Natural electrolyte drink. Better than sports drinks for hydration." },
  lassi: { name: "Lassi", emoji: "🥛", category: "drinks", calories: 150, protein: 5, carbs: 22, fat: 4, goodFat: 2, badFat: 2, vitamins: ["B2", "B12", "D"], minerals: ["Calcium", "Phosphorus", "Potassium"], healthTip: "Probiotic yogurt drink. Salt lassi is healthier than sweet lassi." },
};

// Filename keywords to food database mapping
export const fileNameFoodMapping: Record<string, string> = {
  // Fruits
  "apple": "apple", "banana": "banana", "orange": "orange", "mango": "mango",
  "grapes": "grapes", "grape": "grapes", "watermelon": "watermelon", "water melon": "watermelon",
  "papaya": "papaya", "pomegranate": "pomegranate", "pineapple": "pineapple", "guava": "guava",
  "coconut": "coconut",
  // Vegetables
  "carrot": "carrot", "tomato": "tomato", "potato": "potato", "onion": "onion",
  "broccoli": "broccoli", "spinach": "spinach", "beetroot": "beetroot", "beet root": "beetroot",
  "cabbage": "cabbage", "cucumber": "cucumber", "mushroom": "mushroom",
  "ladies finger": "ladies finger", "okra": "ladies finger", "bhindi": "ladies finger",
  "bitter gourd": "bitter gourd", "karela": "bitter gourd", "pavakkai": "bitter gourd",
  "drumstick": "drumstick", "moringa": "drumstick", "murungai": "drumstick",
  // Grains
  "rice": "rice", "fried rice": "rice", "white rice": "rice", "brown rice": "rice",
  "chapati": "chapati", "chapathi": "chapati", "roti": "chapati",
  "bread": "bread", "toast": "bread",
  "oats": "oats", "oatmeal": "oats",
  "corn": "corn", "maize": "corn",
  // Protein
  "egg": "egg", "omelette": "egg", "omelet": "egg", "boiled egg": "egg",
  "chicken": "chicken", "chicken curry": "chicken", "grilled chicken": "chicken",
  "rotisserie": "chicken", "roast chicken": "chicken", "roasted chicken": "chicken",
  "fish": "fish", "fish curry": "fish", "fish fry": "fish",
  "mutton": "mutton", "mutton curry": "mutton", "lamb": "mutton",
  "prawns": "prawns", "prawn": "prawns", "shrimp": "prawns",
  "soya chunk": "soya chunks", "soya chunks": "soya chunks", "soya": "soya chunks",
  "meal maker": "soya chunks", "mealmaker": "soya chunks",
  "paneer": "paneer", "cottage cheese": "paneer",
  "tofu": "tofu",
  "dal": "dal", "dhal": "dal", "lentil": "dal", "lentils": "dal", "paruppu": "dal",
  // Dairy
  "milk": "milk", "curd": "curd", "yogurt": "curd", "yoghurt": "curd",
  "buttermilk": "buttermilk", "mor": "buttermilk", "chaas": "buttermilk",
  "ghee": "ghee", "nei": "ghee",
  "cheese": "cheese",
  // South Indian
  "dosa": "dosa", "masala dosa": "dosa",
  "idli": "idli", "idly": "idli",
  "vada": "vada", "vadai": "vada", "medu vada": "vada",
  "pongal": "pongal", "ven pongal": "pongal",
  "upma": "upma", "uppuma": "upma",
  "uttapam": "uttapam", "uthappam": "uttapam",
  "sambar": "sambar", "sambhar": "sambar",
  "rasam": "rasam",
  "puttu": "puttu",
  "appam": "appam",
  "kozhukattai": "kozhukattai",
  "lemon rice": "lemon rice",
  "curd rice": "curd rice", "thayir sadam": "curd rice",
  // North Indian
  "biryani": "biryani", "biriyani": "biryani", "briyani": "biryani",
  "parotta": "parotta", "paratha": "parotta", "porotta": "parotta",
  "butter chicken": "butter chicken",
  "palak paneer": "palak paneer",
  "chole": "chole", "chana masala": "chole", "chickpea": "chole",
  "naan": "naan",
  "rajma": "rajma", "kidney bean": "rajma",
  "aloo gobi": "aloo gobi", "alu gobi": "aloo gobi",
  // Snacks
  "pizza": "pizza", "burger": "burger", "hamburger": "burger",
  "samosa": "samosa",
  "pasta": "pasta", "noodle": "pasta", "noodles": "pasta",
  "poori": "poori", "puri": "poori",
  "french fries": "french fries", "fries": "french fries",
  "sandwich": "sandwich",
  "cake": "cake", "pastry": "cake",
  "ice cream": "ice cream", "icecream": "ice cream",
  "chocolate": "chocolate",
  "salad": "salad", "vegetable salad": "salad",
  // Drinks
  "tea": "tea", "chai": "tea",
  "coffee": "coffee", "kaapi": "coffee",
  "fruit juice": "fruit juice", "juice": "fruit juice",
  "coconut water": "coconut water", "ilaneer": "coconut water", "tender coconut": "coconut water",
  "lassi": "lassi",
};

export const portionMultipliers = {
  small: { label: "Small", value: 0.8, emoji: "🤏" },
  medium: { label: "Medium", value: 1.0, emoji: "👌" },
  large: { label: "Large", value: 1.5, emoji: "🤲" },
} as const;

export type PortionSize = keyof typeof portionMultipliers;

import { getExtras } from "./nutritionExtras";

export function calculateNutrition(food: NutritionInfo, portion: PortionSize, foodKey?: string): NutritionInfo {
  const multiplier = portionMultipliers[portion].value;
  const extras = foodKey ? getExtras(foodKey) : null;
  const r = (v: number) => +(v * multiplier).toFixed(1);
  return {
    ...food,
    calories: Math.round(food.calories * multiplier),
    protein: r(food.protein),
    carbs: r(food.carbs),
    fat: r(food.fat),
    goodFat: r(food.goodFat),
    badFat: r(food.badFat),
    fiber: extras ? r(extras.fiber) : food.fiber,
    sugar: extras ? r(extras.sugar) : food.sugar,
    sodium: extras ? Math.round(extras.sodium * multiplier) : food.sodium,
  };
}
