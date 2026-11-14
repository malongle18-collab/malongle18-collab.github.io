/** Built-in starter recipes (read-only). General home-cooking guidance written for this app.
 *  Shape of one entry: R(no, category, prepMins, difficulty, servings, nameZh, nameEn, dietKeys, ingredients, steps, tips)
 *  ingredients: [zh, en, qtyZh, qtyEn]   steps: [zh, en]   tips: [zh, en]
 *  dietKeys: contains "pork" | "beef" | "alcohol" | "fermented" (腐乳/南乳), and "light" for light / low-oil dishes. */

const R = (no, category, prepMins, difficulty, servings, nameZh, nameEn, diet, ings, steps, tips) => ({
  id: `lib-${String(no).padStart(3, "0")}`,
  no,
  builtin: true,
  nameZh,
  nameEn,
  name: nameZh,
  category,
  prepMins,
  difficulty,
  servings,
  diet,
  ingredients: ings.map(([zh, en, qty, qtyEn]) => ({ zh, en, qty: qty || "", qtyEn: qtyEn || qty || "" })),
  steps: steps.map(([zh, en]) => ({ zh, en })),
  tips: { zh: tips[0], en: tips[1] },
  tags: [],
  photo: `images/recipes/lib-${String(no).padStart(3, "0")}.jpg`,
  photos: [`images/recipes/lib-${String(no).padStart(3, "0")}.jpg`],
  notes: tips[0],
  createdAt: "",
  updatedAt: "",
});

