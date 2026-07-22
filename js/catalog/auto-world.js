const AUTO_WORLD = [
  { id:'toyota', name:'Toyota', ru:'Тойота', country:'jp', popular:true, aliases:['тойота','тайота','тоета','toyota','тоёта'],
    models:[
      { id:'camry', name:'Camry', ru:'Камри', popular:true, aliases:['камри','camry','камрик'], body:'Седан',
        gens:[
          { name:'XV50', ru:'50', years:[2011,2017], body:['Седан'],
            engines:[{vol:2.0,hp:148,fuel:'Бензин'},{vol:2.5,hp:181,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.5,hp:205,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[900000,1800000] },
          { name:'XV70', ru:'70', years:[2017,2024], body:['Седан'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:200,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.5,hp:218,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[1400000,3000000] },
          { name:'XV80', ru:'80', years:[2024,2026], body:['Седан'],
            engines:[{vol:2.5,hp:228,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[3000000,4500000] }
        ] },
      { id:'corolla', name:'Corolla', ru:'Королла', popular:true, aliases:['королла','карола','corolla','каролла','кароллка'], body:'Седан',
        gens:[
          { name:'E140/E150', ru:'140', years:[2006,2013], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:97,fuel:'Бензин'},{vol:1.6,hp:124,fuel:'Бензин'},{vol:1.8,hp:132,fuel:'Бензин'},{vol:2.0,hp:126,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[450000,950000] },
          { name:'E170', ru:'170', years:[2012,2018], body:['Седан'],
            engines:[{vol:1.3,hp:99,fuel:'Бензин'},{vol:1.6,hp:122,fuel:'Бензин'},{vol:1.8,hp:140,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний'], price:[750000,1500000] },
          { name:'E210', ru:'210', years:[2018,2026], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:122,fuel:'Бензин'},{vol:2.0,hp:169,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Гибрид'},{vol:2.0,hp:196,fuel:'Гибрид'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[1400000,2600000] }
        ] },
      { id:'rav4', name:'RAV4', ru:'РАВ4', popular:true, aliases:['рав4','рав 4','rav 4','рафик','рав четыре'], body:'Кроссовер',
        gens:[
          { name:'XA30', ru:'30', years:[2005,2013], body:['Кроссовер'],
            engines:[{vol:2.0,hp:152,fuel:'Бензин'},{vol:2.4,hp:170,fuel:'Бензин'},{vol:2.2,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[800000,1500000] },
          { name:'XA40', ru:'40', years:[2012,2018], body:['Кроссовер'],
            engines:[{vol:2.0,hp:146,fuel:'Бензин'},{vol:2.5,hp:180,fuel:'Бензин'},{vol:2.2,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[1400000,2400000] },
          { name:'XA50', ru:'50', years:[2018,2025], body:['Кроссовер'],
            engines:[{vol:2.0,hp:149,fuel:'Бензин'},{vol:2.5,hp:199,fuel:'Бензин'},{vol:2.5,hp:222,fuel:'Гибрид'},{vol:2.5,hp:306,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[2400000,4200000] }
        ] },
      { id:'land-cruiser-prado', name:'Land Cruiser Prado', ru:'Ленд Крузер Прадо', popular:true, aliases:['прадо','прада','крузак прадо','prado','lc prado','ленд крузер прадо','прадик'], body:'Внедорожник',
        gens:[
          { name:'J120', ru:'120', years:[2002,2009], body:['Внедорожник'],
            engines:[{vol:2.7,hp:163,fuel:'Бензин'},{vol:4.0,hp:249,fuel:'Бензин'},{vol:3.0,hp:173,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[1500000,2600000] },
          { name:'J150', ru:'150', years:[2009,2023], body:['Внедорожник'],
            engines:[{vol:2.7,hp:163,fuel:'Бензин'},{vol:4.0,hp:282,fuel:'Бензин'},{vol:2.8,hp:177,fuel:'Дизель'},{vol:3.0,hp:173,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[2400000,6000000] },
          { name:'J250', ru:'250', years:[2023,2026], body:['Внедорожник'],
            engines:[{vol:2.4,hp:326,fuel:'Гибрид'},{vol:2.8,hp:204,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[6500000,10000000] }
        ] },
      { id:'land-cruiser', name:'Land Cruiser', ru:'Ленд Крузер', popular:true, aliases:['крузак','ленд крузер','лк200','lc200','lc300','ленкрузер','кукурузер','ленд круизер'], body:'Внедорожник',
        gens:[
          { name:'J100', ru:'100', years:[1998,2007], body:['Внедорожник'],
            engines:[{vol:4.7,hp:288,fuel:'Бензин'},{vol:4.2,hp:204,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[1600000,3000000] },
          { name:'J200', ru:'200', years:[2007,2021], body:['Внедорожник'],
            engines:[{vol:4.0,hp:282,fuel:'Бензин'},{vol:4.6,hp:309,fuel:'Бензин'},{vol:5.7,hp:383,fuel:'Бензин'},{vol:4.5,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3000000,8000000] },
          { name:'J300', ru:'300', years:[2021,2026], body:['Внедорожник'],
            engines:[{vol:3.5,hp:415,fuel:'Бензин'},{vol:3.3,hp:309,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[8000000,14000000] }
        ] },
      { id:'highlander', name:'Highlander', ru:'Хайлендер', popular:false, aliases:['хайлендер','хайлайндер','highlander','клюгер'], body:'Кроссовер',
        gens:[
          { name:'XU40', ru:'40', years:[2007,2013], body:['Кроссовер'],
            engines:[{vol:2.7,hp:188,fuel:'Бензин'},{vol:3.5,hp:273,fuel:'Бензин'},{vol:3.3,hp:272,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1300000,2200000] },
          { name:'XU50', ru:'50', years:[2013,2019], body:['Кроссовер'],
            engines:[{vol:2.7,hp:188,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2000000,3400000] },
          { name:'XU70', ru:'70', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.4,hp:265,fuel:'Бензин'},{vol:2.5,hp:243,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[3600000,6500000] }
        ] },
      { id:'prius', name:'Prius', ru:'Приус', popular:true, aliases:['приус','приус 30','prius','приуc','приусик'], body:'Хэтчбек',
        gens:[
          { name:'XW30', ru:'30', years:[2009,2015], body:['Хэтчбек','Минивэн'],
            engines:[{vol:1.8,hp:136,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[550000,1200000] },
          { name:'XW50', ru:'50', years:[2015,2022], body:['Хэтчбек'],
            engines:[{vol:1.8,hp:122,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1100000,2000000] },
          { name:'XW60', ru:'60', years:[2022,2026], body:['Хэтчбек'],
            engines:[{vol:1.8,hp:140,fuel:'Гибрид'},{vol:2.0,hp:196,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[2400000,3800000] }
        ] },
      { id:'vitz', name:'Vitz', ru:'Витц', popular:false, aliases:['витц','витз','vitz','виц'], body:'Хэтчбек',
        gens:[
          { name:'XP90', ru:'90', years:[2005,2010], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:69,fuel:'Бензин'},{vol:1.3,hp:87,fuel:'Бензин'},{vol:1.5,hp:110,fuel:'Бензин'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[350000,650000] },
          { name:'XP130', ru:'130', years:[2010,2020], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:69,fuel:'Бензин'},{vol:1.3,hp:99,fuel:'Бензин'},{vol:1.5,hp:100,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[500000,1100000] }
        ] },
      { id:'yaris', name:'Yaris', ru:'Ярис', popular:false, aliases:['ярис','yaris','яриc'], body:'Хэтчбек',
        gens:[
          { name:'XP210', ru:'210', years:[2020,2026], body:['Хэтчбек'],
            engines:[{vol:1.5,hp:125,fuel:'Бензин'},{vol:1.5,hp:116,fuel:'Гибрид'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[1300000,2200000] }
        ] },
      { id:'avensis', name:'Avensis', ru:'Авенсис', popular:false, aliases:['авенсис','avensis','авенсиc'], body:'Седан',
        gens:[
          { name:'T250', ru:'250', years:[2003,2009], body:['Седан','Универсал','Хэтчбек'],
            engines:[{vol:1.6,hp:110,fuel:'Бензин'},{vol:1.8,hp:129,fuel:'Бензин'},{vol:2.0,hp:147,fuel:'Бензин'},{vol:2.0,hp:126,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[400000,750000] },
          { name:'T270', ru:'270', years:[2008,2018], body:['Седан','Универсал'],
            engines:[{vol:1.6,hp:132,fuel:'Бензин'},{vol:1.8,hp:147,fuel:'Бензин'},{vol:2.0,hp:126,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[700000,1400000] }
        ] },
      { id:'alphard', name:'Alphard', ru:'Альфард', popular:true, aliases:['альфард','алфард','alphard','альфа','вельфаер'], body:'Минивэн',
        gens:[
          { name:'AH20', ru:'20', years:[2008,2015], body:['Минивэн'],
            engines:[{vol:2.4,hp:170,fuel:'Бензин'},{vol:3.5,hp:280,fuel:'Бензин'},{vol:2.4,hp:190,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[1500000,2800000] },
          { name:'AH30', ru:'30', years:[2015,2023], body:['Минивэн'],
            engines:[{vol:2.5,hp:182,fuel:'Бензин'},{vol:3.5,hp:301,fuel:'Бензин'},{vol:2.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[3000000,6000000] },
          { name:'AH40', ru:'40', years:[2023,2026], body:['Минивэн'],
            engines:[{vol:2.4,hp:279,fuel:'Бензин'},{vol:2.5,hp:250,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[6500000,11000000] }
        ] },
      { id:'estima', name:'Estima', ru:'Эстима', popular:false, aliases:['эстима','estima','эстимка','люселла'], body:'Минивэн',
        gens:[
          { name:'XR50', ru:'50', years:[2006,2019], body:['Минивэн'],
            engines:[{vol:2.4,hp:170,fuel:'Бензин'},{vol:3.5,hp:280,fuel:'Бензин'},{vol:2.4,hp:150,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[900000,2000000] }
        ] },
      { id:'harrier', name:'Harrier', ru:'Харриер', popular:false, aliases:['харриер','харьер','harrier','хариер'], body:'Кроссовер',
        gens:[
          { name:'XU60', ru:'60', years:[2013,2020], body:['Кроссовер'],
            engines:[{vol:2.0,hp:151,fuel:'Бензин'},{vol:2.0,hp:231,fuel:'Бензин'},{vol:2.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[1700000,3000000] },
          { name:'XU80', ru:'80', years:[2020,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:171,fuel:'Бензин'},{vol:2.5,hp:218,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[3200000,5500000] }
        ] },
      { id:'chr', name:'C-HR', ru:'Си-ЭйчАр', popular:false, aliases:['ц хр','с хр','chr','c-hr','цхр','сихиар'], body:'Кроссовер',
        gens:[
          { name:'AX10', ru:'1', years:[2016,2023], body:['Кроссовер'],
            engines:[{vol:1.2,hp:116,fuel:'Бензин'},{vol:2.0,hp:144,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Гибрид'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[1400000,2600000] },
          { name:'AX20', ru:'2', years:[2023,2026], body:['Кроссовер'],
            engines:[{vol:1.8,hp:140,fuel:'Гибрид'},{vol:2.0,hp:198,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[3000000,4800000] }
        ] },
      { id:'hilux', name:'Hilux', ru:'Хайлюкс', popular:false, aliases:['хайлюкс','хилюкс','hilux','хайлакс'], body:'Пикап',
        gens:[
          { name:'AN120/AN130', ru:'8', years:[2015,2026], body:['Пикап'],
            engines:[{vol:2.7,hp:166,fuel:'Бензин'},{vol:2.4,hp:150,fuel:'Дизель'},{vol:2.8,hp:204,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[2200000,4500000] }
        ] },
      { id:'sequoia', name:'Sequoia', ru:'Секвойя', popular:false, aliases:['секвойя','секвоя','sequoia'], body:'Внедорожник',
        gens:[
          { name:'XK60', ru:'2', years:[2007,2022], body:['Внедорожник'],
            engines:[{vol:4.6,hp:310,fuel:'Бензин'},{vol:5.7,hp:381,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2200000,5000000] },
          { name:'XK80', ru:'3', years:[2022,2026], body:['Внедорожник'],
            engines:[{vol:3.4,hp:441,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[7500000,12000000] }
        ] },
      { id:'4runner', name:'4Runner', ru:'Форраннер', popular:false, aliases:['форраннер','4раннер','4runner','фораннер','сурф'], body:'Внедорожник',
        gens:[
          { name:'N280', ru:'5', years:[2009,2024], body:['Внедорожник'],
            engines:[{vol:4.0,hp:270,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2200000,5500000] },
          { name:'N300', ru:'6', years:[2024,2026], body:['Внедорожник'],
            engines:[{vol:2.4,hp:278,fuel:'Бензин'},{vol:2.4,hp:326,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[6000000,9500000] }
        ] },
      { id:'mark-ii', name:'Mark II', ru:'Марк 2', popular:false, aliases:['марк 2','марк два','mark 2','маркушник','чайзер'], body:'Седан',
        gens:[
          { name:'X110', ru:'110', years:[2000,2007], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:160,fuel:'Бензин'},{vol:2.5,hp:200,fuel:'Бензин'},{vol:2.5,hp:280,fuel:'Бензин'},{vol:3.0,hp:220,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[350000,900000] }
        ] }
    ] },

  { id:'lexus', name:'Lexus', ru:'Лексус', country:'jp', popular:true, aliases:['лексус','лехус','lexus','лекс'],
    models:[
      { id:'rx', name:'RX', ru:'РИкс', popular:true, aliases:['рх','rx','рх 350','лексус рх','эрикс'], body:'Кроссовер',
        gens:[
          { name:'AL10', ru:'3', years:[2008,2015], body:['Кроссовер'],
            engines:[{vol:2.7,hp:188,fuel:'Бензин'},{vol:3.5,hp:277,fuel:'Бензин'},{vol:3.5,hp:299,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[1600000,3000000] },
          { name:'AL20', ru:'4', years:[2015,2022], body:['Кроссовер'],
            engines:[{vol:2.0,hp:238,fuel:'Бензин'},{vol:3.5,hp:300,fuel:'Бензин'},{vol:3.5,hp:313,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[3000000,5800000] },
          { name:'AL30', ru:'5', years:[2022,2026], body:['Кроссовер'],
            engines:[{vol:2.4,hp:279,fuel:'Бензин'},{vol:2.5,hp:250,fuel:'Гибрид'},{vol:2.4,hp:371,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[6000000,10000000] }
        ] },
      { id:'lx', name:'LX', ru:'ЭлИкс', popular:true, aliases:['лх','lx','лх 570','лексус лх','эликс','лх570'], body:'Внедорожник',
        gens:[
          { name:'J200 LX570', ru:'570', years:[2007,2021], body:['Внедорожник'],
            engines:[{vol:5.7,hp:367,fuel:'Бензин'},{vol:4.5,hp:272,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3500000,9000000] },
          { name:'J310 LX600', ru:'600', years:[2021,2026], body:['Внедорожник'],
            engines:[{vol:3.5,hp:415,fuel:'Бензин'},{vol:3.3,hp:309,fuel:'Дизель'},{vol:3.4,hp:464,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[10000000,17000000] }
        ] },
      { id:'gx', name:'GX', ru:'ДжиИкс', popular:false, aliases:['гх','gx','gx460','гх 460','лексус гх'], body:'Внедорожник',
        gens:[
          { name:'J150 GX460', ru:'460', years:[2009,2023], body:['Внедорожник'],
            engines:[{vol:4.6,hp:296,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2800000,6500000] },
          { name:'J250 GX550', ru:'550', years:[2023,2026], body:['Внедорожник'],
            engines:[{vol:3.4,hp:349,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[8000000,12500000] }
        ] },
      { id:'es', name:'ES', ru:'ИЭс', popular:true, aliases:['ес','es','es 350','ес 350','лексус ес'], body:'Седан',
        gens:[
          { name:'XV60', ru:'6', years:[2012,2018], body:['Седан'],
            engines:[{vol:2.5,hp:181,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.5,hp:205,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний'], price:[1600000,2800000] },
          { name:'XZ10', ru:'7', years:[2018,2026], body:['Седан'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:200,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.5,hp:218,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний'], price:[3000000,5500000] }
        ] },
      { id:'is', name:'IS', ru:'АйЭс', popular:false, aliases:['ис','is','is 250','ис 250','лексус ис'], body:'Седан',
        gens:[
          { name:'XE20', ru:'2', years:[2005,2013], body:['Седан','Кабриолет'],
            engines:[{vol:2.5,hp:208,fuel:'Бензин'},{vol:3.5,hp:318,fuel:'Бензин'},{vol:2.2,hp:177,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[900000,1800000] },
          { name:'XE30', ru:'3', years:[2013,2026], body:['Седан'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.5,hp:207,fuel:'Бензин'},{vol:3.5,hp:311,fuel:'Бензин'},{vol:2.5,hp:223,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Задний','Полный'], price:[2000000,4500000] }
        ] },
      { id:'nx', name:'NX', ru:'ЭнИкс', popular:false, aliases:['нх','nx','нх 200','лексус нх','эникс'], body:'Кроссовер',
        gens:[
          { name:'AZ10', ru:'1', years:[2014,2021], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:238,fuel:'Бензин'},{vol:2.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[2000000,3800000] },
          { name:'AZ20', ru:'2', years:[2021,2026], body:['Кроссовер'],
            engines:[{vol:2.5,hp:203,fuel:'Бензин'},{vol:2.4,hp:279,fuel:'Бензин'},{vol:2.5,hp:243,fuel:'Гибрид'},{vol:2.5,hp:309,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[4200000,7000000] }
        ] },
      { id:'ls', name:'LS', ru:'ЭлЭс', popular:false, aliases:['лс','ls','ls 460','лексус лс','эльэс'], body:'Седан',
        gens:[
          { name:'XF40', ru:'4', years:[2006,2017], body:['Седан'],
            engines:[{vol:4.6,hp:380,fuel:'Бензин'},{vol:5.0,hp:394,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Задний','Полный'], price:[1500000,3500000] },
          { name:'XF50', ru:'5', years:[2017,2026], body:['Седан'],
            engines:[{vol:3.5,hp:416,fuel:'Бензин'},{vol:3.5,hp:359,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Задний','Полный'], price:[6000000,11000000] }
        ] },
      { id:'gs', name:'GS', ru:'ДжиЭс', popular:false, aliases:['гс','gs','gs 350','лексус гс'], body:'Седан',
        gens:[
          { name:'L10', ru:'4', years:[2012,2020], body:['Седан'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'},{vol:3.5,hp:315,fuel:'Бензин'},{vol:3.5,hp:345,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1800000,3500000] }
        ] },
      { id:'ux', name:'UX', ru:'ЮИкс', popular:false, aliases:['ух','ux','лексус ух','ux 200'], body:'Кроссовер',
        gens:[
          { name:'ZA10', ru:'1', years:[2018,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:171,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[2600000,4500000] }
        ] },
      { id:'rc', name:'RC', ru:'АрСи', popular:false, aliases:['рц','rc','лексус рц','rc350'], body:'Купе',
        gens:[
          { name:'XC10', ru:'1', years:[2014,2026], body:['Купе'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'},{vol:3.5,hp:318,fuel:'Бензин'},{vol:5.0,hp:477,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3000000,7000000] }
        ] },
      { id:'lc', name:'LC', ru:'ЭлСи', popular:false, aliases:['лц','lc','lc500','лексус лц'], body:'Купе',
        gens:[
          { name:'Z100', ru:'1', years:[2017,2026], body:['Купе','Кабриолет'],
            engines:[{vol:5.0,hp:477,fuel:'Бензин'},{vol:3.5,hp:359,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Задний'], price:[8000000,14000000] }
        ] },
      { id:'lm', name:'LM', ru:'ЭлЭм', popular:false, aliases:['лм','lm','lm300','лексус лм'], body:'Минивэн',
        gens:[
          { name:'AH30', ru:'1', years:[2019,2023], body:['Минивэн'],
            engines:[{vol:3.5,hp:301,fuel:'Бензин'},{vol:2.5,hp:197,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[6000000,10000000] },
          { name:'AH40', ru:'2', years:[2023,2026], body:['Минивэн'],
            engines:[{vol:2.4,hp:279,fuel:'Бензин'},{vol:2.5,hp:250,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[11000000,18000000] }
        ] }
    ] },

  { id:'honda', name:'Honda', ru:'Хонда', country:'jp', popular:true, aliases:['хонда','honda','хонды'],
    models:[
      { id:'fit', name:'Fit', ru:'Фит', popular:true, aliases:['фит','fit','хонда фит','джаз','jazz'], body:'Хэтчбек',
        gens:[
          { name:'GE', ru:'2', years:[2007,2013], body:['Хэтчбек'],
            engines:[{vol:1.3,hp:100,fuel:'Бензин'},{vol:1.5,hp:120,fuel:'Бензин'},{vol:1.3,hp:98,fuel:'Гибрид'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[400000,750000] },
          { name:'GK', ru:'3', years:[2013,2020], body:['Хэтчбек'],
            engines:[{vol:1.3,hp:100,fuel:'Бензин'},{vol:1.5,hp:132,fuel:'Бензин'},{vol:1.5,hp:137,fuel:'Гибрид'}],
            gearbox:['Механика','Вариатор','Робот'], drive:['Передний','Полный'], price:[700000,1400000] },
          { name:'GR', ru:'4', years:[2020,2026], body:['Хэтчбек'],
            engines:[{vol:1.3,hp:98,fuel:'Бензин'},{vol:1.5,hp:110,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1400000,2300000] }
        ] },
      { id:'civic', name:'Civic', ru:'Цивик', popular:false, aliases:['цивик','сивик','civic','цивиг'], body:'Седан',
        gens:[
          { name:'8', ru:'8', years:[2005,2012], body:['Седан','Хэтчбек'],
            engines:[{vol:1.8,hp:140,fuel:'Бензин'},{vol:2.0,hp:201,fuel:'Бензин'},{vol:2.2,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[550000,1100000] },
          { name:'10', ru:'10', years:[2015,2021], body:['Седан','Хэтчбек'],
            engines:[{vol:1.5,hp:182,fuel:'Бензин'},{vol:2.0,hp:158,fuel:'Бензин'},{vol:2.0,hp:320,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1500000,2800000] },
          { name:'11', ru:'11', years:[2021,2026], body:['Седан','Хэтчбек'],
            engines:[{vol:1.5,hp:182,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Гибрид'},{vol:2.0,hp:329,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[2600000,4500000] }
        ] },
      { id:'accord', name:'Accord', ru:'Аккорд', popular:false, aliases:['аккорд','акорд','accord','акорды'], body:'Седан',
        gens:[
          { name:'8', ru:'8', years:[2008,2013], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:156,fuel:'Бензин'},{vol:2.4,hp:201,fuel:'Бензин'},{vol:3.5,hp:275,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[650000,1300000] },
          { name:'10', ru:'10', years:[2017,2022], body:['Седан'],
            engines:[{vol:1.5,hp:192,fuel:'Бензин'},{vol:2.0,hp:252,fuel:'Бензин'},{vol:2.0,hp:215,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний'], price:[2000000,3600000] },
          { name:'11', ru:'11', years:[2022,2026], body:['Седан'],
            engines:[{vol:1.5,hp:192,fuel:'Бензин'},{vol:2.0,hp:204,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[3400000,5200000] }
        ] },
      { id:'crv', name:'CR-V', ru:'ЦР-В', popular:true, aliases:['црв','ср в','cr-v','crv','сирив','цр в'], body:'Кроссовер',
        gens:[
          { name:'RE', ru:'3', years:[2006,2012], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.4,hp:166,fuel:'Бензин'},{vol:2.2,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[750000,1400000] },
          { name:'RM', ru:'4', years:[2011,2016], body:['Кроссовер'],
            engines:[{vol:2.0,hp:155,fuel:'Бензин'},{vol:2.4,hp:190,fuel:'Бензин'},{vol:1.6,hp:160,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1200000,2100000] },
          { name:'RW', ru:'5', years:[2016,2022], body:['Кроссовер'],
            engines:[{vol:1.5,hp:193,fuel:'Бензин'},{vol:2.4,hp:186,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[2200000,3800000] }
        ] },
      { id:'vezel', name:'Vezel', ru:'Везел', popular:false, aliases:['везел','вазел','vezel','hr-v','хрв','хр в'], body:'Кроссовер',
        gens:[
          { name:'RU', ru:'1', years:[2013,2021], body:['Кроссовер'],
            engines:[{vol:1.5,hp:132,fuel:'Бензин'},{vol:1.5,hp:152,fuel:'Гибрид'}],
            gearbox:['Вариатор','Робот'], drive:['Передний','Полный'], price:[1200000,2200000] },
          { name:'RV', ru:'2', years:[2021,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:118,fuel:'Бензин'},{vol:1.5,hp:131,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[2200000,3600000] }
        ] },
      { id:'odyssey', name:'Odyssey', ru:'Одиссей', popular:false, aliases:['одиссей','одисей','odyssey','одиссея'], body:'Минивэн',
        gens:[
          { name:'RB', ru:'3', years:[2008,2013], body:['Минивэн'],
            engines:[{vol:2.4,hp:173,fuel:'Бензин'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[700000,1300000] },
          { name:'RC', ru:'5', years:[2013,2023], body:['Минивэн'],
            engines:[{vol:2.4,hp:175,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1500000,3000000] }
        ] },
      { id:'stepwgn', name:'Stepwgn', ru:'Степвагон', popular:false, aliases:['степвагон','степ вагон','stepwgn','степвгн'], body:'Минивэн',
        gens:[
          { name:'RK', ru:'4', years:[2009,2015], body:['Минивэн'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[700000,1300000] },
          { name:'RP', ru:'5', years:[2015,2022], body:['Минивэн'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1400000,2600000] }
        ] },
      { id:'freed', name:'Freed', ru:'Фрид', popular:false, aliases:['фрид','freed','фрит'], body:'Минивэн',
        gens:[
          { name:'GB3', ru:'1', years:[2008,2016], body:['Минивэн'],
            engines:[{vol:1.5,hp:118,fuel:'Бензин'},{vol:1.5,hp:131,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[550000,1000000] },
          { name:'GB5', ru:'2', years:[2016,2024], body:['Минивэн'],
            engines:[{vol:1.5,hp:131,fuel:'Бензин'},{vol:1.5,hp:110,fuel:'Гибрид'}],
            gearbox:['Вариатор','Робот'], drive:['Передний','Полный'], price:[1100000,2000000] }
        ] },
      { id:'insight', name:'Insight', ru:'Инсайт', popular:false, aliases:['инсайт','insight','инсайд'], body:'Хэтчбек',
        gens:[
          { name:'ZE2', ru:'2', years:[2009,2014], body:['Хэтчбек'],
            engines:[{vol:1.3,hp:98,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[400000,750000] },
          { name:'ZE4', ru:'3', years:[2018,2022], body:['Седан'],
            engines:[{vol:1.5,hp:152,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1500000,2400000] }
        ] },
      { id:'pilot', name:'Pilot', ru:'Пилот', popular:false, aliases:['пилот','pilot','хонда пилот'], body:'Внедорожник',
        gens:[
          { name:'YF5', ru:'3', years:[2015,2022], body:['Внедорожник'],
            engines:[{vol:3.5,hp:284,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1900000,3500000] },
          { name:'YG', ru:'4', years:[2022,2026], body:['Внедорожник'],
            engines:[{vol:3.5,hp:288,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[4000000,6500000] }
        ] },
      { id:'legend', name:'Legend', ru:'Легенд', popular:false, aliases:['легенд','legend','легенда'], body:'Седан',
        gens:[
          { name:'KB', ru:'4', years:[2004,2012], body:['Седан'],
            engines:[{vol:3.5,hp:295,fuel:'Бензин'},{vol:3.7,hp:309,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[600000,1200000] },
          { name:'KC2', ru:'5', years:[2014,2021], body:['Седан'],
            engines:[{vol:3.5,hp:381,fuel:'Гибрид'}],
            gearbox:['Робот'], drive:['Полный'], price:[1800000,3200000] }
        ] },
      { id:'elysion', name:'Elysion', ru:'Элюзион', popular:false, aliases:['элюзион','элисион','elysion'], body:'Минивэн',
        gens:[
          { name:'RR', ru:'1', years:[2004,2013], body:['Минивэн'],
            engines:[{vol:2.4,hp:160,fuel:'Бензин'},{vol:3.0,hp:250,fuel:'Бензин'},{vol:3.5,hp:300,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[600000,1200000] }
        ] },
      { id:'shuttle', name:'Shuttle', ru:'Шаттл', popular:false, aliases:['шаттл','шатл','shuttle'], body:'Универсал',
        gens:[
          { name:'GK/GP', ru:'2', years:[2015,2022], body:['Универсал'],
            engines:[{vol:1.5,hp:132,fuel:'Бензин'},{vol:1.5,hp:137,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1100000,2000000] }
        ] }
    ] },

  { id:'nissan', name:'Nissan', ru:'Ниссан', country:'jp', popular:true, aliases:['ниссан','нисан','nissan','нисcан'],
    models:[
      { id:'leaf', name:'Leaf', ru:'Лиф', popular:true, aliases:['лиф','лист','leaf','ниссан лиф','лифчик'], body:'Хэтчбек',
        gens:[
          { name:'ZE0', ru:'1', years:[2010,2017], body:['Хэтчбек'],
            engines:[{hp:109,fuel:'Электро'}], batteryKwh:[24,30], rangeKm:[110,200],
            gearbox:['Автомат'], drive:['Передний'], price:[450000,900000] },
          { name:'ZE1', ru:'2', years:[2017,2024], body:['Хэтчбек'],
            engines:[{hp:150,fuel:'Электро'},{hp:218,fuel:'Электро'}], batteryKwh:[40,62], rangeKm:[220,385],
            gearbox:['Автомат'], drive:['Передний'], price:[1100000,2400000] },
          { name:'ZE2', ru:'3', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:177,fuel:'Электро'},{hp:218,fuel:'Электро'}], batteryKwh:[52,75], rangeKm:[300,500],
            gearbox:['Автомат'], drive:['Передний'], price:[3000000,4500000] }
        ] },
      { id:'x-trail', name:'X-Trail', ru:'Икс-Трейл', popular:true, aliases:['икстрейл','x-trail','xtrail','икс трейл','экстрейл'], body:'Кроссовер',
        gens:[
          { name:'T31', ru:'2', years:[2007,2014], body:['Кроссовер'],
            engines:[{vol:2.0,hp:141,fuel:'Бензин'},{vol:2.5,hp:169,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[750000,1500000] },
          { name:'T32', ru:'3', years:[2013,2022], body:['Кроссовер'],
            engines:[{vol:2.0,hp:144,fuel:'Бензин'},{vol:2.5,hp:171,fuel:'Бензин'},{vol:1.6,hp:130,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[1500000,2800000] },
          { name:'T33', ru:'4', years:[2022,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:204,fuel:'Бензин'},{vol:2.5,hp:181,fuel:'Бензин'},{vol:1.5,hp:213,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[3000000,5000000] }
        ] },
      { id:'qashqai', name:'Qashqai', ru:'Кашкай', popular:false, aliases:['кашкай','кашкай','qashqai','кошкай'], body:'Кроссовер',
        gens:[
          { name:'J10', ru:'1', years:[2006,2014], body:['Кроссовер'],
            engines:[{vol:1.6,hp:117,fuel:'Бензин'},{vol:2.0,hp:141,fuel:'Бензин'},{vol:1.5,hp:106,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[600000,1200000] },
          { name:'J11', ru:'2', years:[2013,2022], body:['Кроссовер'],
            engines:[{vol:1.2,hp:115,fuel:'Бензин'},{vol:2.0,hp:144,fuel:'Бензин'},{vol:1.6,hp:130,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[1200000,2200000] },
          { name:'J12', ru:'3', years:[2021,2026], body:['Кроссовер'],
            engines:[{vol:1.3,hp:158,fuel:'Бензин'},{vol:1.5,hp:190,fuel:'Гибрид'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[2600000,4200000] }
        ] },
      { id:'note', name:'Note', ru:'Ноут', popular:true, aliases:['ноут','ноте','note','нот'], body:'Хэтчбек',
        gens:[
          { name:'E11', ru:'1', years:[2005,2012], body:['Хэтчбек'],
            engines:[{vol:1.4,hp:88,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,650000] },
          { name:'E12', ru:'2', years:[2012,2020], body:['Хэтчбек'],
            engines:[{vol:1.2,hp:79,fuel:'Бензин'},{vol:1.2,hp:98,fuel:'Бензин'},{vol:1.2,hp:109,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[600000,1200000] },
          { name:'E13', ru:'3', years:[2020,2026], body:['Хэтчбек'],
            engines:[{vol:1.2,hp:116,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1500000,2500000] }
        ] },
      { id:'juke', name:'Juke', ru:'Жук', popular:false, aliases:['жук','джук','juke','джюк'], body:'Кроссовер',
        gens:[
          { name:'F15', ru:'1', years:[2010,2019], body:['Кроссовер'],
            engines:[{vol:1.6,hp:117,fuel:'Бензин'},{vol:1.6,hp:190,fuel:'Бензин'},{vol:1.5,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[700000,1400000] },
          { name:'F16', ru:'2', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:1.0,hp:117,fuel:'Бензин'},{vol:1.6,hp:143,fuel:'Гибрид'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[2000000,3400000] }
        ] },
      { id:'murano', name:'Murano', ru:'Мурано', popular:false, aliases:['мурано','murano','мурана'], body:'Кроссовер',
        gens:[
          { name:'Z51', ru:'2', years:[2008,2015], body:['Кроссовер'],
            engines:[{vol:2.5,hp:190,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[900000,1700000] },
          { name:'Z52', ru:'3', years:[2014,2024], body:['Кроссовер'],
            engines:[{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.5,hp:253,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1900000,3600000] }
        ] },
      { id:'patrol', name:'Patrol', ru:'Патрол', popular:false, aliases:['патрол','патруль','patrol','патрул'], body:'Внедорожник',
        gens:[
          { name:'Y61', ru:'5', years:[1997,2013], body:['Внедорожник'],
            engines:[{vol:4.5,hp:200,fuel:'Бензин'},{vol:3.0,hp:160,fuel:'Дизель'},{vol:4.2,hp:145,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[1200000,2800000] },
          { name:'Y62', ru:'6', years:[2010,2024], body:['Внедорожник'],
            engines:[{vol:5.6,hp:405,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3000000,7000000] },
          { name:'Y63', ru:'7', years:[2024,2026], body:['Внедорожник'],
            engines:[{vol:3.5,hp:425,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[8000000,12000000] }
        ] },
      { id:'teana', name:'Teana', ru:'Теана', popular:false, aliases:['теана','teana','тиана','альтима'], body:'Седан',
        gens:[
          { name:'J32', ru:'2', years:[2008,2014], body:['Седан'],
            engines:[{vol:2.5,hp:182,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[600000,1200000] },
          { name:'L33', ru:'3', years:[2013,2021], body:['Седан'],
            engines:[{vol:2.0,hp:144,fuel:'Бензин'},{vol:2.5,hp:173,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[1200000,2200000] }
        ] },
      { id:'almera', name:'Almera', ru:'Альмера', popular:false, aliases:['альмера','альмерa','almera','алмера'], body:'Седан',
        gens:[
          { name:'G15', ru:'4', years:[2012,2018], body:['Седан'],
            engines:[{vol:1.6,hp:102,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[450000,850000] }
        ] },
      { id:'serena', name:'Serena', ru:'Серена', popular:false, aliases:['серена','serena','сирена'], body:'Минивэн',
        gens:[
          { name:'C26', ru:'4', years:[2010,2016], body:['Минивэн'],
            engines:[{vol:2.0,hp:147,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[650000,1200000] },
          { name:'C27', ru:'5', years:[2016,2022], body:['Минивэн'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:1.2,hp:136,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1300000,2400000] }
        ] },
      { id:'skyline', name:'Skyline', ru:'Скайлайн', popular:false, aliases:['скайлайн','скай','skyline','скайлан'], body:'Седан',
        gens:[
          { name:'V36', ru:'12', years:[2006,2014], body:['Седан','Купе'],
            engines:[{vol:2.5,hp:225,fuel:'Бензин'},{vol:3.7,hp:333,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[800000,1700000] },
          { name:'V37', ru:'13', years:[2014,2026], body:['Седан'],
            engines:[{vol:2.0,hp:211,fuel:'Бензин'},{vol:3.0,hp:405,fuel:'Бензин'},{vol:3.5,hp:364,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2000000,4200000] }
        ] },
      { id:'pathfinder', name:'Pathfinder', ru:'Патфайндер', popular:false, aliases:['патфайндер','pathfinder','пасфайндер'], body:'Внедорожник',
        gens:[
          { name:'R51', ru:'3', years:[2004,2014], body:['Внедорожник'],
            engines:[{vol:4.0,hp:269,fuel:'Бензин'},{vol:2.5,hp:190,fuel:'Дизель'},{vol:3.0,hp:231,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[900000,1800000] },
          { name:'R52', ru:'4', years:[2012,2021], body:['Кроссовер'],
            engines:[{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.5,hp:253,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1600000,3000000] }
        ] },
      { id:'march', name:'March', ru:'Марч', popular:false, aliases:['марч','march','микра','micra'], body:'Хэтчбек',
        gens:[
          { name:'K13', ru:'4', years:[2010,2022], body:['Хэтчбек'],
            engines:[{vol:1.2,hp:79,fuel:'Бензин'},{vol:1.5,hp:99,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[400000,900000] }
        ] },
      { id:'sylphy', name:'Sylphy', ru:'Сильфи', popular:false, aliases:['сильфи','sylphy','сентра','sentra'], body:'Седан',
        gens:[
          { name:'B17', ru:'3', years:[2012,2019], body:['Седан'],
            engines:[{vol:1.6,hp:117,fuel:'Бензин'},{vol:1.8,hp:131,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний'], price:[700000,1400000] }
        ] },
      { id:'ariya', name:'Ariya', ru:'Ария', popular:false, aliases:['ария','ariya','арийа'], body:'Кроссовер',
        gens:[
          { name:'FE0', ru:'1', years:[2022,2026], body:['Кроссовер'],
            engines:[{hp:218,fuel:'Электро'},{hp:306,fuel:'Электро'},{hp:394,fuel:'Электро'}], batteryKwh:[63,87], rangeKm:[350,530],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[3500000,6000000] }
        ] },
      { id:'sunny', name:'Sunny', ru:'Санни', popular:false, aliases:['санни','sunny','сани'], body:'Седан',
        gens:[
          { name:'B15', ru:'9', years:[1998,2004], body:['Седан'],
            engines:[{vol:1.3,hp:88,fuel:'Бензин'},{vol:1.5,hp:105,fuel:'Бензин'},{vol:1.8,hp:125,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[250000,500000] }
        ] }
    ] },
  { id:'mitsubishi', name:'Mitsubishi', ru:'Мицубиси', country:'jp', popular:true, aliases:['мицубиси','митсубиси','мицубиши','mitsubishi','митсу','мицу'],
    models:[
      { id:'outlander', name:'Outlander', ru:'Аутлендер', popular:true, aliases:['аутлендер','автлендер','outlander','аутлэндер','ауст'], body:'Кроссовер',
        gens:[
          { name:'CW', ru:'2', years:[2005,2012], body:['Кроссовер'],
            engines:[{vol:2.0,hp:147,fuel:'Бензин'},{vol:2.4,hp:170,fuel:'Бензин'},{vol:3.0,hp:220,fuel:'Бензин'},{vol:2.2,hp:156,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[700000,1400000] },
          { name:'GF', ru:'3', years:[2012,2021], body:['Кроссовер'],
            engines:[{vol:2.0,hp:146,fuel:'Бензин'},{vol:2.4,hp:167,fuel:'Бензин'},{vol:3.0,hp:230,fuel:'Бензин'},{vol:2.4,hp:224,fuel:'Гибрид'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[1300000,2600000] },
          { name:'GN', ru:'4', years:[2021,2026], body:['Кроссовер'],
            engines:[{vol:2.5,hp:181,fuel:'Бензин'},{vol:2.4,hp:306,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[3200000,5500000] }
        ] },
      { id:'pajero', name:'Pajero', ru:'Паджеро', popular:true, aliases:['паджеро','поджеро','pajero','паджерик','монтеро'], body:'Внедорожник',
        gens:[
          { name:'V60', ru:'3', years:[1999,2006], body:['Внедорожник'],
            engines:[{vol:3.0,hp:178,fuel:'Бензин'},{vol:3.5,hp:202,fuel:'Бензин'},{vol:3.2,hp:160,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[700000,1500000] },
          { name:'V80', ru:'4', years:[2006,2021], body:['Внедорожник'],
            engines:[{vol:3.0,hp:178,fuel:'Бензин'},{vol:3.8,hp:250,fuel:'Бензин'},{vol:3.2,hp:200,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[1500000,3800000] }
        ] },
      { id:'pajero-sport', name:'Pajero Sport', ru:'Паджеро Спорт', popular:false, aliases:['паджеро спорт','pajero sport','монтеро спорт','паджеро спорт'], body:'Внедорожник',
        gens:[
          { name:'KH', ru:'2', years:[2008,2016], body:['Внедорожник'],
            engines:[{vol:3.0,hp:220,fuel:'Бензин'},{vol:2.5,hp:178,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1200000,2400000] },
          { name:'QE', ru:'3', years:[2015,2026], body:['Внедорожник'],
            engines:[{vol:3.0,hp:209,fuel:'Бензин'},{vol:2.4,hp:181,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2600000,5000000] }
        ] },
      { id:'lancer', name:'Lancer', ru:'Лансер', popular:false, aliases:['лансер','ланцер','lancer','ланс','эволюшн'], body:'Седан',
        gens:[
          { name:'IX', ru:'9', years:[2000,2010], body:['Седан','Универсал'],
            engines:[{vol:1.3,hp:82,fuel:'Бензин'},{vol:1.6,hp:98,fuel:'Бензин'},{vol:2.0,hp:280,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[350000,800000] },
          { name:'X', ru:'10', years:[2007,2017], body:['Седан','Хэтчбек'],
            engines:[{vol:1.5,hp:109,fuel:'Бензин'},{vol:1.6,hp:117,fuel:'Бензин'},{vol:1.8,hp:143,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[600000,1300000] }
        ] },
      { id:'asx', name:'ASX', ru:'АСХ', popular:false, aliases:['асх','asx','рвр','rvr','аутлендер спорт'], body:'Кроссовер',
        gens:[
          { name:'GA', ru:'1', years:[2010,2023], body:['Кроссовер'],
            engines:[{vol:1.6,hp:117,fuel:'Бензин'},{vol:1.8,hp:140,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:1.8,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[900000,2000000] }
        ] },
      { id:'l200', name:'L200', ru:'Л200', popular:false, aliases:['л200','l200','эль 200','триton','тритон'], body:'Пикап',
        gens:[
          { name:'KA/KB', ru:'4', years:[2006,2015], body:['Пикап'],
            engines:[{vol:2.5,hp:178,fuel:'Дизель'},{vol:3.2,hp:165,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[900000,1900000] },
          { name:'KL', ru:'5', years:[2015,2023], body:['Пикап'],
            engines:[{vol:2.4,hp:181,fuel:'Дизель'},{vol:2.5,hp:136,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[2000000,4000000] }
        ] },
      { id:'delica', name:'Delica', ru:'Делика', popular:false, aliases:['делика','delica','деликa','делика д5'], body:'Минивэн',
        gens:[
          { name:'D:5', ru:'5', years:[2007,2026], body:['Минивэн'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.4,hp:170,fuel:'Бензин'},{vol:2.2,hp:148,fuel:'Дизель'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[1200000,3500000] }
        ] },
      { id:'eclipse-cross', name:'Eclipse Cross', ru:'Эклипс Кросс', popular:false, aliases:['эклипс кросс','eclipse cross','эклипс'], body:'Кроссовер',
        gens:[
          { name:'GK', ru:'1', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.2,hp:150,fuel:'Дизель'},{vol:2.4,hp:188,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[2000000,3800000] }
        ] },
      { id:'galant', name:'Galant', ru:'Галант', popular:false, aliases:['галант','galant','галлант'], body:'Седан',
        gens:[
          { name:'8', ru:'8', years:[1996,2006], body:['Седан','Универсал'],
            engines:[{vol:1.8,hp:140,fuel:'Бензин'},{vol:2.0,hp:145,fuel:'Бензин'},{vol:2.5,hp:163,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[250000,550000] }
        ] },
      { id:'colt', name:'Colt', ru:'Кольт', popular:false, aliases:['кольт','colt','колт'], body:'Хэтчбек',
        gens:[
          { name:'Z30', ru:'6', years:[2002,2012], body:['Хэтчбек'],
            engines:[{vol:1.3,hp:95,fuel:'Бензин'},{vol:1.5,hp:109,fuel:'Бензин'},{vol:1.5,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[300000,650000] }
        ] },
      { id:'i-miev', name:'i-MiEV', ru:'Ай-МиЕВ', popular:false, aliases:['аймив','i-miev','имив','ай мив'], body:'Хэтчбек',
        gens:[
          { name:'HA3W', ru:'1', years:[2009,2021], body:['Хэтчбек'],
            engines:[{hp:67,fuel:'Электро'}], batteryKwh:[10,16], rangeKm:[100,160],
            gearbox:['Автомат'], drive:['Задний'], price:[400000,750000] }
        ] }
    ] },

  { id:'subaru', name:'Subaru', ru:'Субару', country:'jp', popular:true, aliases:['субару','субара','subaru','субарик'],
    models:[
      { id:'forester', name:'Forester', ru:'Форестер', popular:true, aliases:['форестер','форик','forester','форрестер','фарестер'], body:'Кроссовер',
        gens:[
          { name:'SH', ru:'3', years:[2007,2013], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:172,fuel:'Бензин'},{vol:2.5,hp:263,fuel:'Бензин'},{vol:2.0,hp:147,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[750000,1500000] },
          { name:'SJ', ru:'4', years:[2012,2018], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:241,fuel:'Бензин'},{vol:2.5,hp:171,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Полный'], price:[1300000,2400000] },
          { name:'SK', ru:'5', years:[2018,2024], body:['Кроссовер'],
            engines:[{vol:1.8,hp:177,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Гибрид'},{vol:2.5,hp:185,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[2400000,4200000] }
        ] },
      { id:'outback', name:'Outback', ru:'Аутбек', popular:true, aliases:['аутбек','аутбэк','outback','автбек'], body:'Универсал',
        gens:[
          { name:'BR', ru:'4', years:[2009,2014], body:['Универсал'],
            engines:[{vol:2.5,hp:167,fuel:'Бензин'},{vol:3.6,hp:249,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Полный'], price:[900000,1800000] },
          { name:'BS', ru:'5', years:[2014,2019], body:['Универсал'],
            engines:[{vol:2.5,hp:175,fuel:'Бензин'},{vol:3.6,hp:260,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[1600000,2800000] },
          { name:'BT', ru:'6', years:[2019,2026], body:['Универсал'],
            engines:[{vol:2.5,hp:188,fuel:'Бензин'},{vol:2.4,hp:264,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[3000000,5200000] }
        ] },
      { id:'legacy', name:'Legacy', ru:'Легаси', popular:false, aliases:['легаси','легасси','legacy','легаси б4'], body:'Седан',
        gens:[
          { name:'BL/BP', ru:'4', years:[2003,2009], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:190,fuel:'Бензин'},{vol:2.0,hp:280,fuel:'Бензин'},{vol:2.5,hp:173,fuel:'Бензин'},{vol:3.0,hp:245,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[500000,1100000] },
          { name:'BM/BR', ru:'5', years:[2009,2014], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:167,fuel:'Бензин'},{vol:3.6,hp:249,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Полный'], price:[800000,1600000] },
          { name:'BN', ru:'6', years:[2014,2019], body:['Седан'],
            engines:[{vol:2.5,hp:175,fuel:'Бензин'},{vol:3.6,hp:260,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[1400000,2400000] }
        ] },
      { id:'impreza', name:'Impreza', ru:'Импреза', popular:false, aliases:['импреза','имреза','impreza','импреса'], body:'Хэтчбек',
        gens:[
          { name:'GH/GE', ru:'3', years:[2007,2011], body:['Хэтчбек','Седан'],
            engines:[{vol:1.5,hp:107,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:230,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[500000,1000000] },
          { name:'GJ/GP', ru:'4', years:[2011,2016], body:['Хэтчбек','Седан'],
            engines:[{vol:1.6,hp:114,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[800000,1500000] },
          { name:'GK/GT', ru:'5', years:[2016,2023], body:['Хэтчбек','Седан'],
            engines:[{vol:1.6,hp:114,fuel:'Бензин'},{vol:2.0,hp:156,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1500000,2600000] }
        ] },
      { id:'xv', name:'XV', ru:'ИксВи', popular:false, aliases:['хв','xv','кросстрек','crosstrek','субару хв'], body:'Кроссовер',
        gens:[
          { name:'GP', ru:'1', years:[2011,2017], body:['Кроссовер'],
            engines:[{vol:1.6,hp:114,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Гибрид'}],
            gearbox:['Механика','Вариатор'], drive:['Полный'], price:[900000,1700000] },
          { name:'GT', ru:'2', years:[2017,2022], body:['Кроссовер'],
            engines:[{vol:1.6,hp:114,fuel:'Бензин'},{vol:2.0,hp:156,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[1700000,2900000] },
          { name:'GU', ru:'3', years:[2022,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Гибрид'},{vol:2.5,hp:182,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[3000000,4800000] }
        ] },
      { id:'levorg', name:'Levorg', ru:'Леворг', popular:false, aliases:['леворг','levorg','леворк'], body:'Универсал',
        gens:[
          { name:'VM', ru:'1', years:[2014,2020], body:['Универсал'],
            engines:[{vol:1.6,hp:170,fuel:'Бензин'},{vol:2.0,hp:300,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[1300000,2300000] },
          { name:'VN', ru:'2', years:[2020,2026], body:['Универсал'],
            engines:[{vol:1.8,hp:177,fuel:'Бензин'},{vol:2.4,hp:275,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[2600000,4200000] }
        ] },
      { id:'wrx', name:'WRX', ru:'ВРХ', popular:false, aliases:['врх','wrx','вирикс','сти','sti','wrx sti'], body:'Седан',
        gens:[
          { name:'VA', ru:'1', years:[2014,2021], body:['Седан'],
            engines:[{vol:2.0,hp:268,fuel:'Бензин'},{vol:2.5,hp:300,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Полный'], price:[1800000,3500000] },
          { name:'VB', ru:'2', years:[2021,2026], body:['Седан'],
            engines:[{vol:2.4,hp:275,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Полный'], price:[3500000,5500000] }
        ] },
      { id:'tribeca', name:'Tribeca', ru:'Трибека', popular:false, aliases:['трибека','tribeca','трайбека'], body:'Кроссовер',
        gens:[
          { name:'B9', ru:'1', years:[2005,2014], body:['Кроссовер'],
            engines:[{vol:3.0,hp:245,fuel:'Бензин'},{vol:3.6,hp:258,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[600000,1200000] }
        ] },
      { id:'ascent', name:'Ascent', ru:'Ассент', popular:false, aliases:['ассент','ascent','асцент'], body:'Кроссовер',
        gens:[
          { name:'WM', ru:'1', years:[2018,2026], body:['Кроссовер'],
            engines:[{vol:2.4,hp:264,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Полный'], price:[2800000,4800000] }
        ] },
      { id:'brz', name:'BRZ', ru:'БРЗ', popular:false, aliases:['брз','brz','бэрзэт'], body:'Купе',
        gens:[
          { name:'ZC6', ru:'1', years:[2012,2020], body:['Купе'],
            engines:[{vol:2.0,hp:200,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[1500000,2500000] },
          { name:'ZD8', ru:'2', years:[2021,2026], body:['Купе'],
            engines:[{vol:2.4,hp:235,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[3000000,4800000] }
        ] },
      { id:'exiga', name:'Exiga', ru:'Эксига', popular:false, aliases:['эксига','exiga','эксайга'], body:'Минивэн',
        gens:[
          { name:'YA', ru:'1', years:[2008,2018], body:['Минивэн'],
            engines:[{vol:2.0,hp:148,fuel:'Бензин'},{vol:2.5,hp:173,fuel:'Бензин'}],
            gearbox:['Автомат','Вариатор'], drive:['Полный'], price:[600000,1300000] }
        ] }
    ] },

  { id:'mazda', name:'Mazda', ru:'Мазда', country:'jp', popular:false, aliases:['мазда','mazda','мазд'],
    models:[
      { id:'mazda3', name:'Mazda 3', ru:'Мазда 3', popular:true, aliases:['мазда 3','мазда3','mazda3','аксела','axela','трешка мазда'], body:'Седан',
        gens:[
          { name:'BL', ru:'2', years:[2009,2013], body:['Седан','Хэтчбек'],
            engines:[{vol:1.6,hp:105,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.3,hp:260,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1100000] },
          { name:'BM', ru:'3', years:[2013,2019], body:['Седан','Хэтчбек'],
            engines:[{vol:1.5,hp:120,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:184,fuel:'Бензин'},{vol:2.2,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1100000,2100000] },
          { name:'BP', ru:'4', years:[2019,2026], body:['Седан','Хэтчбек'],
            engines:[{vol:1.5,hp:120,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:191,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[2200000,3800000] }
        ] },
      { id:'mazda6', name:'Mazda 6', ru:'Мазда 6', popular:false, aliases:['мазда 6','мазда6','mazda6','атенза','atenza','шестерка мазда'], body:'Седан',
        gens:[
          { name:'GH', ru:'2', years:[2007,2012], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.8,hp:120,fuel:'Бензин'},{vol:2.0,hp:147,fuel:'Бензин'},{vol:2.5,hp:170,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[550000,1100000] },
          { name:'GJ', ru:'3', years:[2012,2024], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:194,fuel:'Бензин'},{vol:2.2,hp:175,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1300000,3000000] }
        ] },
      { id:'cx5', name:'CX-5', ru:'СХ-5', popular:true, aliases:['сх5','cx-5','cx5','цх5','сиэкс 5'], body:'Кроссовер',
        gens:[
          { name:'KE', ru:'1', years:[2011,2017], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:192,fuel:'Бензин'},{vol:2.2,hp:175,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1200000,2200000] },
          { name:'KF', ru:'2', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:194,fuel:'Бензин'},{vol:2.5,hp:231,fuel:'Бензин'},{vol:2.2,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2200000,4500000] }
        ] },
      { id:'cx7', name:'CX-7', ru:'СХ-7', popular:false, aliases:['сх7','cx-7','cx7','цх7'], body:'Кроссовер',
        gens:[
          { name:'ER', ru:'1', years:[2006,2012], body:['Кроссовер'],
            engines:[{vol:2.3,hp:238,fuel:'Бензин'},{vol:2.5,hp:163,fuel:'Бензин'},{vol:2.2,hp:173,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[650000,1300000] }
        ] },
      { id:'cx9', name:'CX-9', ru:'СХ-9', popular:false, aliases:['сх9','cx-9','cx9','цх9'], body:'Кроссовер',
        gens:[
          { name:'TB', ru:'1', years:[2007,2015], body:['Кроссовер'],
            engines:[{vol:3.7,hp:277,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[900000,1800000] },
          { name:'TC', ru:'2', years:[2016,2023], body:['Кроссовер'],
            engines:[{vol:2.5,hp:231,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2200000,4000000] }
        ] },
      { id:'cx30', name:'CX-30', ru:'СХ-30', popular:false, aliases:['сх30','cx-30','cx30','цх30'], body:'Кроссовер',
        gens:[
          { name:'DM', ru:'1', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:1.8,hp:116,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:186,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[2200000,3800000] }
        ] },
      { id:'cx60', name:'CX-60', ru:'СХ-60', popular:false, aliases:['сх60','cx-60','cx60','цх60'], body:'Кроссовер',
        gens:[
          { name:'KH', ru:'1', years:[2022,2026], body:['Кроссовер'],
            engines:[{vol:3.3,hp:284,fuel:'Бензин'},{vol:3.3,hp:254,fuel:'Дизель'},{vol:2.5,hp:327,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4200000,6800000] }
        ] },
      { id:'cx90', name:'CX-90', ru:'СХ-90', popular:false, aliases:['сх90','cx-90','cx90','цх90'], body:'Кроссовер',
        gens:[
          { name:'KK', ru:'1', years:[2023,2026], body:['Кроссовер'],
            engines:[{vol:3.3,hp:340,fuel:'Бензин'},{vol:2.5,hp:327,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[5500000,8500000] }
        ] },
      { id:'demio', name:'Demio', ru:'Демио', popular:false, aliases:['демио','demio','мазда 2','mazda2','демиo'], body:'Хэтчбек',
        gens:[
          { name:'DE', ru:'3', years:[2007,2014], body:['Хэтчбек'],
            engines:[{vol:1.3,hp:91,fuel:'Бензин'},{vol:1.5,hp:113,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[400000,750000] },
          { name:'DJ', ru:'4', years:[2014,2022], body:['Хэтчбек'],
            engines:[{vol:1.3,hp:92,fuel:'Бензин'},{vol:1.5,hp:115,fuel:'Бензин'},{vol:1.5,hp:105,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[800000,1600000] }
        ] },
      { id:'mx5', name:'MX-5', ru:'МХ-5', popular:false, aliases:['мх5','mx-5','mx5','миата','miata','роадстер'], body:'Кабриолет',
        gens:[
          { name:'NC', ru:'3', years:[2005,2015], body:['Кабриолет','Купе'],
            engines:[{vol:1.8,hp:126,fuel:'Бензин'},{vol:2.0,hp:160,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[900000,1700000] },
          { name:'ND', ru:'4', years:[2015,2026], body:['Кабриолет','Купе'],
            engines:[{vol:1.5,hp:132,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[2200000,4200000] }
        ] },
      { id:'premacy', name:'Premacy', ru:'Премаси', popular:false, aliases:['премаси','premacy','примаси','мазда 5'], body:'Минивэн',
        gens:[
          { name:'CREW', ru:'2', years:[2005,2010], body:['Минивэн'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.3,hp:165,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[400000,800000] },
          { name:'CW', ru:'3', years:[2010,2018], body:['Минивэн'],
            engines:[{vol:2.0,hp:151,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[600000,1200000] }
        ] }
    ] },

  { id:'suzuki', name:'Suzuki', ru:'Сузуки', country:'jp', popular:false, aliases:['сузуки','судзуки','suzuki','сузук'],
    models:[
      { id:'swift', name:'Swift', ru:'Свифт', popular:false, aliases:['свифт','swift','свит'], body:'Хэтчбек',
        gens:[
          { name:'ZC/ZD', ru:'3', years:[2010,2017], body:['Хэтчбек'],
            engines:[{vol:1.2,hp:94,fuel:'Бензин'},{vol:1.4,hp:95,fuel:'Бензин'},{vol:1.6,hp:136,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[550000,1100000] },
          { name:'ZC13', ru:'4', years:[2017,2023], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:111,fuel:'Бензин'},{vol:1.2,hp:91,fuel:'Бензин'},{vol:1.4,hp:140,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[1100000,2000000] }
        ] },
      { id:'vitara', name:'Vitara', ru:'Витара', popular:false, aliases:['витара','vitara','витарa'], body:'Кроссовер',
        gens:[
          { name:'LY', ru:'1', years:[2015,2026], body:['Кроссовер'],
            engines:[{vol:1.0,hp:112,fuel:'Бензин'},{vol:1.4,hp:140,fuel:'Бензин'},{vol:1.6,hp:117,fuel:'Бензин'},{vol:1.6,hp:120,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1500000,3000000] }
        ] },
      { id:'grand-vitara', name:'Grand Vitara', ru:'Гранд Витара', popular:false, aliases:['гранд витара','grand vitara','эскудо','escudo','грандвитара'], body:'Внедорожник',
        gens:[
          { name:'JT', ru:'3', years:[2005,2015], body:['Внедорожник'],
            engines:[{vol:1.6,hp:106,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Бензин'},{vol:2.4,hp:169,fuel:'Бензин'},{vol:1.9,hp:129,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[700000,1500000] },
          { name:'YWD', ru:'4', years:[2022,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:103,fuel:'Гибрид'},{vol:1.5,hp:116,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[2200000,3600000] }
        ] },
      { id:'jimny', name:'Jimny', ru:'Джимни', popular:false, aliases:['джимни','jimny','жимни','джимник'], body:'Внедорожник',
        gens:[
          { name:'JB43', ru:'3', years:[1998,2018], body:['Внедорожник'],
            engines:[{vol:0.7,hp:64,fuel:'Бензин'},{vol:1.3,hp:85,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[550000,1300000] },
          { name:'JB64/JB74', ru:'4', years:[2018,2026], body:['Внедорожник'],
            engines:[{vol:0.66,hp:64,fuel:'Бензин'},{vol:1.5,hp:102,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[2000000,3600000] }
        ] },
      { id:'sx4', name:'SX4', ru:'СХ4', popular:false, aliases:['сх4','sx4','эсикс4','s-cross','с кросс'], body:'Кроссовер',
        gens:[
          { name:'EY', ru:'1', years:[2006,2014], body:['Хэтчбек','Седан'],
            engines:[{vol:1.5,hp:99,fuel:'Бензин'},{vol:1.6,hp:112,fuel:'Бензин'},{vol:2.0,hp:145,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[500000,1000000] },
          { name:'JY S-Cross', ru:'2', years:[2013,2021], body:['Кроссовер'],
            engines:[{vol:1.4,hp:140,fuel:'Бензин'},{vol:1.6,hp:117,fuel:'Бензин'},{vol:1.6,hp:120,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[1100000,2200000] }
        ] },
      { id:'alto', name:'Alto', ru:'Альто', popular:false, aliases:['альто','alto','алто'], body:'Хэтчбек',
        gens:[
          { name:'HA36', ru:'8', years:[2014,2021], body:['Хэтчбек'],
            engines:[{vol:0.66,hp:52,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[450000,900000] }
        ] },
      { id:'wagon-r', name:'Wagon R', ru:'Вагон Эр', popular:false, aliases:['вагон р','wagon r','вагонр','вагон эр'], body:'Хэтчбек',
        gens:[
          { name:'MH35', ru:'6', years:[2017,2026], body:['Хэтчбек'],
            engines:[{vol:0.66,hp:52,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[700000,1400000] }
        ] },
      { id:'baleno', name:'Baleno', ru:'Балено', popular:false, aliases:['балено','baleno','баленo'], body:'Хэтчбек',
        gens:[
          { name:'WB', ru:'2', years:[2015,2022], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:111,fuel:'Бензин'},{vol:1.2,hp:90,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[900000,1600000] }
        ] },
      { id:'every', name:'Every', ru:'Эвери', popular:false, aliases:['эвери','every','эври','эвери вагон'], body:'Фургон',
        gens:[
          { name:'DA17', ru:'6', years:[2015,2026], body:['Фургон','Минивэн'],
            engines:[{vol:0.66,hp:49,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[600000,1500000] }
        ] }
    ] },

  { id:'daihatsu', name:'Daihatsu', ru:'Дайхатсу', country:'jp', popular:false, aliases:['дайхатсу','дайхацу','daihatsu','дайхатцу'],
    models:[
      { id:'terios', name:'Terios', ru:'Териос', popular:false, aliases:['териос','terios','териоc','биго'], body:'Внедорожник',
        gens:[
          { name:'J100', ru:'1', years:[1997,2005], body:['Внедорожник'],
            engines:[{vol:1.3,hp:83,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[300000,600000] },
          { name:'J200', ru:'2', years:[2006,2017], body:['Внедорожник'],
            engines:[{vol:1.5,hp:105,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[500000,1000000] }
        ] },
      { id:'move', name:'Move', ru:'Мув', popular:false, aliases:['мув','move','мов'], body:'Хэтчбек',
        gens:[
          { name:'LA100', ru:'5', years:[2010,2014], body:['Хэтчбек'],
            engines:[{vol:0.66,hp:52,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[350000,650000] },
          { name:'LA150', ru:'6', years:[2014,2023], body:['Хэтчбек'],
            engines:[{vol:0.66,hp:52,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[550000,1100000] }
        ] },
      { id:'mira', name:'Mira', ru:'Мира', popular:false, aliases:['мира','mira','мираэс','mira es'], body:'Хэтчбек',
        gens:[
          { name:'L275', ru:'7', years:[2006,2018], body:['Хэтчбек'],
            engines:[{vol:0.66,hp:52,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[300000,700000] }
        ] },
      { id:'tanto', name:'Tanto', ru:'Танто', popular:false, aliases:['танто','tanto','тантo'], body:'Хэтчбек',
        gens:[
          { name:'LA600', ru:'3', years:[2013,2019], body:['Хэтчбек'],
            engines:[{vol:0.66,hp:52,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[550000,1100000] }
        ] },
      { id:'hijet', name:'Hijet', ru:'Хайджет', popular:false, aliases:['хайджет','hijet','хиджет'], body:'Фургон',
        gens:[
          { name:'S321', ru:'10', years:[2004,2021], body:['Фургон','Пикап'],
            engines:[{vol:0.66,hp:53,fuel:'Бензин'},{vol:0.66,hp:64,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[400000,900000] }
        ] },
      { id:'rocky', name:'Rocky', ru:'Роки', popular:false, aliases:['роки','rocky','рокки','райз'], body:'Кроссовер',
        gens:[
          { name:'A200', ru:'2', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:1.0,hp:98,fuel:'Бензин'},{vol:1.2,hp:87,fuel:'Бензин'},{vol:1.2,hp:106,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1400000,2400000] }
        ] }
    ] },

  { id:'infiniti', name:'Infiniti', ru:'Инфинити', country:'jp', popular:false, aliases:['инфинити','инфинит','infiniti','инфинити'],
    models:[
      { id:'fx', name:'FX / QX70', ru:'ФИкс', popular:false, aliases:['фх','fx','fx35','fx37','qx70','кх70','фх35'], body:'Кроссовер',
        gens:[
          { name:'S50', ru:'1', years:[2002,2008], body:['Кроссовер'],
            engines:[{vol:3.5,hp:280,fuel:'Бензин'},{vol:4.5,hp:315,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[700000,1400000] },
          { name:'S51', ru:'2', years:[2008,2017], body:['Кроссовер'],
            engines:[{vol:3.0,hp:238,fuel:'Дизель'},{vol:3.5,hp:307,fuel:'Бензин'},{vol:3.7,hp:333,fuel:'Бензин'},{vol:5.0,hp:390,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1400000,2800000] }
        ] },
      { id:'qx56', name:'QX56 / QX80', ru:'КьюИкс80', popular:false, aliases:['кх56','qx56','qx80','кх80','инфинити кх'], body:'Внедорожник',
        gens:[
          { name:'Z62', ru:'2', years:[2010,2024], body:['Внедорожник'],
            engines:[{vol:5.6,hp:405,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2400000,6000000] }
        ] },
      { id:'qx60', name:'QX60', ru:'КьюИкс60', popular:false, aliases:['кх60','qx60','jx35','инфинити кх60'], body:'Кроссовер',
        gens:[
          { name:'L50', ru:'1', years:[2012,2020], body:['Кроссовер'],
            engines:[{vol:3.5,hp:249,fuel:'Бензин'},{vol:2.5,hp:253,fuel:'Гибрид'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[1700000,3200000] },
          { name:'L51', ru:'2', years:[2021,2026], body:['Кроссовер'],
            engines:[{vol:3.5,hp:295,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[4000000,6500000] }
        ] },
      { id:'q50', name:'Q50', ru:'КьюПятьдесят', popular:false, aliases:['ку50','q50','кью 50','инфинити ку50'], body:'Седан',
        gens:[
          { name:'V37', ru:'1', years:[2013,2026], body:['Седан'],
            engines:[{vol:2.0,hp:211,fuel:'Бензин'},{vol:3.0,hp:405,fuel:'Бензин'},{vol:3.5,hp:364,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1800000,4000000] }
        ] },
      { id:'g35', name:'G35 / G37', ru:'Джи37', popular:false, aliases:['г35','g35','g37','джи 37','инфинити г'], body:'Седан',
        gens:[
          { name:'V36', ru:'4', years:[2006,2015], body:['Седан','Купе','Кабриолет'],
            engines:[{vol:2.5,hp:225,fuel:'Бензин'},{vol:3.5,hp:315,fuel:'Бензин'},{vol:3.7,hp:333,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[800000,1800000] }
        ] },
      { id:'qx50', name:'QX50 / EX', ru:'КьюИкс50', popular:false, aliases:['кх50','qx50','ex35','ex25','инфинити ех'], body:'Кроссовер',
        gens:[
          { name:'J50', ru:'1', years:[2007,2017], body:['Кроссовер'],
            engines:[{vol:2.5,hp:222,fuel:'Бензин'},{vol:3.5,hp:315,fuel:'Бензин'},{vol:3.7,hp:333,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[900000,1900000] },
          { name:'P71A', ru:'2', years:[2018,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:249,fuel:'Бензин'}],
            gearbox:['Вариатор'], drive:['Передний','Полный'], price:[2600000,4500000] }
        ] },
      { id:'m37', name:'M / Q70', ru:'Кью70', popular:false, aliases:['м37','m37','m56','q70','ку70','инфинити м'], body:'Седан',
        gens:[
          { name:'Y51', ru:'4', years:[2010,2019], body:['Седан'],
            engines:[{vol:2.5,hp:222,fuel:'Бензин'},{vol:3.7,hp:333,fuel:'Бензин'},{vol:5.6,hp:420,fuel:'Бензин'},{vol:3.5,hp:364,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1300000,2800000] }
        ] }
    ] },

  { id:'acura', name:'Acura', ru:'Акура', country:'jp', popular:false, aliases:['акура','acura','акурa'],
    models:[
      { id:'mdx', name:'MDX', ru:'ЭмДиИкс', popular:false, aliases:['мдх','mdx','эмдиикс'], body:'Кроссовер',
        gens:[
          { name:'YD2', ru:'2', years:[2006,2013], body:['Кроссовер'],
            engines:[{vol:3.7,hp:305,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[800000,1600000] },
          { name:'YD3', ru:'3', years:[2013,2020], body:['Кроссовер'],
            engines:[{vol:3.5,hp:290,fuel:'Бензин'},{vol:3.0,hp:325,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1800000,3400000] }
        ] },
      { id:'rdx', name:'RDX', ru:'АрДиИкс', popular:false, aliases:['рдх','rdx','эрдиикс'], body:'Кроссовер',
        gens:[
          { name:'TB3', ru:'2', years:[2012,2018], body:['Кроссовер'],
            engines:[{vol:3.5,hp:279,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1200000,2200000] },
          { name:'TC1', ru:'3', years:[2018,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:272,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2600000,4500000] }
        ] },
      { id:'tlx', name:'TLX', ru:'ТиЭлИкс', popular:false, aliases:['тлх','tlx','тиэликс'], body:'Седан',
        gens:[
          { name:'UB', ru:'1', years:[2014,2020], body:['Седан'],
            engines:[{vol:2.4,hp:206,fuel:'Бензин'},{vol:3.5,hp:290,fuel:'Бензин'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[1300000,2400000] }
        ] },
      { id:'tl', name:'TL', ru:'ТиЭл', popular:false, aliases:['тл','tl','акура тл'], body:'Седан',
        gens:[
          { name:'UA8', ru:'4', years:[2008,2014], body:['Седан'],
            engines:[{vol:3.5,hp:280,fuel:'Бензин'},{vol:3.7,hp:305,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[700000,1400000] }
        ] },
      { id:'rl', name:'RL', ru:'АрЭл', popular:false, aliases:['рл','rl','акура рл'], body:'Седан',
        gens:[
          { name:'KB1', ru:'2', years:[2004,2012], body:['Седан'],
            engines:[{vol:3.5,hp:300,fuel:'Бензин'},{vol:3.7,hp:305,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[550000,1100000] }
        ] }
    ] },

  { id:'mercedes-benz', name:'Mercedes-Benz', ru:'Мерседес-Бенц', country:'de', popular:true, aliases:['мерседес','мерс','мерин','mercedes','benz','бенз','мэрсэдэс','мерседес бенц'],
    models:[
      { id:'e-class', name:'E-Class', ru:'Е-класс', popular:true, aliases:['е класс','ешка','мерс е','e class','еклас','мерседес е класс'], body:'Седан',
        gens:[
          { name:'W211', ru:'211', years:[2002,2009], body:['Седан','Универсал'],
            engines:[{vol:1.8,hp:184,fuel:'Бензин'},{vol:2.6,hp:177,fuel:'Бензин'},{vol:3.5,hp:272,fuel:'Бензин'},{vol:2.2,hp:150,fuel:'Дизель'},{vol:3.0,hp:224,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[600000,1400000] },
          { name:'W212', ru:'212', years:[2009,2016], body:['Седан','Универсал','Купе'],
            engines:[{vol:1.8,hp:184,fuel:'Бензин'},{vol:2.0,hp:211,fuel:'Бензин'},{vol:3.5,hp:306,fuel:'Бензин'},{vol:2.1,hp:170,fuel:'Дизель'},{vol:3.0,hp:252,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1400000,2800000] },
          { name:'W213', ru:'213', years:[2016,2023], body:['Седан','Универсал','Купе'],
            engines:[{vol:1.5,hp:184,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:3.0,hp:367,fuel:'Бензин'},{vol:2.0,hp:194,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2800000,5500000] },
          { name:'W214', ru:'214', years:[2023,2026], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:204,fuel:'Бензин'},{vol:3.0,hp:381,fuel:'Бензин'},{vol:2.0,hp:197,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[6000000,10000000] }
        ] },
      { id:'s-class', name:'S-Class', ru:'С-класс', popular:true, aliases:['с класс','эска','кабан','мерс с','s class','сшка','мерседес с класс'], body:'Седан',
        gens:[
          { name:'W221', ru:'221', years:[2005,2013], body:['Седан'],
            engines:[{vol:3.5,hp:272,fuel:'Бензин'},{vol:4.7,hp:435,fuel:'Бензин'},{vol:5.5,hp:544,fuel:'Бензин'},{vol:3.0,hp:235,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1400000,3200000] },
          { name:'W222', ru:'222', years:[2013,2020], body:['Седан'],
            engines:[{vol:3.0,hp:367,fuel:'Бензин'},{vol:4.7,hp:455,fuel:'Бензин'},{vol:6.0,hp:630,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3500000,8000000] },
          { name:'W223', ru:'223', years:[2020,2026], body:['Седан'],
            engines:[{vol:3.0,hp:435,fuel:'Бензин'},{vol:4.0,hp:503,fuel:'Бензин'},{vol:3.0,hp:330,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[9000000,18000000] }
        ] },
      { id:'c-class', name:'C-Class', ru:'Ц-класс', popular:false, aliases:['ц класс','цешка','мерс ц','c class','цеклас','мерседес ц класс'], body:'Седан',
        gens:[
          { name:'W204', ru:'204', years:[2007,2015], body:['Седан','Универсал','Купе'],
            engines:[{vol:1.6,hp:156,fuel:'Бензин'},{vol:1.8,hp:184,fuel:'Бензин'},{vol:3.5,hp:306,fuel:'Бензин'},{vol:2.1,hp:170,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[900000,1900000] },
          { name:'W205', ru:'205', years:[2014,2021], body:['Седан','Универсал','Купе'],
            engines:[{vol:1.6,hp:156,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:3.0,hp:390,fuel:'Бензин'},{vol:2.1,hp:194,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2000000,4200000] },
          { name:'W206', ru:'206', years:[2021,2026], body:['Седан','Универсал'],
            engines:[{vol:1.5,hp:170,fuel:'Бензин'},{vol:2.0,hp:258,fuel:'Бензин'},{vol:2.0,hp:200,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4500000,7500000] }
        ] },
      { id:'gle', name:'GLE / ML', ru:'ГЛЕ', popular:true, aliases:['гле','gle','мл','ml','ml350','gle 350','мерс гле'], body:'Кроссовер',
        gens:[
          { name:'W164 ML', ru:'164', years:[2005,2011], body:['Кроссовер'],
            engines:[{vol:3.5,hp:272,fuel:'Бензин'},{vol:5.5,hp:388,fuel:'Бензин'},{vol:3.0,hp:224,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[900000,1900000] },
          { name:'W166', ru:'166', years:[2011,2019], body:['Кроссовер','Купе'],
            engines:[{vol:3.5,hp:249,fuel:'Бензин'},{vol:4.7,hp:456,fuel:'Бензин'},{vol:5.5,hp:585,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2000000,4500000] },
          { name:'V167', ru:'167', years:[2019,2026], body:['Кроссовер','Купе'],
            engines:[{vol:2.0,hp:258,fuel:'Бензин'},{vol:3.0,hp:367,fuel:'Бензин'},{vol:4.0,hp:612,fuel:'Бензин'},{vol:2.9,hp:330,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[5500000,11000000] }
        ] },
      { id:'gls', name:'GLS / GL', ru:'ГЛС', popular:false, aliases:['глс','gls','гл','gl','gl500','gls 400','мерс глс'], body:'Внедорожник',
        gens:[
          { name:'X164 GL', ru:'164', years:[2006,2012], body:['Внедорожник'],
            engines:[{vol:4.7,hp:340,fuel:'Бензин'},{vol:5.5,hp:388,fuel:'Бензин'},{vol:3.0,hp:224,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1100000,2200000] },
          { name:'X166', ru:'166', years:[2012,2019], body:['Внедорожник'],
            engines:[{vol:3.0,hp:333,fuel:'Бензин'},{vol:4.7,hp:455,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2400000,5000000] },
          { name:'X167', ru:'167', years:[2019,2026], body:['Внедорожник'],
            engines:[{vol:3.0,hp:367,fuel:'Бензин'},{vol:4.0,hp:557,fuel:'Бензин'},{vol:2.9,hp:330,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[7000000,14000000] }
        ] },
      { id:'glc', name:'GLC', ru:'ГЛЦ', popular:false, aliases:['глц','glc','glc 300','мерс глц'], body:'Кроссовер',
        gens:[
          { name:'X253', ru:'253', years:[2015,2022], body:['Кроссовер','Купе'],
            engines:[{vol:2.0,hp:197,fuel:'Бензин'},{vol:2.0,hp:258,fuel:'Бензин'},{vol:3.0,hp:390,fuel:'Бензин'},{vol:2.1,hp:170,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2400000,4800000] },
          { name:'X254', ru:'254', years:[2022,2026], body:['Кроссовер','Купе'],
            engines:[{vol:2.0,hp:204,fuel:'Бензин'},{vol:2.0,hp:258,fuel:'Бензин'},{vol:2.0,hp:197,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[5500000,9000000] }
        ] },
      { id:'glk', name:'GLK', ru:'ГЛК', popular:false, aliases:['глк','glk','glk 300','мерс глк'], body:'Кроссовер',
        gens:[
          { name:'X204', ru:'204', years:[2008,2015], body:['Кроссовер'],
            engines:[{vol:2.0,hp:211,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Бензин'},{vol:3.5,hp:306,fuel:'Бензин'},{vol:2.1,hp:170,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1200000,2400000] }
        ] },
      { id:'gla', name:'GLA', ru:'ГЛА', popular:false, aliases:['гла','gla','gla 250','мерс гла'], body:'Кроссовер',
        gens:[
          { name:'X156', ru:'156', years:[2013,2020], body:['Кроссовер'],
            engines:[{vol:1.6,hp:156,fuel:'Бензин'},{vol:2.0,hp:211,fuel:'Бензин'},{vol:2.0,hp:381,fuel:'Бензин'},{vol:2.1,hp:136,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1400000,2800000] },
          { name:'H247', ru:'247', years:[2020,2026], body:['Кроссовер'],
            engines:[{vol:1.3,hp:163,fuel:'Бензин'},{vol:2.0,hp:224,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[3200000,5500000] }
        ] },
      { id:'g-class', name:'G-Class', ru:'Г-класс', popular:false, aliases:['гелик','гелендваген','g class','г класс','гелендос','g63','гелик амг'], body:'Внедорожник',
        gens:[
          { name:'W463', ru:'463', years:[1990,2018], body:['Внедорожник'],
            engines:[{vol:3.0,hp:184,fuel:'Дизель'},{vol:5.0,hp:296,fuel:'Бензин'},{vol:5.5,hp:388,fuel:'Бензин'},{vol:5.5,hp:571,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[2500000,8000000] },
          { name:'W463A', ru:'463А', years:[2018,2026], body:['Внедорожник'],
            engines:[{vol:3.0,hp:286,fuel:'Дизель'},{vol:4.0,hp:422,fuel:'Бензин'},{vol:4.0,hp:585,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[12000000,25000000] }
        ] },
      { id:'cls', name:'CLS', ru:'ЦЛС', popular:false, aliases:['цлс','cls','cls 350','мерс цлс'], body:'Седан',
        gens:[
          { name:'W218', ru:'218', years:[2010,2018], body:['Седан','Универсал'],
            engines:[{vol:3.5,hp:306,fuel:'Бензин'},{vol:4.7,hp:408,fuel:'Бензин'},{vol:3.0,hp:265,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1600000,3200000] },
          { name:'C257', ru:'257', years:[2018,2023], body:['Седан'],
            engines:[{vol:2.0,hp:299,fuel:'Бензин'},{vol:3.0,hp:435,fuel:'Бензин'},{vol:3.0,hp:340,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4000000,7000000] }
        ] },
      { id:'cla', name:'CLA', ru:'ЦЛА', popular:false, aliases:['цла','cla','cla 200','мерс цла'], body:'Седан',
        gens:[
          { name:'C117', ru:'117', years:[2013,2019], body:['Седан','Универсал'],
            engines:[{vol:1.6,hp:156,fuel:'Бензин'},{vol:2.0,hp:211,fuel:'Бензин'},{vol:2.0,hp:381,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1400000,2800000] },
          { name:'C118', ru:'118', years:[2019,2026], body:['Седан','Универсал'],
            engines:[{vol:1.3,hp:163,fuel:'Бензин'},{vol:2.0,hp:224,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[3200000,5500000] }
        ] },
      { id:'a-class', name:'A-Class', ru:'А-класс', popular:false, aliases:['а класс','ашка','a class','мерс а класс'], body:'Хэтчбек',
        gens:[
          { name:'W176', ru:'176', years:[2012,2018], body:['Хэтчбек'],
            engines:[{vol:1.6,hp:156,fuel:'Бензин'},{vol:2.0,hp:211,fuel:'Бензин'},{vol:2.0,hp:381,fuel:'Бензин'},{vol:1.5,hp:109,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1200000,2400000] },
          { name:'W177', ru:'177', years:[2018,2026], body:['Хэтчбек','Седан'],
            engines:[{vol:1.3,hp:163,fuel:'Бензин'},{vol:2.0,hp:224,fuel:'Бензин'},{vol:1.5,hp:116,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2800000,4800000] }
        ] },
      { id:'v-class', name:'V-Class', ru:'В-класс', popular:false, aliases:['в класс','вито','vito','v class','viano','виано'], body:'Минивэн',
        gens:[
          { name:'W639', ru:'639', years:[2003,2014], body:['Минивэн','Фургон'],
            engines:[{vol:2.1,hp:150,fuel:'Дизель'},{vol:3.0,hp:224,fuel:'Дизель'},{vol:3.5,hp:258,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[900000,2000000] },
          { name:'W447', ru:'447', years:[2014,2026], body:['Минивэн','Фургон'],
            engines:[{vol:2.1,hp:163,fuel:'Дизель'},{vol:2.0,hp:239,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[2200000,6000000] }
        ] },
      { id:'sprinter', name:'Sprinter', ru:'Спринтер', popular:false, aliases:['спринтер','sprinter','шпринтер','спринт'], body:'Фургон',
        gens:[
          { name:'W906', ru:'906', years:[2006,2018], body:['Фургон','Минивэн'],
            engines:[{vol:2.1,hp:129,fuel:'Дизель'},{vol:2.1,hp:163,fuel:'Дизель'},{vol:3.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1200000,3200000] },
          { name:'VS30', ru:'907', years:[2018,2026], body:['Фургон'],
            engines:[{vol:2.1,hp:143,fuel:'Дизель'},{vol:2.0,hp:170,fuel:'Дизель'},{vol:3.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Задний','Полный'], price:[3200000,7500000] }
        ] },
      { id:'gle-coupe', name:'GLE Coupe', ru:'ГЛЕ Купе', popular:false, aliases:['гле купе','gle coupe','глц купе'], body:'Купе',
        gens:[
          { name:'C292', ru:'292', years:[2015,2019], body:['Купе'],
            engines:[{vol:3.0,hp:333,fuel:'Бензин'},{vol:5.5,hp:585,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3000000,5500000] }
        ] },
      { id:'w124', name:'W124', ru:'В124', popular:false, aliases:['в124','w124','волчок','124 кузов','мерс 124'], body:'Седан',
        gens:[
          { name:'W124', ru:'124', years:[1984,1997], body:['Седан','Универсал','Купе'],
            engines:[{vol:2.0,hp:136,fuel:'Бензин'},{vol:2.3,hp:132,fuel:'Бензин'},{vol:3.2,hp:220,fuel:'Бензин'},{vol:2.5,hp:126,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[300000,900000] }
        ] }
    ] },

  { id:'bmw', name:'BMW', ru:'БМВ', country:'de', popular:true, aliases:['бмв','бэмэвэ','bmw','бумер','бэха'],
    models:[
      { id:'3-series', name:'3 Series', ru:'3 серия', popular:true, aliases:['бмв 3','бмв тройка','тройка','3 series','е90','f30','бмв 3 серии'], body:'Седан',
        gens:[
          { name:'E90', ru:'E90', years:[2005,2012], body:['Седан','Универсал','Купе'],
            engines:[{vol:1.6,hp:122,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:3.0,hp:306,fuel:'Бензин'},{vol:2.0,hp:177,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[700000,1600000] },
          { name:'F30', ru:'F30', years:[2011,2019], body:['Седан','Универсал'],
            engines:[{vol:1.5,hp:136,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:326,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1600000,3200000] },
          { name:'G20', ru:'G20', years:[2018,2026], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:387,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3500000,6500000] }
        ] },
      { id:'5-series', name:'5 Series', ru:'5 серия', popular:true, aliases:['бмв 5','бмв пятерка','пятерка','5 series','g30','e60','f10','бмв 5 серии'], body:'Седан',
        gens:[
          { name:'E60', ru:'E60', years:[2003,2010], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:170,fuel:'Бензин'},{vol:2.5,hp:218,fuel:'Бензин'},{vol:3.0,hp:272,fuel:'Бензин'},{vol:5.0,hp:507,fuel:'Бензин'},{vol:3.0,hp:235,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[700000,1500000] },
          { name:'F10', ru:'F10', years:[2010,2017], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:306,fuel:'Бензин'},{vol:4.4,hp:560,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1600000,3400000] },
          { name:'G30', ru:'G30', years:[2016,2023], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:340,fuel:'Бензин'},{vol:4.4,hp:625,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3400000,6800000] },
          { name:'G60', ru:'G60', years:[2023,2026], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:208,fuel:'Бензин'},{vol:3.0,hp:381,fuel:'Бензин'},{vol:2.0,hp:197,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[7000000,11000000] }
        ] },
      { id:'7-series', name:'7 Series', ru:'7 серия', popular:false, aliases:['бмв 7','семерка','7 series','e65','f01','бмв 7 серии'], body:'Седан',
        gens:[
          { name:'E65', ru:'E65', years:[2001,2008], body:['Седан'],
            engines:[{vol:3.0,hp:231,fuel:'Бензин'},{vol:4.4,hp:333,fuel:'Бензин'},{vol:6.0,hp:445,fuel:'Бензин'},{vol:3.0,hp:231,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний'], price:[700000,1600000] },
          { name:'F01', ru:'F01', years:[2008,2015], body:['Седан'],
            engines:[{vol:3.0,hp:320,fuel:'Бензин'},{vol:4.4,hp:450,fuel:'Бензин'},{vol:6.0,hp:544,fuel:'Бензин'},{vol:3.0,hp:258,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1600000,3400000] },
          { name:'G11', ru:'G11', years:[2015,2022], body:['Седан'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:4.4,hp:530,fuel:'Бензин'},{vol:3.0,hp:265,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4000000,8000000] }
        ] },
      { id:'x5', name:'X5', ru:'Х5', popular:true, aliases:['х5','x5','икс пять','е70','f15','g05','бмв х5'], body:'Кроссовер',
        gens:[
          { name:'E53', ru:'E53', years:[1999,2006], body:['Кроссовер'],
            engines:[{vol:3.0,hp:231,fuel:'Бензин'},{vol:4.4,hp:320,fuel:'Бензин'},{vol:3.0,hp:218,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[700000,1500000] },
          { name:'E70', ru:'E70', years:[2006,2013], body:['Кроссовер'],
            engines:[{vol:3.0,hp:306,fuel:'Бензин'},{vol:4.4,hp:407,fuel:'Бензин'},{vol:3.0,hp:245,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1400000,2800000] },
          { name:'F15', ru:'F15', years:[2013,2018], body:['Кроссовер'],
            engines:[{vol:3.0,hp:306,fuel:'Бензин'},{vol:4.4,hp:450,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2600000,4800000] },
          { name:'G05', ru:'G05', years:[2018,2026], body:['Кроссовер'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:4.4,hp:530,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[5500000,11000000] }
        ] },
      { id:'x6', name:'X6', ru:'Х6', popular:false, aliases:['х6','x6','икс шесть','e71','f16','бмв х6'], body:'Купе',
        gens:[
          { name:'E71', ru:'E71', years:[2008,2014], body:['Купе','Кроссовер'],
            engines:[{vol:3.0,hp:306,fuel:'Бензин'},{vol:4.4,hp:555,fuel:'Бензин'},{vol:3.0,hp:245,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1600000,3200000] },
          { name:'F16', ru:'F16', years:[2014,2019], body:['Купе','Кроссовер'],
            engines:[{vol:3.0,hp:306,fuel:'Бензин'},{vol:4.4,hp:575,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3000000,5500000] },
          { name:'G06', ru:'G06', years:[2019,2026], body:['Купе','Кроссовер'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:4.4,hp:625,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[6500000,13000000] }
        ] },
      { id:'x3', name:'X3', ru:'Х3', popular:false, aliases:['х3','x3','икс три','f25','g01','бмв х3'], body:'Кроссовер',
        gens:[
          { name:'E83', ru:'E83', years:[2003,2010], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.5,hp:218,fuel:'Бензин'},{vol:3.0,hp:272,fuel:'Бензин'},{vol:2.0,hp:177,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[600000,1300000] },
          { name:'F25', ru:'F25', years:[2010,2017], body:['Кроссовер'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:306,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1600000,3000000] },
          { name:'G01', ru:'G01', years:[2017,2024], body:['Кроссовер'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:360,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3400000,6500000] }
        ] },
      { id:'x1', name:'X1', ru:'Х1', popular:false, aliases:['х1','x1','икс один','e84','f48','бмв х1'], body:'Кроссовер',
        gens:[
          { name:'E84', ru:'E84', years:[2009,2015], body:['Кроссовер'],
            engines:[{vol:1.6,hp:150,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.0,hp:177,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[900000,1800000] },
          { name:'F48', ru:'F48', years:[2015,2022], body:['Кроссовер'],
            engines:[{vol:1.5,hp:140,fuel:'Бензин'},{vol:2.0,hp:192,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[2000000,3800000] },
          { name:'U11', ru:'U11', years:[2022,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:136,fuel:'Бензин'},{vol:2.0,hp:204,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[4000000,6500000] }
        ] },
      { id:'x7', name:'X7', ru:'Х7', popular:false, aliases:['х7','x7','икс семь','g07','бмв х7'], body:'Внедорожник',
        gens:[
          { name:'G07', ru:'G07', years:[2018,2026], body:['Внедорожник'],
            engines:[{vol:3.0,hp:381,fuel:'Бензин'},{vol:4.4,hp:530,fuel:'Бензин'},{vol:3.0,hp:352,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[8000000,16000000] }
        ] },
      { id:'x4', name:'X4', ru:'Х4', popular:false, aliases:['х4','x4','икс четыре','f26','g02','бмв х4'], body:'Купе',
        gens:[
          { name:'F26', ru:'F26', years:[2014,2018], body:['Купе','Кроссовер'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:360,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2200000,4000000] },
          { name:'G02', ru:'G02', years:[2018,2026], body:['Купе','Кроссовер'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:387,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[4200000,7500000] }
        ] },
      { id:'1-series', name:'1 Series', ru:'1 серия', popular:false, aliases:['бмв 1','единичка','1 series','e87','f20','бмв 1 серии'], body:'Хэтчбек',
        gens:[
          { name:'E87', ru:'E87', years:[2004,2011], body:['Хэтчбек'],
            engines:[{vol:1.6,hp:122,fuel:'Бензин'},{vol:2.0,hp:170,fuel:'Бензин'},{vol:3.0,hp:306,fuel:'Бензин'},{vol:2.0,hp:143,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[600000,1300000] },
          { name:'F20', ru:'F20', years:[2011,2019], body:['Хэтчбек'],
            engines:[{vol:1.5,hp:136,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:340,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1400000,2800000] }
        ] },
      { id:'4-series', name:'4 Series', ru:'4 серия', popular:false, aliases:['бмв 4','четверка','4 series','f32','g22'], body:'Купе',
        gens:[
          { name:'F32', ru:'F32', years:[2013,2020], body:['Купе','Кабриолет'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:326,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[2200000,4200000] },
          { name:'G22', ru:'G22', years:[2020,2026], body:['Купе','Кабриолет'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:510,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4500000,8500000] }
        ] },
      { id:'m5', name:'M5', ru:'М5', popular:false, aliases:['м5','m5','эм пять','f90','бмв м5'], body:'Седан',
        gens:[
          { name:'F10 M5', ru:'F10', years:[2011,2016], body:['Седан'],
            engines:[{vol:4.4,hp:560,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Задний'], price:[2800000,5000000] },
          { name:'F90 M5', ru:'F90', years:[2017,2023], body:['Седан'],
            engines:[{vol:4.4,hp:625,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[6000000,11000000] }
        ] },
      { id:'z4', name:'Z4', ru:'З4', popular:false, aliases:['з4','z4','зет четыре','g29'], body:'Кабриолет',
        gens:[
          { name:'E89', ru:'E89', years:[2009,2016], body:['Кабриолет','Купе'],
            engines:[{vol:2.0,hp:184,fuel:'Бензин'},{vol:3.0,hp:340,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Задний'], price:[1400000,2600000] },
          { name:'G29', ru:'G29', years:[2018,2026], body:['Кабриолет'],
            engines:[{vol:2.0,hp:197,fuel:'Бензин'},{vol:3.0,hp:387,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[4000000,7500000] }
        ] },
      { id:'i3', name:'i3', ru:'и3', popular:false, aliases:['и3','i3','ай три','бмв и3'], body:'Хэтчбек',
        gens:[
          { name:'I01', ru:'1', years:[2013,2022], body:['Хэтчбек'],
            engines:[{hp:170,fuel:'Электро'},{hp:184,fuel:'Электро'}], batteryKwh:[22,42], rangeKm:[130,310],
            gearbox:['Автомат'], drive:['Задний'], price:[1200000,2600000] }
        ] }
    ] },

  { id:'audi', name:'Audi', ru:'Ауди', country:'de', popular:true, aliases:['ауди','аудюха','audi','ауди'],
    models:[
      { id:'a6', name:'A6', ru:'А6', popular:true, aliases:['а6','a6','ауди а6','с7','c7','шестерка ауди'], body:'Седан',
        gens:[
          { name:'C6', ru:'C6', years:[2004,2011], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:170,fuel:'Бензин'},{vol:2.4,hp:177,fuel:'Бензин'},{vol:3.2,hp:255,fuel:'Бензин'},{vol:2.7,hp:180,fuel:'Дизель'},{vol:3.0,hp:233,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[600000,1400000] },
          { name:'C7', ru:'C7', years:[2011,2018], body:['Седан','Универсал'],
            engines:[{vol:1.8,hp:190,fuel:'Бензин'},{vol:2.0,hp:252,fuel:'Бензин'},{vol:3.0,hp:333,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'},{vol:3.0,hp:272,fuel:'Дизель'}],
            gearbox:['Робот','Вариатор'], drive:['Передний','Полный'], price:[1600000,3200000] },
          { name:'C8', ru:'C8', years:[2018,2026], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'},{vol:3.0,hp:340,fuel:'Бензин'},{vol:3.0,hp:286,fuel:'Дизель'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[4000000,7500000] }
        ] },
      { id:'a4', name:'A4', ru:'А4', popular:true, aliases:['а4','a4','ауди а4','b8','б8','четверка ауди'], body:'Седан',
        gens:[
          { name:'B7', ru:'B7', years:[2004,2008], body:['Седан','Универсал'],
            engines:[{vol:1.8,hp:163,fuel:'Бензин'},{vol:2.0,hp:200,fuel:'Бензин'},{vol:3.2,hp:255,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[450000,950000] },
          { name:'B8', ru:'B8', years:[2007,2015], body:['Седан','Универсал'],
            engines:[{vol:1.8,hp:170,fuel:'Бензин'},{vol:2.0,hp:211,fuel:'Бензин'},{vol:3.0,hp:272,fuel:'Бензин'},{vol:2.0,hp:143,fuel:'Дизель'}],
            gearbox:['Механика','Робот','Вариатор'], drive:['Передний','Полный'], price:[900000,1900000] },
          { name:'B9', ru:'B9', years:[2015,2023], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:249,fuel:'Бензин'},{vol:3.0,hp:354,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Робот','Автомат'], drive:['Передний','Полный'], price:[2200000,4500000] }
        ] },
      { id:'a8', name:'A8', ru:'А8', popular:false, aliases:['а8','a8','ауди а8','d4','восьмерка ауди'], body:'Седан',
        gens:[
          { name:'D3', ru:'D3', years:[2002,2010], body:['Седан'],
            engines:[{vol:3.0,hp:220,fuel:'Бензин'},{vol:4.2,hp:335,fuel:'Бензин'},{vol:6.0,hp:450,fuel:'Бензин'},{vol:3.0,hp:233,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[700000,1600000] },
          { name:'D4', ru:'D4', years:[2010,2017], body:['Седан'],
            engines:[{vol:3.0,hp:290,fuel:'Бензин'},{vol:4.0,hp:435,fuel:'Бензин'},{vol:3.0,hp:250,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1800000,3600000] },
          { name:'D5', ru:'D5', years:[2017,2026], body:['Седан'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:4.0,hp:460,fuel:'Бензин'},{vol:3.0,hp:286,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[5000000,10000000] }
        ] },
      { id:'q7', name:'Q7', ru:'Ку7', popular:false, aliases:['ку7','q7','ауди ку7','кушка 7'], body:'Внедорожник',
        gens:[
          { name:'4L', ru:'1', years:[2005,2015], body:['Внедорожник'],
            engines:[{vol:3.0,hp:333,fuel:'Бензин'},{vol:4.2,hp:350,fuel:'Бензин'},{vol:3.0,hp:245,fuel:'Дизель'},{vol:4.2,hp:340,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1100000,2600000] },
          { name:'4M', ru:'2', years:[2015,2026], body:['Внедорожник'],
            engines:[{vol:2.0,hp:249,fuel:'Бензин'},{vol:3.0,hp:340,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3800000,8500000] }
        ] },
      { id:'q5', name:'Q5', ru:'Ку5', popular:false, aliases:['ку5','q5','ауди ку5','кушка 5'], body:'Кроссовер',
        gens:[
          { name:'8R', ru:'1', years:[2008,2017], body:['Кроссовер'],
            engines:[{vol:2.0,hp:211,fuel:'Бензин'},{vol:3.0,hp:272,fuel:'Бензин'},{vol:2.0,hp:177,fuel:'Дизель'},{vol:3.0,hp:245,fuel:'Дизель'}],
            gearbox:['Механика','Робот','Автомат'], drive:['Полный'], price:[1200000,2600000] },
          { name:'FY', ru:'2', years:[2016,2024], body:['Кроссовер'],
            engines:[{vol:2.0,hp:249,fuel:'Бензин'},{vol:3.0,hp:354,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Полный'], price:[3000000,6000000] }
        ] },
      { id:'q3', name:'Q3', ru:'Ку3', popular:false, aliases:['ку3','q3','ауди ку3','кушка 3'], body:'Кроссовер',
        gens:[
          { name:'8U', ru:'1', years:[2011,2018], body:['Кроссовер'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:220,fuel:'Бензин'},{vol:2.0,hp:177,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1200000,2400000] },
          { name:'F3', ru:'2', years:[2018,2026], body:['Кроссовер'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:230,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[2800000,5000000] }
        ] },
      { id:'a3', name:'A3', ru:'А3', popular:false, aliases:['а3','a3','ауди а3','тройка ауди'], body:'Хэтчбек',
        gens:[
          { name:'8P', ru:'8P', years:[2003,2012], body:['Хэтчбек','Кабриолет'],
            engines:[{vol:1.4,hp:125,fuel:'Бензин'},{vol:1.8,hp:160,fuel:'Бензин'},{vol:2.0,hp:265,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[500000,1200000] },
          { name:'8V', ru:'8V', years:[2012,2020], body:['Хэтчбек','Седан'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:1.8,hp:180,fuel:'Бензин'},{vol:2.0,hp:310,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1300000,2600000] },
          { name:'8Y', ru:'8Y', years:[2020,2026], body:['Хэтчбек','Седан'],
            engines:[{vol:1.0,hp:110,fuel:'Бензин'},{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:400,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[3000000,5500000] }
        ] },
      { id:'a7', name:'A7', ru:'А7', popular:false, aliases:['а7','a7','ауди а7','семерка ауди'], body:'Хэтчбек',
        gens:[
          { name:'4G', ru:'1', years:[2010,2018], body:['Хэтчбек'],
            engines:[{vol:2.0,hp:252,fuel:'Бензин'},{vol:3.0,hp:333,fuel:'Бензин'},{vol:3.0,hp:272,fuel:'Дизель'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[1800000,3400000] },
          { name:'4K', ru:'2', years:[2018,2026], body:['Хэтчбек'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'},{vol:3.0,hp:340,fuel:'Бензин'},{vol:3.0,hp:286,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Полный'], price:[4500000,8000000] }
        ] },
      { id:'a5', name:'A5', ru:'А5', popular:false, aliases:['а5','a5','ауди а5','пятерка ауди'], body:'Купе',
        gens:[
          { name:'8T', ru:'1', years:[2007,2016], body:['Купе','Хэтчбек','Кабриолет'],
            engines:[{vol:1.8,hp:170,fuel:'Бензин'},{vol:2.0,hp:225,fuel:'Бензин'},{vol:3.0,hp:333,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Робот','Вариатор'], drive:['Передний','Полный'], price:[1000000,2200000] },
          { name:'F5', ru:'2', years:[2016,2024], body:['Купе','Хэтчбек','Кабриолет'],
            engines:[{vol:2.0,hp:249,fuel:'Бензин'},{vol:3.0,hp:354,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Робот','Автомат'], drive:['Передний','Полный'], price:[2600000,5500000] }
        ] },
      { id:'q8', name:'Q8', ru:'Ку8', popular:false, aliases:['ку8','q8','ауди ку8','кушка 8'], body:'Кроссовер',
        gens:[
          { name:'4M', ru:'1', years:[2018,2026], body:['Кроссовер','Купе'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:4.0,hp:600,fuel:'Бензин'},{vol:3.0,hp:286,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[6000000,12000000] }
        ] },
      { id:'tt', name:'TT', ru:'ТТ', popular:false, aliases:['тт','tt','ауди тт'], body:'Купе',
        gens:[
          { name:'8J', ru:'2', years:[2006,2014], body:['Купе','Кабриолет'],
            engines:[{vol:1.8,hp:160,fuel:'Бензин'},{vol:2.0,hp:211,fuel:'Бензин'},{vol:3.2,hp:250,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[900000,1900000] },
          { name:'8S', ru:'3', years:[2014,2023], body:['Купе','Кабриолет'],
            engines:[{vol:1.8,hp:180,fuel:'Бензин'},{vol:2.0,hp:230,fuel:'Бензин'},{vol:2.5,hp:400,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2200000,4500000] }
        ] },
      { id:'e-tron', name:'e-tron', ru:'е-трон', popular:false, aliases:['етрон','e-tron','етрон','ауди етрон','q8 e-tron'], body:'Кроссовер',
        gens:[
          { name:'GE', ru:'1', years:[2018,2022], body:['Кроссовер'],
            engines:[{hp:313,fuel:'Электро'},{hp:408,fuel:'Электро'}], batteryKwh:[71,95], rangeKm:[300,440],
            gearbox:['Автомат'], drive:['Полный'], price:[3200000,5500000] },
          { name:'Q8 e-tron', ru:'2', years:[2022,2026], body:['Кроссовер'],
            engines:[{hp:340,fuel:'Электро'},{hp:408,fuel:'Электро'},{hp:503,fuel:'Электро'}], batteryKwh:[89,114], rangeKm:[400,580],
            gearbox:['Автомат'], drive:['Полный'], price:[6000000,10000000] }
        ] },
      { id:'80', name:'80 / 100', ru:'80', popular:false, aliases:['ауди 80','бочка','сигара','audi 80','ауди 100','селедка'], body:'Седан',
        gens:[
          { name:'B3/B4', ru:'80', years:[1986,1996], body:['Седан','Универсал'],
            engines:[{vol:1.8,hp:90,fuel:'Бензин'},{vol:2.0,hp:115,fuel:'Бензин'},{vol:2.3,hp:133,fuel:'Бензин'},{vol:1.9,hp:75,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[180000,450000] }
        ] }
    ] },

  { id:'volkswagen', name:'Volkswagen', ru:'Фольксваген', country:'de', popular:true, aliases:['фольксваген','фольц','volkswagen','vw','вв','фольк','вольцваген'],
    models:[
      { id:'golf', name:'Golf', ru:'Гольф', popular:true, aliases:['гольф','golf','гольфик','гольф 4','гольф 6'], body:'Хэтчбек',
        gens:[
          { name:'Mk4', ru:'4', years:[1997,2004], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.4,hp:75,fuel:'Бензин'},{vol:1.6,hp:105,fuel:'Бензин'},{vol:1.8,hp:180,fuel:'Бензин'},{vol:1.9,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[300000,700000] },
          { name:'Mk6', ru:'6', years:[2008,2012], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.2,hp:105,fuel:'Бензин'},{vol:1.4,hp:122,fuel:'Бензин'},{vol:2.0,hp:210,fuel:'Бензин'},{vol:1.6,hp:105,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[650000,1300000] },
          { name:'Mk7', ru:'7', years:[2012,2020], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.2,hp:105,fuel:'Бензин'},{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:310,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1200000,2400000] },
          { name:'Mk8', ru:'8', years:[2019,2026], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.0,hp:110,fuel:'Бензин'},{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:320,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2400000,4500000] }
        ] },
      { id:'passat', name:'Passat', ru:'Пассат', popular:true, aliases:['пассат','пасат','passat','б5','б6','б7','пассат сс'], body:'Седан',
        gens:[
          { name:'B5', ru:'B5', years:[1996,2005], body:['Седан','Универсал'],
            engines:[{vol:1.6,hp:102,fuel:'Бензин'},{vol:1.8,hp:150,fuel:'Бензин'},{vol:2.8,hp:193,fuel:'Бензин'},{vol:1.9,hp:130,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[300000,700000] },
          { name:'B6', ru:'B6', years:[2005,2010], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:122,fuel:'Бензин'},{vol:1.8,hp:160,fuel:'Бензин'},{vol:3.2,hp:250,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[550000,1100000] },
          { name:'B7', ru:'B7', years:[2010,2015], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:1.8,hp:152,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[900000,1700000] },
          { name:'B8', ru:'B8', years:[2014,2022], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:280,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1800000,3400000] }
        ] },
      { id:'polo', name:'Polo', ru:'Поло', popular:false, aliases:['поло','polo','полик','поло седан'], body:'Седан',
        gens:[
          { name:'Mk5', ru:'5', years:[2009,2017], body:['Седан','Хэтчбек'],
            engines:[{vol:1.2,hp:105,fuel:'Бензин'},{vol:1.4,hp:85,fuel:'Бензин'},{vol:1.6,hp:105,fuel:'Бензин'},{vol:1.6,hp:90,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[600000,1200000] },
          { name:'Mk6', ru:'6', years:[2017,2026], body:['Хэтчбек','Седан'],
            engines:[{vol:1.0,hp:110,fuel:'Бензин'},{vol:1.4,hp:125,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Бензин'},{vol:2.0,hp:207,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[1500000,2600000] }
        ] },
      { id:'tiguan', name:'Tiguan', ru:'Тигуан', popular:false, aliases:['тигуан','тигуана','tiguan','тигуанчик'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2007,2016], body:['Кроссовер'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:200,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Робот','Автомат'], drive:['Передний','Полный'], price:[900000,1900000] },
          { name:'2', ru:'2', years:[2016,2023], body:['Кроссовер'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:220,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2000000,4000000] },
          { name:'3', ru:'3', years:[2023,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:265,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Передний','Полный'], price:[4500000,7000000] }
        ] },
      { id:'touareg', name:'Touareg', ru:'Туарег', popular:false, aliases:['туарег','туарэг','touareg','туарега'], body:'Внедорожник',
        gens:[
          { name:'7L', ru:'1', years:[2002,2010], body:['Внедорожник'],
            engines:[{vol:3.2,hp:220,fuel:'Бензин'},{vol:4.2,hp:310,fuel:'Бензин'},{vol:3.0,hp:225,fuel:'Дизель'},{vol:5.0,hp:313,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[800000,1800000] },
          { name:'7P', ru:'2', years:[2010,2018], body:['Внедорожник'],
            engines:[{vol:3.6,hp:249,fuel:'Бензин'},{vol:3.0,hp:333,fuel:'Гибрид'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1800000,3600000] },
          { name:'CR', ru:'3', years:[2018,2026], body:['Внедорожник'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'},{vol:4.0,hp:421,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[4500000,9000000] }
        ] },
      { id:'jetta', name:'Jetta', ru:'Джетта', popular:false, aliases:['джетта','жетта','jetta','джета'], body:'Седан',
        gens:[
          { name:'Mk6', ru:'6', years:[2010,2018], body:['Седан'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:1.6,hp:105,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[800000,1600000] },
          { name:'Mk7', ru:'7', years:[2018,2026], body:['Седан'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:1.5,hp:160,fuel:'Бензин'},{vol:2.0,hp:230,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[2000000,3500000] }
        ] },
      { id:'touran', name:'Touran', ru:'Туран', popular:false, aliases:['туран','touran','турана'], body:'Минивэн',
        gens:[
          { name:'1T', ru:'1', years:[2003,2015], body:['Минивэн'],
            engines:[{vol:1.4,hp:140,fuel:'Бензин'},{vol:1.6,hp:102,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[550000,1200000] },
          { name:'5T', ru:'2', years:[2015,2026], body:['Минивэн'],
            engines:[{vol:1.2,hp:110,fuel:'Бензин'},{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[1600000,3000000] }
        ] },
      { id:'transporter', name:'Transporter', ru:'Транспортер', popular:false, aliases:['транспортер','transporter','т5','т6','каравелла','мультивэн'], body:'Фургон',
        gens:[
          { name:'T5', ru:'T5', years:[2003,2015], body:['Фургон','Минивэн'],
            engines:[{vol:2.0,hp:115,fuel:'Дизель'},{vol:2.5,hp:174,fuel:'Дизель'},{vol:3.2,hp:235,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний','Полный'], price:[900000,2200000] },
          { name:'T6', ru:'T6', years:[2015,2026], body:['Фургон','Минивэн'],
            engines:[{vol:2.0,hp:150,fuel:'Дизель'},{vol:2.0,hp:204,fuel:'Дизель'},{vol:2.0,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2400000,5500000] }
        ] },
      { id:'caddy', name:'Caddy', ru:'Кадди', popular:false, aliases:['кадди','caddy','кэдди'], body:'Фургон',
        gens:[
          { name:'2K', ru:'3', years:[2003,2015], body:['Фургон','Минивэн'],
            engines:[{vol:1.4,hp:80,fuel:'Бензин'},{vol:1.6,hp:102,fuel:'Дизель'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[600000,1400000] },
          { name:'SB', ru:'5', years:[2020,2026], body:['Фургон','Минивэн'],
            engines:[{vol:1.5,hp:114,fuel:'Бензин'},{vol:2.0,hp:122,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2400000,4200000] }
        ] },
      { id:'sharan', name:'Sharan', ru:'Шаран', popular:false, aliases:['шаран','sharan','шарана'], body:'Минивэн',
        gens:[
          { name:'7M', ru:'1', years:[1995,2010], body:['Минивэн'],
            engines:[{vol:1.8,hp:150,fuel:'Бензин'},{vol:2.0,hp:115,fuel:'Бензин'},{vol:1.9,hp:130,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[350000,750000] },
          { name:'7N', ru:'2', years:[2010,2022], body:['Минивэн'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:200,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1200000,2400000] }
        ] },
      { id:'amarok', name:'Amarok', ru:'Амарок', popular:false, aliases:['амарок','amarok','амарак'], body:'Пикап',
        gens:[
          { name:'2H', ru:'1', years:[2010,2020], body:['Пикап'],
            engines:[{vol:2.0,hp:180,fuel:'Дизель'},{vol:3.0,hp:258,fuel:'Дизель'},{vol:2.0,hp:160,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1400000,3200000] }
        ] },
      { id:'id4', name:'ID.4', ru:'АйДи 4', popular:false, aliases:['ид4','id4','id.4','айди 4'], body:'Кроссовер',
        gens:[
          { name:'ID.4', ru:'1', years:[2020,2026], body:['Кроссовер'],
            engines:[{hp:170,fuel:'Электро'},{hp:204,fuel:'Электро'},{hp:299,fuel:'Электро'}], batteryKwh:[52,82], rangeKm:[340,520],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2800000,4800000] }
        ] },
      { id:'multivan', name:'Multivan', ru:'Мультивэн', popular:false, aliases:['мультивэн','мультиван','multivan','каравелла'], body:'Минивэн',
        gens:[
          { name:'T7', ru:'T7', years:[2021,2026], body:['Минивэн'],
            engines:[{vol:1.5,hp:136,fuel:'Бензин'},{vol:2.0,hp:204,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Передний'], price:[5000000,8500000] }
        ] }
    ] },

  { id:'porsche', name:'Porsche', ru:'Порше', country:'de', popular:false, aliases:['порше','порш','porsche','порще'],
    models:[
      { id:'cayenne', name:'Cayenne', ru:'Кайен', popular:false, aliases:['кайен','каен','cayenne','кайенн'], body:'Кроссовер',
        gens:[
          { name:'955/957', ru:'1', years:[2002,2010], body:['Кроссовер'],
            engines:[{vol:3.6,hp:290,fuel:'Бензин'},{vol:4.8,hp:405,fuel:'Бензин'},{vol:4.8,hp:500,fuel:'Бензин'},{vol:3.0,hp:240,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[1000000,2200000] },
          { name:'958', ru:'2', years:[2010,2018], body:['Кроссовер'],
            engines:[{vol:3.6,hp:300,fuel:'Бензин'},{vol:4.8,hp:520,fuel:'Бензин'},{vol:3.0,hp:245,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2400000,5000000] },
          { name:'9YA', ru:'3', years:[2017,2026], body:['Кроссовер','Купе'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:2.9,hp:440,fuel:'Бензин'},{vol:4.0,hp:640,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[6500000,15000000] }
        ] },
      { id:'macan', name:'Macan', ru:'Макан', popular:false, aliases:['макан','macan','маккан'], body:'Кроссовер',
        gens:[
          { name:'95B', ru:'1', years:[2014,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:265,fuel:'Бензин'},{vol:3.0,hp:354,fuel:'Бензин'},{vol:2.9,hp:440,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Полный'], price:[3800000,9000000] }
        ] },
      { id:'panamera', name:'Panamera', ru:'Панамера', popular:false, aliases:['панамера','panamera','панамэра'], body:'Хэтчбек',
        gens:[
          { name:'970', ru:'1', years:[2009,2016], body:['Хэтчбек'],
            engines:[{vol:3.6,hp:300,fuel:'Бензин'},{vol:4.8,hp:520,fuel:'Бензин'},{vol:3.0,hp:250,fuel:'Дизель'}],
            gearbox:['Робот','Автомат'], drive:['Задний','Полный'], price:[2200000,4500000] },
          { name:'971', ru:'2', years:[2016,2023], body:['Хэтчбек','Универсал'],
            engines:[{vol:2.9,hp:440,fuel:'Бензин'},{vol:4.0,hp:550,fuel:'Бензин'},{vol:4.0,hp:422,fuel:'Дизель'}],
            gearbox:['Робот'], drive:['Задний','Полный'], price:[6000000,13000000] }
        ] },
      { id:'911', name:'911', ru:'911', popular:false, aliases:['911','девять один один','porsche 911','каррера','carrera'], body:'Купе',
        gens:[
          { name:'997', ru:'997', years:[2004,2012], body:['Купе','Кабриолет'],
            engines:[{vol:3.6,hp:345,fuel:'Бензин'},{vol:3.8,hp:530,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Задний','Полный'], price:[3500000,8000000] },
          { name:'992', ru:'992', years:[2019,2026], body:['Купе','Кабриолет'],
            engines:[{vol:3.0,hp:385,fuel:'Бензин'},{vol:3.8,hp:650,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Задний','Полный'], price:[12000000,25000000] }
        ] },
      { id:'cayman', name:'Cayman / Boxster', ru:'Кайман', popular:false, aliases:['кайман','cayman','бокстер','boxster','718'], body:'Купе',
        gens:[
          { name:'981', ru:'981', years:[2012,2016], body:['Купе','Кабриолет'],
            engines:[{vol:2.7,hp:275,fuel:'Бензин'},{vol:3.4,hp:340,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Задний'], price:[2600000,5000000] },
          { name:'982', ru:'718', years:[2016,2026], body:['Купе','Кабриолет'],
            engines:[{vol:2.0,hp:300,fuel:'Бензин'},{vol:2.5,hp:365,fuel:'Бензин'},{vol:4.0,hp:500,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Задний'], price:[5000000,11000000] }
        ] },
      { id:'taycan', name:'Taycan', ru:'Тайкан', popular:false, aliases:['тайкан','taycan','тайкaн'], body:'Седан',
        gens:[
          { name:'J1', ru:'1', years:[2019,2026], body:['Седан','Универсал'],
            engines:[{hp:408,fuel:'Электро'},{hp:571,fuel:'Электро'},{hp:761,fuel:'Электро'}], batteryKwh:[79,105], rangeKm:[380,590],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[8000000,18000000] }
        ] }
    ] },

  { id:'opel', name:'Opel', ru:'Опель', country:'de', popular:false, aliases:['опель','opel','опел'],
    models:[
      { id:'astra', name:'Astra', ru:'Астра', popular:false, aliases:['астра','astra','астрa','астра h','астра j'], body:'Хэтчбек',
        gens:[
          { name:'H', ru:'H', years:[2004,2014], body:['Хэтчбек','Седан','Универсал'],
            engines:[{vol:1.4,hp:90,fuel:'Бензин'},{vol:1.6,hp:115,fuel:'Бензин'},{vol:1.8,hp:140,fuel:'Бензин'},{vol:1.7,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,750000] },
          { name:'J', ru:'J', years:[2009,2018], body:['Хэтчбек','Седан','Универсал'],
            engines:[{vol:1.4,hp:140,fuel:'Бензин'},{vol:1.6,hp:170,fuel:'Бензин'},{vol:2.0,hp:165,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1300000] }
        ] },
      { id:'insignia', name:'Insignia', ru:'Инсигния', popular:false, aliases:['инсигния','insignia','инсигниа'], body:'Седан',
        gens:[
          { name:'A', ru:'A', years:[2008,2017], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:250,fuel:'Бензин'},{vol:2.0,hp:170,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[600000,1300000] },
          { name:'B', ru:'B', years:[2017,2022], body:['Седан','Универсал'],
            engines:[{vol:1.5,hp:165,fuel:'Бензин'},{vol:2.0,hp:260,fuel:'Бензин'},{vol:2.0,hp:170,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1400000,2600000] }
        ] },
      { id:'vectra', name:'Vectra', ru:'Вектра', popular:false, aliases:['вектра','vectra','вектрa'], body:'Седан',
        gens:[
          { name:'C', ru:'C', years:[2002,2008], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:105,fuel:'Бензин'},{vol:1.8,hp:140,fuel:'Бензин'},{vol:2.2,hp:155,fuel:'Бензин'},{vol:1.9,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[280000,600000] }
        ] },
      { id:'zafira', name:'Zafira', ru:'Зафира', popular:false, aliases:['зафира','zafira','зафирa'], body:'Минивэн',
        gens:[
          { name:'B', ru:'B', years:[2005,2014], body:['Минивэн'],
            engines:[{vol:1.6,hp:115,fuel:'Бензин'},{vol:1.8,hp:140,fuel:'Бензин'},{vol:1.9,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,750000] }
        ] },
      { id:'corsa', name:'Corsa', ru:'Корса', popular:false, aliases:['корса','corsa','корсa'], body:'Хэтчбек',
        gens:[
          { name:'D', ru:'D', years:[2006,2014], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:65,fuel:'Бензин'},{vol:1.2,hp:80,fuel:'Бензин'},{vol:1.4,hp:100,fuel:'Бензин'},{vol:1.3,hp:75,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[300000,650000] }
        ] },
      { id:'mokka', name:'Mokka', ru:'Мокка', popular:false, aliases:['мокка','mokka','мока'], body:'Кроссовер',
        gens:[
          { name:'J13', ru:'1', years:[2012,2019], body:['Кроссовер'],
            engines:[{vol:1.4,hp:140,fuel:'Бензин'},{vol:1.8,hp:140,fuel:'Бензин'},{vol:1.7,hp:130,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[800000,1600000] }
        ] },
      { id:'vivaro', name:'Vivaro', ru:'Виваро', popular:false, aliases:['виваро','vivaro','вивара'], body:'Фургон',
        gens:[
          { name:'B', ru:'2', years:[2014,2019], body:['Фургон','Минивэн'],
            engines:[{vol:1.6,hp:120,fuel:'Дизель'},{vol:1.6,hp:145,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Передний'], price:[900000,1900000] }
        ] }
    ] },

  { id:'skoda', name:'Skoda', ru:'Шкода', country:'eu', popular:false, aliases:['шкода','skoda','шкодa','щкода'],
    models:[
      { id:'octavia', name:'Octavia', ru:'Октавия', popular:false, aliases:['октавия','октавиа','octavia','октаха','а5','а7'], body:'Хэтчбек',
        gens:[
          { name:'A5', ru:'A5', years:[2004,2013], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.4,hp:122,fuel:'Бензин'},{vol:1.6,hp:102,fuel:'Бензин'},{vol:1.8,hp:152,fuel:'Бензин'},{vol:1.9,hp:105,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний','Полный'], price:[450000,950000] },
          { name:'A7', ru:'A7', years:[2013,2020], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.2,hp:110,fuel:'Бензин'},{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:230,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1000000,2200000] },
          { name:'A8', ru:'A8', years:[2019,2026], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.0,hp:110,fuel:'Бензин'},{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2200000,4200000] }
        ] },
      { id:'superb', name:'Superb', ru:'Суперб', popular:false, aliases:['суперб','superb','суперп'], body:'Седан',
        gens:[
          { name:'B6', ru:'2', years:[2008,2015], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:125,fuel:'Бензин'},{vol:1.8,hp:160,fuel:'Бензин'},{vol:3.6,hp:260,fuel:'Бензин'},{vol:2.0,hp:170,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[600000,1300000] },
          { name:'B8', ru:'3', years:[2015,2023], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:280,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1600000,3200000] }
        ] },
      { id:'rapid', name:'Rapid', ru:'Рапид', popular:false, aliases:['рапид','rapid','рапиид'], body:'Хэтчбек',
        gens:[
          { name:'NH', ru:'1', years:[2012,2020], body:['Хэтчбек','Седан'],
            engines:[{vol:1.2,hp:105,fuel:'Бензин'},{vol:1.4,hp:125,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[700000,1400000] }
        ] },
      { id:'fabia', name:'Fabia', ru:'Фабия', popular:false, aliases:['фабия','фабиа','fabia','фабя'], body:'Хэтчбек',
        gens:[
          { name:'NJ', ru:'3', years:[2014,2021], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.0,hp:110,fuel:'Бензин'},{vol:1.2,hp:110,fuel:'Бензин'},{vol:1.4,hp:105,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[800000,1600000] }
        ] },
      { id:'kodiaq', name:'Kodiaq', ru:'Кодиак', popular:false, aliases:['кодиак','kodiaq','кодьяк'], body:'Кроссовер',
        gens:[
          { name:'NS', ru:'1', years:[2016,2023], body:['Кроссовер'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[2000000,3800000] }
        ] },
      { id:'karoq', name:'Karoq', ru:'Карок', popular:false, aliases:['карок','karoq','карог'], body:'Кроссовер',
        gens:[
          { name:'NU', ru:'1', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:1.0,hp:115,fuel:'Бензин'},{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[1900000,3600000] }
        ] },
      { id:'yeti', name:'Yeti', ru:'Йети', popular:false, aliases:['йети','ети','yeti','йетти'], body:'Кроссовер',
        gens:[
          { name:'5L', ru:'1', years:[2009,2018], body:['Кроссовер'],
            engines:[{vol:1.2,hp:105,fuel:'Бензин'},{vol:1.4,hp:125,fuel:'Бензин'},{vol:1.8,hp:152,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[700000,1500000] }
        ] }
    ] },

  { id:'hyundai', name:'Hyundai', ru:'Хендай', country:'kr', popular:true, aliases:['хендай','хундай','хюндай','hyundai','хёндэ','хундэ'],
    models:[
      { id:'sonata', name:'Sonata', ru:'Соната', popular:true, aliases:['соната','sonata','саната','соната нф','yf','lf','dn8'], body:'Седан',
        gens:[
          { name:'NF', ru:'5', years:[2004,2010], body:['Седан'],
            engines:[{vol:2.0,hp:145,fuel:'Бензин'},{vol:2.4,hp:174,fuel:'Бензин'},{vol:3.3,hp:233,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[400000,800000] },
          { name:'YF', ru:'6', years:[2009,2014], body:['Седан'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:271,fuel:'Бензин'},{vol:2.4,hp:178,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[650000,1300000] },
          { name:'LF', ru:'7', years:[2014,2019], body:['Седан'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.4,hp:188,fuel:'Бензин'},{vol:2.0,hp:194,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1100000,2000000] },
          { name:'DN8', ru:'8', years:[2019,2026], body:['Седан'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:160,fuel:'Бензин'},{vol:2.5,hp:191,fuel:'Бензин'},{vol:2.0,hp:195,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2000000,3600000] }
        ] },
      { id:'elantra', name:'Elantra', ru:'Элантра', popular:true, aliases:['элантра','elantra','аванте','avante','эланта','ад','cn7'], body:'Седан',
        gens:[
          { name:'MD', ru:'5', years:[2010,2016], body:['Седан'],
            engines:[{vol:1.6,hp:132,fuel:'Бензин'},{vol:1.8,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[550000,1100000] },
          { name:'AD', ru:'6', years:[2015,2020], body:['Седан'],
            engines:[{vol:1.6,hp:128,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:1.6,hp:204,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[1000000,1900000] },
          { name:'CN7', ru:'7', years:[2020,2026], body:['Седан'],
            engines:[{vol:1.6,hp:123,fuel:'Бензин'},{vol:2.0,hp:149,fuel:'Бензин'},{vol:1.6,hp:141,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор','Робот'], drive:['Передний'], price:[1900000,3400000] }
        ] },
      { id:'tucson', name:'Tucson', ru:'Туссан', popular:true, aliases:['туссан','туксон','tucson','тусан','ix35','нх4'], body:'Кроссовер',
        gens:[
          { name:'LM ix35', ru:'2', years:[2009,2015], body:['Кроссовер'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.4,hp:175,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[800000,1600000] },
          { name:'TL', ru:'3', years:[2015,2020], body:['Кроссовер'],
            engines:[{vol:1.6,hp:177,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:185,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний','Полный'], price:[1500000,2800000] },
          { name:'NX4', ru:'4', years:[2020,2026], body:['Кроссовер'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:156,fuel:'Бензин'},{vol:2.5,hp:190,fuel:'Бензин'},{vol:1.6,hp:230,fuel:'Гибрид'}],
            gearbox:['Автомат','Робот'], drive:['Передний','Полный'], price:[2800000,5000000] }
        ] },
      { id:'santa-fe', name:'Santa Fe', ru:'Санта Фе', popular:false, aliases:['санта фе','сантафе','santa fe','санта','дм','тм'], body:'Кроссовер',
        gens:[
          { name:'CM', ru:'2', years:[2006,2012], body:['Кроссовер'],
            engines:[{vol:2.4,hp:174,fuel:'Бензин'},{vol:2.7,hp:189,fuel:'Бензин'},{vol:2.2,hp:197,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[700000,1400000] },
          { name:'DM', ru:'3', years:[2012,2018], body:['Кроссовер'],
            engines:[{vol:2.0,hp:235,fuel:'Бензин'},{vol:2.4,hp:175,fuel:'Бензин'},{vol:2.2,hp:200,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1400000,2600000] },
          { name:'TM', ru:'4', years:[2018,2023], body:['Кроссовер'],
            engines:[{vol:2.5,hp:180,fuel:'Бензин'},{vol:2.5,hp:281,fuel:'Бензин'},{vol:2.2,hp:200,fuel:'Дизель'},{vol:1.6,hp:230,fuel:'Гибрид'}],
            gearbox:['Автомат','Робот'], drive:['Передний','Полный'], price:[2800000,5000000] }
        ] },
      { id:'accent', name:'Accent / Solaris', ru:'Акцент', popular:true, aliases:['акцент','аксент','accent','солярис','solaris','верна'], body:'Седан',
        gens:[
          { name:'MC', ru:'3', years:[2005,2011], body:['Седан','Хэтчбек'],
            engines:[{vol:1.4,hp:97,fuel:'Бензин'},{vol:1.6,hp:112,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,700000] },
          { name:'RB', ru:'4', years:[2010,2017], body:['Седан','Хэтчбек'],
            engines:[{vol:1.4,hp:107,fuel:'Бензин'},{vol:1.6,hp:123,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1200000] },
          { name:'HC', ru:'5', years:[2017,2026], body:['Седан'],
            engines:[{vol:1.4,hp:100,fuel:'Бензин'},{vol:1.6,hp:123,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний'], price:[1200000,2200000] }
        ] },
      { id:'grandeur', name:'Grandeur', ru:'Грандер', popular:false, aliases:['грандер','грандеур','grandeur','азера','azera','hg','ig'], body:'Седан',
        gens:[
          { name:'TG', ru:'4', years:[2005,2011], body:['Седан'],
            engines:[{vol:2.4,hp:178,fuel:'Бензин'},{vol:2.7,hp:192,fuel:'Бензин'},{vol:3.3,hp:233,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[500000,1000000] },
          { name:'HG', ru:'5', years:[2011,2016], body:['Седан'],
            engines:[{vol:2.4,hp:180,fuel:'Бензин'},{vol:3.0,hp:270,fuel:'Бензин'},{vol:2.4,hp:204,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[900000,1700000] },
          { name:'IG', ru:'6', years:[2016,2022], body:['Седан'],
            engines:[{vol:2.5,hp:198,fuel:'Бензин'},{vol:3.3,hp:290,fuel:'Бензин'},{vol:2.4,hp:190,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1800000,3400000] }
        ] },
      { id:'creta', name:'Creta', ru:'Крета', popular:false, aliases:['крета','creta','ix25','крэта'], body:'Кроссовер',
        gens:[
          { name:'GS', ru:'1', years:[2014,2021], body:['Кроссовер'],
            engines:[{vol:1.6,hp:123,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:1.6,hp:128,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1100000,2000000] },
          { name:'SU2', ru:'2', years:[2020,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:115,fuel:'Бензин'},{vol:1.4,hp:140,fuel:'Бензин'},{vol:1.5,hp:116,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний'], price:[2000000,3200000] }
        ] },
      { id:'palisade', name:'Palisade', ru:'Палисад', popular:false, aliases:['палисад','palisade','палисейд'], body:'Кроссовер',
        gens:[
          { name:'LX2', ru:'1', years:[2018,2025], body:['Кроссовер'],
            engines:[{vol:3.5,hp:295,fuel:'Бензин'},{vol:2.2,hp:202,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[3200000,6000000] }
        ] },
      { id:'staria', name:'Staria / Starex', ru:'Стария', popular:false, aliases:['стария','старекс','starex','staria','гранд старекс','h1'], body:'Минивэн',
        gens:[
          { name:'TQ Starex', ru:'2', years:[2007,2021], body:['Минивэн','Фургон'],
            engines:[{vol:2.4,hp:173,fuel:'Бензин'},{vol:2.5,hp:175,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[900000,2400000] },
          { name:'US4', ru:'1', years:[2021,2026], body:['Минивэн'],
            engines:[{vol:3.5,hp:272,fuel:'Бензин'},{vol:2.2,hp:177,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[3200000,5500000] }
        ] },
      { id:'kona', name:'Kona', ru:'Кона', popular:false, aliases:['кона','kona','конa','кауай'], body:'Кроссовер',
        gens:[
          { name:'OS', ru:'1', years:[2017,2023], body:['Кроссовер'],
            engines:[{vol:1.6,hp:177,fuel:'Бензин'},{vol:2.0,hp:149,fuel:'Бензин'},{vol:1.6,hp:141,fuel:'Гибрид'}],
            gearbox:['Автомат','Робот'], drive:['Передний','Полный'], price:[1600000,2900000] },
          { name:'SX2', ru:'2', years:[2023,2026], body:['Кроссовер'],
            engines:[{vol:1.6,hp:198,fuel:'Бензин'},{vol:2.0,hp:149,fuel:'Бензин'},{vol:1.6,hp:141,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор','Робот'], drive:['Передний','Полный'], price:[2800000,4500000] }
        ] },
      { id:'ioniq5', name:'Ioniq 5', ru:'Ионик 5', popular:false, aliases:['ионик 5','ioniq 5','ioniq5','ионик5'], body:'Кроссовер',
        gens:[
          { name:'NE', ru:'1', years:[2021,2026], body:['Кроссовер'],
            engines:[{hp:170,fuel:'Электро'},{hp:229,fuel:'Электро'},{hp:325,fuel:'Электро'}], batteryKwh:[58,84], rangeKm:[350,570],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3000000,5500000] }
        ] },
      { id:'i30', name:'i30', ru:'и30', popular:false, aliases:['и30','i30','ай тридцать'], body:'Хэтчбек',
        gens:[
          { name:'GD', ru:'2', years:[2011,2017], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.4,hp:100,fuel:'Бензин'},{vol:1.6,hp:130,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1200000] },
          { name:'PD', ru:'3', years:[2016,2026], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.0,hp:120,fuel:'Бензин'},{vol:1.4,hp:140,fuel:'Бензин'},{vol:2.0,hp:275,fuel:'Бензин'},{vol:1.6,hp:136,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[1400000,2800000] }
        ] },
      { id:'getz', name:'Getz', ru:'Гетц', popular:false, aliases:['гетц','getz','гец','гетс'], body:'Хэтчбек',
        gens:[
          { name:'TB', ru:'1', years:[2002,2011], body:['Хэтчбек'],
            engines:[{vol:1.1,hp:66,fuel:'Бензин'},{vol:1.4,hp:97,fuel:'Бензин'},{vol:1.6,hp:105,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[280000,600000] }
        ] },
      { id:'porter', name:'Porter', ru:'Портер', popular:false, aliases:['портер','porter','портэр','h100'], body:'Пикап',
        gens:[
          { name:'HR', ru:'2', years:[2004,2026], body:['Пикап','Фургон'],
            engines:[{vol:2.5,hp:126,fuel:'Дизель'},{vol:2.6,hp:80,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[600000,1900000] }
        ] },
      { id:'h1', name:'H-1', ru:'Аш-1', popular:false, aliases:['аш1','h1','h-1','старекс h1'], body:'Минивэн',
        gens:[
          { name:'TQ', ru:'2', years:[2007,2021], body:['Минивэн','Фургон'],
            engines:[{vol:2.4,hp:173,fuel:'Бензин'},{vol:2.5,hp:170,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[900000,2400000] }
        ] }
    ] },

  { id:'kia', name:'Kia', ru:'Киа', country:'kr', popular:true, aliases:['киа','кия','kia','кийа'],
    models:[
      { id:'k5', name:'K5 / Optima', ru:'К5', popular:true, aliases:['к5','k5','оптима','optima','кия к5','dl3'], body:'Седан',
        gens:[
          { name:'TF', ru:'3', years:[2010,2015], body:['Седан'],
            engines:[{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:274,fuel:'Бензин'},{vol:2.4,hp:180,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[700000,1400000] },
          { name:'JF', ru:'4', years:[2015,2020], body:['Седан','Универсал'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.4,hp:188,fuel:'Бензин'},{vol:2.0,hp:205,fuel:'Гибрид'}],
            gearbox:['Автомат','Робот'], drive:['Передний'], price:[1300000,2400000] },
          { name:'DL3', ru:'5', years:[2019,2026], body:['Седан'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:160,fuel:'Бензин'},{vol:2.5,hp:194,fuel:'Бензин'},{vol:2.0,hp:195,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2200000,4000000] }
        ] },
      { id:'sportage', name:'Sportage', ru:'Спортейдж', popular:true, aliases:['спортейдж','спортаж','sportage','спортедж','ql','nq5'], body:'Кроссовер',
        gens:[
          { name:'SL', ru:'3', years:[2010,2016], body:['Кроссовер'],
            engines:[{vol:1.6,hp:135,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:184,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[900000,1700000] },
          { name:'QL', ru:'4', years:[2015,2021], body:['Кроссовер'],
            engines:[{vol:1.6,hp:177,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:2.0,hp:185,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний','Полный'], price:[1600000,3000000] },
          { name:'NQ5', ru:'5', years:[2021,2026], body:['Кроссовер'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:156,fuel:'Бензин'},{vol:2.5,hp:194,fuel:'Бензин'},{vol:1.6,hp:230,fuel:'Гибрид'}],
            gearbox:['Автомат','Робот'], drive:['Передний','Полный'], price:[3000000,5200000] }
        ] },
      { id:'rio', name:'Rio', ru:'Рио', popular:true, aliases:['рио','rio','рия','к2'], body:'Седан',
        gens:[
          { name:'JB', ru:'2', years:[2005,2011], body:['Седан','Хэтчбек'],
            engines:[{vol:1.4,hp:97,fuel:'Бензин'},{vol:1.6,hp:112,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,700000] },
          { name:'UB', ru:'3', years:[2011,2017], body:['Седан','Хэтчбек'],
            engines:[{vol:1.4,hp:107,fuel:'Бензин'},{vol:1.6,hp:123,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1200000] },
          { name:'YB', ru:'4', years:[2017,2026], body:['Седан','Хэтчбек'],
            engines:[{vol:1.4,hp:100,fuel:'Бензин'},{vol:1.6,hp:123,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний'], price:[1200000,2200000] }
        ] },
      { id:'sorento', name:'Sorento', ru:'Соренто', popular:false, aliases:['соренто','sorento','сорэнто','мq4'], body:'Кроссовер',
        gens:[
          { name:'XM', ru:'2', years:[2009,2014], body:['Кроссовер'],
            engines:[{vol:2.4,hp:175,fuel:'Бензин'},{vol:3.5,hp:277,fuel:'Бензин'},{vol:2.2,hp:197,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[800000,1600000] },
          { name:'UM', ru:'3', years:[2014,2020], body:['Кроссовер'],
            engines:[{vol:2.4,hp:188,fuel:'Бензин'},{vol:3.3,hp:249,fuel:'Бензин'},{vol:2.2,hp:200,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1700000,3200000] },
          { name:'MQ4', ru:'4', years:[2020,2026], body:['Кроссовер'],
            engines:[{vol:2.5,hp:281,fuel:'Бензин'},{vol:3.5,hp:294,fuel:'Бензин'},{vol:2.2,hp:202,fuel:'Дизель'},{vol:1.6,hp:230,fuel:'Гибрид'}],
            gearbox:['Автомат','Робот'], drive:['Передний','Полный'], price:[3500000,6500000] }
        ] },
      { id:'cerato', name:'Cerato / K3', ru:'Церато', popular:false, aliases:['церато','серато','cerato','к3','k3','форте','forte'], body:'Седан',
        gens:[
          { name:'YD', ru:'3', years:[2012,2018], body:['Седан'],
            engines:[{vol:1.6,hp:130,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[700000,1400000] },
          { name:'BD', ru:'4', years:[2018,2026], body:['Седан'],
            engines:[{vol:1.6,hp:128,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:1.6,hp:204,fuel:'Бензин'}],
            gearbox:['Автомат','Вариатор','Робот'], drive:['Передний'], price:[1600000,3000000] }
        ] },
      { id:'carnival', name:'Carnival', ru:'Карнивал', popular:false, aliases:['карнивал','carnival','карнавал','седона','sedona','ka4'], body:'Минивэн',
        gens:[
          { name:'YP', ru:'3', years:[2014,2020], body:['Минивэн'],
            engines:[{vol:3.3,hp:249,fuel:'Бензин'},{vol:2.2,hp:200,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1600000,3000000] },
          { name:'KA4', ru:'4', years:[2020,2026], body:['Минивэн'],
            engines:[{vol:3.5,hp:294,fuel:'Бензин'},{vol:2.2,hp:202,fuel:'Дизель'},{vol:1.6,hp:245,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[3600000,6500000] }
        ] },
      { id:'seltos', name:'Seltos', ru:'Селтос', popular:false, aliases:['селтос','seltos','сельтос'], body:'Кроссовер',
        gens:[
          { name:'SP2', ru:'1', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:1.6,hp:177,fuel:'Бензин'},{vol:2.0,hp:149,fuel:'Бензин'},{vol:1.6,hp:136,fuel:'Дизель'}],
            gearbox:['Автомат','Вариатор','Робот'], drive:['Передний','Полный'], price:[2200000,3800000] }
        ] },
      { id:'soul', name:'Soul', ru:'Соул', popular:false, aliases:['соул','soul','сол','соуль'], body:'Хэтчбек',
        gens:[
          { name:'PS', ru:'2', years:[2013,2019], body:['Хэтчбек'],
            engines:[{vol:1.6,hp:132,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:1.6,hp:128,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[800000,1600000] },
          { name:'SK3', ru:'3', years:[2018,2026], body:['Хэтчбек'],
            engines:[{vol:1.6,hp:123,fuel:'Бензин'},{vol:2.0,hp:149,fuel:'Бензин'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний'], price:[1600000,2900000] }
        ] },
      { id:'mohave', name:'Mohave', ru:'Мохав', popular:false, aliases:['мохав','мохаве','mohave','borrego','боррего'], body:'Внедорожник',
        gens:[
          { name:'HM', ru:'1', years:[2008,2020], body:['Внедорожник'],
            engines:[{vol:3.0,hp:250,fuel:'Дизель'},{vol:3.8,hp:276,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1300000,3600000] }
        ] },
      { id:'picanto', name:'Picanto', ru:'Пиканто', popular:false, aliases:['пиканто','picanto','морнинг','morning'], body:'Хэтчбек',
        gens:[
          { name:'TA', ru:'2', years:[2011,2017], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:69,fuel:'Бензин'},{vol:1.2,hp:85,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[450000,900000] },
          { name:'JA', ru:'3', years:[2017,2026], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:67,fuel:'Бензин'},{vol:1.2,hp:84,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[900000,1700000] }
        ] },
      { id:'stinger', name:'Stinger', ru:'Стингер', popular:false, aliases:['стингер','stinger','стингэр'], body:'Хэтчбек',
        gens:[
          { name:'CK', ru:'1', years:[2017,2023], body:['Хэтчбек'],
            engines:[{vol:2.0,hp:247,fuel:'Бензин'},{vol:2.5,hp:304,fuel:'Бензин'},{vol:3.3,hp:370,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2600000,4800000] }
        ] },
      { id:'ev6', name:'EV6', ru:'ЕВ6', popular:false, aliases:['ев6','ev6','ив шесть','киа ев6'], body:'Кроссовер',
        gens:[
          { name:'CV', ru:'1', years:[2021,2026], body:['Кроссовер'],
            engines:[{hp:170,fuel:'Электро'},{hp:229,fuel:'Электро'},{hp:325,fuel:'Электро'},{hp:585,fuel:'Электро'}], batteryKwh:[58,84], rangeKm:[350,580],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3200000,6500000] }
        ] },
      { id:'k8', name:'K8 / Cadenza', ru:'К8', popular:false, aliases:['к8','k8','каденза','cadenza','к7','k7'], body:'Седан',
        gens:[
          { name:'YG K7', ru:'2', years:[2016,2021], body:['Седан'],
            engines:[{vol:2.5,hp:198,fuel:'Бензин'},{vol:3.0,hp:266,fuel:'Бензин'},{vol:2.4,hp:190,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[1800000,3200000] },
          { name:'GL3 K8', ru:'1', years:[2021,2026], body:['Седан'],
            engines:[{vol:2.5,hp:198,fuel:'Бензин'},{vol:3.5,hp:300,fuel:'Бензин'},{vol:1.6,hp:230,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний'], price:[3200000,5500000] }
        ] },
      { id:'bongo', name:'Bongo', ru:'Бонго', popular:false, aliases:['бонго','bongo','бонга','к2500'], body:'Пикап',
        gens:[
          { name:'PU', ru:'3', years:[2004,2026], body:['Пикап','Фургон'],
            engines:[{vol:2.5,hp:126,fuel:'Дизель'},{vol:2.9,hp:123,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[700000,2200000] }
        ] }
    ] },

  { id:'genesis', name:'Genesis', ru:'Дженезис', country:'kr', popular:false, aliases:['дженезис','генезис','genesis','генесис'],
    models:[
      { id:'g80', name:'G80', ru:'Джи80', popular:false, aliases:['г80','g80','дженезис г80'], body:'Седан',
        gens:[
          { name:'DH', ru:'1', years:[2013,2020], body:['Седан'],
            engines:[{vol:3.3,hp:282,fuel:'Бензин'},{vol:3.8,hp:315,fuel:'Бензин'},{vol:5.0,hp:425,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1600000,3000000] },
          { name:'RG3', ru:'2', years:[2020,2026], body:['Седан'],
            engines:[{vol:2.5,hp:304,fuel:'Бензин'},{vol:3.5,hp:380,fuel:'Бензин'},{vol:2.2,hp:210,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4000000,7000000] }
        ] },
      { id:'g70', name:'G70', ru:'Джи70', popular:false, aliases:['г70','g70','дженезис г70'], body:'Седан',
        gens:[
          { name:'IK', ru:'1', years:[2017,2026], body:['Седан'],
            engines:[{vol:2.0,hp:255,fuel:'Бензин'},{vol:2.5,hp:304,fuel:'Бензин'},{vol:3.3,hp:370,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2600000,4800000] }
        ] },
      { id:'g90', name:'G90', ru:'Джи90', popular:false, aliases:['г90','g90','eq900','дженезис г90'], body:'Седан',
        gens:[
          { name:'HI', ru:'1', years:[2015,2022], body:['Седан'],
            engines:[{vol:3.3,hp:370,fuel:'Бензин'},{vol:3.8,hp:315,fuel:'Бензин'},{vol:5.0,hp:425,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2800000,5000000] },
          { name:'RS4', ru:'2', years:[2022,2026], body:['Седан'],
            engines:[{vol:3.5,hp:380,fuel:'Бензин'},{vol:3.5,hp:415,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Полный'], price:[7000000,11000000] }
        ] },
      { id:'gv80', name:'GV80', ru:'ДжиВи80', popular:false, aliases:['гв80','gv80','дженезис гв80'], body:'Кроссовер',
        gens:[
          { name:'JX1', ru:'1', years:[2020,2026], body:['Кроссовер','Купе'],
            engines:[{vol:2.5,hp:304,fuel:'Бензин'},{vol:3.5,hp:380,fuel:'Бензин'},{vol:3.0,hp:278,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[5000000,9000000] }
        ] },
      { id:'gv70', name:'GV70', ru:'ДжиВи70', popular:false, aliases:['гв70','gv70','дженезис гв70'], body:'Кроссовер',
        gens:[
          { name:'JK1', ru:'1', years:[2020,2026], body:['Кроссовер'],
            engines:[{vol:2.5,hp:304,fuel:'Бензин'},{vol:3.5,hp:380,fuel:'Бензин'},{vol:2.2,hp:210,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[4200000,7500000] }
        ] },
      { id:'gv60', name:'GV60', ru:'ДжиВи60', popular:false, aliases:['гв60','gv60','дженезис гв60'], body:'Кроссовер',
        gens:[
          { name:'JW1', ru:'1', years:[2021,2026], body:['Кроссовер'],
            engines:[{hp:229,fuel:'Электро'},{hp:320,fuel:'Электро'},{hp:490,fuel:'Электро'}], batteryKwh:[77,77], rangeKm:[400,470],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4500000,7000000] }
        ] }
    ] },

  { id:'ssangyong', name:'SsangYong', ru:'Санг Ёнг', country:'kr', popular:false, aliases:['санг ёнг','ссангйонг','ssangyong','сангйонг','саньенг','кг мобилити'],
    models:[
      { id:'rexton', name:'Rexton', ru:'Рекстон', popular:false, aliases:['рекстон','rexton','ректон'], body:'Внедорожник',
        gens:[
          { name:'Y200', ru:'1', years:[2001,2017], body:['Внедорожник'],
            engines:[{vol:2.7,hp:165,fuel:'Дизель'},{vol:3.2,hp:220,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[500000,1200000] },
          { name:'Y400', ru:'2', years:[2017,2026], body:['Внедорожник'],
            engines:[{vol:2.2,hp:181,fuel:'Дизель'},{vol:2.0,hp:225,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2200000,4200000] }
        ] },
      { id:'actyon', name:'Actyon', ru:'Актион', popular:false, aliases:['актион','актиён','actyon','экшн'], body:'Кроссовер',
        gens:[
          { name:'C100', ru:'1', years:[2005,2011], body:['Кроссовер','Пикап'],
            engines:[{vol:2.0,hp:141,fuel:'Дизель'},{vol:2.3,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[450000,900000] },
          { name:'C200', ru:'2', years:[2010,2018], body:['Кроссовер'],
            engines:[{vol:2.0,hp:149,fuel:'Дизель'},{vol:2.0,hp:149,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[700000,1400000] }
        ] },
      { id:'kyron', name:'Kyron', ru:'Кайрон', popular:false, aliases:['кайрон','kyron','каирон'], body:'Внедорожник',
        gens:[
          { name:'D100', ru:'1', years:[2005,2015], body:['Внедорожник'],
            engines:[{vol:2.0,hp:141,fuel:'Дизель'},{vol:2.3,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[450000,950000] }
        ] },
      { id:'musso', name:'Musso', ru:'Муссо', popular:false, aliases:['муссо','musso','мусо'], body:'Пикап',
        gens:[
          { name:'Q200', ru:'2', years:[2018,2026], body:['Пикап'],
            engines:[{vol:2.2,hp:181,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[2200000,3800000] }
        ] },
      { id:'korando', name:'Korando', ru:'Корандо', popular:false, aliases:['корандо','korando','карандо'], body:'Кроссовер',
        gens:[
          { name:'C200', ru:'3', years:[2010,2019], body:['Кроссовер'],
            engines:[{vol:2.0,hp:149,fuel:'Дизель'},{vol:2.0,hp:149,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[700000,1500000] }
        ] },
      { id:'tivoli', name:'Tivoli', ru:'Тиволи', popular:false, aliases:['тиволи','tivoli','тивали'], body:'Кроссовер',
        gens:[
          { name:'X100', ru:'1', years:[2015,2026], body:['Кроссовер'],
            engines:[{vol:1.6,hp:128,fuel:'Бензин'},{vol:1.6,hp:115,fuel:'Дизель'},{vol:1.5,hp:163,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1300000,2600000] }
        ] }
    ] },

  { id:'daewoo', name:'Daewoo', ru:'Дэу', country:'kr', popular:false, aliases:['дэу','деу','daewoo','дэво'],
    models:[
      { id:'nexia', name:'Nexia', ru:'Нексия', popular:true, aliases:['нексия','нексиа','nexia','нэксия'], body:'Седан',
        gens:[
          { name:'N100', ru:'1', years:[1995,2008], body:['Седан','Хэтчбек'],
            engines:[{vol:1.5,hp:75,fuel:'Бензин'},{vol:1.5,hp:80,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[180000,400000] },
          { name:'N150', ru:'2', years:[2008,2016], body:['Седан'],
            engines:[{vol:1.5,hp:80,fuel:'Бензин'},{vol:1.6,hp:109,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[300000,600000] }
        ] },
      { id:'matiz', name:'Matiz', ru:'Матиз', popular:true, aliases:['матиз','matiz','матис','матизик'], body:'Хэтчбек',
        gens:[
          { name:'M100', ru:'1', years:[1998,2008], body:['Хэтчбек'],
            engines:[{vol:0.8,hp:51,fuel:'Бензин'},{vol:1.0,hp:64,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[180000,380000] },
          { name:'M200', ru:'2', years:[2005,2015], body:['Хэтчбек'],
            engines:[{vol:0.8,hp:51,fuel:'Бензин'},{vol:1.0,hp:67,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[280000,550000] }
        ] },
      { id:'lanos', name:'Lanos', ru:'Ланос', popular:false, aliases:['ланос','lanos','ланас','сенс'], body:'Седан',
        gens:[
          { name:'T100', ru:'1', years:[1997,2009], body:['Седан','Хэтчбек'],
            engines:[{vol:1.4,hp:75,fuel:'Бензин'},{vol:1.5,hp:86,fuel:'Бензин'},{vol:1.6,hp:106,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[180000,400000] }
        ] },
      { id:'gentra', name:'Gentra', ru:'Джентра', popular:false, aliases:['джентра','gentra','гентра'], body:'Седан',
        gens:[
          { name:'T250', ru:'1', years:[2005,2016], body:['Седан'],
            engines:[{vol:1.5,hp:107,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,700000] }
        ] },
      { id:'nubira', name:'Nubira', ru:'Нубира', popular:false, aliases:['нубира','nubira','нубиро'], body:'Седан',
        gens:[
          { name:'J200', ru:'3', years:[2003,2008], body:['Седан','Универсал'],
            engines:[{vol:1.4,hp:94,fuel:'Бензин'},{vol:1.6,hp:109,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[220000,450000] }
        ] },
      { id:'damas', name:'Damas', ru:'Дамас', popular:false, aliases:['дамас','damas','дамаз'], body:'Минивэн',
        gens:[
          { name:'Damas', ru:'1', years:[1991,2026], body:['Минивэн','Фургон'],
            engines:[{vol:0.8,hp:38,fuel:'Бензин'},{vol:0.8,hp:52,fuel:'Газ/Бензин'}],
            gearbox:['Механика'], drive:['Задний'], price:[300000,750000] }
        ] },
      { id:'tico', name:'Tico', ru:'Тико', popular:false, aliases:['тико','tico','тика'], body:'Хэтчбек',
        gens:[
          { name:'Tico', ru:'1', years:[1991,2001], body:['Хэтчбек'],
            engines:[{vol:0.8,hp:41,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[120000,280000] }
        ] }
    ] },

  { id:'chevrolet', name:'Chevrolet', ru:'Шевроле', country:'us', popular:false, aliases:['шевроле','шеврале','chevrolet','шевик','шеви'],
    models:[
      { id:'cobalt', name:'Cobalt', ru:'Кобальт', popular:true, aliases:['кобальт','кобалт','cobalt','равон р4'], body:'Седан',
        gens:[
          { name:'T250', ru:'2', years:[2011,2026], body:['Седан'],
            engines:[{vol:1.5,hp:106,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[700000,1500000] }
        ] },
      { id:'lacetti', name:'Lacetti', ru:'Лачетти', popular:true, aliases:['лачетти','лачети','lacetti','лачет','джентра х'], body:'Седан',
        gens:[
          { name:'J200', ru:'1', years:[2002,2013], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.4,hp:94,fuel:'Бензин'},{vol:1.6,hp:109,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,750000] }
        ] },
      { id:'cruze', name:'Cruze', ru:'Круз', popular:false, aliases:['круз','крузе','cruze','крус'], body:'Седан',
        gens:[
          { name:'J300', ru:'1', years:[2009,2016], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:109,fuel:'Бензин'},{vol:1.8,hp:141,fuel:'Бензин'},{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1200000] },
          { name:'J400', ru:'2', years:[2016,2023], body:['Седан','Хэтчбек'],
            engines:[{vol:1.4,hp:153,fuel:'Бензин'},{vol:1.6,hp:136,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[1200000,2200000] }
        ] },
      { id:'malibu', name:'Malibu', ru:'Малибу', popular:false, aliases:['малибу','malibu','малибy'], body:'Седан',
        gens:[
          { name:'8', ru:'8', years:[2012,2016], body:['Седан'],
            engines:[{vol:2.0,hp:167,fuel:'Бензин'},{vol:2.4,hp:167,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[700000,1400000] },
          { name:'9', ru:'9', years:[2015,2024], body:['Седан'],
            engines:[{vol:1.5,hp:163,fuel:'Бензин'},{vol:2.0,hp:253,fuel:'Бензин'},{vol:1.8,hp:182,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний'], price:[1600000,3000000] }
        ] },
      { id:'captiva', name:'Captiva', ru:'Каптива', popular:false, aliases:['каптива','captiva','каптиво'], body:'Кроссовер',
        gens:[
          { name:'C100', ru:'1', years:[2006,2018], body:['Кроссовер'],
            engines:[{vol:2.4,hp:136,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[600000,1400000] }
        ] },
      { id:'spark', name:'Spark', ru:'Спарк', popular:false, aliases:['спарк','spark','спaрк','равон р2'], body:'Хэтчбек',
        gens:[
          { name:'M300', ru:'2', years:[2009,2015], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:68,fuel:'Бензин'},{vol:1.2,hp:81,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,700000] },
          { name:'M400', ru:'3', years:[2015,2022], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:75,fuel:'Бензин'},{vol:1.4,hp:98,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[700000,1400000] }
        ] },
      { id:'aveo', name:'Aveo', ru:'Авео', popular:false, aliases:['авео','aveo','авэо','равон р3'], body:'Седан',
        gens:[
          { name:'T250', ru:'1', years:[2006,2011], body:['Седан','Хэтчбек'],
            engines:[{vol:1.2,hp:84,fuel:'Бензин'},{vol:1.4,hp:101,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[300000,650000] },
          { name:'T300', ru:'2', years:[2011,2020], body:['Седан','Хэтчбек'],
            engines:[{vol:1.2,hp:86,fuel:'Бензин'},{vol:1.4,hp:100,fuel:'Бензин'},{vol:1.6,hp:115,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1200000] }
        ] },
      { id:'tahoe', name:'Tahoe', ru:'Тахо', popular:false, aliases:['тахо','tahoe','тахоэ','тахое'], body:'Внедорожник',
        gens:[
          { name:'GMT900', ru:'3', years:[2006,2014], body:['Внедорожник'],
            engines:[{vol:5.3,hp:324,fuel:'Бензин'},{vol:6.2,hp:409,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1400000,2800000] },
          { name:'K2XX', ru:'4', years:[2014,2020], body:['Внедорожник'],
            engines:[{vol:5.3,hp:355,fuel:'Бензин'},{vol:6.2,hp:426,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2800000,5000000] },
          { name:'T1XX', ru:'5', years:[2020,2026], body:['Внедорожник'],
            engines:[{vol:5.3,hp:355,fuel:'Бензин'},{vol:6.2,hp:426,fuel:'Бензин'},{vol:3.0,hp:277,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[5500000,10000000] }
        ] },
      { id:'suburban', name:'Suburban', ru:'Субурбан', popular:false, aliases:['субурбан','suburban','сабурбан'], body:'Внедорожник',
        gens:[
          { name:'K2XX', ru:'11', years:[2014,2020], body:['Внедорожник'],
            engines:[{vol:5.3,hp:355,fuel:'Бензин'},{vol:6.2,hp:426,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3000000,5500000] }
        ] },
      { id:'equinox', name:'Equinox', ru:'Эквинокс', popular:false, aliases:['эквинокс','equinox','экуинокс'], body:'Кроссовер',
        gens:[
          { name:'3', ru:'3', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:170,fuel:'Бензин'},{vol:2.0,hp:252,fuel:'Бензин'},{vol:1.6,hp:137,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1900000,3600000] }
        ] },
      { id:'camaro', name:'Camaro', ru:'Камаро', popular:false, aliases:['камаро','camaro','камара'], body:'Купе',
        gens:[
          { name:'5', ru:'5', years:[2009,2015], body:['Купе','Кабриолет'],
            engines:[{vol:3.6,hp:323,fuel:'Бензин'},{vol:6.2,hp:432,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[1600000,3200000] },
          { name:'6', ru:'6', years:[2015,2024], body:['Купе','Кабриолет'],
            engines:[{vol:2.0,hp:275,fuel:'Бензин'},{vol:3.6,hp:340,fuel:'Бензин'},{vol:6.2,hp:461,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[3000000,6000000] }
        ] },
      { id:'trailblazer', name:'TrailBlazer', ru:'Трейлблейзер', popular:false, aliases:['трейлблейзер','trailblazer','трайлблейзер'], body:'Внедорожник',
        gens:[
          { name:'GMT360', ru:'1', years:[2001,2009], body:['Внедорожник'],
            engines:[{vol:4.2,hp:275,fuel:'Бензин'},{vol:5.3,hp:305,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[600000,1300000] }
        ] }
    ] },

  { id:'ford', name:'Ford', ru:'Форд', country:'us', popular:false, aliases:['форд','ford','фордик'],
    models:[
      { id:'focus', name:'Focus', ru:'Фокус', popular:false, aliases:['фокус','focus','фокусник','фокус 2','фокус 3'], body:'Хэтчбек',
        gens:[
          { name:'2', ru:'2', years:[2004,2011], body:['Хэтчбек','Седан','Универсал'],
            engines:[{vol:1.4,hp:80,fuel:'Бензин'},{vol:1.6,hp:100,fuel:'Бензин'},{vol:2.0,hp:145,fuel:'Бензин'},{vol:1.8,hp:115,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[400000,850000] },
          { name:'3', ru:'3', years:[2011,2018], body:['Хэтчбек','Седан','Универсал'],
            engines:[{vol:1.0,hp:125,fuel:'Бензин'},{vol:1.6,hp:125,fuel:'Бензин'},{vol:2.0,hp:150,fuel:'Бензин'},{vol:1.5,hp:120,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[800000,1600000] },
          { name:'4', ru:'4', years:[2018,2026], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.0,hp:125,fuel:'Бензин'},{vol:1.5,hp:182,fuel:'Бензин'},{vol:2.3,hp:280,fuel:'Бензин'},{vol:1.5,hp:120,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[1800000,3400000] }
        ] },
      { id:'mondeo', name:'Mondeo', ru:'Мондео', popular:false, aliases:['мондео','mondeo','мандео'], body:'Седан',
        gens:[
          { name:'4', ru:'4', years:[2007,2014], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:125,fuel:'Бензин'},{vol:2.0,hp:200,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[500000,1100000] },
          { name:'5', ru:'5', years:[2014,2022], body:['Седан','Универсал'],
            engines:[{vol:1.5,hp:160,fuel:'Бензин'},{vol:2.0,hp:240,fuel:'Бензин'},{vol:2.0,hp:187,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1300000,2600000] }
        ] },
      { id:'fusion', name:'Fusion', ru:'Фьюжн', popular:false, aliases:['фьюжн','фьюжен','fusion','фюжн'], body:'Седан',
        gens:[
          { name:'2', ru:'2', years:[2012,2020], body:['Седан'],
            engines:[{vol:1.5,hp:181,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.0,hp:188,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[1100000,2400000] }
        ] },
      { id:'explorer', name:'Explorer', ru:'Эксплорер', popular:false, aliases:['эксплорер','explorer','експлорер','эксплоер'], body:'Внедорожник',
        gens:[
          { name:'4', ru:'4', years:[2005,2010], body:['Внедорожник'],
            engines:[{vol:4.0,hp:210,fuel:'Бензин'},{vol:4.6,hp:295,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[700000,1400000] },
          { name:'5', ru:'5', years:[2010,2019], body:['Кроссовер'],
            engines:[{vol:2.0,hp:240,fuel:'Бензин'},{vol:2.3,hp:249,fuel:'Бензин'},{vol:3.5,hp:249,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1500000,3000000] },
          { name:'6', ru:'6', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:2.3,hp:300,fuel:'Бензин'},{vol:3.0,hp:365,fuel:'Бензин'},{vol:3.3,hp:322,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3500000,6500000] }
        ] },
      { id:'kuga', name:'Kuga / Escape', ru:'Куга', popular:false, aliases:['куга','kuga','эскейп','escape'], body:'Кроссовер',
        gens:[
          { name:'2', ru:'2', years:[2012,2019], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:1.6,hp:182,fuel:'Бензин'},{vol:2.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1000000,2200000] },
          { name:'3', ru:'3', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'},{vol:2.5,hp:225,fuel:'Гибрид'}],
            gearbox:['Автомат','Вариатор'], drive:['Передний','Полный'], price:[2400000,4200000] }
        ] },
      { id:'f150', name:'F-150', ru:'Ф-150', popular:false, aliases:['ф150','f150','f-150','эф 150','форд ф150'], body:'Пикап',
        gens:[
          { name:'13', ru:'13', years:[2014,2020], body:['Пикап'],
            engines:[{vol:2.7,hp:325,fuel:'Бензин'},{vol:3.5,hp:375,fuel:'Бензин'},{vol:5.0,hp:395,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2400000,5000000] },
          { name:'14', ru:'14', years:[2020,2026], body:['Пикап'],
            engines:[{vol:2.7,hp:325,fuel:'Бензин'},{vol:3.5,hp:400,fuel:'Бензин'},{vol:5.0,hp:400,fuel:'Бензин'},{vol:3.5,hp:436,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[5000000,9500000] }
        ] },
      { id:'transit', name:'Transit', ru:'Транзит', popular:false, aliases:['транзит','transit','транзид'], body:'Фургон',
        gens:[
          { name:'3', ru:'3', years:[2000,2014], body:['Фургон','Минивэн'],
            engines:[{vol:2.2,hp:140,fuel:'Дизель'},{vol:2.4,hp:137,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Передний','Задний'], price:[600000,1500000] },
          { name:'4', ru:'4', years:[2013,2026], body:['Фургон','Минивэн'],
            engines:[{vol:2.0,hp:170,fuel:'Дизель'},{vol:2.2,hp:155,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Задний','Полный'], price:[1600000,4000000] }
        ] },
      { id:'ranger', name:'Ranger', ru:'Рейнджер', popular:false, aliases:['рейнджер','ranger','ренджер','рэнжер'], body:'Пикап',
        gens:[
          { name:'T6', ru:'3', years:[2011,2022], body:['Пикап'],
            engines:[{vol:2.2,hp:160,fuel:'Дизель'},{vol:3.2,hp:200,fuel:'Дизель'},{vol:2.5,hp:166,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1600000,3600000] }
        ] },
      { id:'edge', name:'Edge', ru:'Эдж', popular:false, aliases:['эдж','edge','едж'], body:'Кроссовер',
        gens:[
          { name:'2', ru:'2', years:[2014,2024], body:['Кроссовер'],
            engines:[{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.7,hp:315,fuel:'Бензин'},{vol:3.5,hp:280,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1900000,3600000] }
        ] },
      { id:'mustang', name:'Mustang', ru:'Мустанг', popular:false, aliases:['мустанг','mustang','мустанк'], body:'Купе',
        gens:[
          { name:'5', ru:'5', years:[2004,2014], body:['Купе','Кабриолет'],
            engines:[{vol:3.7,hp:305,fuel:'Бензин'},{vol:5.0,hp:412,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[1400000,3000000] },
          { name:'6', ru:'6', years:[2014,2023], body:['Купе','Кабриолет'],
            engines:[{vol:2.3,hp:317,fuel:'Бензин'},{vol:5.0,hp:450,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний'], price:[2800000,6000000] }
        ] },
      { id:'expedition', name:'Expedition', ru:'Экспедишн', popular:false, aliases:['экспедишн','expedition','експедишен'], body:'Внедорожник',
        gens:[
          { name:'4', ru:'4', years:[2017,2026], body:['Внедорожник'],
            engines:[{vol:3.5,hp:400,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4000000,7500000] }
        ] },
      { id:'fiesta', name:'Fiesta', ru:'Фиеста', popular:false, aliases:['фиеста','fiesta','фиэста'], body:'Хэтчбек',
        gens:[
          { name:'6', ru:'6', years:[2008,2019], body:['Хэтчбек','Седан'],
            engines:[{vol:1.0,hp:125,fuel:'Бензин'},{vol:1.4,hp:96,fuel:'Бензин'},{vol:1.6,hp:120,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[500000,1100000] }
        ] }
    ] },

  { id:'cadillac', name:'Cadillac', ru:'Кадиллак', country:'us', popular:false, aliases:['кадиллак','кадилак','cadillac','кэдди'],
    models:[
      { id:'escalade', name:'Escalade', ru:'Эскалейд', popular:false, aliases:['эскалейд','escalade','эскалад','ескалейд'], body:'Внедорожник',
        gens:[
          { name:'GMT900', ru:'3', years:[2006,2014], body:['Внедорожник'],
            engines:[{vol:6.2,hp:409,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1600000,3200000] },
          { name:'K2XX', ru:'4', years:[2014,2020], body:['Внедорожник'],
            engines:[{vol:6.2,hp:426,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3200000,6000000] },
          { name:'T1XX', ru:'5', years:[2020,2026], body:['Внедорожник'],
            engines:[{vol:6.2,hp:426,fuel:'Бензин'},{vol:3.0,hp:277,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[7000000,13000000] }
        ] },
      { id:'cts', name:'CTS', ru:'ЦТС', popular:false, aliases:['цтс','cts','кадиллак цтс'], body:'Седан',
        gens:[
          { name:'2', ru:'2', years:[2007,2014], body:['Седан','Купе','Универсал'],
            engines:[{vol:3.0,hp:270,fuel:'Бензин'},{vol:3.6,hp:318,fuel:'Бензин'},{vol:6.2,hp:564,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[800000,1800000] },
          { name:'3', ru:'3', years:[2013,2019], body:['Седан'],
            engines:[{vol:2.0,hp:276,fuel:'Бензин'},{vol:3.6,hp:340,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1600000,3000000] }
        ] },
      { id:'srx', name:'SRX', ru:'СРХ', popular:false, aliases:['срх','srx','кадиллак срх'], body:'Кроссовер',
        gens:[
          { name:'2', ru:'2', years:[2009,2016], body:['Кроссовер'],
            engines:[{vol:3.0,hp:265,fuel:'Бензин'},{vol:3.6,hp:314,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1000000,2000000] }
        ] },
      { id:'xt5', name:'XT5', ru:'ХТ5', popular:false, aliases:['хт5','xt5','кадиллак хт5'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2016,2024], body:['Кроссовер'],
            engines:[{vol:2.0,hp:238,fuel:'Бензин'},{vol:3.6,hp:314,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2200000,4200000] }
        ] },
      { id:'ats', name:'ATS', ru:'АТС', popular:false, aliases:['атс','ats','кадиллак атс'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2012,2019], body:['Седан','Купе'],
            engines:[{vol:2.0,hp:276,fuel:'Бензин'},{vol:2.5,hp:202,fuel:'Бензин'},{vol:3.6,hp:340,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[1300000,2600000] }
        ] },
      { id:'xt6', name:'XT6', ru:'ХТ6', popular:false, aliases:['хт6','xt6','кадиллак хт6'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:240,fuel:'Бензин'},{vol:3.6,hp:314,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[3800000,6500000] }
        ] }
    ] },

  { id:'jeep', name:'Jeep', ru:'Джип', country:'us', popular:false, aliases:['джип','jeep','жип'],
    models:[
      { id:'grand-cherokee', name:'Grand Cherokee', ru:'Гранд Чероки', popular:false, aliases:['гранд чероки','grand cherokee','чероки','wk2','грандчероки'], body:'Внедорожник',
        gens:[
          { name:'WK', ru:'3', years:[2004,2010], body:['Внедорожник'],
            engines:[{vol:3.7,hp:213,fuel:'Бензин'},{vol:4.7,hp:231,fuel:'Бензин'},{vol:5.7,hp:326,fuel:'Бензин'},{vol:3.0,hp:218,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[700000,1500000] },
          { name:'WK2', ru:'4', years:[2010,2021], body:['Внедорожник'],
            engines:[{vol:3.6,hp:286,fuel:'Бензин'},{vol:5.7,hp:352,fuel:'Бензин'},{vol:6.4,hp:468,fuel:'Бензин'},{vol:3.0,hp:250,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1800000,4200000] },
          { name:'WL', ru:'5', years:[2021,2026], body:['Внедорожник'],
            engines:[{vol:3.6,hp:293,fuel:'Бензин'},{vol:5.7,hp:357,fuel:'Бензин'},{vol:2.0,hp:380,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[5000000,9000000] }
        ] },
      { id:'wrangler', name:'Wrangler', ru:'Вранглер', popular:false, aliases:['вранглер','wrangler','рэнглер','вранглэр'], body:'Внедорожник',
        gens:[
          { name:'JK', ru:'3', years:[2006,2018], body:['Внедорожник'],
            engines:[{vol:3.6,hp:284,fuel:'Бензин'},{vol:3.8,hp:199,fuel:'Бензин'},{vol:2.8,hp:200,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[1400000,3000000] },
          { name:'JL', ru:'4', years:[2018,2026], body:['Внедорожник'],
            engines:[{vol:2.0,hp:272,fuel:'Бензин'},{vol:3.6,hp:285,fuel:'Бензин'},{vol:2.2,hp:200,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[3600000,7000000] }
        ] },
      { id:'cherokee', name:'Cherokee', ru:'Чероки', popular:false, aliases:['чероки','cherokee','чироки','либерти'], body:'Кроссовер',
        gens:[
          { name:'KL', ru:'5', years:[2013,2023], body:['Кроссовер'],
            engines:[{vol:2.0,hp:270,fuel:'Бензин'},{vol:2.4,hp:184,fuel:'Бензин'},{vol:3.2,hp:272,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[1600000,3200000] }
        ] },
      { id:'compass', name:'Compass', ru:'Компас', popular:false, aliases:['компас','compass','компасс'], body:'Кроссовер',
        gens:[
          { name:'MK', ru:'1', years:[2006,2016], body:['Кроссовер'],
            engines:[{vol:2.0,hp:156,fuel:'Бензин'},{vol:2.4,hp:170,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[600000,1300000] },
          { name:'MP', ru:'2', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:1.4,hp:150,fuel:'Бензин'},{vol:2.0,hp:170,fuel:'Дизель'},{vol:2.4,hp:180,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний','Полный'], price:[1900000,3600000] }
        ] },
      { id:'renegade', name:'Renegade', ru:'Ренегад', popular:false, aliases:['ренегад','renegade','ренегейд'], body:'Кроссовер',
        gens:[
          { name:'BU', ru:'1', years:[2014,2026], body:['Кроссовер'],
            engines:[{vol:1.0,hp:120,fuel:'Бензин'},{vol:1.4,hp:170,fuel:'Бензин'},{vol:2.0,hp:170,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний','Полный'], price:[1600000,3200000] }
        ] },
      { id:'patriot', name:'Patriot', ru:'Патриот Джип', popular:false, aliases:['джип патриот','jeep patriot','патриот джип'], body:'Кроссовер',
        gens:[
          { name:'MK74', ru:'1', years:[2007,2016], body:['Кроссовер'],
            engines:[{vol:2.0,hp:156,fuel:'Бензин'},{vol:2.4,hp:170,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний','Полный'], price:[600000,1300000] }
        ] }
    ] },

  { id:'dodge', name:'Dodge', ru:'Додж', country:'us', popular:false, aliases:['додж','dodge','додж'],
    models:[
      { id:'ram1500', name:'RAM 1500', ru:'РАМ 1500', popular:false, aliases:['рам 1500','ram 1500','рам','ram1500'], body:'Пикап',
        gens:[
          { name:'DS', ru:'4', years:[2009,2018], body:['Пикап'],
            engines:[{vol:3.6,hp:305,fuel:'Бензин'},{vol:5.7,hp:395,fuel:'Бензин'},{vol:3.0,hp:240,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1800000,3600000] },
          { name:'DT', ru:'5', years:[2018,2026], body:['Пикап'],
            engines:[{vol:3.6,hp:305,fuel:'Бензин'},{vol:5.7,hp:395,fuel:'Бензин'},{vol:6.2,hp:702,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4500000,9000000] }
        ] },
      { id:'charger', name:'Charger', ru:'Чарджер', popular:false, aliases:['чарджер','charger','чарджэр'], body:'Седан',
        gens:[
          { name:'LD', ru:'7', years:[2011,2023], body:['Седан'],
            engines:[{vol:3.6,hp:292,fuel:'Бензин'},{vol:5.7,hp:370,fuel:'Бензин'},{vol:6.4,hp:485,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1600000,4500000] }
        ] },
      { id:'challenger', name:'Challenger', ru:'Челленджер', popular:false, aliases:['челленджер','challenger','чэлленджер'], body:'Купе',
        gens:[
          { name:'LC', ru:'3', years:[2008,2023], body:['Купе'],
            engines:[{vol:3.6,hp:305,fuel:'Бензин'},{vol:5.7,hp:375,fuel:'Бензин'},{vol:6.2,hp:717,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[2200000,6500000] }
        ] },
      { id:'durango', name:'Durango', ru:'Дуранго', popular:false, aliases:['дуранго','durango','дюранго'], body:'Внедорожник',
        gens:[
          { name:'WD', ru:'3', years:[2010,2026], body:['Внедорожник'],
            engines:[{vol:3.6,hp:293,fuel:'Бензин'},{vol:5.7,hp:360,fuel:'Бензин'},{vol:6.4,hp:475,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2000000,5500000] }
        ] },
      { id:'caravan', name:'Grand Caravan', ru:'Гранд Караван', popular:false, aliases:['караван','caravan','гранд караван','вояджер'], body:'Минивэн',
        gens:[
          { name:'RT', ru:'5', years:[2007,2020], body:['Минивэн'],
            engines:[{vol:3.3,hp:175,fuel:'Бензин'},{vol:3.6,hp:283,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний'], price:[600000,1600000] }
        ] },
      { id:'journey', name:'Journey', ru:'Джорни', popular:false, aliases:['джорни','journey','джорней'], body:'Кроссовер',
        gens:[
          { name:'JC', ru:'1', years:[2008,2020], body:['Кроссовер'],
            engines:[{vol:2.4,hp:173,fuel:'Бензин'},{vol:3.6,hp:283,fuel:'Бензин'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[700000,1600000] }
        ] }
    ] },

  { id:'tesla', name:'Tesla', ru:'Тесла', country:'us', popular:false, aliases:['тесла','tesla','тэсла'],
    models:[
      { id:'model3', name:'Model 3', ru:'Модель 3', popular:true, aliases:['модель 3','model 3','model3','тесла 3','тесла модель 3'], body:'Седан',
        gens:[
          { name:'Model 3', ru:'1', years:[2017,2023], body:['Седан'],
            engines:[{hp:283,fuel:'Электро'},{hp:351,fuel:'Электро'},{hp:513,fuel:'Электро'}], batteryKwh:[50,82], rangeKm:[400,600],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2600000,4500000] },
          { name:'Highland', ru:'2', years:[2023,2026], body:['Седан'],
            engines:[{hp:283,fuel:'Электро'},{hp:394,fuel:'Электро'},{hp:460,fuel:'Электро'}], batteryKwh:[57,79], rangeKm:[430,700],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3800000,6000000] }
        ] },
      { id:'modely', name:'Model Y', ru:'Модель Y', popular:true, aliases:['модель у','model y','modely','тесла у','тесла модель игрек'], body:'Кроссовер',
        gens:[
          { name:'Model Y', ru:'1', years:[2020,2024], body:['Кроссовер'],
            engines:[{hp:299,fuel:'Электро'},{hp:384,fuel:'Электро'},{hp:456,fuel:'Электро'}], batteryKwh:[60,82], rangeKm:[420,600],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[3000000,5200000] },
          { name:'Juniper', ru:'2', years:[2025,2026], body:['Кроссовер'],
            engines:[{hp:299,fuel:'Электро'},{hp:384,fuel:'Электро'}], batteryKwh:[62,79], rangeKm:[450,620],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[4500000,6800000] }
        ] },
      { id:'models', name:'Model S', ru:'Модель S', popular:false, aliases:['модель с','model s','models','тесла с','тесла эс'], body:'Хэтчбек',
        gens:[
          { name:'Model S', ru:'1', years:[2012,2021], body:['Хэтчбек'],
            engines:[{hp:333,fuel:'Электро'},{hp:428,fuel:'Электро'},{hp:772,fuel:'Электро'}], batteryKwh:[60,100], rangeKm:[350,610],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2400000,5000000] },
          { name:'Plaid', ru:'2', years:[2021,2026], body:['Хэтчбек'],
            engines:[{hp:670,fuel:'Электро'},{hp:1020,fuel:'Электро'}], batteryKwh:[95,100], rangeKm:[560,650],
            gearbox:['Автомат'], drive:['Полный'], price:[6500000,11000000] }
        ] },
      { id:'modelx', name:'Model X', ru:'Модель X', popular:false, aliases:['модель х','model x','modelx','тесла икс'], body:'Кроссовер',
        gens:[
          { name:'Model X', ru:'1', years:[2015,2021], body:['Кроссовер'],
            engines:[{hp:423,fuel:'Электро'},{hp:772,fuel:'Электро'}], batteryKwh:[75,100], rangeKm:[380,540],
            gearbox:['Автомат'], drive:['Полный'], price:[3400000,6500000] },
          { name:'Plaid', ru:'2', years:[2021,2026], body:['Кроссовер'],
            engines:[{hp:670,fuel:'Электро'},{hp:1020,fuel:'Электро'}], batteryKwh:[95,100], rangeKm:[500,580],
            gearbox:['Автомат'], drive:['Полный'], price:[7000000,12000000] }
        ] },
      { id:'cybertruck', name:'Cybertruck', ru:'Кибертрак', popular:false, aliases:['кибертрак','cybertruck','сайбертрак'], body:'Пикап',
        gens:[
          { name:'Cybertruck', ru:'1', years:[2023,2026], body:['Пикап'],
            engines:[{hp:600,fuel:'Электро'},{hp:845,fuel:'Электро'}], batteryKwh:[123,123], rangeKm:[400,550],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[8000000,13000000] }
        ] }
    ] },

  { id:'land-rover', name:'Land Rover', ru:'Ленд Ровер', country:'eu', popular:false, aliases:['ленд ровер','лендровер','land rover','ровер','ленд'],
    models:[
      { id:'range-rover', name:'Range Rover', ru:'Рендж Ровер', popular:false, aliases:['рендж ровер','рендж','range rover','вог','vogue','рэндж'], body:'Внедорожник',
        gens:[
          { name:'L322', ru:'3', years:[2002,2012], body:['Внедорожник'],
            engines:[{vol:4.4,hp:306,fuel:'Бензин'},{vol:5.0,hp:510,fuel:'Бензин'},{vol:3.6,hp:272,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1400000,3200000] },
          { name:'L405', ru:'4', years:[2012,2021], body:['Внедорожник'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:5.0,hp:525,fuel:'Бензин'},{vol:4.4,hp:339,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3400000,7500000] },
          { name:'L460', ru:'5', years:[2021,2026], body:['Внедорожник'],
            engines:[{vol:3.0,hp:400,fuel:'Бензин'},{vol:4.4,hp:530,fuel:'Бензин'},{vol:3.0,hp:350,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[10000000,20000000] }
        ] },
      { id:'range-rover-sport', name:'Range Rover Sport', ru:'Рендж Ровер Спорт', popular:false, aliases:['рендж спорт','range rover sport','рровер спорт','рендж ровер спорт'], body:'Внедорожник',
        gens:[
          { name:'L320', ru:'1', years:[2005,2013], body:['Внедорожник'],
            engines:[{vol:4.2,hp:390,fuel:'Бензин'},{vol:5.0,hp:510,fuel:'Бензин'},{vol:3.0,hp:245,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1200000,2600000] },
          { name:'L494', ru:'2', years:[2013,2022], body:['Внедорожник'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:5.0,hp:575,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3000000,6500000] }
        ] },
      { id:'discovery', name:'Discovery', ru:'Дискавери', popular:false, aliases:['дискавери','discovery','диско','дискавэри'], body:'Внедорожник',
        gens:[
          { name:'L319', ru:'4', years:[2009,2016], body:['Внедорожник'],
            engines:[{vol:5.0,hp:375,fuel:'Бензин'},{vol:3.0,hp:249,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[1200000,2600000] },
          { name:'L462', ru:'5', years:[2017,2026], body:['Внедорожник'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:3.0,hp:306,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3400000,7000000] }
        ] },
      { id:'discovery-sport', name:'Discovery Sport', ru:'Дискавери Спорт', popular:false, aliases:['дискавери спорт','discovery sport','фрилендер 2','freelander'], body:'Кроссовер',
        gens:[
          { name:'L550', ru:'1', years:[2014,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:240,fuel:'Бензин'},{vol:2.0,hp:180,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2000000,4500000] }
        ] },
      { id:'defender', name:'Defender', ru:'Дефендер', popular:false, aliases:['дефендер','defender','дефэндер'], body:'Внедорожник',
        gens:[
          { name:'L316', ru:'1', years:[1990,2016], body:['Внедорожник'],
            engines:[{vol:2.2,hp:122,fuel:'Дизель'},{vol:2.4,hp:122,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Полный'], price:[1200000,3000000] },
          { name:'L663', ru:'2', years:[2019,2026], body:['Внедорожник'],
            engines:[{vol:2.0,hp:300,fuel:'Бензин'},{vol:3.0,hp:400,fuel:'Бензин'},{vol:5.0,hp:525,fuel:'Бензин'},{vol:3.0,hp:300,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[6000000,12000000] }
        ] },
      { id:'evoque', name:'Range Rover Evoque', ru:'Эвок', popular:false, aliases:['эвок','evoque','ивок','рендж эвок'], body:'Кроссовер',
        gens:[
          { name:'L538', ru:'1', years:[2011,2018], body:['Кроссовер'],
            engines:[{vol:2.0,hp:240,fuel:'Бензин'},{vol:2.2,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1400000,2800000] },
          { name:'L551', ru:'2', years:[2018,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:249,fuel:'Бензин'},{vol:2.0,hp:180,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[3200000,5800000] }
        ] },
      { id:'freelander', name:'Freelander', ru:'Фрилендер', popular:false, aliases:['фрилендер','freelander','фриландер'], body:'Кроссовер',
        gens:[
          { name:'L359', ru:'2', years:[2006,2014], body:['Кроссовер'],
            engines:[{vol:3.2,hp:233,fuel:'Бензин'},{vol:2.0,hp:240,fuel:'Бензин'},{vol:2.2,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[700000,1600000] }
        ] }
    ] },

  { id:'jaguar', name:'Jaguar', ru:'Ягуар', country:'eu', popular:false, aliases:['ягуар','jaguar','ягуaр'],
    models:[
      { id:'xf', name:'XF', ru:'ИксЭф', popular:false, aliases:['хф','xf','ягуар хф'], body:'Седан',
        gens:[
          { name:'X250', ru:'1', years:[2007,2015], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:240,fuel:'Бензин'},{vol:5.0,hp:510,fuel:'Бензин'},{vol:3.0,hp:275,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[900000,2000000] },
          { name:'X260', ru:'2', years:[2015,2024], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:250,fuel:'Бензин'},{vol:3.0,hp:380,fuel:'Бензин'},{vol:2.0,hp:180,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[2000000,4200000] }
        ] },
      { id:'xe', name:'XE', ru:'ИксИ', popular:false, aliases:['хе','xe','ягуар хе'], body:'Седан',
        gens:[
          { name:'X760', ru:'1', years:[2015,2024], body:['Седан'],
            engines:[{vol:2.0,hp:250,fuel:'Бензин'},{vol:3.0,hp:380,fuel:'Бензин'},{vol:2.0,hp:180,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1800000,3600000] }
        ] },
      { id:'f-pace', name:'F-Pace', ru:'Эф-Пейс', popular:false, aliases:['ф пейс','f-pace','фпейс','эфпейс'], body:'Кроссовер',
        gens:[
          { name:'X761', ru:'1', years:[2016,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:250,fuel:'Бензин'},{vol:3.0,hp:400,fuel:'Бензин'},{vol:5.0,hp:550,fuel:'Бензин'},{vol:2.0,hp:180,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2800000,6500000] }
        ] },
      { id:'xj', name:'XJ', ru:'ИксДжей', popular:false, aliases:['хж','xj','ягуар хж'], body:'Седан',
        gens:[
          { name:'X351', ru:'4', years:[2009,2019], body:['Седан'],
            engines:[{vol:3.0,hp:340,fuel:'Бензин'},{vol:5.0,hp:510,fuel:'Бензин'},{vol:3.0,hp:275,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Задний','Полный'], price:[1600000,3400000] }
        ] },
      { id:'f-type', name:'F-Type', ru:'Эф-Тайп', popular:false, aliases:['ф тайп','f-type','фтайп'], body:'Купе',
        gens:[
          { name:'X152', ru:'1', years:[2013,2024], body:['Купе','Кабриолет'],
            engines:[{vol:2.0,hp:300,fuel:'Бензин'},{vol:3.0,hp:400,fuel:'Бензин'},{vol:5.0,hp:575,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Задний','Полный'], price:[3500000,8000000] }
        ] },
      { id:'e-pace', name:'E-Pace', ru:'И-Пейс', popular:false, aliases:['е пейс','e-pace','епейс'], body:'Кроссовер',
        gens:[
          { name:'X540', ru:'1', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:249,fuel:'Бензин'},{vol:2.0,hp:180,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2400000,4500000] }
        ] }
    ] },

  { id:'volvo', name:'Volvo', ru:'Вольво', country:'eu', popular:false, aliases:['вольво','volvo','волво'],
    models:[
      { id:'xc90', name:'XC90', ru:'ИксСи90', popular:false, aliases:['хс90','xc90','иксэс 90','вольво хс90'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2002,2014], body:['Кроссовер'],
            engines:[{vol:2.5,hp:210,fuel:'Бензин'},{vol:3.2,hp:243,fuel:'Бензин'},{vol:2.4,hp:185,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[700000,1500000] },
          { name:'2', ru:'2', years:[2014,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:254,fuel:'Бензин'},{vol:2.0,hp:320,fuel:'Бензин'},{vol:2.0,hp:235,fuel:'Дизель'},{vol:2.0,hp:390,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Полный'], price:[2800000,6500000] }
        ] },
      { id:'xc60', name:'XC60', ru:'ИксСи60', popular:false, aliases:['хс60','xc60','иксэс 60','вольво хс60'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2008,2017], body:['Кроссовер'],
            engines:[{vol:2.0,hp:240,fuel:'Бензин'},{vol:3.0,hp:304,fuel:'Бензин'},{vol:2.4,hp:215,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[1100000,2200000] },
          { name:'2', ru:'2', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:2.0,hp:250,fuel:'Бензин'},{vol:2.0,hp:320,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2600000,5500000] }
        ] },
      { id:'xc40', name:'XC40', ru:'ИксСи40', popular:false, aliases:['хс40','xc40','иксэс 40','вольво хс40'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2017,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:163,fuel:'Бензин'},{vol:2.0,hp:249,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Автомат','Робот'], drive:['Передний','Полный'], price:[2200000,4500000] }
        ] },
      { id:'s60', name:'S60', ru:'ЭсШестьдесят', popular:false, aliases:['с60','s60','вольво с60'], body:'Седан',
        gens:[
          { name:'2', ru:'2', years:[2010,2018], body:['Седан'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.4,hp:215,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[900000,1800000] },
          { name:'3', ru:'3', years:[2018,2026], body:['Седан'],
            engines:[{vol:2.0,hp:250,fuel:'Бензин'},{vol:2.0,hp:310,fuel:'Бензин'},{vol:2.0,hp:405,fuel:'Гибрид'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2400000,4500000] }
        ] },
      { id:'s80', name:'S80', ru:'ЭсВосемьдесят', popular:false, aliases:['с80','s80','вольво с80'], body:'Седан',
        gens:[
          { name:'2', ru:'2', years:[2006,2016], body:['Седан'],
            engines:[{vol:2.5,hp:200,fuel:'Бензин'},{vol:3.2,hp:238,fuel:'Бензин'},{vol:2.4,hp:205,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[600000,1300000] }
        ] },
      { id:'s90', name:'S90', ru:'ЭсДевяносто', popular:false, aliases:['с90','s90','вольво с90'], body:'Седан',
        gens:[
          { name:'2', ru:'2', years:[2016,2026], body:['Седан','Универсал'],
            engines:[{vol:2.0,hp:254,fuel:'Бензин'},{vol:2.0,hp:320,fuel:'Бензин'},{vol:2.0,hp:235,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний','Полный'], price:[2600000,5000000] }
        ] },
      { id:'v40', name:'V40', ru:'ВиСорок', popular:false, aliases:['в40','v40','вольво в40'], body:'Хэтчбек',
        gens:[
          { name:'2', ru:'2', years:[2012,2019], body:['Хэтчбек'],
            engines:[{vol:1.6,hp:180,fuel:'Бензин'},{vol:2.0,hp:245,fuel:'Бензин'},{vol:2.0,hp:190,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[900000,1900000] }
        ] },
      { id:'v70', name:'V70 / XC70', ru:'ВиСемьдесят', popular:false, aliases:['в70','v70','xc70','хс70','вольво в70'], body:'Универсал',
        gens:[
          { name:'3', ru:'3', years:[2007,2016], body:['Универсал'],
            engines:[{vol:2.0,hp:203,fuel:'Бензин'},{vol:3.0,hp:304,fuel:'Бензин'},{vol:2.4,hp:215,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[700000,1600000] }
        ] }
    ] },

  { id:'renault', name:'Renault', ru:'Рено', country:'eu', popular:false, aliases:['рено','renault','ренаулт','ренo'],
    models:[
      { id:'logan', name:'Logan', ru:'Логан', popular:false, aliases:['логан','logan','логaн','логашка'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2004,2015], body:['Седан'],
            engines:[{vol:1.4,hp:75,fuel:'Бензин'},{vol:1.6,hp:102,fuel:'Бензин'},{vol:1.5,hp:86,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,750000] },
          { name:'2', ru:'2', years:[2012,2022], body:['Седан'],
            engines:[{vol:1.6,hp:82,fuel:'Бензин'},{vol:1.6,hp:113,fuel:'Бензин'},{vol:1.5,hp:90,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[700000,1400000] }
        ] },
      { id:'sandero', name:'Sandero', ru:'Сандеро', popular:false, aliases:['сандеро','sandero','сандера','степвей'], body:'Хэтчбек',
        gens:[
          { name:'2', ru:'2', years:[2012,2020], body:['Хэтчбек'],
            engines:[{vol:1.0,hp:73,fuel:'Бензин'},{vol:1.6,hp:102,fuel:'Бензин'},{vol:1.5,hp:90,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[700000,1400000] }
        ] },
      { id:'duster', name:'Duster', ru:'Дастер', popular:false, aliases:['дастер','duster','дустер'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2010,2021], body:['Кроссовер'],
            engines:[{vol:1.6,hp:114,fuel:'Бензин'},{vol:2.0,hp:143,fuel:'Бензин'},{vol:1.5,hp:109,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний','Полный'], price:[900000,1800000] },
          { name:'2', ru:'2', years:[2017,2024], body:['Кроссовер'],
            engines:[{vol:1.3,hp:150,fuel:'Бензин'},{vol:1.6,hp:114,fuel:'Бензин'},{vol:1.5,hp:115,fuel:'Дизель'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний','Полный'], price:[1600000,3000000] }
        ] },
      { id:'megane', name:'Megane', ru:'Меган', popular:false, aliases:['меган','megane','мегана','мэган'], body:'Хэтчбек',
        gens:[
          { name:'3', ru:'3', years:[2008,2016], body:['Хэтчбек','Седан','Универсал'],
            engines:[{vol:1.6,hp:106,fuel:'Бензин'},{vol:2.0,hp:265,fuel:'Бензин'},{vol:1.5,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор','Робот'], drive:['Передний'], price:[500000,1100000] },
          { name:'4', ru:'4', years:[2016,2023], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.2,hp:130,fuel:'Бензин'},{vol:1.6,hp:205,fuel:'Бензин'},{vol:1.5,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[1200000,2400000] }
        ] },
      { id:'kaptur', name:'Kaptur / Captur', ru:'Каптюр', popular:false, aliases:['каптюр','kaptur','captur','каптур'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2016,2022], body:['Кроссовер'],
            engines:[{vol:1.6,hp:114,fuel:'Бензин'},{vol:2.0,hp:143,fuel:'Бензин'},{vol:1.3,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Вариатор'], drive:['Передний','Полный'], price:[1200000,2400000] }
        ] },
      { id:'fluence', name:'Fluence', ru:'Флюенс', popular:false, aliases:['флюенс','fluence','флуенс'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2009,2017], body:['Седан'],
            engines:[{vol:1.6,hp:106,fuel:'Бензин'},{vol:2.0,hp:138,fuel:'Бензин'},{vol:1.5,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[500000,1000000] }
        ] },
      { id:'symbol', name:'Symbol', ru:'Символ', popular:false, aliases:['символ','symbol','симбол','клио седан'], body:'Седан',
        gens:[
          { name:'2', ru:'2', years:[2008,2013], body:['Седан'],
            engines:[{vol:1.4,hp:75,fuel:'Бензин'},{vol:1.6,hp:105,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[300000,650000] }
        ] },
      { id:'arkana', name:'Arkana', ru:'Аркана', popular:false, aliases:['аркана','arkana','арканa'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2019,2026], body:['Кроссовер'],
            engines:[{vol:1.3,hp:150,fuel:'Бензин'},{vol:1.6,hp:114,fuel:'Бензин'},{vol:1.6,hp:145,fuel:'Гибрид'}],
            gearbox:['Механика','Вариатор','Робот'], drive:['Передний','Полный'], price:[1900000,3400000] }
        ] }
    ] },

  { id:'peugeot', name:'Peugeot', ru:'Пежо', country:'eu', popular:false, aliases:['пежо','peugeot','пыжик','пежик'],
    models:[
      { id:'206', name:'206', ru:'206', popular:false, aliases:['206','пежо 206','двести шесть'], body:'Хэтчбек',
        gens:[
          { name:'1', ru:'1', years:[1998,2012], body:['Хэтчбек','Седан'],
            engines:[{vol:1.1,hp:60,fuel:'Бензин'},{vol:1.4,hp:75,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[220000,500000] }
        ] },
      { id:'207', name:'207', ru:'207', popular:false, aliases:['207','пежо 207','двести семь'], body:'Хэтчбек',
        gens:[
          { name:'1', ru:'1', years:[2006,2014], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.4,hp:95,fuel:'Бензин'},{vol:1.6,hp:120,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[300000,650000] }
        ] },
      { id:'308', name:'308', ru:'308', popular:false, aliases:['308','пежо 308','триста восемь'], body:'Хэтчбек',
        gens:[
          { name:'1', ru:'1', years:[2007,2014], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.4,hp:95,fuel:'Бензин'},{vol:1.6,hp:150,fuel:'Бензин'},{vol:1.6,hp:112,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[400000,850000] },
          { name:'2', ru:'2', years:[2013,2021], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.2,hp:130,fuel:'Бензин'},{vol:1.6,hp:270,fuel:'Бензин'},{vol:1.6,hp:120,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[900000,1900000] }
        ] },
      { id:'407', name:'407', ru:'407', popular:false, aliases:['407','пежо 407','четыреста семь'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2004,2011], body:['Седан','Универсал','Купе'],
            engines:[{vol:1.8,hp:125,fuel:'Бензин'},{vol:2.0,hp:140,fuel:'Бензин'},{vol:2.0,hp:136,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[300000,700000] }
        ] },
      { id:'508', name:'508', ru:'508', popular:false, aliases:['508','пежо 508','пятьсот восемь'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2010,2018], body:['Седан','Универсал'],
            engines:[{vol:1.6,hp:150,fuel:'Бензин'},{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[700000,1500000] },
          { name:'2', ru:'2', years:[2018,2026], body:['Седан','Универсал'],
            engines:[{vol:1.6,hp:225,fuel:'Бензин'},{vol:2.0,hp:180,fuel:'Дизель'}],
            gearbox:['Автомат'], drive:['Передний'], price:[2000000,3800000] }
        ] },
      { id:'3008', name:'3008', ru:'3008', popular:false, aliases:['3008','пежо 3008','три тысячи восемь'], body:'Кроссовер',
        gens:[
          { name:'1', ru:'1', years:[2009,2016], body:['Кроссовер'],
            engines:[{vol:1.6,hp:156,fuel:'Бензин'},{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1300000] },
          { name:'2', ru:'2', years:[2016,2023], body:['Кроссовер'],
            engines:[{vol:1.2,hp:130,fuel:'Бензин'},{vol:1.6,hp:180,fuel:'Бензин'},{vol:1.5,hp:130,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[1800000,3400000] }
        ] },
      { id:'301', name:'301', ru:'301', popular:false, aliases:['301','пежо 301','триста один'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2012,2022], body:['Седан'],
            engines:[{vol:1.2,hp:82,fuel:'Бензин'},{vol:1.6,hp:115,fuel:'Бензин'},{vol:1.6,hp:92,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1300000] }
        ] },
      { id:'partner', name:'Partner', ru:'Партнер', popular:false, aliases:['партнер','partner','партнёр','рифтер'], body:'Фургон',
        gens:[
          { name:'2', ru:'2', years:[2008,2018], body:['Фургон','Минивэн'],
            engines:[{vol:1.6,hp:110,fuel:'Бензин'},{vol:1.6,hp:92,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[500000,1200000] }
        ] }
    ] },

  { id:'citroen', name:'Citroen', ru:'Ситроен', country:'eu', popular:false, aliases:['ситроен','ситроэн','citroen','цитроен'],
    models:[
      { id:'c4', name:'C4', ru:'Ц4', popular:false, aliases:['ц4','c4','ситроен ц4','си четыре'], body:'Хэтчбек',
        gens:[
          { name:'1', ru:'1', years:[2004,2011], body:['Хэтчбек','Купе'],
            engines:[{vol:1.4,hp:88,fuel:'Бензин'},{vol:1.6,hp:110,fuel:'Бензин'},{vol:1.6,hp:109,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[300000,700000] },
          { name:'2', ru:'2', years:[2010,2018], body:['Хэтчбек','Седан'],
            engines:[{vol:1.6,hp:115,fuel:'Бензин'},{vol:1.6,hp:150,fuel:'Бензин'},{vol:1.6,hp:115,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1300000] }
        ] },
      { id:'c5', name:'C5', ru:'Ц5', popular:false, aliases:['ц5','c5','ситроен ц5','си пять'], body:'Седан',
        gens:[
          { name:'2', ru:'2', years:[2008,2017], body:['Седан','Универсал'],
            engines:[{vol:1.6,hp:150,fuel:'Бензин'},{vol:2.0,hp:143,fuel:'Бензин'},{vol:2.0,hp:163,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[450000,1000000] }
        ] },
      { id:'c3', name:'C3', ru:'Ц3', popular:false, aliases:['ц3','c3','ситроен ц3','си три'], body:'Хэтчбек',
        gens:[
          { name:'2', ru:'2', years:[2009,2016], body:['Хэтчбек'],
            engines:[{vol:1.2,hp:82,fuel:'Бензин'},{vol:1.4,hp:95,fuel:'Бензин'},{vol:1.6,hp:92,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[350000,750000] }
        ] },
      { id:'berlingo', name:'Berlingo', ru:'Берлинго', popular:false, aliases:['берлинго','berlingo','берлинга'], body:'Фургон',
        gens:[
          { name:'2', ru:'2', years:[2008,2018], body:['Фургон','Минивэн'],
            engines:[{vol:1.6,hp:110,fuel:'Бензин'},{vol:1.6,hp:92,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[500000,1200000] }
        ] },
      { id:'c-elysee', name:'C-Elysee', ru:'Ц-Элизе', popular:false, aliases:['элизе','c-elysee','ц элизе','целизе'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2012,2022], body:['Седан'],
            engines:[{vol:1.2,hp:82,fuel:'Бензин'},{vol:1.6,hp:115,fuel:'Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[600000,1300000] }
        ] },
      { id:'jumper', name:'Jumper', ru:'Джампер', popular:false, aliases:['джампер','jumper','джемпер','боксер'], body:'Фургон',
        gens:[
          { name:'3', ru:'3', years:[2006,2026], body:['Фургон'],
            engines:[{vol:2.2,hp:130,fuel:'Дизель'},{vol:3.0,hp:177,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Передний'], price:[900000,2800000] }
        ] }
    ] },

  { id:'fiat', name:'Fiat', ru:'Фиат', country:'eu', popular:false, aliases:['фиат','fiat','фият'],
    models:[
      { id:'albea', name:'Albea', ru:'Альбеа', popular:false, aliases:['альбеа','albea','альбея'], body:'Седан',
        gens:[
          { name:'1', ru:'1', years:[2002,2012], body:['Седан'],
            engines:[{vol:1.2,hp:80,fuel:'Бензин'},{vol:1.4,hp:77,fuel:'Бензин'},{vol:1.6,hp:103,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[220000,500000] }
        ] },
      { id:'doblo', name:'Doblo', ru:'Добло', popular:false, aliases:['добло','doblo','дабло'], body:'Фургон',
        gens:[
          { name:'2', ru:'2', years:[2010,2022], body:['Фургон','Минивэн'],
            engines:[{vol:1.4,hp:95,fuel:'Бензин'},{vol:1.6,hp:105,fuel:'Дизель'},{vol:1.3,hp:90,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[600000,1400000] }
        ] },
      { id:'ducato', name:'Ducato', ru:'Дукато', popular:false, aliases:['дукато','ducato','дуккато'], body:'Фургон',
        gens:[
          { name:'3', ru:'3', years:[2006,2026], body:['Фургон'],
            engines:[{vol:2.3,hp:130,fuel:'Дизель'},{vol:3.0,hp:177,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[900000,3000000] }
        ] },
      { id:'punto', name:'Punto', ru:'Пунто', popular:false, aliases:['пунто','punto','пунта'], body:'Хэтчбек',
        gens:[
          { name:'3', ru:'3', years:[2005,2018], body:['Хэтчбек'],
            engines:[{vol:1.2,hp:69,fuel:'Бензин'},{vol:1.4,hp:77,fuel:'Бензин'},{vol:1.3,hp:75,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[280000,600000] }
        ] },
      { id:'500', name:'500', ru:'500', popular:false, aliases:['500','фиат 500','пятьсот','чинквеченто'], body:'Хэтчбек',
        gens:[
          { name:'312', ru:'2', years:[2007,2024], body:['Хэтчбек','Кабриолет'],
            engines:[{vol:0.9,hp:85,fuel:'Бензин'},{vol:1.2,hp:69,fuel:'Бензин'},{vol:1.4,hp:100,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[600000,1400000] }
        ] },
      { id:'panda', name:'Panda', ru:'Панда', popular:false, aliases:['панда','panda','пандa'], body:'Хэтчбек',
        gens:[
          { name:'3', ru:'3', years:[2011,2026], body:['Хэтчбек'],
            engines:[{vol:0.9,hp:85,fuel:'Бензин'},{vol:1.2,hp:69,fuel:'Бензин'},{vol:1.3,hp:80,fuel:'Дизель'}],
            gearbox:['Механика','Робот'], drive:['Передний','Полный'], price:[600000,1400000] }
        ] }
    ] },

  { id:'lada', name:'Lada', ru:'Лада (ВАЗ)', country:'ru', popular:true, aliases:['лада','ваз','lada','жигули','автоваз'],
    models:[
      { id:'priora', name:'Priora', ru:'Приора', popular:true, aliases:['приора','priora','приорa','2170','приорка'], body:'Седан',
        gens:[
          { name:'2170', ru:'1', years:[2007,2018], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:87,fuel:'Бензин'},{vol:1.6,hp:98,fuel:'Бензин'},{vol:1.6,hp:106,fuel:'Бензин'}],
            gearbox:['Механика','Робот'], drive:['Передний'], price:[280000,650000] }
        ] },
      { id:'niva', name:'Niva', ru:'Нива', popular:true, aliases:['нива','niva','нива 4х4','2121','нива легенд','ваз 2121'], body:'Внедорожник',
        gens:[
          { name:'2121 / Legend', ru:'21214', years:[1977,2026], body:['Внедорожник'],
            engines:[{vol:1.7,hp:83,fuel:'Бензин'},{vol:1.7,hp:80,fuel:'Газ/Бензин'}],
            gearbox:['Механика'], drive:['Полный'], price:[350000,1200000] }
        ] },
      { id:'niva-travel', name:'Niva Travel', ru:'Нива Тревел', popular:false, aliases:['нива тревел','niva travel','шевроле нива','нива шевроле'], body:'Внедорожник',
        gens:[
          { name:'2123', ru:'1', years:[2002,2026], body:['Внедорожник'],
            engines:[{vol:1.7,hp:80,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Полный'], price:[500000,1600000] }
        ] },
      { id:'granta', name:'Granta', ru:'Гранта', popular:true, aliases:['гранта','granta','грантa','гранд'], body:'Седан',
        gens:[
          { name:'2190', ru:'1', years:[2011,2018], body:['Седан','Хэтчбек'],
            engines:[{vol:1.6,hp:87,fuel:'Бензин'},{vol:1.6,hp:106,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[350000,750000] },
          { name:'FL', ru:'2', years:[2018,2026], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:90,fuel:'Бензин'},{vol:1.6,hp:106,fuel:'Бензин'},{vol:1.6,hp:98,fuel:'Газ/Бензин'}],
            gearbox:['Механика','Автомат'], drive:['Передний'], price:[700000,1500000] }
        ] },
      { id:'vesta', name:'Vesta', ru:'Веста', popular:true, aliases:['веста','vesta','вестa','веста св'], body:'Седан',
        gens:[
          { name:'GFL', ru:'1', years:[2015,2026], body:['Седан','Универсал','Кроссовер'],
            engines:[{vol:1.6,hp:106,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Бензин'},{vol:1.6,hp:98,fuel:'Газ/Бензин'}],
            gearbox:['Механика','Вариатор','Робот'], drive:['Передний'], price:[900000,2000000] }
        ] },
      { id:'kalina', name:'Kalina', ru:'Калина', popular:false, aliases:['калина','kalina','калинa','1119'], body:'Хэтчбек',
        gens:[
          { name:'1118', ru:'1', years:[2004,2013], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.4,hp:89,fuel:'Бензин'},{vol:1.6,hp:81,fuel:'Бензин'},{vol:1.6,hp:98,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[220000,450000] },
          { name:'2192', ru:'2', years:[2013,2018], body:['Хэтчбек','Универсал'],
            engines:[{vol:1.6,hp:87,fuel:'Бензин'},{vol:1.6,hp:106,fuel:'Бензин'}],
            gearbox:['Механика','Автомат','Робот'], drive:['Передний'], price:[350000,700000] }
        ] },
      { id:'largus', name:'Largus', ru:'Ларгус', popular:false, aliases:['ларгус','largus','ларгуc'], body:'Универсал',
        gens:[
          { name:'R90', ru:'1', years:[2012,2026], body:['Универсал','Фургон'],
            engines:[{vol:1.6,hp:87,fuel:'Бензин'},{vol:1.6,hp:106,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[600000,1500000] }
        ] },
      { id:'xray', name:'XRAY', ru:'Иксрей', popular:false, aliases:['иксрей','xray','экс рей','х рей'], body:'Хэтчбек',
        gens:[
          { name:'GAB', ru:'1', years:[2015,2022], body:['Хэтчбек','Кроссовер'],
            engines:[{vol:1.6,hp:106,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор','Робот'], drive:['Передний'], price:[700000,1400000] }
        ] },
      { id:'2114', name:'2113-2115', ru:'Самара 2', popular:true, aliases:['2114','2115','четырка','пятнашка','самара','ваз 2114','девяносто девятая'], body:'Хэтчбек',
        gens:[
          { name:'2113-2115', ru:'2', years:[1997,2013], body:['Хэтчбек','Седан'],
            engines:[{vol:1.5,hp:78,fuel:'Бензин'},{vol:1.6,hp:81,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[180000,420000] }
        ] },
      { id:'2110', name:'2110-2112', ru:'Десятка', popular:true, aliases:['2110','2112','десятка','одиннадцатая','ваз 2110','девятка новая'], body:'Седан',
        gens:[
          { name:'2110-2112', ru:'1', years:[1995,2009], body:['Седан','Хэтчбек','Универсал'],
            engines:[{vol:1.5,hp:79,fuel:'Бензин'},{vol:1.6,hp:81,fuel:'Бензин'},{vol:1.6,hp:89,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[180000,400000] }
        ] },
      { id:'2109', name:'2108-2109', ru:'Девятка', popular:true, aliases:['2109','девятка','восьмерка','2108','ваз 2109','зубило'], body:'Хэтчбек',
        gens:[
          { name:'2108-21099', ru:'1', years:[1984,2004], body:['Хэтчбек','Седан'],
            engines:[{vol:1.3,hp:64,fuel:'Бензин'},{vol:1.5,hp:72,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[120000,320000] }
        ] },
      { id:'2107', name:'2101-2107', ru:'Классика', popular:true, aliases:['2107','копейка','семерка','2106','шестерка','классика','жигуль','ваз 2107'], body:'Седан',
        gens:[
          { name:'2101-2107', ru:'1', years:[1970,2012], body:['Седан','Универсал'],
            engines:[{vol:1.3,hp:64,fuel:'Бензин'},{vol:1.5,hp:71,fuel:'Бензин'},{vol:1.6,hp:75,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Задний'], price:[120000,350000] }
        ] },
      { id:'largus-cross', name:'Vesta Cross', ru:'Веста Кросс', popular:false, aliases:['веста кросс','vesta cross','веста св кросс'], body:'Универсал',
        gens:[
          { name:'GFL', ru:'1', years:[2017,2026], body:['Универсал','Кроссовер'],
            engines:[{vol:1.6,hp:106,fuel:'Бензин'},{vol:1.8,hp:122,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1100000,2100000] }
        ] }
    ] },

  { id:'gaz', name:'GAZ', ru:'ГАЗ', country:'ru', popular:false, aliases:['газ','gaz','газель','горьковский'],
    models:[
      { id:'gazelle', name:'Gazelle', ru:'Газель', popular:true, aliases:['газель','gazelle','газел','газелька','3302'], body:'Фургон',
        gens:[
          { name:'3302', ru:'1', years:[1994,2013], body:['Фургон','Пикап','Минивэн'],
            engines:[{vol:2.5,hp:100,fuel:'Бензин'},{vol:2.9,hp:107,fuel:'Бензин'},{vol:2.1,hp:95,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[350000,900000] },
          { name:'Next', ru:'Next', years:[2013,2026], body:['Фургон','Пикап','Минивэн'],
            engines:[{vol:2.7,hp:107,fuel:'Бензин'},{vol:2.8,hp:120,fuel:'Дизель'},{vol:2.7,hp:106,fuel:'Газ/Бензин'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[900000,2600000] }
        ] },
      { id:'sobol', name:'Sobol', ru:'Соболь', popular:false, aliases:['соболь','sobol','собол','2217'], body:'Минивэн',
        gens:[
          { name:'2217', ru:'1', years:[1998,2026], body:['Минивэн','Фургон'],
            engines:[{vol:2.5,hp:100,fuel:'Бензин'},{vol:2.7,hp:107,fuel:'Бензин'},{vol:2.8,hp:120,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[400000,1800000] }
        ] },
      { id:'volga-3110', name:'Volga 3110', ru:'Волга 3110', popular:false, aliases:['волга','3110','газ 3110','волга 3110'], body:'Седан',
        gens:[
          { name:'3110', ru:'1', years:[1997,2005], body:['Седан'],
            engines:[{vol:2.3,hp:150,fuel:'Бензин'},{vol:2.4,hp:137,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Задний'], price:[120000,320000] }
        ] },
      { id:'volga-31105', name:'Volga 31105', ru:'Волга 31105', popular:false, aliases:['31105','волга 31105','газ 31105'], body:'Седан',
        gens:[
          { name:'31105', ru:'1', years:[2004,2009], body:['Седан'],
            engines:[{vol:2.3,hp:137,fuel:'Бензин'},{vol:2.4,hp:137,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Задний'], price:[150000,380000] }
        ] },
      { id:'gazon', name:'GAZon Next', ru:'Газон Некст', popular:false, aliases:['газон','газон некст','gazon next','газ 3309'], body:'Фургон',
        gens:[
          { name:'C41', ru:'1', years:[2014,2026], body:['Фургон','Пикап'],
            engines:[{vol:4.4,hp:149,fuel:'Дизель'},{vol:3.8,hp:170,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[1800000,4500000] }
        ] }
    ] },

  { id:'uaz', name:'UAZ', ru:'УАЗ', country:'ru', popular:false, aliases:['уаз','uaz','ульяновский','уазик'],
    models:[
      { id:'patriot', name:'Patriot', ru:'Патриот', popular:false, aliases:['патриот','patriot','уаз патриот','патрик'], body:'Внедорожник',
        gens:[
          { name:'3163', ru:'1', years:[2005,2026], body:['Внедорожник'],
            engines:[{vol:2.7,hp:135,fuel:'Бензин'},{vol:2.7,hp:150,fuel:'Бензин'},{vol:2.2,hp:114,fuel:'Дизель'}],
            gearbox:['Механика','Автомат'], drive:['Полный'], price:[500000,2200000] }
        ] },
      { id:'hunter', name:'Hunter', ru:'Хантер', popular:false, aliases:['хантер','hunter','уаз хантер','469','козлик'], body:'Внедорожник',
        gens:[
          { name:'3151', ru:'1', years:[2003,2026], body:['Внедорожник'],
            engines:[{vol:2.7,hp:135,fuel:'Бензин'},{vol:2.4,hp:98,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Полный'], price:[400000,1500000] }
        ] },
      { id:'buhanka', name:'UAZ 452', ru:'Буханка', popular:false, aliases:['буханка','452','уаз 452','таблетка','2206','санитарка'], body:'Фургон',
        gens:[
          { name:'452', ru:'1', years:[1965,2026], body:['Фургон','Минивэн'],
            engines:[{vol:2.4,hp:92,fuel:'Бензин'},{vol:2.7,hp:112,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Полный'], price:[300000,1600000] }
        ] },
      { id:'pickup', name:'UAZ Pickup', ru:'УАЗ Пикап', popular:false, aliases:['уаз пикап','uaz pickup','пикап уаз','2363'], body:'Пикап',
        gens:[
          { name:'2363', ru:'1', years:[2008,2026], body:['Пикап'],
            engines:[{vol:2.7,hp:135,fuel:'Бензин'},{vol:2.2,hp:114,fuel:'Дизель'}],
            gearbox:['Механика'], drive:['Полный'], price:[600000,2000000] }
        ] },
      { id:'profi', name:'UAZ Profi', ru:'УАЗ Профи', popular:false, aliases:['профи','uaz profi','уаз профи'], body:'Пикап',
        gens:[
          { name:'Profi', ru:'1', years:[2017,2026], body:['Пикап','Фургон'],
            engines:[{vol:2.7,hp:150,fuel:'Бензин'},{vol:2.7,hp:149,fuel:'Газ/Бензин'}],
            gearbox:['Механика'], drive:['Задний','Полный'], price:[1200000,2400000] }
        ] }
    ] },

  { id:'moskvich', name:'Moskvich', ru:'Москвич', country:'ru', popular:false, aliases:['москвич','moskvich','москвичь','азлк'],
    models:[
      { id:'2141', name:'2141', ru:'2141', popular:false, aliases:['2141','москвич 2141','святогор','алеко'], body:'Хэтчбек',
        gens:[
          { name:'2141', ru:'1', years:[1986,2002], body:['Хэтчбек','Седан'],
            engines:[{vol:1.5,hp:72,fuel:'Бензин'},{vol:1.7,hp:85,fuel:'Бензин'},{vol:2.0,hp:113,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Передний'], price:[80000,250000] }
        ] },
      { id:'412', name:'412', ru:'412', popular:false, aliases:['412','москвич 412','москвич 408','ижак'], body:'Седан',
        gens:[
          { name:'412', ru:'1', years:[1967,1998], body:['Седан','Универсал'],
            engines:[{vol:1.5,hp:75,fuel:'Бензин'}],
            gearbox:['Механика'], drive:['Задний'], price:[60000,200000] }
        ] },
      { id:'moskvich3', name:'Москвич 3', ru:'Москвич 3', popular:false, aliases:['москвич 3','москвич3','moskvich 3'], body:'Кроссовер',
        gens:[
          { name:'3', ru:'1', years:[2022,2026], body:['Кроссовер'],
            engines:[{vol:1.5,hp:150,fuel:'Бензин'}],
            gearbox:['Механика','Вариатор'], drive:['Передний'], price:[1800000,2800000] }
        ] },
      { id:'moskvich6', name:'Москвич 6', ru:'Москвич 6', popular:false, aliases:['москвич 6','москвич6','moskvich 6'], body:'Седан',
        gens:[
          { name:'6', ru:'1', years:[2023,2026], body:['Седан'],
            engines:[{vol:1.5,hp:174,fuel:'Бензин'}],
            gearbox:['Робот'], drive:['Передний'], price:[2200000,3200000] }
        ] }
    ] }

];
