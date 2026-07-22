const AUTO_CHINA = [
  { id:'byd', name:'BYD', ru:'БИД', country:'cn', popular:true, aliases:['бид','биуайди','бивайди','быд','би уай ди','byd','бяди'],
    models:[
      { id:'byd-song-plus', name:'Song Plus', ru:'Сонг Плюс', popular:true, aliases:['сонг плюс','сонг плус','song plus','songplus','бид сонг','сонг','сонг плюс дми'], body:'Кроссовер',
        gens:[
          { name:'DM-i', ru:'ДМ-ай', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1900000,3200000] },
          { name:'EV', ru:'Электро', years:[2021,2025], body:['Кроссовер'],
            engines:[{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[71,72], rangeKm:[480,520], price:[2100000,3300000] }
        ] },
      { id:'byd-song-pro', name:'Song Pro', ru:'Сонг Про', popular:false, aliases:['сонг про','song pro','songpro','сонгпро'], body:'Кроссовер',
        gens:[
          { name:'DM-i', ru:'ДМ-ай', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1700000,2700000] }
        ] },
      { id:'byd-han', name:'Han', ru:'Хан', popular:true, aliases:['хан','han','бид хан','хань','хан ев','han ev'], body:'Седан',
        gens:[
          { name:'EV', ru:'Электро', years:[2020,2025], body:['Седан'],
            engines:[{hp:245,fuel:'Электро'},{hp:517,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[64,86], rangeKm:[500,715], price:[2400000,4500000] },
          { name:'DM-i', ru:'ДМ-ай', years:[2021,2025], body:['Седан'],
            engines:[{vol:1.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[2200000,3800000] }
        ] },
      { id:'byd-tang', name:'Tang', ru:'Тан', popular:true, aliases:['тан','танг','tang','бид тан','тан дми'], body:'Кроссовер',
        gens:[
          { name:'DM-i', ru:'ДМ-ай', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:197,fuel:'Гибрид'},{vol:2.0,hp:192,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[2600000,4600000] },
          { name:'EV', ru:'Электро', years:[2021,2025], body:['Кроссовер'],
            engines:[{hp:517,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[86,109], rangeKm:[500,635], price:[3000000,5200000] }
        ] },
      { id:'byd-qin-plus', name:'Qin Plus', ru:'Цинь Плюс', popular:true, aliases:['цинь плюс','цин плюс','qin plus','qinplus','чинь плюс','цинь'], body:'Седан',
        gens:[
          { name:'DM-i', ru:'ДМ-ай', years:[2021,2025], body:['Седан'],
            engines:[{vol:1.5,hp:110,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1200000,2200000] },
          { name:'EV', ru:'Электро', years:[2021,2025], body:['Седан'],
            engines:[{hp:136,fuel:'Электро'},{hp:177,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[48,58], rangeKm:[420,610], price:[1400000,2500000] }
        ] },
      { id:'byd-seal', name:'Seal', ru:'Сил', popular:true, aliases:['сил','силь','seal','бид сил','сиал','сеал'], body:'Седан',
        gens:[
          { name:'EV', ru:'Электро', years:[2022,2025], body:['Седан'],
            engines:[{hp:204,fuel:'Электро'},{hp:313,fuel:'Электро'},{hp:530,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[61,83], rangeKm:[460,700], price:[2600000,4400000] },
          { name:'DM-i', ru:'ДМ-ай', years:[2024,2025], body:['Седан'],
            engines:[{vol:1.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[2300000,3500000] }
        ] },
      { id:'byd-dolphin', name:'Dolphin', ru:'Дольфин', popular:true, aliases:['дельфин','дольфин','dolphin','бид дельфин','долфин'], body:'Хэтчбек',
        gens:[
          { name:'EV', ru:'Электро', years:[2021,2025], body:['Хэтчбек'],
            engines:[{hp:95,fuel:'Электро'},{hp:177,fuel:'Электро'},{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[30,45], rangeKm:[300,420], price:[1300000,2400000] }
        ] },
      { id:'byd-atto3', name:'Atto 3', ru:'Атто 3', popular:true, aliases:['атто 3','атто3','atto 3','atto3','юань плюс','yuan plus','юан плюс'], body:'Кроссовер',
        gens:[
          { name:'Yuan Plus', ru:'Юань Плюс', years:[2021,2025], body:['Кроссовер'],
            engines:[{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[49,61], rangeKm:[400,510], price:[1900000,3100000] }
        ] },
      { id:'byd-seagull', name:'Seagull', ru:'Сигал', popular:true, aliases:['сигал','сигалл','seagull','чайка','дольфин мини','dolphin mini','сеагул'], body:'Хэтчбек',
        gens:[
          { name:'EV', ru:'Электро', years:[2023,2025], body:['Хэтчбек'],
            engines:[{hp:75,fuel:'Электро'},{hp:102,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[30,39], rangeKm:[300,405], price:[900000,1600000] }
        ] }
    ] },

  { id:'geely', name:'Geely', ru:'Джили', country:'cn', popular:true, aliases:['джили','жили','гили','geely','джилли','джили авто'],
    models:[
      { id:'geely-coolray', name:'Coolray', ru:'Кулрей', popular:true, aliases:['кулрей','кулрэй','coolray','бинюэ','binyue','джили кулрей'], body:'Кроссовер',
        gens:[
          { name:'SX11', ru:'СХ11', years:[2018,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:1.5,hp:177,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний'], price:[1100000,1900000] },
          { name:'Coolray II', ru:'2 поколение', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:1.5,hp:181,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний'], price:[1700000,2500000] }
        ] },
      { id:'geely-atlas', name:'Atlas', ru:'Атлас', popular:true, aliases:['атлас','atlas','боюэ','boyue','джили атлас','атлас про','atlas pro'], body:'Кроссовер',
        gens:[
          { name:'NL-3', ru:'НЛ-3', years:[2016,2022], body:['Кроссовер'],
            engines:[{vol:1.8,hp:184,fuel:'Бензин'},{vol:2.4,hp:148,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[900000,1700000] },
          { name:'Atlas Pro', ru:'Про', years:[2019,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:177,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1500000,2300000] },
          { name:'Boyue L / Atlas 2023', ru:'Новый', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:200,fuel:'Бензин'},{vol:2.0,hp:238,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2200000,3300000] }
        ] },
      { id:'geely-monjaro', name:'Monjaro', ru:'Монжаро', popular:true, aliases:['монжаро','манжаро','monjaro','синъюэ л','xingyue l','джили монжаро'], body:'Кроссовер',
        gens:[
          { name:'KX11', ru:'КХ11', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:238,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2800000,4200000] }
        ] },
      { id:'geely-tugella', name:'Tugella', ru:'Тугелла', popular:false, aliases:['тугелла','тугела','tugella','синъюэ','xingyue'], body:'Кроссовер',
        gens:[
          { name:'FY11', ru:'ФУ11', years:[2019,2024], body:['Кроссовер'],
            engines:[{vol:2.0,hp:238,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2000000,3200000] }
        ] },
      { id:'geely-emgrand', name:'Emgrand', ru:'Эмгранд', popular:true, aliases:['эмгранд','эмгранд 7','emgrand','имгранд','джили эмгранд','ec7'], body:'Седан',
        gens:[
          { name:'EC7', ru:'ЕС7', years:[2009,2018], body:['Седан'],
            engines:[{vol:1.5,hp:98,fuel:'Бензин'},{vol:1.8,hp:126,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,750000] },
          { name:'Emgrand 2021', ru:'Новый', years:[2021,2025], body:['Седан'],
            engines:[{vol:1.5,hp:122,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1000000,1700000] }
        ] },
      { id:'geely-okavango', name:'Okavango', ru:'Окаванго', popular:false, aliases:['окаванго','okavango','хаоюэ','haoyue','джили окаванго'], body:'Кроссовер',
        gens:[
          { name:'VX11', ru:'ВХ11', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:190,fuel:'Гибрид'},{vol:2.0,hp:238,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1900000,3000000] }
        ] },
      { id:'geely-preface', name:'Preface', ru:'Прифейс', popular:false, aliases:['прифейс','преface','preface','синжуй','xingrui','джили прифейс'], body:'Седан',
        gens:[
          { name:'KC11', ru:'КС11', years:[2020,2025], body:['Седан'],
            engines:[{vol:1.5,hp:181,fuel:'Бензин'},{vol:2.0,hp:238,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1700000,2700000] }
        ] },
      { id:'geely-galaxy-e5', name:'Galaxy E5', ru:'Гэлакси Е5', popular:false, aliases:['галакси е5','galaxy e5','гэлакси e5','джили е5','инхэ е5'], body:'Кроссовер',
        gens:[
          { name:'EX5', ru:'ЕХ5', years:[2024,2025], body:['Кроссовер'],
            engines:[{hp:218,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[49,61], rangeKm:[440,530], price:[1800000,2600000] }
        ] },
      { id:'geely-starray', name:'Starray', ru:'Старрей', popular:false, aliases:['старрей','старей','starray','синъюэ л ем-хайбрид','джили старрей','инхэ л7'], body:'Кроссовер',
        gens:[
          { name:'Galaxy L7', ru:'Гэлакси Л7', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:181,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2300000,3200000] }
        ] }
    ] },

  { id:'chery', name:'Chery', ru:'Чери', country:'cn', popular:true, aliases:['чери','чери авто','chery','черри','чэри'],
    models:[
      { id:'chery-tiggo-2-pro', name:'Tiggo 2 Pro', ru:'Тигго 2 Про', popular:false, aliases:['тигго 2','тигго 2 про','tiggo 2','tiggo2','чери тигго 2'], body:'Кроссовер',
        gens:[
          { name:'Tiggo 2 Pro', ru:'2 Про', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:106,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[900000,1500000] }
        ] },
      { id:'chery-tiggo-4', name:'Tiggo 4 Pro', ru:'Тигго 4 Про', popular:true, aliases:['тигго 4','тигго 4 про','tiggo 4','tiggo4','чери тигго 4','тиго 4'], body:'Кроссовер',
        gens:[
          { name:'T19', ru:'Т19', years:[2017,2022], body:['Кроссовер'],
            engines:[{vol:1.5,hp:113,fuel:'Бензин'},{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[900000,1500000] },
          { name:'Tiggo 4 Pro', ru:'4 Про', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:113,fuel:'Бензин'},{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1300000,2000000] }
        ] },
      { id:'chery-tiggo-5x', name:'Tiggo 5x', ru:'Тигго 5х', popular:false, aliases:['тигго 5х','тигго 5x','tiggo 5x','tiggo5x','чери тигго 5'], body:'Кроссовер',
        gens:[
          { name:'T17', ru:'Т17', years:[2018,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1100000,1800000] }
        ] },
      { id:'chery-tiggo-7', name:'Tiggo 7 Pro', ru:'Тигго 7 Про', popular:true, aliases:['тигго 7','тигго 7 про','tiggo 7','tiggo7','чери тигго 7','тигго 7 про макс'], body:'Кроссовер',
        gens:[
          { name:'Tiggo 7 Pro', ru:'7 Про', years:[2020,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'},{vol:1.6,hp:186,fuel:'Бензин'}],
            gearbox:['Вариатор','Робот'], drive:['Передний'], price:[1600000,2500000] },
          { name:'Tiggo 7 Pro Max', ru:'7 Про Макс', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:186,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[2100000,3000000] }
        ] },
      { id:'chery-tiggo-8', name:'Tiggo 8 Pro', ru:'Тигго 8 Про', popular:true, aliases:['тигго 8','тигго 8 про','tiggo 8','tiggo8','чери тигго 8','тигго 8 про макс'], body:'Кроссовер',
        gens:[
          { name:'Tiggo 8', ru:'8', years:[2018,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'},{vol:1.6,hp:186,fuel:'Бензин'}],
            gearbox:['Вариатор','Робот'], drive:['Передний'], price:[1600000,2600000] },
          { name:'Tiggo 8 Pro Max', ru:'8 Про Макс', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:186,fuel:'Бензин'},{vol:2.0,hp:249,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[2400000,3600000] }
        ] },
      { id:'chery-tiggo-9', name:'Tiggo 9', ru:'Тигго 9', popular:false, aliases:['тигго 9','tiggo 9','tiggo9','чери тигго 9'], body:'Кроссовер',
        gens:[
          { name:'Tiggo 9', ru:'9', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:261,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[3000000,4300000] }
        ] },
      { id:'chery-arrizo-8', name:'Arrizo 8', ru:'Аризо 8', popular:false, aliases:['аризо 8','arrizo 8','arrizo8','чери аризо','арризо 8'], body:'Седан',
        gens:[
          { name:'Arrizo 8', ru:'8', years:[2022,2025], body:['Седан'],
            engines:[{vol:1.6,hp:197,fuel:'Бензин'},{vol:2.0,hp:261,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний'], price:[1900000,2900000] }
        ] },
      { id:'chery-arrizo-5', name:'Arrizo 5', ru:'Аризо 5', popular:false, aliases:['аризо 5','arrizo 5','arrizo5','чери аризо 5'], body:'Седан',
        gens:[
          { name:'Arrizo 5 Plus', ru:'5 Плюс', years:[2016,2024], body:['Седан'],
            engines:[{vol:1.5,hp:113,fuel:'Бензин'},{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[800000,1500000] }
        ] }
    ] },

  { id:'exeed', name:'Exeed', ru:'Эксид', country:'cn', popular:true, aliases:['эксид','эксид авто','exeed','эксиид','иксид'],
    models:[
      { id:'exeed-txl', name:'TXL', ru:'ТХЛ', popular:true, aliases:['тхл','txl','эксид тхл','эксид txl'], body:'Кроссовер',
        gens:[
          { name:'TXL', ru:'ТХЛ', years:[2018,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:186,fuel:'Бензин'},{vol:2.0,hp:249,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[2200000,3600000] }
        ] },
      { id:'exeed-lx', name:'LX', ru:'ЛХ', popular:true, aliases:['лх','lx','эксид лх','эксид lx'], body:'Кроссовер',
        gens:[
          { name:'LX', ru:'ЛХ', years:[2019,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'},{vol:1.6,hp:186,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1900000,2900000] }
        ] },
      { id:'exeed-vx', name:'VX', ru:'ВХ', popular:true, aliases:['вх','vx','эксид вх','эксид vx'], body:'Кроссовер',
        gens:[
          { name:'VX', ru:'ВХ', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:249,fuel:'Бензин'},{vol:2.0,hp:261,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2900000,4400000] }
        ] },
      { id:'exeed-rx', name:'RX', ru:'РХ', popular:false, aliases:['рх','rx','эксид рх','эксид rx'], body:'Кроссовер',
        gens:[
          { name:'RX', ru:'РХ', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:197,fuel:'Бензин'},{vol:2.0,hp:261,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[2500000,3800000] }
        ] },
      { id:'exeed-es', name:'Exlantix ES', ru:'Эксланткс ЕС', popular:false, aliases:['эксид ес','exlantix es','эксланткс','стерра ес','sterra es'], body:'Седан',
        gens:[
          { name:'ES', ru:'ЕС', years:[2023,2025], body:['Седан'],
            engines:[{hp:315,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[62,82], rangeKm:[520,700], price:[2800000,4200000] }
        ] },
      { id:'exeed-et', name:'Exlantix ET', ru:'Эксланткс ЕТ', popular:false, aliases:['эксид ет','exlantix et','стерра ет','sterra et'], body:'Кроссовер',
        gens:[
          { name:'ET', ru:'ЕТ', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[3000000,4500000] }
        ] }
    ] },

  { id:'jetour', name:'Jetour', ru:'Джетур', country:'cn', popular:true, aliases:['джетур','джету','jetour','джитур','жетур'],
    models:[
      { id:'jetour-x70', name:'X70', ru:'Х70', popular:false, aliases:['х70','x70','джетур х70','джетур x70'], body:'Кроссовер',
        gens:[
          { name:'X70', ru:'Х70', years:[2018,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'},{vol:1.6,hp:186,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[1300000,2100000] }
        ] },
      { id:'jetour-x70-plus', name:'X70 Plus', ru:'Х70 Плюс', popular:true, aliases:['х70 плюс','x70 plus','x70plus','джетур х70 плюс','х70 плус'], body:'Кроссовер',
        gens:[
          { name:'X70 Plus', ru:'Х70 Плюс', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'},{vol:1.6,hp:186,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1900000,2900000] }
        ] },
      { id:'jetour-x90-plus', name:'X90 Plus', ru:'Х90 Плюс', popular:true, aliases:['х90 плюс','x90 plus','x90plus','джетур х90','х90'], body:'Кроссовер',
        gens:[
          { name:'X90 Plus', ru:'Х90 Плюс', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:186,fuel:'Бензин'},{vol:2.0,hp:249,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний'], price:[2300000,3500000] }
        ] },
      { id:'jetour-x50', name:'X50', ru:'Х50', popular:false, aliases:['х50','x50','джетур х50','дэшинг'], body:'Кроссовер',
        gens:[
          { name:'X50', ru:'Х50', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1500000,2300000] }
        ] },
      { id:'jetour-dashing', name:'Dashing', ru:'Дэшинг', popular:true, aliases:['дэшинг','дашинг','dashing','джетур дэшинг'], body:'Кроссовер',
        gens:[
          { name:'Dashing', ru:'Дэшинг', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'},{vol:1.6,hp:197,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[2000000,3000000] }
        ] },
      { id:'jetour-t2', name:'Traveller T2', ru:'Тревеллер Т2', popular:true, aliases:['т2','t2','джетур т2','тревеллер','traveller','джетур траввелер'], body:'Внедорожник',
        gens:[
          { name:'T2', ru:'Т2', years:[2023,2025], body:['Внедорожник'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'},{vol:2.0,hp:254,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2800000,4200000] }
        ] },
      { id:'jetour-t1', name:'Traveller T1', ru:'Тревеллер Т1', popular:false, aliases:['т1','t1','джетур т1','шаньхай т1','shanhai t1'], body:'Внедорожник',
        gens:[
          { name:'T1', ru:'Т1', years:[2024,2025], body:['Внедорожник'],
            engines:[{vol:1.5,hp:156,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2600000,3800000] }
        ] },
      { id:'jetour-x95', name:'X95', ru:'Х95', popular:false, aliases:['х95','x95','джетур х95'], body:'Кроссовер',
        gens:[
          { name:'X95', ru:'Х95', years:[2019,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'},{vol:1.6,hp:197,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1800000,2700000] }
        ] }
    ] },

  { id:'haval', name:'Haval', ru:'Хавал', country:'cn', popular:true, aliases:['хавал','хавейл','хавал моторс','haval','хавал авто','хаваль'],
    models:[
      { id:'haval-jolion', name:'Jolion', ru:'Джолион', popular:true, aliases:['джолион','жолион','jolion','хавал джолион','дждолион'], body:'Кроссовер',
        gens:[
          { name:'Jolion', ru:'Джолион', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:143,fuel:'Бензин'},{vol:1.5,hp:150,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний'], price:[1600000,2500000] }
        ] },
      { id:'haval-h6', name:'H6', ru:'Н6', popular:true, aliases:['н6','h6','хавал н6','хавал h6','аш шесть'], body:'Кроссовер',
        gens:[
          { name:'H6 II', ru:'2 поколение', years:[2017,2021], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[1200000,2000000] },
          { name:'H6 III', ru:'3 поколение', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:169,fuel:'Бензин'},{vol:2.0,hp:204,fuel:'Бензин'},{vol:1.5,hp:243,fuel:'Гибрид'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[2000000,3300000] }
        ] },
      { id:'haval-f7', name:'F7', ru:'Ф7', popular:true, aliases:['ф7','f7','хавал ф7','хавал f7'], body:'Кроссовер',
        gens:[
          { name:'F7', ru:'Ф7', years:[2018,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[1500000,2400000] }
        ] },
      { id:'haval-f7x', name:'F7x', ru:'Ф7х', popular:false, aliases:['ф7х','f7x','хавал ф7х','ф семь икс'], body:'Кроссовер',
        gens:[
          { name:'F7x', ru:'Ф7х', years:[2019,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[1600000,2500000] }
        ] },
      { id:'haval-dargo', name:'Dargo', ru:'Дарго', popular:true, aliases:['дарго','dargo','хавал дарго','биг дог','big dog','хавал дог'], body:'Кроссовер',
        gens:[
          { name:'Dargo', ru:'Дарго', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:192,fuel:'Бензин'},{vol:2.0,hp:204,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2400000,3600000] }
        ] },
      { id:'haval-h9', name:'H9', ru:'Н9', popular:true, aliases:['н9','h9','хавал н9','хавал h9','аш девять'], body:'Внедорожник',
        gens:[
          { name:'H9', ru:'Н9', years:[2014,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:218,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2000000,4200000] }
        ] },
      { id:'haval-h3', name:'H3', ru:'Н3', popular:false, aliases:['н3','h3','хавал н3','хавал h3'], body:'Кроссовер',
        gens:[
          { name:'H3', ru:'Н3', years:[2013,2018], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний','Полный'], price:[550000,1000000] }
        ] },
      { id:'haval-m6', name:'M6', ru:'М6', popular:false, aliases:['м6','m6','хавал м6','хавал m6'], body:'Кроссовер',
        gens:[
          { name:'M6', ru:'М6', years:[2017,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:143,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[1200000,1900000] }
        ] }
    ] },

  { id:'greatwall', name:'Great Wall', ru:'Грейт Волл', country:'cn', popular:true, aliases:['грейт волл','грейтвол','great wall','gwm','гвм','грейт вол','ховер','hover'],
    models:[
      { id:'gw-poer', name:'Poer', ru:'Поер', popular:true, aliases:['поер','пое','poer','pao','пао','грейт волл поер','ганн'], body:'Пикап',
        gens:[
          { name:'Poer', ru:'Поер', years:[2019,2025], body:['Пикап'],
            engines:[{vol:2.0,hp:150,fuel:'Дизель'},{vol:2.0,hp:190,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[2000000,3400000] }
        ] },
      { id:'gw-wingle-7', name:'Wingle 7', ru:'Вингл 7', popular:false, aliases:['вингл 7','wingle 7','wingle7','грейт волл вингл'], body:'Пикап',
        gens:[
          { name:'Wingle 7', ru:'Вингл 7', years:[2018,2025], body:['Пикап'],
            engines:[{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[1300000,2100000] }
        ] },
      { id:'gw-wingle-5', name:'Wingle 5', ru:'Вингл 5', popular:false, aliases:['вингл 5','wingle 5','wingle5','грейт волл вингл 5'], body:'Пикап',
        gens:[
          { name:'Wingle 5', ru:'Вингл 5', years:[2011,2022], body:['Пикап'],
            engines:[{vol:2.0,hp:143,fuel:'Дизель'},{vol:2.4,hp:136,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[600000,1300000] }
        ] },
      { id:'gw-hover-h5', name:'Hover H5', ru:'Ховер Н5', popular:false, aliases:['ховер н5','ховер h5','hover h5','грейт волл ховер','ховер'], body:'Внедорожник',
        gens:[
          { name:'H5', ru:'Н5', years:[2010,2018], body:['Внедорожник'],
            engines:[{vol:2.0,hp:150,fuel:'Дизель'},{vol:2.4,hp:136,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[500000,1100000] }
        ] }
    ] },

  { id:'tank', name:'Tank', ru:'Танк', country:'cn', popular:true, aliases:['танк','tank','танк авто','вэй танк'],
    models:[
      { id:'tank-300', name:'Tank 300', ru:'Танк 300', popular:true, aliases:['танк 300','tank 300','tank300','танк300','танк триста'], body:'Внедорожник',
        gens:[
          { name:'Tank 300', ru:'300', years:[2020,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:220,fuel:'Бензин'},{vol:2.0,hp:342,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3000000,4800000] }
        ] },
      { id:'tank-400', name:'Tank 400', ru:'Танк 400', popular:false, aliases:['танк 400','tank 400','tank400','танк400'], body:'Внедорожник',
        gens:[
          { name:'Tank 400', ru:'400', years:[2023,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.0,hp:408,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3600000,5200000] }
        ] },
      { id:'tank-500', name:'Tank 500', ru:'Танк 500', popular:true, aliases:['танк 500','tank 500','tank500','танк500','танк пятьсот'], body:'Внедорожник',
        gens:[
          { name:'Tank 500', ru:'500', years:[2021,2025], body:['Внедорожник'],
            engines:[{vol:3.0,hp:299,fuel:'Бензин'},{vol:2.0,hp:408,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[4500000,7000000] }
        ] },
      { id:'tank-700', name:'Tank 700', ru:'Танк 700', popular:false, aliases:['танк 700','tank 700','tank700','танк700'], body:'Внедорожник',
        gens:[
          { name:'Tank 700', ru:'700', years:[2024,2025], body:['Внедорожник'],
            engines:[{vol:3.0,hp:517,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[6500000,9500000] }
        ] }
    ] },

  { id:'zeekr', name:'Zeekr', ru:'Зикр', country:'cn', popular:true, aliases:['зикр','зеекр','зикер','zeekr','зикр авто','джикр'],
    models:[
      { id:'zeekr-001', name:'001', ru:'001', popular:true, aliases:['зикр 001','zeekr 001','001','зикр 1','зикр001'], body:'Универсал',
        gens:[
          { name:'001', ru:'001', years:[2021,2025], body:['Универсал'],
            engines:[{hp:272,fuel:'Электро'},{hp:544,fuel:'Электро'},{hp:789,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[86,140], rangeKm:[550,750], price:[3500000,6500000] }
        ] },
      { id:'zeekr-007', name:'007', ru:'007', popular:true, aliases:['зикр 007','zeekr 007','007','зикр 7','зикр007'], body:'Седан',
        gens:[
          { name:'007', ru:'007', years:[2023,2025], body:['Седан'],
            engines:[{hp:475,fuel:'Электро'},{hp:646,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[75,100], rangeKm:[600,870], price:[3200000,5000000] }
        ] },
      { id:'zeekr-009', name:'009', ru:'009', popular:true, aliases:['зикр 009','zeekr 009','009','зикр 9','зикр009','минивэн зикр'], body:'Минивэн',
        gens:[
          { name:'009', ru:'009', years:[2022,2025], body:['Минивэн'],
            engines:[{hp:544,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[108,140], rangeKm:[700,820], price:[6000000,9500000] }
        ] },
      { id:'zeekr-x', name:'X', ru:'Икс', popular:false, aliases:['зикр икс','зикр x','zeekr x','zeekrx','зикр икс кроссовер'], body:'Кроссовер',
        gens:[
          { name:'X', ru:'Икс', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:272,fuel:'Электро'},{hp:428,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[66,69], rangeKm:[440,560], price:[2700000,4000000] }
        ] },
      { id:'zeekr-7x', name:'7X', ru:'7Х', popular:false, aliases:['зикр 7х','зикр 7x','zeekr 7x','7x','зикр7х'], body:'Кроссовер',
        gens:[
          { name:'7X', ru:'7Х', years:[2024,2025], body:['Кроссовер'],
            engines:[{hp:421,fuel:'Электро'},{hp:637,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[75,100], rangeKm:[615,780], price:[3600000,5400000] }
        ] },
      { id:'zeekr-mix', name:'Mix', ru:'Микс', popular:false, aliases:['зикр микс','zeekr mix','микс','зикр mix'], body:'Минивэн',
        gens:[
          { name:'Mix', ru:'Микс', years:[2024,2025], body:['Минивэн'],
            engines:[{hp:428,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[76,76], rangeKm:[550,600], price:[3400000,4600000] }
        ] }
    ] },

  { id:'liauto', name:'Li Auto', ru:'Ли Авто', country:'cn', popular:true, aliases:['ли авто','лиавто','лисян','лисиан','li auto','lixiang','ли сян','лишан'],
    models:[
      { id:'li-l6', name:'L6', ru:'Л6', popular:true, aliases:['ли авто л6','лисян 6','лисян l6','li l6','л6','лиауто л6'], body:'Кроссовер',
        gens:[
          { name:'L6', ru:'Л6', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:408,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[36,37], rangeKm:[180,212], price:[3800000,5200000] }
        ] },
      { id:'li-l7', name:'L7', ru:'Л7', popular:true, aliases:['ли авто л7','лисян 7','лисян l7','li l7','л7','лиауто л7'], body:'Кроссовер',
        gens:[
          { name:'L7', ru:'Л7', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:449,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[40,53], rangeKm:[210,285], price:[4300000,6200000] }
        ] },
      { id:'li-l8', name:'L8', ru:'Л8', popular:true, aliases:['ли авто л8','лисян 8','лисян l8','li l8','л8','лиауто л8'], body:'Кроссовер',
        gens:[
          { name:'L8', ru:'Л8', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:449,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[40,53], rangeKm:[210,285], price:[4600000,6600000] }
        ] },
      { id:'li-l9', name:'L9', ru:'Л9', popular:true, aliases:['ли авто л9','лисян 9','лисян l9','li l9','л9','лиауто л9','лисян л9'], body:'Кроссовер',
        gens:[
          { name:'L9', ru:'Л9', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:449,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[44,53], rangeKm:[215,290], price:[5500000,8000000] }
        ] },
      { id:'li-mega', name:'Mega', ru:'Мега', popular:false, aliases:['ли авто мега','лисян мега','li mega','мега','лиауто мега'], body:'Минивэн',
        gens:[
          { name:'Mega', ru:'Мега', years:[2024,2025], body:['Минивэн'],
            engines:[{hp:544,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[102,102], rangeKm:[650,710], price:[6500000,9000000] }
        ] },
      { id:'li-i8', name:'i8', ru:'ай8', popular:false, aliases:['ли авто i8','лисян i8','li i8','ай 8','лиауто ай8'], body:'Кроссовер',
        gens:[
          { name:'i8', ru:'ай8', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:544,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[90,97], rangeKm:[620,720], price:[5500000,7500000] }
        ] }
    ] },

  { id:'aito', name:'Aito', ru:'Аито', country:'cn', popular:true, aliases:['аито','айто','aito','вэньцзе','wenjie','хуавей аито','аито хуавей'],
    models:[
      { id:'aito-m5', name:'M5', ru:'М5', popular:false, aliases:['аито м5','aito m5','м5','вэньцзе м5'], body:'Кроссовер',
        gens:[
          { name:'M5', ru:'М5', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:365,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[40,40], rangeKm:[180,255], price:[3200000,4600000] }
        ] },
      { id:'aito-m7', name:'M7', ru:'М7', popular:true, aliases:['аито м7','aito m7','м7','вэньцзе м7','аито м7 макс'], body:'Кроссовер',
        gens:[
          { name:'M7', ru:'М7', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:365,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[40,42], rangeKm:[190,240], price:[3600000,5200000] }
        ] },
      { id:'aito-m8', name:'M8', ru:'М8', popular:false, aliases:['аито м8','aito m8','м8','вэньцзе м8'], body:'Кроссовер',
        gens:[
          { name:'M8', ru:'М8', years:[2025,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:400,fuel:'Гибрид'},{hp:496,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[37,97], rangeKm:[210,705], price:[5000000,7000000] }
        ] },
      { id:'aito-m9', name:'M9', ru:'М9', popular:true, aliases:['аито м9','aito m9','м9','вэньцзе м9','аито м девять'], body:'Кроссовер',
        gens:[
          { name:'M9', ru:'М9', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:496,fuel:'Гибрид'},{hp:530,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[40,100], rangeKm:[220,630], price:[6000000,9500000] }
        ] }
    ] },

  { id:'avatr', name:'Avatr', ru:'Аватр', country:'cn', popular:false, aliases:['аватр','аватар','avatr','аватр авто','авартр'],
    models:[
      { id:'avatr-11', name:'11', ru:'11', popular:false, aliases:['аватр 11','avatr 11','аватр11','11'], body:'Кроссовер',
        gens:[
          { name:'11', ru:'11', years:[2022,2025], body:['Кроссовер'],
            engines:[{hp:313,fuel:'Электро'},{hp:578,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[90,116], rangeKm:[550,730], price:[4200000,6300000] }
        ] },
      { id:'avatr-12', name:'12', ru:'12', popular:false, aliases:['аватр 12','avatr 12','аватр12','12'], body:'Седан',
        gens:[
          { name:'12', ru:'12', years:[2023,2025], body:['Седан'],
            engines:[{hp:313,fuel:'Электро'},{hp:578,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[90,116], rangeKm:[600,700], price:[4400000,6600000] }
        ] },
      { id:'avatr-07', name:'07', ru:'07', popular:false, aliases:['аватр 07','avatr 07','аватр 7','аватр07'], body:'Кроссовер',
        gens:[
          { name:'07', ru:'07', years:[2024,2025], body:['Кроссовер'],
            engines:[{hp:313,fuel:'Электро'},{vol:1.5,hp:428,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[39,90], rangeKm:[220,650], price:[3800000,5400000] }
        ] },
      { id:'avatr-06', name:'06', ru:'06', popular:false, aliases:['аватр 06','avatr 06','аватр 6','аватр06'], body:'Седан',
        gens:[
          { name:'06', ru:'06', years:[2025,2026], body:['Седан'],
            engines:[{hp:313,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[65,90], rangeKm:[520,650], price:[3300000,4800000] }
        ] }
    ] },

  { id:'hongqi', name:'Hongqi', ru:'Хунци', country:'cn', popular:false, aliases:['хунци','хончи','хонки','hongqi','хунци авто','красное знамя'],
    models:[
      { id:'hongqi-h5', name:'H5', ru:'Н5', popular:false, aliases:['хунци н5','hongqi h5','хунци h5','н5'], body:'Седан',
        gens:[
          { name:'H5', ru:'Н5', years:[2022,2025], body:['Седан'],
            engines:[{vol:1.5,hp:169,fuel:'Бензин'},{vol:2.0,hp:224,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2000000,3200000] }
        ] },
      { id:'hongqi-h6', name:'H6', ru:'Н6', popular:false, aliases:['хунци н6','hongqi h6','хунци h6','н6'], body:'Седан',
        gens:[
          { name:'H6', ru:'Н6', years:[2022,2025], body:['Седан'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2400000,3600000] }
        ] },
      { id:'hongqi-h9', name:'H9', ru:'Н9', popular:false, aliases:['хунци н9','hongqi h9','хунци h9','н9','хунци девятка'], body:'Седан',
        gens:[
          { name:'H9', ru:'Н9', years:[2020,2025], body:['Седан'],
            engines:[{vol:2.0,hp:252,fuel:'Бензин'},{vol:3.0,hp:281,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4000000,7000000] }
        ] },
      { id:'hongqi-hs3', name:'HS3', ru:'ХС3', popular:false, aliases:['хунци хс3','hongqi hs3','hs3','хс3'], body:'Кроссовер',
        gens:[
          { name:'HS3', ru:'ХС3', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:190,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1900000,2800000] }
        ] },
      { id:'hongqi-hs5', name:'HS5', ru:'ХС5', popular:false, aliases:['хунци хс5','hongqi hs5','hs5','хс5'], body:'Кроссовер',
        gens:[
          { name:'HS5', ru:'ХС5', years:[2019,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:224,fuel:'Бензин'},{vol:2.0,hp:252,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2400000,3600000] }
        ] },
      { id:'hongqi-hs7', name:'HS7', ru:'ХС7', popular:false, aliases:['хунци хс7','hongqi hs7','hs7','хс7'], body:'Внедорожник',
        gens:[
          { name:'HS7', ru:'ХС7', years:[2020,2025], body:['Внедорожник'],
            engines:[{vol:3.0,hp:281,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[4200000,6500000] }
        ] },
      { id:'hongqi-ehs9', name:'E-HS9', ru:'Е-ХС9', popular:false, aliases:['хунци е хс9','hongqi ehs9','e-hs9','ehs9','хунци электро'], body:'Внедорожник',
        gens:[
          { name:'E-HS9', ru:'Е-ХС9', years:[2020,2025], body:['Внедорожник'],
            engines:[{hp:435,fuel:'Электро'},{hp:551,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[84,120], rangeKm:[460,690], price:[5500000,8500000] }
        ] },
      { id:'hongqi-eh7', name:'EH7', ru:'ЕН7', popular:false, aliases:['хунци ен7','hongqi eh7','eh7','ен7'], body:'Седан',
        gens:[
          { name:'EH7', ru:'ЕН7', years:[2023,2025], body:['Седан'],
            engines:[{hp:252,fuel:'Электро'},{hp:462,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[64,105], rangeKm:[500,810], price:[2800000,4300000] }
        ] }
    ] },

  { id:'changan', name:'Changan', ru:'Чанган', country:'cn', popular:true, aliases:['чанган','чангань','чанъань','changan','чанган авто','чангаан'],
    models:[
      { id:'changan-cs35-plus', name:'CS35 Plus', ru:'ЦС35 Плюс', popular:true, aliases:['цс35 плюс','cs35 plus','cs35plus','чанган цс35','цс 35'], body:'Кроссовер',
        gens:[
          { name:'CS35 Plus', ru:'ЦС35 Плюс', years:[2018,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:128,fuel:'Бензин'},{vol:1.4,hp:158,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[1300000,2100000] }
        ] },
      { id:'changan-cs55-plus', name:'CS55 Plus', ru:'ЦС55 Плюс', popular:true, aliases:['цс55 плюс','cs55 plus','cs55plus','чанган цс55','цс 55'], body:'Кроссовер',
        gens:[
          { name:'CS55 Plus', ru:'ЦС55 Плюс', years:[2019,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:181,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1700000,2600000] }
        ] },
      { id:'changan-cs75-plus', name:'CS75 Plus', ru:'ЦС75 Плюс', popular:true, aliases:['цс75 плюс','cs75 plus','cs75plus','чанган цс75','цс 75'], body:'Кроссовер',
        gens:[
          { name:'CS75 Plus', ru:'ЦС75 Плюс', years:[2019,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:181,fuel:'Бензин'},{vol:2.0,hp:233,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2100000,3300000] }
        ] },
      { id:'changan-cs95', name:'CS95 Plus', ru:'ЦС95 Плюс', popular:false, aliases:['цс95','cs95','cs95 plus','чанган цс95'], body:'Внедорожник',
        gens:[
          { name:'CS95 Plus', ru:'ЦС95 Плюс', years:[2017,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:233,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2600000,3900000] }
        ] },
      { id:'changan-uni-t', name:'UNI-T', ru:'ЮНИ-Т', popular:true, aliases:['юни т','uni-t','unit','чанган юни т','uni t'], body:'Кроссовер',
        gens:[
          { name:'UNI-T', ru:'ЮНИ-Т', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:181,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1900000,2900000] }
        ] },
      { id:'changan-uni-k', name:'UNI-K', ru:'ЮНИ-К', popular:true, aliases:['юни к','uni-k','unik','чанган юни к','uni k'], body:'Кроссовер',
        gens:[
          { name:'UNI-K', ru:'ЮНИ-К', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:233,fuel:'Бензин'},{vol:2.0,hp:314,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2600000,4000000] }
        ] },
      { id:'changan-uni-v', name:'UNI-V', ru:'ЮНИ-В', popular:false, aliases:['юни в','uni-v','univ','чанган юни в','uni v'], body:'Седан',
        gens:[
          { name:'UNI-V', ru:'ЮНИ-В', years:[2022,2025], body:['Седан'],
            engines:[{vol:1.5,hp:181,fuel:'Бензин'},{vol:2.0,hp:233,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1900000,2900000] }
        ] },
      { id:'changan-alsvin', name:'Alsvin', ru:'Алсвин', popular:false, aliases:['алсвин','alsvin','чанган алсвин','алсвин v7'], body:'Седан',
        gens:[
          { name:'Alsvin', ru:'Алсвин', years:[2018,2025], body:['Седан'],
            engines:[{vol:1.4,hp:99,fuel:'Бензин'},{vol:1.5,hp:107,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[850000,1400000] }
        ] },
      { id:'changan-hunter', name:'Hunter', ru:'Хантер', popular:false, aliases:['хантер','hunter','чанган хантер','чанган пикап'], body:'Пикап',
        gens:[
          { name:'Hunter', ru:'Хантер', years:[2021,2025], body:['Пикап'],
            engines:[{vol:2.0,hp:170,fuel:'Дизель'},{vol:2.0,hp:196,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1900000,3000000] }
        ] }
    ] },

  { id:'deepal', name:'Deepal', ru:'Дипал', country:'cn', popular:false, aliases:['дипал','дипаль','deepal','шэньлань','чанган дипал'],
    models:[
      { id:'deepal-s07', name:'S07', ru:'С07', popular:false, aliases:['дипал с07','deepal s07','s07','дипал s7','дипал с7'], body:'Кроссовер',
        gens:[
          { name:'S07', ru:'С07', years:[2022,2025], body:['Кроссовер'],
            engines:[{hp:258,fuel:'Электро'},{vol:1.5,hp:218,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[31,80], rangeKm:[200,620], price:[2500000,3600000] }
        ] },
      { id:'deepal-l07', name:'L07', ru:'Л07', popular:false, aliases:['дипал л07','deepal l07','sl03','дипал sl03','л07'], body:'Седан',
        gens:[
          { name:'SL03 / L07', ru:'СЛ03', years:[2022,2025], body:['Седан'],
            engines:[{hp:258,fuel:'Электро'},{vol:1.5,hp:218,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[31,79], rangeKm:[200,705], price:[2300000,3400000] }
        ] },
      { id:'deepal-s05', name:'S05', ru:'С05', popular:false, aliases:['дипал с05','deepal s05','s05','дипал s5'], body:'Кроссовер',
        gens:[
          { name:'S05', ru:'С05', years:[2024,2025], body:['Кроссовер'],
            engines:[{hp:190,fuel:'Электро'},{vol:1.5,hp:158,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[18,68], rangeKm:[110,520], price:[2000000,3000000] }
        ] },
      { id:'deepal-g318', name:'G318', ru:'Г318', popular:false, aliases:['дипал г318','deepal g318','g318','дипал 318'], body:'Внедорожник',
        gens:[
          { name:'G318', ru:'Г318', years:[2024,2025], body:['Внедорожник'],
            engines:[{vol:1.5,hp:299,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[35,35], rangeKm:[145,190], price:[3200000,4400000] }
        ] },
      { id:'deepal-e07', name:'E07', ru:'Е07', popular:false, aliases:['дипал е07','deepal e07','e07','дипал e7'], body:'Пикап',
        gens:[
          { name:'E07', ru:'Е07', years:[2024,2025], body:['Пикап'],
            engines:[{hp:428,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[68,89], rangeKm:[450,640], price:[3600000,5000000] }
        ] }
    ] },

  { id:'nio', name:'NIO', ru:'Нио', country:'cn', popular:false, aliases:['нио','ниу','nio','нио авто','вэйлай','weilai'],
    models:[
      { id:'nio-es6', name:'ES6', ru:'ЕС6', popular:false, aliases:['нио ес6','nio es6','es6','ес6'], body:'Кроссовер',
        gens:[
          { name:'ES6', ru:'ЕС6', years:[2018,2025], body:['Кроссовер'],
            engines:[{hp:490,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[75,100], rangeKm:[490,625], price:[3800000,5600000] }
        ] },
      { id:'nio-es7', name:'ES7', ru:'ЕС7', popular:false, aliases:['нио ес7','nio es7','es7','ес7','el7'], body:'Кроссовер',
        gens:[
          { name:'ES7 / EL7', ru:'ЕС7', years:[2022,2025], body:['Кроссовер'],
            engines:[{hp:653,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[75,100], rangeKm:[485,620], price:[4400000,6400000] }
        ] },
      { id:'nio-es8', name:'ES8', ru:'ЕС8', popular:false, aliases:['нио ес8','nio es8','es8','ес8'], body:'Кроссовер',
        gens:[
          { name:'ES8', ru:'ЕС8', years:[2017,2025], body:['Кроссовер'],
            engines:[{hp:544,fuel:'Электро'},{hp:653,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[75,100], rangeKm:[430,605], price:[4200000,7000000] }
        ] },
      { id:'nio-ec6', name:'EC6', ru:'ЕС6 купе', popular:false, aliases:['нио ес6 купе','nio ec6','ec6','ец6'], body:'Кроссовер',
        gens:[
          { name:'EC6', ru:'ЕС6 купе', years:[2020,2025], body:['Кроссовер'],
            engines:[{hp:490,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[75,100], rangeKm:[480,625], price:[3900000,5800000] }
        ] },
      { id:'nio-ec7', name:'EC7', ru:'ЕС7 купе', popular:false, aliases:['нио ец7','nio ec7','ec7'], body:'Кроссовер',
        gens:[
          { name:'EC7', ru:'ЕС7 купе', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:653,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[75,100], rangeKm:[490,635], price:[4600000,6600000] }
        ] },
      { id:'nio-et5', name:'ET5', ru:'ЕТ5', popular:false, aliases:['нио ет5','nio et5','et5','ет5','et5 touring'], body:'Седан',
        gens:[
          { name:'ET5', ru:'ЕТ5', years:[2022,2025], body:['Седан','Универсал'],
            engines:[{hp:490,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[75,100], rangeKm:[550,710], price:[3400000,5000000] }
        ] },
      { id:'nio-et7', name:'ET7', ru:'ЕТ7', popular:false, aliases:['нио ет7','nio et7','et7','ет7'], body:'Седан',
        gens:[
          { name:'ET7', ru:'ЕТ7', years:[2021,2025], body:['Седан'],
            engines:[{hp:653,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[75,150], rangeKm:[530,1000], price:[4300000,6800000] }
        ] },
      { id:'nio-et9', name:'ET9', ru:'ЕТ9', popular:false, aliases:['нио ет9','nio et9','et9','ет9'], body:'Седан',
        gens:[
          { name:'ET9', ru:'ЕТ9', years:[2025,2026], body:['Седан'],
            engines:[{hp:697,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[100,120], rangeKm:[620,700], price:[7500000,11000000] }
        ] }
    ] },

  { id:'xpeng', name:'XPeng', ru:'Сяопэн', country:'cn', popular:false, aliases:['икспенг','экспенг','xpeng','сяопэн','сяопенг','иксpeng'],
    models:[
      { id:'xpeng-p5', name:'P5', ru:'П5', popular:false, aliases:['икспенг п5','xpeng p5','p5','сяопэн п5'], body:'Седан',
        gens:[
          { name:'P5', ru:'П5', years:[2021,2024], body:['Седан'],
            engines:[{hp:211,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[55,72], rangeKm:[440,600], price:[1900000,2900000] }
        ] },
      { id:'xpeng-p7', name:'P7', ru:'П7', popular:false, aliases:['икспенг п7','xpeng p7','p7','сяопэн п7','п7 плюс','p7+'], body:'Седан',
        gens:[
          { name:'P7', ru:'П7', years:[2020,2025], body:['Седан'],
            engines:[{hp:276,fuel:'Электро'},{hp:473,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[70,86], rangeKm:[550,706], price:[2700000,4200000] }
        ] },
      { id:'xpeng-g3', name:'G3', ru:'Г3', popular:false, aliases:['икспенг г3','xpeng g3','g3','сяопэн г3'], body:'Кроссовер',
        gens:[
          { name:'G3', ru:'Г3', years:[2018,2024], body:['Кроссовер'],
            engines:[{hp:197,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[55,66], rangeKm:[420,520], price:[1600000,2500000] }
        ] },
      { id:'xpeng-g6', name:'G6', ru:'Г6', popular:false, aliases:['икспенг г6','xpeng g6','g6','сяопэн г6'], body:'Кроссовер',
        gens:[
          { name:'G6', ru:'Г6', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:296,fuel:'Электро'},{hp:487,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[66,88], rangeKm:[550,755], price:[2700000,4000000] }
        ] },
      { id:'xpeng-g7', name:'G7', ru:'Г7', popular:false, aliases:['икспенг г7','xpeng g7','g7','сяопэн г7'], body:'Кроссовер',
        gens:[
          { name:'G7', ru:'Г7', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:292,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[68,81], rangeKm:[602,702], price:[3000000,4200000] }
        ] },
      { id:'xpeng-g9', name:'G9', ru:'Г9', popular:false, aliases:['икспенг г9','xpeng g9','g9','сяопэн г9'], body:'Кроссовер',
        gens:[
          { name:'G9', ru:'Г9', years:[2022,2025], body:['Кроссовер'],
            engines:[{hp:313,fuel:'Электро'},{hp:551,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[78,98], rangeKm:[570,750], price:[3600000,5400000] }
        ] },
      { id:'xpeng-x9', name:'X9', ru:'Х9', popular:false, aliases:['икспенг х9','xpeng x9','x9','сяопэн х9'], body:'Минивэн',
        gens:[
          { name:'X9', ru:'Х9', years:[2024,2025], body:['Минивэн'],
            engines:[{hp:313,fuel:'Электро'},{hp:476,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[84,102], rangeKm:[610,702], price:[4400000,6200000] }
        ] },
      { id:'xpeng-mona-m03', name:'Mona M03', ru:'Мона М03', popular:false, aliases:['мона м03','mona m03','m03','икспенг мона','сяопэн м03'], body:'Седан',
        gens:[
          { name:'M03', ru:'М03', years:[2024,2025], body:['Седан'],
            engines:[{hp:190,fuel:'Электро'},{hp:218,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[51,62], rangeKm:[515,620], price:[1700000,2500000] }
        ] }
    ] },

  { id:'voyah', name:'Voyah', ru:'Вояж', country:'cn', popular:false, aliases:['вояж','воях','voyah','лань ту','вояж авто'],
    models:[
      { id:'voyah-free', name:'Free', ru:'Фри', popular:false, aliases:['вояж фри','voyah free','фри','вояж free'], body:'Кроссовер',
        gens:[
          { name:'Free', ru:'Фри', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:510,fuel:'Гибрид'},{hp:694,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[33,106], rangeKm:[140,650], price:[3600000,5400000] }
        ] },
      { id:'voyah-dream', name:'Dream', ru:'Дрим', popular:false, aliases:['вояж дрим','voyah dream','дрим','вояж минивэн'], body:'Минивэн',
        gens:[
          { name:'Dream', ru:'Дрим', years:[2022,2025], body:['Минивэн'],
            engines:[{vol:1.5,hp:517,fuel:'Гибрид'},{hp:694,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[43,108], rangeKm:[180,605], price:[5000000,7500000] }
        ] },
      { id:'voyah-passion', name:'Passion', ru:'Пэшн', popular:false, aliases:['вояж пэшн','voyah passion','пэшн','чжуйгуан','вояж седан'], body:'Седан',
        gens:[
          { name:'Passion', ru:'Пэшн', years:[2023,2025], body:['Седан'],
            engines:[{hp:326,fuel:'Электро'},{hp:517,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[82,108], rangeKm:[580,730], price:[3800000,5600000] }
        ] },
      { id:'voyah-courage', name:'Courage', ru:'Кураж', popular:false, aliases:['вояж кураж','voyah courage','кураж','вояж кроссовер'], body:'Кроссовер',
        gens:[
          { name:'Courage', ru:'Кураж', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:272,fuel:'Электро'},{hp:435,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[65,90], rangeKm:[500,650], price:[3000000,4400000] }
        ] }
    ] },

  { id:'gac', name:'GAC', ru:'ГАК', country:'cn', popular:false, aliases:['гак','гэйси','gac','джиэйси','трумпчи','trumpchi','гак мотор'],
    models:[
      { id:'gac-gs3', name:'GS3 Emzoom', ru:'ГС3 Эмзум', popular:false, aliases:['гс3','gs3','гак гс3','эмзум','emzoom'], body:'Кроссовер',
        gens:[
          { name:'GS3 Emzoom', ru:'ГС3 Эмзум', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:177,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1600000,2400000] }
        ] },
      { id:'gac-gs4', name:'GS4', ru:'ГС4', popular:false, aliases:['гс4','gs4','гак гс4','трумпчи гс4'], body:'Кроссовер',
        gens:[
          { name:'GS4', ru:'ГС4', years:[2018,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:169,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1700000,2600000] }
        ] },
      { id:'gac-gs8', name:'GS8', ru:'ГС8', popular:false, aliases:['гс8','gs8','гак гс8','трумпчи гс8'], body:'Кроссовер',
        gens:[
          { name:'GS8', ru:'ГС8', years:[2016,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:252,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2800000,4300000] }
        ] },
      { id:'gac-m8', name:'M8', ru:'М8', popular:false, aliases:['гак м8','gac m8','м8','трумпчи м8'], body:'Минивэн',
        gens:[
          { name:'M8', ru:'М8', years:[2019,2025], body:['Минивэн'],
            engines:[{vol:2.0,hp:252,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[3200000,5200000] }
        ] },
      { id:'gac-emkoo', name:'Emkoo', ru:'Эмку', popular:false, aliases:['эмку','emkoo','гак эмку','инкун'], body:'Кроссовер',
        gens:[
          { name:'Emkoo', ru:'Эмку', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:177,fuel:'Бензин'},{vol:2.0,hp:252,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2000000,3000000] }
        ] },
      { id:'gac-empow', name:'Empow', ru:'Эмпау', popular:false, aliases:['эмпау','empow','гак эмпау','инлу'], body:'Седан',
        gens:[
          { name:'Empow', ru:'Эмпау', years:[2021,2025], body:['Седан'],
            engines:[{vol:1.5,hp:177,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1600000,2400000] }
        ] }
    ] },

  { id:'aion', name:'Aion', ru:'Аион', country:'cn', popular:false, aliases:['аион','айон','aion','гак аион','аиан'],
    models:[
      { id:'aion-s', name:'S Plus', ru:'С Плюс', popular:false, aliases:['аион с','aion s','aion s plus','аион s','аион эс'], body:'Седан',
        gens:[
          { name:'S Plus', ru:'С Плюс', years:[2019,2025], body:['Седан'],
            engines:[{hp:184,fuel:'Электро'},{hp:224,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[52,70], rangeKm:[450,610], price:[1700000,2600000] }
        ] },
      { id:'aion-y', name:'Y Plus', ru:'Ю Плюс', popular:false, aliases:['аион у','aion y','aion y plus','аион y','аион игрек'], body:'Кроссовер',
        gens:[
          { name:'Y Plus', ru:'Ю Плюс', years:[2021,2025], body:['Кроссовер'],
            engines:[{hp:150,fuel:'Электро'},{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[51,70], rangeKm:[430,610], price:[1900000,2800000] }
        ] },
      { id:'aion-v', name:'V', ru:'В', popular:false, aliases:['аион в','aion v','аион v','аион ви'], body:'Кроссовер',
        gens:[
          { name:'V', ru:'В', years:[2020,2025], body:['Кроссовер'],
            engines:[{hp:204,fuel:'Электро'},{hp:250,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[60,80], rangeKm:[500,750], price:[2200000,3300000] }
        ] },
      { id:'aion-es', name:'ES', ru:'ЕС', popular:false, aliases:['аион ес','aion es','аион es'], body:'Седан',
        gens:[
          { name:'ES', ru:'ЕС', years:[2022,2025], body:['Седан'],
            engines:[{hp:136,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[49,60], rangeKm:[430,510], price:[1500000,2200000] }
        ] },
      { id:'aion-rt', name:'RT', ru:'РТ', popular:false, aliases:['аион рт','aion rt','аион rt'], body:'Седан',
        gens:[
          { name:'RT', ru:'РТ', years:[2024,2025], body:['Седан'],
            engines:[{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[50,68], rangeKm:[430,650], price:[1700000,2500000] }
        ] }
    ] },

  { id:'jac', name:'JAC', ru:'Джак', country:'cn', popular:false, aliases:['джак','жак','jac','джей эй си','джак моторс'],
    models:[
      { id:'jac-js3', name:'JS3', ru:'ДжС3', popular:false, aliases:['джак джс3','jac js3','js3','джс3'], body:'Кроссовер',
        gens:[
          { name:'JS3', ru:'ДжС3', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:113,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1100000,1700000] }
        ] },
      { id:'jac-js4', name:'JS4', ru:'ДжС4', popular:false, aliases:['джак джс4','jac js4','js4','джс4'], body:'Кроссовер',
        gens:[
          { name:'JS4', ru:'ДжС4', years:[2019,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1400000,2100000] }
        ] },
      { id:'jac-js6', name:'JS6', ru:'ДжС6', popular:false, aliases:['джак джс6','jac js6','js6','джс6'], body:'Кроссовер',
        gens:[
          { name:'JS6', ru:'ДжС6', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:174,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1700000,2500000] }
        ] },
      { id:'jac-t6', name:'T6', ru:'Т6', popular:false, aliases:['джак т6','jac t6','t6','джак пикап'], body:'Пикап',
        gens:[
          { name:'T6', ru:'Т6', years:[2016,2024], body:['Пикап'],
            engines:[{vol:2.0,hp:139,fuel:'Дизель'},{vol:2.0,hp:177,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1200000,2000000] }
        ] },
      { id:'jac-t8-pro', name:'T8 Pro', ru:'Т8 Про', popular:false, aliases:['джак т8','jac t8','t8 pro','т8 про'], body:'Пикап',
        gens:[
          { name:'T8 Pro', ru:'Т8 Про', years:[2021,2025], body:['Пикап'],
            engines:[{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1700000,2700000] }
        ] },
      { id:'jac-t9', name:'T9', ru:'Т9', popular:false, aliases:['джак т9','jac t9','t9','хантер т9'], body:'Пикап',
        gens:[
          { name:'T9', ru:'Т9', years:[2022,2025], body:['Пикап'],
            engines:[{vol:2.0,hp:170,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2300000,3400000] }
        ] },
      { id:'jac-x8', name:'Sehol X8', ru:'Сехол Х8', popular:false, aliases:['джак х8','sehol x8','x8','сихол х8','джак sehol'], body:'Кроссовер',
        gens:[
          { name:'X8 Plus', ru:'Х8 Плюс', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:174,fuel:'Бензин'}],
            gearbox:['Вариатор','Автомат'], drive:['Передний'], price:[1800000,2600000] }
        ] }
    ] },

  { id:'baic', name:'BAIC', ru:'Байк', country:'cn', popular:false, aliases:['байк','баик','baic','бэйцзи','бэйцзин','beijing'],
    models:[
      { id:'baic-x35', name:'X35', ru:'Х35', popular:false, aliases:['байк х35','baic x35','x35','х35'], body:'Кроссовер',
        gens:[
          { name:'X35', ru:'Х35', years:[2018,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:116,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[900000,1500000] }
        ] },
      { id:'baic-x55', name:'X55', ru:'Х55', popular:false, aliases:['байк х55','baic x55','x55','х55'], body:'Кроссовер',
        gens:[
          { name:'X55 II', ru:'Х55 2', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:177,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1500000,2300000] }
        ] },
      { id:'baic-x7', name:'X7', ru:'Х7', popular:false, aliases:['байк х7','baic x7','x7','х7'], body:'Кроссовер',
        gens:[
          { name:'X7', ru:'Х7', years:[2019,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:188,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1800000,2700000] }
        ] },
      { id:'baic-u5-plus', name:'U5 Plus', ru:'Ю5 Плюс', popular:false, aliases:['байк у5','baic u5','u5 plus','ю5 плюс'], body:'Седан',
        gens:[
          { name:'U5 Plus', ru:'Ю5 Плюс', years:[2019,2025], body:['Седан'],
            engines:[{vol:1.5,hp:113,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1000000,1600000] }
        ] },
      { id:'baic-bj40', name:'BJ40', ru:'БЖ40', popular:false, aliases:['бж40','bj40','байк бж40','beijing bj40','бэйцзин 40'], body:'Внедорожник',
        gens:[
          { name:'BJ40 Plus', ru:'БЖ40 Плюс', years:[2016,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:224,fuel:'Бензин'},{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[2300000,3800000] }
        ] },
      { id:'baic-bj60', name:'BJ60', ru:'БЖ60', popular:false, aliases:['бж60','bj60','байк бж60','beijing bj60','бэйцзин 60'], body:'Внедорожник',
        gens:[
          { name:'BJ60', ru:'БЖ60', years:[2022,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:238,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3200000,4800000] }
        ] },
      { id:'baic-bj80', name:'BJ80', ru:'БЖ80', popular:false, aliases:['бж80','bj80','байк бж80','beijing bj80','китайский гелик'], body:'Внедорожник',
        gens:[
          { name:'BJ80', ru:'БЖ80', years:[2016,2024], body:['Внедорожник'],
            engines:[{vol:2.3,hp:250,fuel:'Бензин'},{vol:3.0,hp:280,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3000000,5000000] }
        ] }
    ] },

  { id:'dongfeng', name:'Dongfeng', ru:'Дунфэн', country:'cn', popular:false, aliases:['дунфэн','дунфенг','донгфенг','dongfeng','дунфэн авто'],
    models:[
      { id:'dongfeng-ax7', name:'AX7', ru:'АХ7', popular:false, aliases:['ах7','ax7','дунфэн ах7','дунфэн ax7'], body:'Кроссовер',
        gens:[
          { name:'AX7 Pro', ru:'АХ7 Про', years:[2014,2024], body:['Кроссовер'],
            engines:[{vol:1.6,hp:150,fuel:'Бензин'},{vol:2.0,hp:141,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[1100000,2000000] }
        ] },
      { id:'dongfeng-580', name:'Glory 580', ru:'Глори 580', popular:false, aliases:['глори 580','glory 580','580','дунфэн 580','фэнгуан 580'], body:'Кроссовер',
        gens:[
          { name:'Glory 580', ru:'Глори 580', years:[2016,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:1.8,hp:139,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[900000,1700000] }
        ] },
      { id:'dongfeng-rich6', name:'Rich 6', ru:'Рич 6', popular:false, aliases:['рич 6','rich 6','rich6','дунфэн рич','дунфэн пикап'], body:'Пикап',
        gens:[
          { name:'Rich 6', ru:'Рич 6', years:[2018,2025], body:['Пикап'],
            engines:[{vol:2.3,hp:163,fuel:'Дизель'},{vol:2.0,hp:190,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1300000,2300000] }
        ] },
      { id:'dongfeng-shine-max', name:'Shine Max', ru:'Шайн Макс', popular:false, aliases:['шайн макс','shine max','shinemax','дунфэн шайн'], body:'Кроссовер',
        gens:[
          { name:'Shine Max', ru:'Шайн Макс', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1600000,2400000] }
        ] },
      { id:'dongfeng-huge', name:'Huge', ru:'Хьюдж', popular:false, aliases:['хьюдж','huge','дунфэн хьюдж','дунфэн huge'], body:'Кроссовер',
        gens:[
          { name:'Huge', ru:'Хьюдж', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:224,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2200000,3200000] }
        ] },
      { id:'dongfeng-nammi', name:'Nammi 01', ru:'Намми 01', popular:false, aliases:['намми','nammi','nammi 01','дунфэн намми'], body:'Хэтчбек',
        gens:[
          { name:'Nammi 01', ru:'Намми 01', years:[2023,2025], body:['Хэтчбек'],
            engines:[{hp:95,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[31,42], rangeKm:[330,430], price:[1200000,1800000] }
        ] }
    ] },

  { id:'forthing', name:'Forthing', ru:'Фортинг', country:'cn', popular:false, aliases:['фортинг','фортхинг','forthing','дунфэн фортинг','фэнсин'],
    models:[
      { id:'forthing-t5evo', name:'T5 Evo', ru:'Т5 Эво', popular:false, aliases:['т5 эво','t5 evo','t5evo','фортинг т5'], body:'Кроссовер',
        gens:[
          { name:'T5 Evo', ru:'Т5 Эво', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:197,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1800000,2700000] }
        ] },
      { id:'forthing-t5', name:'T5', ru:'Т5', popular:false, aliases:['фортинг т5','forthing t5','t5'], body:'Кроссовер',
        gens:[
          { name:'T5', ru:'Т5', years:[2018,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1300000,2000000] }
        ] },
      { id:'forthing-u-tour', name:'U-Tour', ru:'Ю-Тур', popular:false, aliases:['ю тур','u-tour','utour','фортинг ю тур','фортинг минивэн'], body:'Минивэн',
        gens:[
          { name:'U-Tour', ru:'Ю-Тур', years:[2021,2025], body:['Минивэн'],
            engines:[{vol:1.5,hp:197,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2000000,3000000] }
        ] },
      { id:'forthing-s7', name:'Xinghai S7', ru:'Синхай С7', popular:false, aliases:['синхай с7','xinghai s7','forthing s7','фортинг с7'], body:'Седан',
        gens:[
          { name:'S7', ru:'С7', years:[2023,2025], body:['Седан'],
            engines:[{hp:218,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[60,72], rangeKm:[520,620], price:[2200000,3200000] }
        ] },
      { id:'forthing-friday', name:'Friday', ru:'Фрайдей', popular:false, aliases:['фрайдей','friday','фортинг фрайдей','фортинг friday'], body:'Кроссовер',
        gens:[
          { name:'Friday', ru:'Фрайдей', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:184,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1900000,2800000] }
        ] }
    ] },

  { id:'omoda', name:'Omoda', ru:'Омода', country:'cn', popular:true, aliases:['омода','omoda','амода','омода авто','омада'],
    models:[
      { id:'omoda-c5', name:'C5', ru:'С5', popular:true, aliases:['омода с5','omoda c5','c5','с5','омода 5','omoda 5'], body:'Кроссовер',
        gens:[
          { name:'C5', ru:'С5', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'},{vol:1.6,hp:186,fuel:'Бензин'}],
            gearbox:['Вариатор','Робот'], drive:['Передний'], price:[1900000,2900000] }
        ] },
      { id:'omoda-c7', name:'C7', ru:'С7', popular:false, aliases:['омода с7','omoda c7','c7','с7','омода 7'], body:'Кроссовер',
        gens:[
          { name:'C7', ru:'С7', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:197,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[2600000,3600000] }
        ] },
      { id:'omoda-s5', name:'S5', ru:'С5 седан', popular:false, aliases:['омода s5','omoda s5','эс5','омода седан'], body:'Седан',
        gens:[
          { name:'S5', ru:'С5', years:[2022,2025], body:['Седан'],
            engines:[{vol:1.5,hp:113,fuel:'Бензин'},{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1500000,2300000] }
        ] },
      { id:'omoda-e5', name:'E5', ru:'Е5', popular:false, aliases:['омода е5','omoda e5','e5','омода электро'], body:'Кроссовер',
        gens:[
          { name:'E5', ru:'Е5', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[61,61], rangeKm:[420,470], price:[2400000,3300000] }
        ] },
      { id:'omoda-c9', name:'C9', ru:'С9', popular:false, aliases:['омода с9','omoda c9','c9','омода 9'], body:'Кроссовер',
        gens:[
          { name:'C9', ru:'С9', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:261,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3400000,4600000] }
        ] },
      { id:'omoda-c3', name:'C3', ru:'С3', popular:false, aliases:['омода с3','omoda c3','c3','омода 3'], body:'Кроссовер',
        gens:[
          { name:'C3', ru:'С3', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[2100000,2900000] }
        ] }
    ] },

  { id:'jaecoo', name:'Jaecoo', ru:'Джейку', country:'cn', popular:true, aliases:['джейку','джеку','jaecoo','джаеку','джейкоо'],
    models:[
      { id:'jaecoo-j5', name:'J5', ru:'Дж5', popular:false, aliases:['джейку j5','jaecoo j5','j5','дж5'], body:'Кроссовер',
        gens:[
          { name:'J5', ru:'Дж5', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:197,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[2100000,3000000] }
        ] },
      { id:'jaecoo-j6', name:'J6', ru:'Дж6', popular:false, aliases:['джейку j6','jaecoo j6','j6','дж6'], body:'Внедорожник',
        gens:[
          { name:'J6', ru:'Дж6', years:[2024,2025], body:['Внедорожник'],
            engines:[{hp:279,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[69,69], rangeKm:[400,450], price:[2900000,4000000] }
        ] },
      { id:'jaecoo-j7', name:'J7', ru:'Дж7', popular:true, aliases:['джейку j7','jaecoo j7','j7','дж7','джейку 7'], body:'Кроссовер',
        gens:[
          { name:'J7', ru:'Дж7', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:186,fuel:'Бензин'},{vol:1.5,hp:204,fuel:'Гибрид'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[2400000,3500000] }
        ] },
      { id:'jaecoo-j8', name:'J8', ru:'Дж8', popular:false, aliases:['джейку j8','jaecoo j8','j8','дж8','джейку 8'], body:'Внедорожник',
        gens:[
          { name:'J8', ru:'Дж8', years:[2023,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:261,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3400000,4700000] }
        ] }
    ] },

  { id:'lynkco', name:'Lynk & Co', ru:'Линк энд Ко', country:'cn', popular:false, aliases:['линк ко','линк энд ко','lynk co','lynk&co','линк','линкко'],
    models:[
      { id:'lynkco-01', name:'01', ru:'01', popular:false, aliases:['линк 01','lynk 01','01','линк ко 01'], body:'Кроссовер',
        gens:[
          { name:'01', ru:'01', years:[2017,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:180,fuel:'Бензин'},{vol:2.0,hp:238,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1900000,3100000] }
        ] },
      { id:'lynkco-02', name:'02', ru:'02', popular:false, aliases:['линк 02','lynk 02','02','линк ко 02'], body:'Кроссовер',
        gens:[
          { name:'02', ru:'02', years:[2018,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:180,fuel:'Бензин'},{vol:1.5,hp:255,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1900000,2900000] }
        ] },
      { id:'lynkco-03', name:'03', ru:'03', popular:false, aliases:['линк 03','lynk 03','03','линк ко 03','линк 03 плюс'], body:'Седан',
        gens:[
          { name:'03', ru:'03', years:[2018,2025], body:['Седан'],
            engines:[{vol:1.5,hp:180,fuel:'Бензин'},{vol:2.0,hp:254,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1900000,3200000] }
        ] },
      { id:'lynkco-05', name:'05', ru:'05', popular:false, aliases:['линк 05','lynk 05','05','линк ко 05'], body:'Кроссовер',
        gens:[
          { name:'05', ru:'05', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:254,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2400000,3500000] }
        ] },
      { id:'lynkco-06', name:'06', ru:'06', popular:false, aliases:['линк 06','lynk 06','06','линк ко 06'], body:'Кроссовер',
        gens:[
          { name:'06', ru:'06', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:181,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1700000,2600000] }
        ] },
      { id:'lynkco-08', name:'08', ru:'08', popular:false, aliases:['линк 08','lynk 08','08','линк ко 08'], body:'Кроссовер',
        gens:[
          { name:'08', ru:'08', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:245,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2900000,4200000] }
        ] },
      { id:'lynkco-09', name:'09', ru:'09', popular:false, aliases:['линк 09','lynk 09','09','линк ко 09'], body:'Кроссовер',
        gens:[
          { name:'09', ru:'09', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:254,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3200000,4800000] }
        ] }
    ] },

  { id:'leapmotor', name:'Leapmotor', ru:'Липмотор', country:'cn', popular:false, aliases:['липмотор','лип мотор','leapmotor','лянпао','липмоторс'],
    models:[
      { id:'leapmotor-t03', name:'T03', ru:'Т03', popular:false, aliases:['липмотор т03','leapmotor t03','t03','т03'], body:'Хэтчбек',
        gens:[
          { name:'T03', ru:'Т03', years:[2020,2025], body:['Хэтчбек'],
            engines:[{hp:95,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[37,42], rangeKm:[280,400], price:[1000000,1600000] }
        ] },
      { id:'leapmotor-c01', name:'C01', ru:'С01', popular:false, aliases:['липмотор с01','leapmotor c01','c01','с01'], body:'Седан',
        gens:[
          { name:'C01', ru:'С01', years:[2022,2025], body:['Седан'],
            engines:[{hp:272,fuel:'Электро'},{vol:1.5,hp:215,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[43,90], rangeKm:[300,717], price:[2200000,3300000] }
        ] },
      { id:'leapmotor-c10', name:'C10', ru:'С10', popular:false, aliases:['липмотор с10','leapmotor c10','c10','с10'], body:'Кроссовер',
        gens:[
          { name:'C10', ru:'С10', years:[2024,2025], body:['Кроссовер'],
            engines:[{hp:218,fuel:'Электро'},{vol:1.5,hp:215,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[28,70], rangeKm:[145,530], price:[2400000,3400000] }
        ] },
      { id:'leapmotor-c11', name:'C11', ru:'С11', popular:false, aliases:['липмотор с11','leapmotor c11','c11','с11'], body:'Кроссовер',
        gens:[
          { name:'C11', ru:'С11', years:[2021,2025], body:['Кроссовер'],
            engines:[{hp:272,fuel:'Электро'},{vol:1.5,hp:215,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[43,90], rangeKm:[285,610], price:[2400000,3600000] }
        ] },
      { id:'leapmotor-c16', name:'C16', ru:'С16', popular:false, aliases:['липмотор с16','leapmotor c16','c16','с16'], body:'Кроссовер',
        gens:[
          { name:'C16', ru:'С16', years:[2024,2025], body:['Кроссовер'],
            engines:[{hp:215,fuel:'Электро'},{vol:1.5,hp:215,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[33,80], rangeKm:[180,605], price:[2700000,3900000] }
        ] },
      { id:'leapmotor-b10', name:'B10', ru:'Б10', popular:false, aliases:['липмотор б10','leapmotor b10','b10','б10'], body:'Кроссовер',
        gens:[
          { name:'B10', ru:'Б10', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:218,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[56,67], rangeKm:[510,600], price:[2100000,2900000] }
        ] }
    ] },

  { id:'xiaomi', name:'Xiaomi', ru:'Сяоми', country:'cn', popular:true, aliases:['сяоми','ксиаоми','xiaomi','ксяоми','сяоми авто','шаоми'],
    models:[
      { id:'xiaomi-su7', name:'SU7', ru:'СУ7', popular:true, aliases:['су7','su7','сяоми су7','сяоми su7','су 7'], body:'Седан',
        gens:[
          { name:'SU7', ru:'СУ7', years:[2024,2025], body:['Седан'],
            engines:[{hp:299,fuel:'Электро'},{hp:673,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[73,101], rangeKm:[700,830], price:[3400000,5200000] }
        ] },
      { id:'xiaomi-su7-ultra', name:'SU7 Ultra', ru:'СУ7 Ультра', popular:false, aliases:['су7 ультра','su7 ultra','su7ultra','сяоми ультра'], body:'Седан',
        gens:[
          { name:'SU7 Ultra', ru:'Ультра', years:[2025,2026], body:['Седан'],
            engines:[{hp:1548,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[93,94], rangeKm:[600,630], price:[8500000,13000000] }
        ] },
      { id:'xiaomi-yu7', name:'YU7', ru:'ЮУ7', popular:true, aliases:['ю7','yu7','сяоми ю7','сяоми yu7','ю 7'], body:'Кроссовер',
        gens:[
          { name:'YU7', ru:'ЮУ7', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:320,fuel:'Электро'},{hp:690,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[96,102], rangeKm:[760,835], price:[3800000,5600000] }
        ] }
    ] },

  { id:'denza', name:'Denza', ru:'Денза', country:'cn', popular:false, aliases:['денза','дэнза','denza','тэнши','бид денза'],
    models:[
      { id:'denza-d9', name:'D9', ru:'Д9', popular:false, aliases:['денза д9','denza d9','d9','д9'], body:'Минивэн',
        gens:[
          { name:'D9', ru:'Д9', years:[2022,2025], body:['Минивэн'],
            engines:[{vol:1.5,hp:197,fuel:'Гибрид'},{hp:374,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], batteryKwh:[18,103], rangeKm:[180,620], price:[4200000,6500000] }
        ] },
      { id:'denza-n7', name:'N7', ru:'Н7', popular:false, aliases:['денза н7','denza n7','n7'], body:'Кроссовер',
        gens:[
          { name:'N7', ru:'Н7', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:308,fuel:'Электро'},{hp:523,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[71,92], rangeKm:[550,702], price:[3200000,4600000] }
        ] },
      { id:'denza-n8', name:'N8', ru:'Н8', popular:false, aliases:['денза н8','denza n8','n8'], body:'Кроссовер',
        gens:[
          { name:'N8', ru:'Н8', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], batteryKwh:[18,18], rangeKm:[100,180], price:[3200000,4400000] }
        ] },
      { id:'denza-n9', name:'N9', ru:'Н9', popular:false, aliases:['денза н9','denza n9','n9'], body:'Кроссовер',
        gens:[
          { name:'N9', ru:'Н9', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:966,fuel:'Электро'},{vol:2.0,hp:857,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[38,110], rangeKm:[200,630], price:[5800000,8500000] }
        ] },
      { id:'denza-z9gt', name:'Z9 GT', ru:'З9 ГТ', popular:false, aliases:['денза з9','denza z9','z9 gt','z9gt'], body:'Универсал',
        gens:[
          { name:'Z9 GT', ru:'З9 ГТ', years:[2024,2025], body:['Универсал'],
            engines:[{hp:965,fuel:'Электро'},{vol:2.0,hp:872,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[38,100], rangeKm:[200,630], price:[4600000,6800000] }
        ] }
    ] },

  { id:'fangchengbao', name:'Fang Cheng Bao', ru:'Фанчэнбао', country:'cn', popular:false, aliases:['фанчэнбао','фанченбао','fang cheng bao','fcb','бао','формула бао','леопард'],
    models:[
      { id:'fcb-bao5', name:'Bao 5', ru:'Бао 5', popular:false, aliases:['бао 5','bao 5','bao5','леопард 5','leopard 5','фанчэнбао 5'], body:'Внедорожник',
        gens:[
          { name:'Bao 5', ru:'Бао 5', years:[2023,2025], body:['Внедорожник'],
            engines:[{vol:1.5,hp:687,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[31,32], rangeKm:[125,140], price:[3800000,5400000] }
        ] },
      { id:'fcb-bao8', name:'Bao 8', ru:'Бао 8', popular:false, aliases:['бао 8','bao 8','bao8','леопард 8','фанчэнбао 8'], body:'Внедорожник',
        gens:[
          { name:'Bao 8', ru:'Бао 8', years:[2024,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:700,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[36,36], rangeKm:[125,150], price:[5000000,7000000] }
        ] },
      { id:'fcb-ti3', name:'Titanium 3', ru:'Титаниум 3', popular:false, aliases:['титаниум 3','titanium 3','ti3','тай3','фанчэнбао титан'], body:'Кроссовер',
        gens:[
          { name:'Ti3', ru:'Ти3', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[55,68], rangeKm:[450,520], price:[2200000,3000000] }
        ] },
      { id:'fcb-bao5-ev', name:'Tai 7', ru:'Тай 7', popular:false, aliases:['тай 7','tai 7','tai7','фанчэнбао тай 7'], body:'Кроссовер',
        gens:[
          { name:'Tai 7', ru:'Тай 7', years:[2025,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:435,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], batteryKwh:[19,32], rangeKm:[100,175], price:[2800000,3900000] }
        ] }
    ] },

  { id:'yangwang', name:'Yangwang', ru:'Янван', country:'cn', popular:false, aliases:['янван','ян ван','yangwang','бид янван','янг ванг'],
    models:[
      { id:'yangwang-u8', name:'U8', ru:'Ю8', popular:false, aliases:['янван у8','yangwang u8','u8','ю8'], body:'Внедорожник',
        gens:[
          { name:'U8', ru:'Ю8', years:[2023,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:1197,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[49,49], rangeKm:[180,200], price:[10000000,15000000] }
        ] },
      { id:'yangwang-u9', name:'U9', ru:'Ю9', popular:false, aliases:['янван у9','yangwang u9','u9','ю9'], body:'Купе',
        gens:[
          { name:'U9', ru:'Ю9', years:[2024,2025], body:['Купе'],
            engines:[{hp:1306,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[80,80], rangeKm:[450,465], price:[16000000,24000000] }
        ] },
      { id:'yangwang-u7', name:'U7', ru:'Ю7', popular:false, aliases:['янван у7','yangwang u7','u7','ю7'], body:'Седан',
        gens:[
          { name:'U7', ru:'Ю7', years:[2024,2025], body:['Седан'],
            engines:[{hp:1306,fuel:'Электро'},{vol:2.0,hp:952,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[52,135], rangeKm:[200,720], price:[9000000,13000000] }
        ] }
    ] },

  { id:'rox', name:'Rox', ru:'Рокс', country:'cn', popular:false, aliases:['рокс','rox','рокс мотор','полар стоун','цзиши','rox 01'],
    models:[
      { id:'rox-01', name:'Rox 01', ru:'Рокс 01', popular:false, aliases:['рокс 01','rox 01','rox01','рокс01','цзиши 01'], body:'Внедорожник',
        gens:[
          { name:'Rox 01', ru:'01', years:[2024,2025], body:['Внедорожник'],
            engines:[{vol:1.5,hp:748,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[59,66], rangeKm:[240,290], price:[4800000,6800000] }
        ] }
    ] },

  { id:'immotors', name:'IM Motors', ru:'АйЭм Моторс', country:'cn', popular:false, aliases:['айэм','im motors','immotors','чжицзи','zhiji','ай эм моторс'],
    models:[
      { id:'im-l6', name:'L6', ru:'Л6', popular:false, aliases:['айэм л6','im l6','l6','чжицзи л6'], body:'Седан',
        gens:[
          { name:'L6', ru:'Л6', years:[2024,2025], body:['Седан'],
            engines:[{hp:299,fuel:'Электро'},{hp:787,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[75,100], rangeKm:[620,800], price:[2900000,4400000] }
        ] },
      { id:'im-l7', name:'L7', ru:'Л7', popular:false, aliases:['айэм л7','im l7','l7','чжицзи л7'], body:'Седан',
        gens:[
          { name:'L7', ru:'Л7', years:[2022,2025], body:['Седан'],
            engines:[{hp:408,fuel:'Электро'},{hp:578,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[90,100], rangeKm:[615,730], price:[3200000,4800000] }
        ] },
      { id:'im-ls6', name:'LS6', ru:'ЛС6', popular:false, aliases:['айэм лс6','im ls6','ls6','чжицзи лс6'], body:'Кроссовер',
        gens:[
          { name:'LS6', ru:'ЛС6', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:252,fuel:'Электро'},{hp:579,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[77,100], rangeKm:[560,760], price:[2900000,4300000] }
        ] },
      { id:'im-ls7', name:'LS7', ru:'ЛС7', popular:false, aliases:['айэм лс7','im ls7','ls7','чжицзи лс7'], body:'Кроссовер',
        gens:[
          { name:'LS7', ru:'ЛС7', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:435,fuel:'Электро'},{hp:578,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[90,100], rangeKm:[560,660], price:[3600000,5200000] }
        ] },
      { id:'im-ls9', name:'LS9', ru:'ЛС9', popular:false, aliases:['айэм лс9','im ls9','ls9','чжицзи лс9'], body:'Кроссовер',
        gens:[
          { name:'LS9', ru:'ЛС9', years:[2025,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:517,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], batteryKwh:[66,66], rangeKm:[300,350], price:[4600000,6200000] }
        ] }
    ] },

  { id:'arcfox', name:'Arcfox', ru:'Аркфокс', country:'cn', popular:false, aliases:['аркфокс','арк фокс','arcfox','цзиху','байк аркфокс'],
    models:[
      { id:'arcfox-alpha-s', name:'Alpha S', ru:'Альфа С', popular:false, aliases:['альфа с','alpha s','arcfox alpha s','аркфокс альфа с','альфа эс'], body:'Седан',
        gens:[
          { name:'Alpha S', ru:'Альфа С', years:[2021,2025], body:['Седан'],
            engines:[{hp:218,fuel:'Электро'},{hp:653,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[67,94], rangeKm:[520,700], price:[2600000,4200000] }
        ] },
      { id:'arcfox-alpha-t', name:'Alpha T', ru:'Альфа Т', popular:false, aliases:['альфа т','alpha t','arcfox alpha t','аркфокс альфа т'], body:'Кроссовер',
        gens:[
          { name:'Alpha T', ru:'Альфа Т', years:[2020,2025], body:['Кроссовер'],
            engines:[{hp:218,fuel:'Электро'},{hp:437,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[67,93], rangeKm:[480,650], price:[2500000,3900000] }
        ] },
      { id:'arcfox-alpha-t5', name:'Alpha T5', ru:'Альфа Т5', popular:false, aliases:['альфа т5','alpha t5','arcfox t5','аркфокс т5'], body:'Кроссовер',
        gens:[
          { name:'Alpha T5', ru:'Альфа Т5', years:[2023,2025], body:['Кроссовер'],
            engines:[{hp:218,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[65,72], rangeKm:[520,600], price:[2200000,3200000] }
        ] },
      { id:'arcfox-kaola', name:'Kaola', ru:'Каола', popular:false, aliases:['каола','коала','kaola','аркфокс каола'], body:'Минивэн',
        gens:[
          { name:'Kaola', ru:'Каола', years:[2023,2025], body:['Минивэн'],
            engines:[{hp:204,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[60,70], rangeKm:[450,520], price:[2400000,3400000] }
        ] }
    ] },

  { id:'seres', name:'Seres', ru:'Серес', country:'cn', popular:false, aliases:['серес','сирес','seres','саньси','цзиньканг'],
    models:[
      { id:'seres-3', name:'Seres 3', ru:'Серес 3', popular:false, aliases:['серес 3','seres 3','seres3','серес3'], body:'Кроссовер',
        gens:[
          { name:'Seres 3', ru:'3', years:[2020,2024], body:['Кроссовер'],
            engines:[{hp:163,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[52,53], rangeKm:[329,405], price:[1600000,2400000] }
        ] },
      { id:'seres-5', name:'Seres 5', ru:'Серес 5', popular:false, aliases:['серес 5','seres 5','seres5','серес5'], body:'Кроссовер',
        gens:[
          { name:'Seres 5', ru:'5', years:[2022,2025], body:['Кроссовер'],
            engines:[{hp:374,fuel:'Электро'},{vol:1.5,hp:255,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[40,80], rangeKm:[180,530], price:[2600000,3800000] }
        ] },
      { id:'seres-sf5', name:'SF5', ru:'СФ5', popular:false, aliases:['серес сф5','seres sf5','sf5','сф5'], body:'Кроссовер',
        gens:[
          { name:'SF5', ru:'СФ5', years:[2019,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:551,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], batteryKwh:[33,35], rangeKm:[130,180], price:[2400000,3400000] }
        ] },
      { id:'seres-e5', name:'Landian E5', ru:'Ландиан Е5', popular:false, aliases:['ландиан е5','landian e5','лань дянь','серес е5'], body:'Кроссовер',
        gens:[
          { name:'E5', ru:'Е5', years:[2023,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:218,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[19,44], rangeKm:[100,270], price:[2000000,3000000] }
        ] }
    ] },

  { id:'wuling', name:'Wuling', ru:'Вулинг', country:'cn', popular:false, aliases:['вулинг','вулин','wuling','улин','вулинг мотор'],
    models:[
      { id:'wuling-mini-ev', name:'Hongguang Mini EV', ru:'Хунгуан Мини', popular:false, aliases:['мини ев','mini ev','minievs','вулинг мини','хунгуан мини','wuling mini'], body:'Хэтчбек',
        gens:[
          { name:'Mini EV', ru:'Мини ЕВ', years:[2020,2025], body:['Хэтчбек'],
            engines:[{hp:41,fuel:'Электро'},{hp:68,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[9,17], rangeKm:[120,300], price:[450000,900000] }
        ] },
      { id:'wuling-bingo', name:'Bingo', ru:'Бинго', popular:false, aliases:['бинго','bingo','вулинг бинго','бинго ев'], body:'Хэтчбек',
        gens:[
          { name:'Bingo', ru:'Бинго', years:[2023,2025], body:['Хэтчбек'],
            engines:[{hp:68,fuel:'Электро'},{hp:100,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[17,37], rangeKm:[203,410], price:[850000,1400000] }
        ] },
      { id:'wuling-xingguang', name:'Xingguang', ru:'Синьгуан', popular:false, aliases:['синьгуан','xingguang','вулинг синьгуан','вулинг стар лайт'], body:'Седан',
        gens:[
          { name:'Xingguang', ru:'Синьгуан', years:[2024,2025], body:['Седан'],
            engines:[{vol:1.5,hp:139,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[18,32], rangeKm:[100,150], price:[1300000,1900000] }
        ] },
      { id:'wuling-almaz', name:'Almaz', ru:'Алмаз', popular:false, aliases:['алмаз','almaz','вулинг алмаз','вулинг almaz'], body:'Кроссовер',
        gens:[
          { name:'Almaz', ru:'Алмаз', years:[2019,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1300000,2000000] }
        ] },
      { id:'wuling-cortez', name:'Cortez', ru:'Кортез', popular:false, aliases:['кортез','cortez','вулинг кортез','вулинг минивэн'], body:'Минивэн',
        gens:[
          { name:'Cortez', ru:'Кортез', years:[2018,2024], body:['Минивэн'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1200000,1900000] }
        ] },
      { id:'wuling-hongguang-s', name:'Hongguang S', ru:'Хунгуан С', popular:false, aliases:['хунгуан','hongguang','вулинг хунгуан','хунгуан с'], body:'Минивэн',
        gens:[
          { name:'Hongguang S', ru:'Хунгуан С', years:[2013,2023], body:['Минивэн'],
            engines:[{vol:1.2,hp:82,fuel:'Бензин'},{vol:1.5,hp:107,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Задний'], price:[500000,1100000] }
        ] }
    ] },

  { id:'baojun', name:'Baojun', ru:'Баоцзюнь', country:'cn', popular:false, aliases:['баоцзюнь','баоджун','baojun','баоцзюн','баоцзун'],
    models:[
      { id:'baojun-yep', name:'Yep', ru:'Йеп', popular:false, aliases:['йеп','yep','баоцзюнь йеп','баоцзюнь yep','йеп плюс'], body:'Внедорожник',
        gens:[
          { name:'Yep', ru:'Йеп', years:[2023,2025], body:['Внедорожник'],
            engines:[{hp:68,fuel:'Электро'},{hp:100,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[28,42], rangeKm:[303,451], price:[1100000,1800000] }
        ] },
      { id:'baojun-yunduo', name:'Yunduo', ru:'Юньдо', popular:false, aliases:['юньдо','yunduo','cloud','баоцзюнь юньдо','баоцзюнь клауд'], body:'Хэтчбек',
        gens:[
          { name:'Yunduo', ru:'Юньдо', years:[2023,2025], body:['Хэтчбек'],
            engines:[{hp:136,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[37,42], rangeKm:[360,460], price:[1200000,1900000] }
        ] },
      { id:'baojun-yunhai', name:'Yunhai', ru:'Юньхай', popular:false, aliases:['юньхай','yunhai','баоцзюнь юньхай'], body:'Кроссовер',
        gens:[
          { name:'Yunhai', ru:'Юньхай', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:143,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[18,18], rangeKm:[100,135], price:[1400000,2000000] }
        ] },
      { id:'baojun-510', name:'510', ru:'510', popular:false, aliases:['баоцзюнь 510','baojun 510','510'], body:'Кроссовер',
        gens:[
          { name:'510', ru:'510', years:[2017,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:112,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[700000,1300000] }
        ] },
      { id:'baojun-530', name:'530', ru:'530', popular:false, aliases:['баоцзюнь 530','baojun 530','530'], body:'Кроссовер',
        gens:[
          { name:'530', ru:'530', years:[2018,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1000000,1700000] }
        ] }
    ] },

  { id:'bestune', name:'Bestune', ru:'Бестюн', country:'cn', popular:false, aliases:['бестюн','бестун','bestune','фав бестюн','бэстюн','бэнтэн'],
    models:[
      { id:'bestune-t33', name:'T33', ru:'Т33', popular:false, aliases:['бестюн т33','bestune t33','t33','т33'], body:'Кроссовер',
        gens:[
          { name:'T33', ru:'Т33', years:[2020,2024], body:['Кроссовер'],
            engines:[{vol:1.6,hp:114,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[1000000,1600000] }
        ] },
      { id:'bestune-t55', name:'T55', ru:'Т55', popular:false, aliases:['бестюн т55','bestune t55','t55','т55'], body:'Кроссовер',
        gens:[
          { name:'T55', ru:'Т55', years:[2021,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:169,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1500000,2200000] }
        ] },
      { id:'bestune-t77', name:'T77', ru:'Т77', popular:false, aliases:['бестюн т77','bestune t77','t77','т77'], body:'Кроссовер',
        gens:[
          { name:'T77', ru:'Т77', years:[2018,2024], body:['Кроссовер'],
            engines:[{vol:1.2,hp:143,fuel:'Бензин'},{vol:1.5,hp:169,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1300000,2000000] }
        ] },
      { id:'bestune-t90', name:'T90', ru:'Т90', popular:false, aliases:['бестюн т90','bestune t90','t90','т90'], body:'Кроссовер',
        gens:[
          { name:'T90', ru:'Т90', years:[2020,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:169,fuel:'Бензин'},{vol:2.0,hp:224,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1800000,2700000] }
        ] },
      { id:'bestune-t99', name:'T99', ru:'Т99', popular:false, aliases:['бестюн т99','bestune t99','t99','т99'], body:'Кроссовер',
        gens:[
          { name:'T99', ru:'Т99', years:[2019,2024], body:['Кроссовер'],
            engines:[{vol:2.0,hp:224,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2000000,3000000] }
        ] },
      { id:'bestune-b70', name:'B70', ru:'Б70', popular:false, aliases:['бестюн б70','bestune b70','b70','б70'], body:'Седан',
        gens:[
          { name:'B70', ru:'Б70', years:[2020,2025], body:['Седан'],
            engines:[{vol:1.5,hp:169,fuel:'Бензин'},{vol:2.0,hp:224,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1600000,2500000] }
        ] },
      { id:'bestune-pony', name:'Pony', ru:'Пони', popular:false, aliases:['пони','pony','бестюн пони','бестюн pony'], body:'Хэтчбек',
        gens:[
          { name:'Pony', ru:'Пони', years:[2023,2025], body:['Хэтчбек'],
            engines:[{hp:41,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Задний'], batteryKwh:[12,31], rangeKm:[122,331], price:[500000,1000000] }
        ] }
    ] },

  { id:'kaiyi', name:'Kaiyi', ru:'Кайи', country:'cn', popular:false, aliases:['кайи','каи','kaiyi','кайи авто','кайыи'],
    models:[
      { id:'kaiyi-e5', name:'E5', ru:'Е5', popular:false, aliases:['кайи е5','kaiyi e5','e5','кайи e5'], body:'Седан',
        gens:[
          { name:'E5', ru:'Е5', years:[2021,2025], body:['Седан'],
            engines:[{vol:1.5,hp:116,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[950000,1500000] }
        ] },
      { id:'kaiyi-x3', name:'X3', ru:'Х3', popular:false, aliases:['кайи х3','kaiyi x3','x3','кайи x3'], body:'Кроссовер',
        gens:[
          { name:'X3', ru:'Х3', years:[2019,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:116,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1000000,1600000] }
        ] },
      { id:'kaiyi-x3-pro', name:'X3 Pro', ru:'Х3 Про', popular:false, aliases:['кайи х3 про','kaiyi x3 pro','x3 pro','х3 про'], body:'Кроссовер',
        gens:[
          { name:'X3 Pro', ru:'Х3 Про', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:147,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1200000,1900000] }
        ] },
      { id:'kaiyi-x7', name:'X7 Kunlun', ru:'Х7 Куньлунь', popular:false, aliases:['кайи х7','kaiyi x7','x7','куньлунь','kunlun'], body:'Кроссовер',
        gens:[
          { name:'X7 Kunlun', ru:'Х7 Куньлунь', years:[2022,2025], body:['Кроссовер'],
            engines:[{vol:1.6,hp:197,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1700000,2500000] }
        ] },
      { id:'kaiyi-xuandu', name:'Xuandu', ru:'Сюаньду', popular:false, aliases:['сюаньду','xuandu','кайи сюаньду','кайи xuandu'], body:'Седан',
        gens:[
          { name:'Xuandu', ru:'Сюаньду', years:[2023,2025], body:['Седан'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1300000,2000000] }
        ] }
    ] },

  { id:'soueast', name:'Soueast', ru:'Соуист', country:'cn', popular:false, aliases:['соуист','соуиист','soueast','дунань','саутист','юго восток'],
    models:[
      { id:'soueast-dx3', name:'DX3', ru:'ДХ3', popular:false, aliases:['соуист дх3','soueast dx3','dx3','дх3'], body:'Кроссовер',
        gens:[
          { name:'DX3', ru:'ДХ3', years:[2016,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[900000,1500000] }
        ] },
      { id:'soueast-dx5', name:'DX5', ru:'ДХ5', popular:false, aliases:['соуист дх5','soueast dx5','dx5','дх5'], body:'Кроссовер',
        gens:[
          { name:'DX5', ru:'ДХ5', years:[2018,2023], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1000000,1600000] }
        ] },
      { id:'soueast-dx7', name:'DX7', ru:'ДХ7', popular:false, aliases:['соуист дх7','soueast dx7','dx7','дх7'], body:'Кроссовер',
        gens:[
          { name:'DX7', ru:'ДХ7', years:[2015,2022], body:['Кроссовер'],
            engines:[{vol:1.5,hp:163,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[1000000,1700000] }
        ] },
      { id:'soueast-s06', name:'S06', ru:'С06', popular:false, aliases:['соуист с06','soueast s06','s06','с06'], body:'Кроссовер',
        gens:[
          { name:'S06', ru:'С06', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1600000,2300000] }
        ] },
      { id:'soueast-s07', name:'S07', ru:'С07', popular:false, aliases:['соуист с07','soueast s07','s07','с07'], body:'Кроссовер',
        gens:[
          { name:'S07', ru:'С07', years:[2024,2025], body:['Кроссовер'],
            engines:[{vol:1.5,hp:156,fuel:'Бензин'},{vol:1.6,hp:197,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[1900000,2700000] }
        ] }
    ] },

  { id:'maxus', name:'Maxus', ru:'Максус', country:'cn', popular:false, aliases:['максус','максас','maxus','ldv','саик максус','датун'],
    models:[
      { id:'maxus-t60', name:'T60', ru:'Т60', popular:false, aliases:['максус т60','maxus t60','t60','т60'], body:'Пикап',
        gens:[
          { name:'T60', ru:'Т60', years:[2017,2024], body:['Пикап'],
            engines:[{vol:2.0,hp:150,fuel:'Дизель'},{vol:2.0,hp:224,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1600000,2600000] }
        ] },
      { id:'maxus-t70', name:'T70', ru:'Т70', popular:false, aliases:['максус т70','maxus t70','t70','т70'], body:'Пикап',
        gens:[
          { name:'T70', ru:'Т70', years:[2021,2025], body:['Пикап'],
            engines:[{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2000000,3000000] }
        ] },
      { id:'maxus-t90', name:'T90', ru:'Т90', popular:false, aliases:['максус т90','maxus t90','t90','т90'], body:'Пикап',
        gens:[
          { name:'T90', ru:'Т90', years:[2021,2025], body:['Пикап'],
            engines:[{vol:2.0,hp:218,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2400000,3500000] }
        ] },
      { id:'maxus-d60', name:'D60', ru:'Д60', popular:false, aliases:['максус д60','maxus d60','d60','д60'], body:'Кроссовер',
        gens:[
          { name:'D60', ru:'Д60', years:[2019,2024], body:['Кроссовер'],
            engines:[{vol:1.5,hp:169,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1500000,2300000] }
        ] },
      { id:'maxus-d90', name:'D90', ru:'Д90', popular:false, aliases:['максус д90','maxus d90','d90','д90'], body:'Внедорожник',
        gens:[
          { name:'D90', ru:'Д90', years:[2017,2025], body:['Внедорожник'],
            engines:[{vol:2.0,hp:224,fuel:'Бензин'},{vol:2.0,hp:218,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2600000,4200000] }
        ] },
      { id:'maxus-g10', name:'G10', ru:'Г10', popular:false, aliases:['максус г10','maxus g10','g10','г10'], body:'Минивэн',
        gens:[
          { name:'G10', ru:'Г10', years:[2014,2023], body:['Минивэн'],
            engines:[{vol:2.0,hp:224,fuel:'Бензин'},{vol:1.9,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[1600000,2800000] }
        ] },
      { id:'maxus-g20', name:'G20', ru:'Г20', popular:false, aliases:['максус г20','maxus g20','g20','г20'], body:'Минивэн',
        gens:[
          { name:'G20', ru:'Г20', years:[2019,2025], body:['Минивэн'],
            engines:[{vol:2.0,hp:224,fuel:'Бензин'},{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний'], price:[2400000,3800000] }
        ] },
      { id:'maxus-mifa9', name:'Mifa 9', ru:'Мифа 9', popular:false, aliases:['мифа 9','mifa 9','mifa9','максус мифа','мифа'], body:'Минивэн',
        gens:[
          { name:'Mifa 9', ru:'Мифа 9', years:[2022,2025], body:['Минивэн'],
            engines:[{hp:245,fuel:'Электро'}],
            gearbox:['Автомат'], drive:['Передний'], batteryKwh:[90,90], rangeKm:[440,560], price:[3800000,5500000] }
        ] }
    ] }
];