export const LIB_RECIPES = [
  R(1, "egg", 15, "easy", "3–4", "蕃茄炒蛋", "Tomato and egg stir-fry", [], [
    ["雞蛋", "Eggs", "4隻", "4"], ["蕃茄", "Tomatoes", "3個", "3"], ["葱", "Spring onion", "1條", "1"], ["油", "Oil", "2湯匙", "2 tbsp"], ["鹽", "Salt", "適量", "to taste"], ["糖", "Sugar", "1茶匙", "1 tsp"],
  ], [
    ["蕃茄切角，葱切粒；雞蛋加少許鹽打勻。", "Cut the tomatoes into wedges, chop the spring onion, and beat the eggs with a pinch of salt."],
    ["燒熱油，倒入蛋液，半熟時推散盛起。", "Heat oil, pour in the eggs, push them into soft curds when half set, and remove."],
    ["原鑊炒蕃茄至出汁軟身，加糖調味。", "In the same pan, cook the tomatoes until soft and juicy, then add the sugar."],
    ["將炒蛋倒回，拌勻，撒上葱粒即可。", "Return the eggs, toss together and finish with the spring onion."],
  ], ["蕃茄先用熱水略燙去皮，口感更滑。", "Blanch the tomatoes briefly in hot water and peel them for a smoother texture."]),

  R(2, "egg", 20, "medium", "2–3", "蒸水蛋", "Steamed egg custard", ["light"], [
    ["雞蛋", "Eggs", "3隻", "3"], ["溫水", "Warm water", "350毫升", "350 ml"], ["鹽", "Salt", "1/4茶匙", "1/4 tsp"], ["生抽", "Light soy sauce", "1茶匙", "1 tsp"], ["葱花", "Chopped spring onion", "少許", "a little"],
  ], [
    ["雞蛋打勻，加入鹽同溫水（約蛋液兩倍份量）拌勻。", "Beat the eggs, then stir in the salt and warm water (about twice the volume of the eggs)."],
    ["過篩入深碟，撇走面層泡泡。", "Strain into a deep dish and skim off any bubbles."],
    ["蓋上碟或錫紙，水滾後以中小火蒸約10至12分鐘，至剛凝固。", "Cover with a plate or foil and steam over medium-low heat for about 10–12 minutes, until just set."],
    ["淋上生抽同葱花。", "Drizzle with soy sauce and sprinkle with spring onion."],
  ], ["蓋住再用小火蒸，蛋面會平滑無蜂窩。", "Keep it covered and use gentle heat for a smooth surface without holes."]),

  R(3, "veg", 10, "easy", "3–4", "蒜蓉炒菜心", "Stir-fried choy sum with garlic", ["light"], [
    ["菜心", "Choy sum", "300克", "300 g"], ["蒜頭", "Garlic", "3瓣", "3 cloves"], ["油", "Oil", "1湯匙", "1 tbsp"], ["鹽", "Salt", "1/2茶匙", "1/2 tsp"], ["水", "Water", "2湯匙", "2 tbsp"],
  ], [
    ["菜心洗淨，切段，瀝乾；蒜頭拍碎。", "Wash and cut the choy sum into sections and drain; crush the garlic."],
    ["燒熱油，爆香蒜蓉。", "Heat the oil and fry the garlic until fragrant."],
    ["放入菜心大火快炒，加鹽同水，蓋上焗約1分鐘。", "Add the choy sum, stir-fry over high heat, add salt and water, then cover for about 1 minute."],
    ["翻勻即可上碟。", "Toss and serve immediately."],
  ], ["菜要瀝乾，炒出嚟先唔會太多水。", "Drain the vegetables well so the dish is not watery."]),

  R(4, "meat", 25, "medium", "3–4", "薑葱炒牛肉", "Beef with ginger and spring onion", ["beef"], [
    ["牛柳或牛肉片", "Beef slices", "250克", "250 g"], ["薑", "Ginger", "5片", "5 slices"], ["葱", "Spring onion", "3條", "3"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["生粉", "Cornflour", "1茶匙", "1 tsp"], ["糖", "Sugar", "1/2茶匙", "1/2 tsp"], ["油", "Oil", "2湯匙", "2 tbsp"],
  ], [
    ["牛肉逆紋切片，用生抽、生粉、糖同少許油醃約15分鐘。", "Slice the beef against the grain and marinate with soy sauce, cornflour, sugar and a little oil for about 15 minutes."],
    ["葱切段，薑切絲。", "Cut the spring onion into lengths and shred the ginger."],
    ["大火燒熱油，下牛肉快炒至轉色，盛起。", "Heat oil over high heat, stir-fry the beef until it changes colour, and set aside."],
    ["爆香薑葱，倒回牛肉，快手炒勻即可。", "Fry the ginger and spring onion, return the beef and toss briefly."],
  ], ["牛肉唔好炒太耐，否則會韌。", "Do not overcook the beef or it becomes tough."]),

  R(5, "meat", 30, "easy", "3–4", "豉汁蒸排骨", "Steamed pork ribs with black bean sauce", ["pork"], [
    ["排骨", "Pork spare ribs", "400克", "400 g"], ["豆豉", "Fermented black beans", "1湯匙", "1 tbsp"], ["蒜頭", "Garlic", "3瓣", "3 cloves"], ["薑", "Ginger", "3片", "3 slices"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["生粉", "Cornflour", "1湯匙", "1 tbsp"], ["糖", "Sugar", "1茶匙", "1 tsp"], ["油", "Oil", "1湯匙", "1 tbsp"],
  ], [
    ["排骨洗淨，浸水約20分鐘去血水，瀝乾。", "Rinse the ribs, soak in water for about 20 minutes to draw out blood, and drain."],
    ["豆豉、蒜蓉、薑絲同調味拌勻，加入排骨同生粉抓勻。", "Mix the black beans, garlic, ginger and seasonings, then toss the ribs and cornflour through."],
    ["放入碟中，水滾後大火蒸約20至25分鐘至熟透。", "Place on a plate and steam over high heat for about 20–25 minutes, until cooked through."],
    ["可撒上葱花。", "Sprinkle with spring onion if you like."],
  ], ["排骨切細件會易熟，蒸前拌少許油更滑。", "Smaller pieces cook faster; a little oil mixed in keeps them tender."]),

  R(6, "staple", 25, "easy", "3–4", "粟米肉粒飯", "Diced pork and sweetcorn rice", ["pork"], [
    ["梅頭豬肉", "Pork shoulder", "200克", "200 g"], ["粟米粒", "Sweetcorn kernels", "1杯", "1 cup"], ["洋葱", "Onion", "半個", "1/2"], ["飯", "Cooked rice", "3碗", "3 bowls"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["油", "Oil", "2湯匙", "2 tbsp"], ["鹽", "Salt", "適量", "to taste"],
  ], [
    ["豬肉切粒，用生抽同少許生粉醃10分鐘；洋葱切粒。", "Dice the pork and marinate with soy sauce and a little cornflour for 10 minutes; dice the onion."],
    ["起鑊落油，炒豬肉至熟透盛起。", "Heat oil and cook the pork until done; set aside."],
    ["炒香洋葱，加入粟米同冷飯炒散。", "Fry the onion, then add the corn and cold rice and break up the rice."],
    ["倒回肉粒，加鹽調味，炒勻。", "Add the pork back, season with salt and toss."],
  ], ["用隔夜飯炒會更乾身、粒粒分明。", "Day-old rice gives drier, separate grains."]),

  R(7, "poultry", 20, "easy", "3–4", "西蘭花炒雞柳", "Chicken strips with broccoli", ["light"], [
    ["雞胸肉", "Chicken breast", "250克", "250 g"], ["西蘭花", "Broccoli", "1個", "1 head"], ["蒜頭", "Garlic", "2瓣", "2 cloves"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["生粉", "Cornflour", "1茶匙", "1 tsp"], ["油", "Oil", "1湯匙", "1 tbsp"], ["鹽", "Salt", "1/2茶匙", "1/2 tsp"],
  ], [
    ["雞胸切條，用生抽同生粉醃10分鐘。", "Cut the chicken into strips and marinate with soy sauce and cornflour for 10 minutes."],
    ["西蘭花切小朵，滾水加少許鹽灼約1分鐘，過冷河。", "Cut the broccoli into florets, blanch in salted boiling water for about 1 minute and rinse under cold water."],
    ["燒熱油，爆香蒜蓉，炒雞柳至熟透。", "Heat the oil, fry the garlic and cook the chicken until it is cooked through."],
    ["加入西蘭花同鹽，炒勻上碟。", "Add the broccoli and salt, toss and serve."],
  ], ["雞肉要確保中心熟透，無粉紅色。", "Make sure the chicken is cooked through with no pink in the centre."]),

  R(8, "fish", 25, "medium", "3–4", "清蒸魚", "Steamed whole fish", ["light"], [
    ["魚（鱸魚、鯇魚或石斑）", "Whole fish (sea bass, grass carp or grouper)", "1條約500克", "1 fish, about 500 g"], ["薑", "Ginger", "5片", "5 slices"], ["葱", "Spring onion", "3條", "3"], ["蒸魚豉油", "Seasoned soy sauce for fish", "2湯匙", "2 tbsp"], ["油", "Oil", "2湯匙", "2 tbsp"],
  ], [
    ["魚洗淨抹乾，魚身墊上薑片，放碟上。", "Clean and pat dry the fish, then place on a plate over a few slices of ginger."],
    ["水大滾後放入蒸約8至10分鐘（約500克魚），按魚大小調整，至魚眼凸出、魚肉熟透。", "Steam over rapidly boiling water for about 8–10 minutes (for ~500 g), adjusting to size, until the flesh is opaque and cooked through."],
    ["倒走碟中水分，鋪上葱絲同薑絲。", "Pour away the liquid, then top with shredded spring onion and ginger."],
    ["燒熱油淋上，再淋蒸魚豉油。", "Heat the oil until very hot, pour it over, then add the soy sauce."],
  ], ["一定要水滾先放魚，肉質先嫩滑。", "Always start steaming once the water is boiling for tender flesh."]),

  R(9, "soup", 40, "easy", "3–4", "蕃茄薯仔湯", "Tomato and potato soup", ["light"], [
    ["蕃茄", "Tomatoes", "3個", "3"], ["薯仔", "Potatoes", "2個", "2"], ["洋葱", "Onion", "半個", "1/2"], ["水", "Water", "1.2公升", "1.2 L"], ["鹽", "Salt", "適量", "to taste"], ["油", "Oil", "1茶匙", "1 tsp"],
  ], [
    ["蕃茄切角，薯仔去皮切塊，洋葱切絲。", "Cut the tomatoes into wedges, peel and chunk the potatoes, and slice the onion."],
    ["落少許油，炒香洋葱同蕃茄至出汁。", "Fry the onion and tomatoes in a little oil until juicy."],
    ["加水同薯仔，煮滾後轉中小火煮約25分鐘至薯仔軟。", "Add the water and potatoes, bring to the boil and simmer for about 25 minutes until the potatoes are soft."],
    ["落鹽調味。", "Season with salt."],
  ], ["想濃啲可以將部分薯仔壓爛。", "Mash a few pieces of potato to thicken the soup."]),

  R(10, "soup", 90, "medium", "4–5", "羅宋湯", "Hong Kong-style borscht", ["beef"], [
    ["牛腩", "Beef brisket", "300克", "300 g"], ["蕃茄", "Tomatoes", "3個", "3"], ["椰菜", "Cabbage", "1/4個", "1/4"], ["洋葱", "Onion", "1個", "1"], ["薯仔", "Potato", "1個", "1"], ["紅蘿蔔", "Carrot", "1條", "1"], ["茄汁", "Ketchup", "2湯匙", "2 tbsp"], ["水", "Water", "1.5公升", "1.5 L"],
  ], [
    ["牛腩切塊，冷水落鍋煮滾，撇去浮沫，沖淨。", "Cut the brisket into pieces, bring to the boil from cold water, skim and rinse."],
    ["牛腩加1.5公升水煮滾，轉小火煲約1小時至軟。", "Simmer the brisket in 1.5 L water for about 1 hour until tender."],
    ["蔬菜切塊，連蕃茄加入再煮約25分鐘。", "Add the chopped vegetables and tomatoes and cook for another 25 minutes."],
    ["加入茄汁同鹽調味。", "Stir in the ketchup and season with salt."],
  ], ["湯放過夜更入味，翌日翻熱更好飲。", "The soup tastes even better reheated the next day."]),

  R(11, "soup", 120, "easy", "4–5", "粟米紅蘿蔔豬骨湯", "Slow-simmered pork bone soup with corn and carrot", ["pork"], [
    ["豬骨", "Pork bones", "400克", "400 g"], ["粟米", "Corn on the cob", "2條", "2"], ["紅蘿蔔", "Carrots", "2條", "2"], ["薑", "Ginger", "3片", "3 slices"], ["水", "Water", "2公升", "2 L"], ["鹽", "Salt", "適量", "to taste"],
  ], [
    ["豬骨冷水落鍋煮滾，焯水後沖淨。", "Boil the pork bones from cold water, then drain and rinse."],
    ["粟米切段，紅蘿蔔切塊。", "Cut the corn into sections and the carrots into chunks."],
    ["所有材料放入煲內，加2公升水同薑片，煮滾後轉小火煲約1.5小時。", "Put everything in a pot with 2 L water and ginger, bring to the boil and simmer for about 1.5 hours."],
    ["落鹽調味。", "Season with salt."],
  ], ["用慢煮鍋或電壓力煲都可以，要按說明書使用。", "A slow cooker or pressure cooker works too; follow its manual."]),

  R(12, "poultry", 40, "easy", "3–4", "瑞士雞翼", "Sweet soy braised chicken wings", [], [
    ["雞中翼", "Chicken mid-wings", "10隻", "10"], ["生抽", "Light soy sauce", "3湯匙", "3 tbsp"], ["老抽", "Dark soy sauce", "1湯匙", "1 tbsp"], ["冰糖或砂糖", "Rock sugar or sugar", "1湯匙", "1 tbsp"], ["薑", "Ginger", "3片", "3 slices"], ["水", "Water", "200毫升", "200 ml"],
  ], [
    ["雞翼洗淨，焯水撇去浮沫。", "Rinse the wings and blanch briefly, skimming the foam."],
    ["水、生抽、老抽、糖同薑煮滾成滷汁。", "Bring the water, both soy sauces, sugar and ginger to the boil for the braising liquid."],
    ["放入雞翼，轉中小火煮約20分鐘至熟透，期間翻轉。", "Add the wings and simmer for about 20 minutes, turning, until cooked through."],
    ["最後大火收汁至濃稠。", "Reduce the sauce over high heat until glossy."],
  ], ["收汁時要不停翻動，以免燶底。", "Keep turning while reducing so the sauce does not burn."]),

  R(13, "poultry", 40, "easy", "4", "咖喱雞", "Curry chicken", [], [
    ["雞髀", "Chicken thighs", "500克", "500 g"], ["薯仔", "Potatoes", "2個", "2"], ["洋葱", "Onion", "1個", "1"], ["咖喱粉或咖喱塊", "Curry powder or curry roux", "2湯匙", "2 tbsp"], ["椰漿（可選）", "Coconut milk (optional)", "半罐", "1/2 can"], ["水", "Water", "400毫升", "400 ml"], ["油", "Oil", "2湯匙", "2 tbsp"],
  ], [
    ["雞髀斬件，薯仔去皮切塊，洋葱切絲。", "Chop the chicken, peel and chunk the potatoes and slice the onion."],
    ["落油炒洋葱至軟，加咖喱粉炒香。", "Soften the onion in oil and fry the curry powder until fragrant."],
    ["加入雞肉炒至轉色，倒入水同薯仔，煮滾後轉小火煮約25分鐘。", "Add the chicken until it changes colour, pour in the water and potatoes, and simmer for about 25 minutes."],
    ["如用椰漿，最後拌入再煮3分鐘。", "If using coconut milk, stir it in for the last 3 minutes."],
  ], ["小朋友食可以少用辣味咖喱粉。", "Use a mild curry powder if children are eating."]),

  R(14, "egg", 10, "easy", "2", "腸仔煎蛋", "Sausage and fried egg", ["pork"], [
    ["腸仔", "Sausages", "4條", "4"], ["雞蛋", "Eggs", "2隻", "2"], ["油", "Oil", "1湯匙", "1 tbsp"], ["生抽", "Light soy sauce", "少許", "a dash"],
  ], [
    ["腸仔切花紋，落少許油用中火煎至表面金黃。", "Score the sausages and pan-fry in a little oil over medium heat until golden."],
    ["撥開腸仔，打入雞蛋煎至蛋白凝固（可翻面煎至熟透）。", "Push the sausages aside, crack in the eggs and fry until the whites set, flipping if you want the yolks firm."],
    ["淋少許生抽，即可上碟。", "Add a dash of soy sauce and serve."],
  ], ["腸仔要煎熟透先食。", "Cook the sausages thoroughly before serving."]),

  R(15, "staple", 20, "easy", "2", "火腿煎蛋通粉", "Macaroni soup with ham and egg", ["pork"], [
    ["通粉", "Macaroni", "100克", "100 g"], ["火腿片", "Ham slices", "2片", "2"], ["雞蛋", "Eggs", "2隻", "2"], ["清湯或水加雞粉", "Stock, or water with stock powder", "700毫升", "700 ml"], ["油", "Oil", "1茶匙", "1 tsp"],
  ], [
    ["清湯煮滾，放入通粉，按包裝時間煮至軟。", "Bring the stock to the boil and cook the macaroni for the time on the pack."],
    ["同時用少許油煎蛋至熟，火腿略煎。", "Meanwhile fry the eggs in a little oil until cooked and warm the ham."],
    ["通粉連湯盛入碗，放上火腿同煎蛋。", "Ladle the macaroni and soup into bowls and top with ham and egg."],
  ], ["湯底可以加幾片菜心同洋葱，更豐富。", "Add some choy sum or onion to the soup for extra flavour."]),

  R(16, "egg", 15, "easy", "3", "蝦仁炒蛋", "Prawns with scrambled eggs", [], [
    ["蝦仁", "Peeled prawns", "150克", "150 g"], ["雞蛋", "Eggs", "4隻", "4"], ["葱花", "Chopped spring onion", "1湯匙", "1 tbsp"], ["鹽", "Salt", "適量", "to taste"], ["生粉", "Cornflour", "1茶匙", "1 tsp"], ["油", "Oil", "2湯匙", "2 tbsp"],
  ], [
    ["蝦仁用鹽同生粉抓勻，沖淨瀝乾。", "Toss the prawns with salt and cornflour, rinse and drain."],
    ["雞蛋打勻，加少許鹽。", "Beat the eggs with a pinch of salt."],
    ["落油炒蝦仁至轉紅熟透，盛起。", "Stir-fry the prawns in oil until pink and cooked through; set aside."],
    ["原鑊倒入蛋液，半凝固時加回蝦仁同葱花，輕手炒勻。", "Pour in the eggs, and when half set return the prawns and spring onion, folding gently."],
  ], ["蛋不要炒到太乾，保持嫩滑。", "Do not overcook the eggs; keep them soft."]),

  R(17, "poultry", 30, "easy", "3–4", "豉油煎雞髀", "Pan-fried soy chicken thighs", [], [
    ["去骨雞髀", "Boneless chicken thighs", "4件", "4"], ["生抽", "Light soy sauce", "2湯匙", "2 tbsp"], ["蜜糖或糖", "Honey or sugar", "1茶匙", "1 tsp"], ["蒜頭", "Garlic", "2瓣", "2 cloves"], ["油", "Oil", "1湯匙", "1 tbsp"],
  ], [
    ["雞髀用生抽、蜜糖同蒜蓉醃最少30分鐘（可放雪櫃）。", "Marinate the chicken with soy sauce, honey and garlic for at least 30 minutes in the fridge."],
    ["平底鑊落油，雞皮向下用中火煎約6分鐘至金黃。", "Fry skin side down in oil over medium heat for about 6 minutes until golden."],
    ["翻面再煎6至8分鐘，確保中心熟透，無粉紅肉汁。", "Flip and fry another 6–8 minutes, until cooked through with clear juices."],
    ["切件，配飯同青菜。", "Slice and serve with rice and greens."],
  ], ["煎的時候唔好太猛火，否則外燶內生。", "Keep the heat moderate so the outside does not burn before the inside is done."]),

  R(18, "egg", 25, "medium", "3–4", "麻婆豆腐", "Mapo tofu", ["pork"], [
    ["嫩豆腐", "Soft tofu", "1盒", "1 block"], ["免治豬肉", "Minced pork", "100克", "100 g"], ["豆瓣醬", "Chilli bean paste", "1湯匙", "1 tbsp"], ["蒜頭", "Garlic", "2瓣", "2 cloves"], ["生抽", "Light soy sauce", "1茶匙", "1 tsp"], ["生粉水", "Cornflour slurry", "2湯匙", "2 tbsp"], ["葱花", "Chopped spring onion", "1湯匙", "1 tbsp"],
  ], [
    ["豆腐切方粒，用淡鹽水浸5分鐘，瀝乾。", "Cube the tofu, soak in lightly salted water for 5 minutes and drain."],
    ["落油炒香蒜蓉同豆瓣醬，加入免治豬肉炒至熟透。", "Fry the garlic and chilli bean paste, then cook the minced pork until done."],
    ["加半杯水同生抽，煮滾後放入豆腐，輕輕推勻煮3分鐘。", "Add half a cup of water and soy sauce, bring to the boil and gently stir in the tofu for 3 minutes."],
    ["慢慢加入生粉水勾芡，撒上葱花。", "Thicken with the slurry and sprinkle with spring onion."],
  ], ["不食辣可減少豆瓣醬份量。", "Use less chilli bean paste if you do not eat spicy food."]),

  R(19, "meat", 35, "easy", "3–4", "冬菇蒸肉餅", "Steamed pork patty with mushrooms", ["pork"], [
    ["免治豬肉", "Minced pork", "300克", "300 g"], ["冬菇", "Dried shiitake mushrooms", "3朵", "3"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["生粉", "Cornflour", "1茶匙", "1 tsp"], ["水", "Water", "3湯匙", "3 tbsp"], ["薑絲", "Shredded ginger", "少許", "a little"],
  ], [
    ["冬菇浸軟，去蒂切粒。", "Soak the mushrooms until soft, trim the stems and dice."],
    ["豬肉加冬菇、生抽、生粉、水同薑絲，順一方向拌至起膠。", "Mix the pork with mushrooms, soy sauce, cornflour, water and ginger, stirring in one direction until sticky."],
    ["鋪平在碟上，水滾後蒸約15分鐘至熟透。", "Spread on a plate and steam for about 15 minutes until cooked through."],
  ], ["加少少水份，肉餅更嫩滑。", "A little added water keeps the patty tender."]),

  R(20, "poultry", 45, "medium", "4", "薯仔燜雞", "Braised chicken with potatoes", [], [
    ["雞件", "Chicken pieces", "600克", "600 g"], ["薯仔", "Potatoes", "2個", "2"], ["紅蘿蔔", "Carrot", "1條", "1"], ["薑", "Ginger", "3片", "3 slices"], ["生抽", "Light soy sauce", "2湯匙", "2 tbsp"], ["老抽", "Dark soy sauce", "1茶匙", "1 tsp"], ["水", "Water", "300毫升", "300 ml"],
  ], [
    ["雞件洗淨，薯仔同紅蘿蔔切塊。", "Rinse the chicken and chunk the potatoes and carrot."],
    ["落油爆香薑片，煎雞件至表面金黃。", "Fry the ginger and sear the chicken until golden."],
    ["加生抽、老抽同水，煮滾後蓋上，轉小火燜15分鐘。", "Add both soy sauces and water, bring to the boil, cover and simmer for 15 minutes."],
    ["加入薯仔同紅蘿蔔再燜約15分鐘，至雞肉同薯仔軟身。", "Add the potato and carrot and cook another 15 minutes until everything is tender."],
  ], ["最後打開鍋蓋收汁，味道更濃。", "Uncover at the end to thicken the sauce."]),

  R(21, "poultry", 30, "easy", "3–4", "薑絲冬菇蒸雞", "Steamed chicken with ginger and mushrooms", ["light"], [
    ["雞件", "Chicken pieces", "500克", "500 g"], ["冬菇", "Dried shiitake mushrooms", "4朵", "4"], ["薑絲", "Shredded ginger", "1湯匙", "1 tbsp"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["生粉", "Cornflour", "1茶匙", "1 tsp"], ["油", "Oil", "1茶匙", "1 tsp"],
  ], [
    ["冬菇浸軟切片；雞件用生抽、生粉、油同薑絲醃15分鐘。", "Soak and slice the mushrooms; marinate the chicken with soy sauce, cornflour, oil and ginger for 15 minutes."],
    ["將冬菇鋪底，雞件放上。", "Spread the mushrooms on the plate and put the chicken on top."],
    ["水滾後大火蒸約18至20分鐘，確保雞肉熟透。", "Steam over high heat for about 18–20 minutes until the chicken is cooked through."],
  ], ["可以淋上少許蒸出嚟嘅汁拌飯。", "Spoon the steaming juices over rice."]),

  R(22, "egg", 15, "easy", "3", "菜脯蛋", "Preserved radish omelette", [], [
    ["雞蛋", "Eggs", "4隻", "4"], ["菜脯粒", "Chopped preserved radish", "3湯匙", "3 tbsp"], ["葱花", "Chopped spring onion", "1湯匙", "1 tbsp"], ["油", "Oil", "2湯匙", "2 tbsp"],
  ], [
    ["菜脯粒洗淨，擠乾水份。", "Rinse the preserved radish and squeeze dry."],
    ["雞蛋打勻，加入菜脯同葱花（菜脯已有鹹味，不需再落鹽）。", "Beat the eggs and mix in the radish and spring onion; no extra salt is needed."],
    ["燒熱油，倒入蛋液，中火煎至一面金黃，翻面再煎熟。", "Heat oil, pour in the mixture and fry until golden, then flip and cook through."],
  ], ["菜脯較鹹，洗得乾淨啲再用。", "Rinse the radish well as it is quite salty."]),

  R(23, "meat", 120, "medium", "4", "蕃茄牛腩", "Tomato beef brisket stew", ["beef"], [
    ["牛腩", "Beef brisket", "500克", "500 g"], ["蕃茄", "Tomatoes", "4個", "4"], ["洋葱", "Onion", "1個", "1"], ["薑", "Ginger", "3片", "3 slices"], ["生抽", "Light soy sauce", "2湯匙", "2 tbsp"], ["茄膏或茄汁", "Tomato paste or ketchup", "1湯匙", "1 tbsp"], ["水", "Water", "800毫升", "800 ml"],
  ], [
    ["牛腩切塊，冷水落鍋煮滾，撇去浮沫後沖淨。", "Cut the brisket into chunks, bring to the boil from cold water, then skim and rinse."],
    ["用少許油爆香薑同洋葱，加入牛腩炒香。", "Fry the ginger and onion in a little oil, then add the brisket."],
    ["加水、生抽同蕃茄，煮滾後轉小火煲約1.5小時至牛腩軟腍。", "Add water, soy sauce and tomatoes, then simmer for about 1.5 hours until tender."],
    ["加茄膏調味，收汁。", "Stir in the tomato paste and reduce slightly."],
  ], ["可以一次煮多啲，分裝放雪櫃。", "Make a bigger batch and store portions in the fridge."]),

  R(24, "staple", 15, "easy", "2–3", "蛋炒飯", "Egg fried rice", [], [
    ["隔夜飯", "Day-old cooked rice", "3碗", "3 bowls"], ["雞蛋", "Eggs", "3隻", "3"], ["葱花", "Chopped spring onion", "2湯匙", "2 tbsp"], ["油", "Oil", "2湯匙", "2 tbsp"], ["鹽", "Salt", "適量", "to taste"], ["生抽", "Light soy sauce", "1茶匙", "1 tsp"],
  ], [
    ["飯用手撥散；雞蛋打勻。", "Break up the rice with your hands and beat the eggs."],
    ["燒熱油，倒入蛋液炒至半熟。", "Heat the oil and scramble the eggs until half set."],
    ["加入白飯大火炒散至熱透。", "Add the rice and stir-fry over high heat until piping hot."],
    ["加鹽、生抽同葱花，炒勻。", "Season with salt and soy sauce, add spring onion and toss."],
  ], ["飯要冷，鑊要夠熱，先會乾身。", "Cold rice and a hot wok give the best texture."]),

  R(25, "fish", 15, "easy", "3", "蒜蓉蒸蝦", "Steamed prawns with garlic", ["light"], [
    ["大蝦", "Large prawns", "8隻", "8"], ["蒜頭", "Garlic", "5瓣", "5 cloves"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["油", "Oil", "2湯匙", "2 tbsp"], ["葱花", "Chopped spring onion", "1湯匙", "1 tbsp"],
  ], [
    ["蝦剪去鬚腳，背部開邊挑去蝦腸，洗淨。", "Trim the prawns, slit the back and remove the vein, then rinse."],
    ["蒜蓉用少許油炒至微黃，加生抽拌勻。", "Fry the garlic in a little oil until pale golden and stir in the soy sauce."],
    ["蝦排碟上，鋪蒜蓉，水滾後蒸約5至6分鐘至轉紅熟透。", "Arrange on a plate, top with garlic and steam for about 5–6 minutes until pink and cooked through."],
    ["撒上葱花。", "Sprinkle with spring onion."],
  ], ["蝦蒸過頭會變老，變紅即可。", "Do not oversteam; prawns turn tough."]),

  R(26, "soup", 120, "easy", "4–5", "冬瓜薏米瘦肉湯", "Winter melon and barley soup with lean pork", ["pork"], [
    ["冬瓜", "Winter melon", "500克", "500 g"], ["瘦肉", "Lean pork", "250克", "250 g"], ["薏米", "Pearl barley", "30克", "30 g"], ["薑", "Ginger", "3片", "3 slices"], ["水", "Water", "2公升", "2 L"], ["鹽", "Salt", "適量", "to taste"],
  ], [
    ["瘦肉洗淨，冷水煮滾焯水；薏米洗淨。", "Boil the pork from cold water to blanch and rinse; wash the barley."],
    ["冬瓜連皮切大塊。", "Cut the winter melon into big chunks, skin on."],
    ["全部材料放入煲內，煮滾後轉小火煲約1.5小時。", "Put everything in a pot, bring to the boil and simmer for about 1.5 hours."],
    ["落鹽調味。", "Season with salt."],
  ], ["懷孕或有特別體質者，使用中式湯料前請先問醫生。", "If pregnant or under medical care, check with a doctor before using herbal ingredients."]),

  R(27, "fish", 20, "easy", "2", "香煎三文魚", "Pan-fried salmon", ["light"], [
    ["三文魚扒", "Salmon fillets", "2塊", "2"], ["鹽", "Salt", "1/4茶匙", "1/4 tsp"], ["黑胡椒", "Black pepper", "少許", "a little"], ["檸檬", "Lemon", "半個", "1/2"], ["油", "Oil", "1茶匙", "1 tsp"],
  ], [
    ["魚扒用廚紙抹乾，兩面撒鹽同黑胡椒。", "Pat the salmon dry and season both sides with salt and pepper."],
    ["平底鑊燒熱，落少許油，魚皮向下中火煎約4分鐘至脆。", "Heat a pan with a little oil and fry skin side down over medium heat for about 4 minutes until crisp."],
    ["翻面再煎2至3分鐘，確保熟透。", "Flip and cook 2–3 minutes more until cooked through."],
    ["擠上檸檬汁。", "Squeeze lemon over the top."],
  ], ["煎的時候唔好經常郁魚，先唔會散。", "Leave the fish alone while it sears so it does not break up."]),

  R(28, "veg", 8, "easy", "3", "蠔油生菜", "Blanched lettuce with oyster sauce", ["light"], [
    ["生菜", "Lettuce", "1個", "1 head"], ["蠔油", "Oyster sauce", "1湯匙", "1 tbsp"], ["油", "Oil", "1茶匙", "1 tsp"], ["蒜頭", "Garlic", "2瓣", "2 cloves"],
  ], [
    ["生菜洗淨，撕成大片。", "Wash and tear the lettuce into large pieces."],
    ["滾水加少許油同鹽，放入生菜灼約30秒，瀝乾上碟。", "Blanch in boiling water with a little oil and salt for about 30 seconds, drain and plate."],
    ["蒜蓉用少許油炒香，加蠔油同少許水煮滾，淋在生菜上。", "Fry the garlic in a little oil, add oyster sauce and a splash of water, bring to the boil and pour over."],
  ], ["灼菜時間短，保持爽脆。", "Blanch briefly to keep it crisp."]),

  R(29, "veg", 10, "easy", "3", "涼拌青瓜", "Smashed cucumber salad", ["light"], [
    ["青瓜", "Cucumbers", "2條", "2"], ["蒜頭", "Garlic", "2瓣", "2 cloves"], ["醋", "Vinegar", "1湯匙", "1 tbsp"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["麻油", "Sesame oil", "1茶匙", "1 tsp"], ["糖", "Sugar", "1茶匙", "1 tsp"],
  ], [
    ["青瓜洗淨，用刀拍裂後切塊，加少許鹽醃10分鐘，倒走水份。", "Wash the cucumbers, smash and cut into pieces, salt for 10 minutes and pour off the liquid."],
    ["蒜頭切碎，同醋、生抽、糖同麻油拌成汁。", "Mince the garlic and mix with vinegar, soy sauce, sugar and sesame oil."],
    ["淋在青瓜上拌勻，雪櫃冷藏後更好食。", "Toss together and chill before serving."],
  ], ["吃前才拌，青瓜更爽脆。", "Dress just before eating to keep it crunchy."]),

  R(30, "staple", 60, "easy", "3–4", "皮蛋瘦肉粥", "Congee with lean pork and century egg", ["pork"], [
    ["白米", "Rice", "1杯", "1 cup"], ["瘦肉", "Lean pork", "150克", "150 g"], ["皮蛋", "Century egg", "2隻", "2"], ["薑絲", "Shredded ginger", "少許", "a little"], ["水", "Water", "2公升", "2 L"], ["鹽", "Salt", "適量", "to taste"],
  ], [
    ["白米洗淨，加少許油同鹽拌勻；瘦肉切絲，用少許生抽同生粉醃10分鐘。", "Rinse the rice and mix with a little oil and salt; shred the pork and marinate with a little soy sauce and cornflour for 10 minutes."],
    ["水煮滾，放入米煮滾後轉小火，煮約45分鐘至稀爛，期間要攪拌。", "Bring the water to the boil, add the rice and simmer for about 45 minutes until soft and creamy, stirring now and then."],
    ["放入瘦肉、薑絲同切碎皮蛋，煮至肉熟透，落鹽調味。", "Add the pork, ginger and chopped century egg and cook until the pork is done; season with salt."],
  ], ["粥要煮至勻身，可預先浸米縮短時間。", "Soak the rice in advance to shorten cooking time."]),

  R(31, "veg", 10, "easy", "3", "腐乳炒通菜", "Water spinach with fermented bean curd", ["fermented"], [
    ["通菜", "Water spinach", "300克", "300 g"], ["腐乳", "Fermented bean curd", "1塊", "1 cube"], ["蒜頭", "Garlic", "2瓣", "2 cloves"], ["油", "Oil", "1湯匙", "1 tbsp"], ["水", "Water", "2湯匙", "2 tbsp"],
  ], [
    ["通菜洗淨切段；腐乳壓爛，加少許水調勻。", "Wash and cut the water spinach; mash the bean curd with a little water."],
    ["燒熱油爆香蒜蓉，放入通菜大火炒。", "Fry the garlic in hot oil, add the water spinach and stir-fry over high heat."],
    ["加入腐乳汁，炒至菜軟身即可。", "Add the bean curd mixture and cook until the leaves are wilted."],
  ], ["腐乳已有鹹味，通常唔使再加鹽。", "The bean curd is salty, so extra salt is usually unnecessary."]),

  R(32, "poultry", 40, "medium", "3–4", "花雕蒸雞", "Steamed chicken with Shaoxing wine", ["alcohol"], [
    ["雞件", "Chicken pieces", "500克", "500 g"], ["花雕酒或紹興酒", "Shaoxing wine", "2湯匙", "2 tbsp"], ["薑片", "Ginger slices", "5片", "5 slices"], ["紅棗", "Red dates", "5粒", "5"], ["生抽", "Light soy sauce", "1湯匙", "1 tbsp"], ["生粉", "Cornflour", "1茶匙", "1 tsp"],
  ], [
    ["雞件用生抽、花雕酒同生粉醃15分鐘。", "Marinate the chicken with soy sauce, Shaoxing wine and cornflour for 15 minutes."],
    ["紅棗洗淨去核，同薑片鋪在雞件上。", "Rinse and stone the red dates and arrange with the ginger over the chicken."],
    ["水滾後蒸約20至25分鐘，確保雞肉熟透。", "Steam for about 20–25 minutes until the chicken is cooked through."],
  ], ["家中有人不飲酒，可以用雞湯代替花雕酒。", "If anyone avoids alcohol, replace the wine with chicken stock."]),
];

export function libRecipeById(id) {
  return LIB_RECIPES.find((r) => r.id === id) || null;
}

/** Photo credits for built-in library images (keyed by hosted path). */
export const RECIPE_PHOTO_CREDITS = {
  "images/recipes/lib-001.jpg": {"author": "Godofnanjing", "license": "CC BY-SA 3.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tomato_and_eggs.JPG", "illustrative": false},
  "images/recipes/lib-002.jpg": {"author": "Andy Li", "license": "CC0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E8%92%B8%E6%B0%B4%E8%9B%8B_-_%E5%9F%BA%E9%9A%86%E8%8C%B6%E9%A4%90%E5%BB%B3.jpg", "illustrative": false},
  "images/recipes/lib-003.jpg": {"author": "Ceeseven", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Choy_Sum_with_Soy_Sauce.jpg", "illustrative": false},
  "images/recipes/lib-004.jpg": {"author": "Jose Nicdao", "license": "CC BY 2.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:DalianClubHouse_StirFriedBeefWithScallion_(50145336288).jpg", "illustrative": false},
  "images/recipes/lib-005.jpg": {"author": "bryan...", "license": "CC BY-SA 2.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Food_%E8%B1%89%E6%B1%81%E8%92%B8%E6%8E%92%E9%AA%A8,_%E6%96%B0%E8%91%A1%E8%8B%91,_Shin_Pu_Yuan,_%E5%8F%B0%E5%8C%97_(21531923392).jpg", "illustrative": false},
  "images/recipes/lib-006.jpg": {"author": "", "license": "illustrative", "source": "", "sourceUrl": "", "illustrative": true},
  "images/recipes/lib-007.jpg": {"author": "Discover Lehigh Valley, PA", "license": "CC BY 2.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chicken_And_Broccoli_@_Bamboo_Asian_Cuisine.jpg", "illustrative": false},
  "images/recipes/lib-008.jpg": {"author": "LEIMIZHI HaoMings", "license": "CC0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:HK_%E4%B8%8A%E7%92%B0_Sheung_Wan_%E6%80%A5%E5%BA%87%E5%88%A9%E8%A1%97_Clevely_Street_%E9%8B%BF%E6%99%B6%E9%A4%A8_SC_Cuisine_Chinese_Seafood_Restaurant_food_steamed_fish_October_2025_N13P_02.jpg", "illustrative": false},
  "images/recipes/lib-009.jpg": {"author": "Dr. Greywolf", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tomato_and_potato_soup_HK.jpg", "illustrative": false},
  "images/recipes/lib-010.jpg": {"author": "Fred Cherrygarden", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Borscht_at_Mido_Cafe.jpg", "illustrative": false},
  "images/recipes/lib-011.jpg": {"author": "Andy Li", "license": "CC0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:%E6%98%AF%E6%97%A5%E4%BE%8B%E6%B9%AF_-_%E7%B2%9F%E7%B1%B3%E7%94%98%E7%AD%8D%E8%B1%AC%E9%AA%A8_-_%E6%A3%8B%E5%93%A5%E8%8C%B6%E9%A4%90%E5%BB%B3_2025-05-29.jpg", "illustrative": false},
  "images/recipes/lib-012.jpg": {"author": "Ceeseven", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Swiss_Chicken_Wings_in_Hong_Kong.jpg", "illustrative": false},
  "images/recipes/lib-013.jpg": {"author": "Ceeseven", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Curry_Chicken_Leg.jpg", "illustrative": false},
  "images/recipes/lib-014.jpg": {"author": "Peachyeung316", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sausage_and_lunch_meats_with_fried_eggs_from_Man_Fong_Canteen.jpg", "illustrative": false},
  "images/recipes/lib-015.jpg": {"author": "ZhengZhou", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Macaroni_soup_with_ham.jpeg", "illustrative": false},
  "images/recipes/lib-016.jpg": {"author": "Stefan Magdalinski", "license": "CC BY 2.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Scramble_Egg_with_Shrimps_with_Rice.jpg", "illustrative": false},
  "images/recipes/lib-017.jpg": {"author": "", "license": "illustrative", "source": "", "sourceUrl": "", "illustrative": true},
  "images/recipes/lib-018.jpg": {"author": "Sichuanfoodlover", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Authentic_Mapo_Tofu.jpg", "illustrative": false},
  "images/recipes/lib-019.jpg": {"author": "Eukbimga", "license": "CC BY-SA 3.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:HK_Food_Steamed_Meat_Cake_%E8%92%B8%E8%B1%AC%E8%82%89%E9%A4%85.JPG", "illustrative": false},
  "images/recipes/lib-020.jpg": {"author": "", "license": "illustrative", "source": "", "sourceUrl": "", "illustrative": true},
  "images/recipes/lib-021.jpg": {"author": "", "license": "illustrative", "source": "", "sourceUrl": "", "illustrative": true},
  "images/recipes/lib-022.jpg": {"author": "JeanneChang", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Preserved_radish_omelet-omelette.jpg", "illustrative": false},
  "images/recipes/lib-023.jpg": {"author": "", "license": "illustrative", "source": "", "sourceUrl": "", "illustrative": true},
  "images/recipes/lib-024.jpg": {"author": "Tofu fighting", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Egg_Fried_Rice_from_a_Chinese_Home.jpg", "illustrative": false},
  "images/recipes/lib-025.jpg": {"author": "Francesc Fort", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Llagost%C3%AD_amb_all_al_vapor.jpg", "illustrative": false},
  "images/recipes/lib-026.jpg": {"author": "Ceeseven", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mini_Double_Boiled_Winter_Melon_Soup.jpg", "illustrative": false},
  "images/recipes/lib-027.jpg": {"author": "gran", "license": "CC BY-SA 3.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Salmon_fried_in_pan.jpg", "illustrative": false},
  "images/recipes/lib-028.jpg": {"author": "Jonashtand", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:202601_%E7%82%B8%E9%86%AC%E9%9B%B2%E5%90%9E%E6%92%88%E9%BA%B5%E9%85%8D%E8%A0%94%E6%B2%B9%E7%94%9F%E8%8F%9C.jpg", "illustrative": false},
  "images/recipes/lib-029.jpg": {"author": "John", "license": "CC BY 2.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pai_huang_gua.jpg", "illustrative": false},
  "images/recipes/lib-030.jpg": {"author": "Peachyeung316", "license": "CC BY-SA 4.0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:A_century_eggs_and_Pork_Congee_from_Chi_Kee_Congee_Shop.jpg", "illustrative": false},
  "images/recipes/lib-031.jpg": {"author": "Andy Li", "license": "CC0", "source": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:Stir_Fried_Morning_Glory_with_Salted_Bean_Curd_Sauce_in_Chilli_-_Good_Friends_2023-09-06.jpg", "illustrative": false},
  "images/recipes/lib-032.jpg": {"author": "", "license": "illustrative", "source": "", "sourceUrl": "", "illustrative": true},
};
