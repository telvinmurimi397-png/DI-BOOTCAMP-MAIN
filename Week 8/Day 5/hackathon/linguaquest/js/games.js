(function () {
  const french = {
    greetings: [
      { word: 'bonjour', meaning: 'hello / good morning', options: ['hello / good morning', 'good night', 'please', 'goodbye'], sentence: 'hello' },
      { word: 'merci', meaning: 'thank you', options: ['sorry', 'thank you', 'please', 'welcome'], sentence: 'thank you' },
      { word: 'au revoir', meaning: 'goodbye', options: ['good evening', 'goodbye', 'see you tomorrow', 'hello'], sentence: 'goodbye' },
      { word: 's’il vous plaît', meaning: 'please', options: ['please', 'thank you', 'excuse me', 'you are welcome'], sentence: 'please' },
      { word: 'salut', meaning: 'hi / bye', options: ['hi / bye', 'good morning', 'good night', 'good luck'], sentence: 'hi' },
      { word: 'bonsoir', meaning: 'good evening', options: ['good evening', 'good morning', 'good night', 'goodbye'], sentence: 'good evening' },
      { word: 'à bientôt', meaning: 'see you soon', options: ['see you soon', 'see you tomorrow', 'good evening', 'good luck'], sentence: 'see you soon' },
      { word: 'excusez-moi', meaning: 'excuse me', options: ['excuse me', 'you are welcome', 'thank you', 'goodbye'], sentence: 'excuse me' },
      { word: 'de rien', meaning: 'you are welcome', options: ['you are welcome', 'please', 'good morning', 'sorry'], sentence: 'you are welcome' },
      { word: 'bonne nuit', meaning: 'good night', options: ['good night', 'good evening', 'good morning', 'see you soon'], sentence: 'good night' }
    ],
    vocabulary: [
      { word: 'livre', meaning: 'book', options: ['book', 'table', 'window', 'pencil'], sentence: 'book' },
      { word: 'maison', meaning: 'house', options: ['garden', 'house', 'school', 'street'], sentence: 'house' },
      { word: 'ami', meaning: 'friend', options: ['family', 'friend', 'teacher', 'child'], sentence: 'friend' },
      { word: 'eau', meaning: 'water', options: ['milk', 'coffee', 'water', 'bread'], sentence: 'water' },
      { word: 'chat', meaning: 'cat', options: ['dog', 'bird', 'cat', 'horse'], sentence: 'cat' },
      { word: 'école', meaning: 'school', options: ['school', 'street', 'garden', 'window'], sentence: 'school' },
      { word: 'table', meaning: 'table', options: ['table', 'pencil', 'book', 'window'], sentence: 'table' },
      { word: 'fenêtre', meaning: 'window', options: ['window', 'door', 'house', 'school'], sentence: 'window' },
      { word: 'stylo', meaning: 'pen', options: ['pen', 'pencil', 'book', 'table'], sentence: 'pen' },
      { word: 'chien', meaning: 'dog', options: ['dog', 'cat', 'bird', 'horse'], sentence: 'dog' }
    ],
    numbers: [
      { word: 'un', meaning: 'one', options: ['one', 'two', 'three', 'four'], sentence: 'one' },
      { word: 'deux', meaning: 'two', options: ['six', 'two', 'ten', 'three'], sentence: 'two' },
      { word: 'trois', meaning: 'three', options: ['four', 'one', 'three', 'five'], sentence: 'three' },
      { word: 'quatre', meaning: 'four', options: ['four', 'seven', 'five', 'two'], sentence: 'four' },
      { word: 'cinq', meaning: 'five', options: ['nine', 'five', 'six', 'one'], sentence: 'five' },
      { word: 'six', meaning: 'six', options: ['six', 'seven', 'eight', 'five'], sentence: 'six' },
      { word: 'sept', meaning: 'seven', options: ['seven', 'six', 'nine', 'ten'], sentence: 'seven' },
      { word: 'huit', meaning: 'eight', options: ['eight', 'seven', 'five', 'nine'], sentence: 'eight' },
      { word: 'neuf', meaning: 'nine', options: ['nine', 'ten', 'eight', 'six'], sentence: 'nine' },
      { word: 'dix', meaning: 'ten', options: ['ten', 'nine', 'seven', 'six'], sentence: 'ten' }
    ],
    food: [
      { word: 'pain', meaning: 'bread', options: ['cheese', 'bread', 'apple', 'fish'], sentence: 'bread' },
      { word: 'pomme', meaning: 'apple', options: ['pear', 'apple', 'orange', 'grape'], sentence: 'apple' },
      { word: 'café', meaning: 'coffee', options: ['tea', 'water', 'coffee', 'juice'], sentence: 'coffee' },
      { word: 'fromage', meaning: 'cheese', options: ['cheese', 'bread', 'soup', 'meat'], sentence: 'cheese' },
      { word: 'lait', meaning: 'milk', options: ['milk', 'juice', 'coffee', 'water'], sentence: 'milk' },
      { word: 'thé', meaning: 'tea', options: ['tea', 'coffee', 'water', 'juice'], sentence: 'tea' },
      { word: 'orange', meaning: 'orange', options: ['orange', 'apple', 'pear', 'grape'], sentence: 'orange' },
      { word: 'jus', meaning: 'juice', options: ['juice', 'milk', 'tea', 'water'], sentence: 'juice' },
      { word: 'poisson', meaning: 'fish', options: ['fish', 'meat', 'cheese', 'bread'], sentence: 'fish' },
      { word: 'œuf', meaning: 'egg', options: ['egg', 'fish', 'cheese', 'bread'], sentence: 'egg' }
    ],
    travel: [
      { word: 'gare', meaning: 'train station', options: ['airport', 'hotel', 'train station', 'museum'], sentence: 'train station' },
      { word: 'billet', meaning: 'ticket', options: ['ticket', 'map', 'suitcase', 'passport'], sentence: 'ticket' },
      { word: 'hôtel', meaning: 'hotel', options: ['restaurant', 'hotel', 'station', 'shop'], sentence: 'hotel' },
      { word: 'rue', meaning: 'street', options: ['street', 'bridge', 'square', 'city'], sentence: 'street' },
      { word: 'aéroport', meaning: 'airport', options: ['port', 'airport', 'station', 'hotel'], sentence: 'airport' },
      { word: 'carte', meaning: 'map', options: ['map', 'ticket', 'passport', 'suitcase'], sentence: 'map' },
      { word: 'valise', meaning: 'suitcase', options: ['suitcase', 'map', 'street', 'bridge'], sentence: 'suitcase' },
      { word: 'passeport', meaning: 'passport', options: ['passport', 'ticket', 'hotel', 'museum'], sentence: 'passport' },
      { word: 'musée', meaning: 'museum', options: ['museum', 'station', 'airport', 'hotel'], sentence: 'museum' },
      { word: 'pont', meaning: 'bridge', options: ['bridge', 'street', 'square', 'station'], sentence: 'bridge' }
    ],
    conversation: [
      { word: 'comment allez-vous ?', meaning: 'how are you?', options: ['how are you?', 'where are you?', 'what is this?', 'who are you?'], sentence: 'how are you' },
      { word: 'je vais bien', meaning: 'I am well', options: ['I am well', 'I am hungry', 'I am here', 'I am ready'], sentence: 'I am well' },
      { word: 'je m’appelle', meaning: 'my name is', options: ['my name is', 'I would like', 'I live here', 'I am called'], sentence: 'my name is' },
      { word: 'enchanté', meaning: 'nice to meet you', options: ['see you soon', 'nice to meet you', 'good evening', 'well done'], sentence: 'nice to meet you' },
      { word: 'où est… ?', meaning: 'where is…?', options: ['where is…?', 'what time…?', 'how much…?', 'who has…?'], sentence: 'where is' },
      { word: 'comment vous appelez-vous ?', meaning: 'what is your name?', options: ['what is your name?', 'how are you?', 'where are you?', 'who are you?'], sentence: 'what is your name' },
      { word: 'j’ai faim', meaning: 'I am hungry', options: ['I am hungry', 'I am well', 'I am ready', 'I am here'], sentence: 'I am hungry' },
      { word: 'd’où venez-vous ?', meaning: 'where are you from?', options: ['where are you from?', 'where do you live?', 'how are you?', 'what is your name?'], sentence: 'where are you from' },
      { word: 'je voudrais', meaning: 'I would like', options: ['I would like', 'I am called', 'I am hungry', 'I am well'], sentence: 'I would like' },
      { word: 'quelle heure est-il ?', meaning: 'what time is it?', options: ['what time is it?', 'where is it?', 'how much is it?', 'who is it?'], sentence: 'what time is it' }
    ]
  };

  const dictionary = {
    French: french,
    Spanish: {
      greetings: [['hola','hello'],['gracias','thank you'],['adiós','goodbye'],['por favor','please'],['buenos días','good morning'],['buenas noches','good evening'],['hasta luego','see you later'],['perdón','sorry'],['de nada','you are welcome'],['buenas tardes','good afternoon']],
      vocabulary: [['libro','book'],['casa','house'],['amigo','friend'],['agua','water'],['gato','cat'],['escuela','school'],['mesa','table'],['ventana','window'],['bolígrafo','pen'],['perro','dog']],
      numbers: [['uno','one'],['dos','two'],['tres','three'],['cuatro','four'],['cinco','five'],['seis','six'],['siete','seven'],['ocho','eight'],['nueve','nine'],['diez','ten']],
      food: [['pan','bread'],['manzana','apple'],['café','coffee'],['queso','cheese'],['leche','milk'],['té','tea'],['naranja','orange'],['jugo','juice'],['pescado','fish'],['huevo','egg']],
      travel: [['estación','train station'],['billete','ticket'],['hotel','hotel'],['calle','street'],['aeropuerto','airport'],['mapa','map'],['maleta','suitcase'],['pasaporte','passport'],['museo','museum'],['puente','bridge']],
      conversation: [['¿cómo estás?','how are you?'],['estoy bien','I am well'],['me llamo','my name is'],['encantado','nice to meet you'],['¿dónde está?','where is...?'],['¿cómo te llamas?','what is your name?'],['tengo hambre','I am hungry'],['¿de dónde eres?','where are you from?'],['quisiera','I would like'],['¿qué hora es?','what time is it?']]
    },
    Italian: {
      greetings: [['ciao','hello'],['grazie','thank you'],['arrivederci','goodbye'],['per favore','please'],['buongiorno','good morning'],['buonasera','good evening'],['a dopo','see you later'],['scusa','sorry'],['prego','you are welcome'],['buon pomeriggio','good afternoon']],
      vocabulary: [['libro','book'],['casa','house'],['amico','friend'],['acqua','water'],['gatto','cat'],['scuola','school'],['tavolo','table'],['finestra','window'],['penna','pen'],['cane','dog']],
      numbers: [['uno','one'],['due','two'],['tre','three'],['quattro','four'],['cinque','five'],['sei','six'],['sette','seven'],['otto','eight'],['nove','nine'],['dieci','ten']],
      food: [['pane','bread'],['mela','apple'],['caffè','coffee'],['formaggio','cheese'],['latte','milk'],['tè','tea'],['arancia','orange'],['succo','juice'],['pesce','fish'],['uovo','egg']],
      travel: [['stazione','train station'],['biglietto','ticket'],['albergo','hotel'],['strada','street'],['aeroporto','airport'],['mappa','map'],['valigia','suitcase'],['passaporto','passport'],['museo','museum'],['ponte','bridge']],
      conversation: [['come stai?','how are you?'],['sto bene','I am well'],['mi chiamo','my name is'],['piacere','nice to meet you'],['dov’è...?','where is...?'],['come ti chiami?','what is your name?'],['ho fame','I am hungry'],['di dove sei?','where are you from?'],['vorrei','I would like'],['che ore sono?','what time is it?']]
    },
    German: {
      greetings: [['hallo','hello'],['danke','thank you'],['auf Wiedersehen','goodbye'],['bitte','please'],['guten Morgen','good morning'],['guten Abend','good evening'],['bis später','see you later'],['Entschuldigung','sorry'],['gern geschehen','you are welcome'],['guten Nachmittag','good afternoon']],
      vocabulary: [['Buch','book'],['Haus','house'],['Freund','friend'],['Wasser','water'],['Katze','cat'],['Schule','school'],['Tisch','table'],['Fenster','window'],['Stift','pen'],['Hund','dog']],
      numbers: [['eins','one'],['zwei','two'],['drei','three'],['vier','four'],['fünf','five'],['sechs','six'],['sieben','seven'],['acht','eight'],['neun','nine'],['zehn','ten']],
      food: [['Brot','bread'],['Apfel','apple'],['Kaffee','coffee'],['Käse','cheese'],['Milch','milk'],['Tee','tea'],['Orange','orange'],['Saft','juice'],['Fisch','fish'],['Ei','egg']],
      travel: [['Bahnhof','train station'],['Fahrkarte','ticket'],['Hotel','hotel'],['Straße','street'],['Flughafen','airport'],['Karte','map'],['Koffer','suitcase'],['Reisepass','passport'],['Museum','museum'],['Brücke','bridge']],
      conversation: [['wie geht es dir?','how are you?'],['mir geht es gut','I am well'],['ich heiße','my name is'],['freut mich','nice to meet you'],['wo ist...?','where is...?'],['wie heißt du?','what is your name?'],['ich habe Hunger','I am hungry'],['woher kommst du?','where are you from?'],['ich hätte gern','I would like'],['wie spät ist es?','what time is it?']]
    },
    Japanese: {
      greetings: [['こんにちは','hello'],['ありがとう','thank you'],['さようなら','goodbye'],['お願いします','please'],['おはよう','good morning'],['こんばんは','good evening'],['またね','see you later'],['すみません','sorry'],['どういたしまして','you are welcome'],['お疲れ様です','good afternoon']],
      vocabulary: [['本','book'],['家','house'],['友達','friend'],['水','water'],['猫','cat'],['学校','school'],['テーブル','table'],['窓','window'],['ペン','pen'],['犬','dog']],
      numbers: [['一','one'],['二','two'],['三','three'],['四','four'],['五','five'],['六','six'],['七','seven'],['八','eight'],['九','nine'],['十','ten']],
      food: [['パン','bread'],['りんご','apple'],['コーヒー','coffee'],['チーズ','cheese'],['牛乳','milk'],['お茶','tea'],['オレンジ','orange'],['ジュース','juice'],['魚','fish'],['卵','egg']],
      travel: [['駅','train station'],['切符','ticket'],['ホテル','hotel'],['道','street'],['空港','airport'],['地図','map'],['スーツケース','suitcase'],['パスポート','passport'],['博物館','museum'],['橋','bridge']],
      conversation: [['お元気ですか','how are you?'],['元気です','I am well'],['私の名前は','my name is'],['はじめまして','nice to meet you'],['どこですか','where is...?'],['お名前は何ですか','what is your name?'],['お腹が空きました','I am hungry'],['どちらの出身ですか','where are you from?'],['お願いします','I would like'],['今何時ですか','what time is it?']]
    },
    Swahili: {
      greetings: [['habari','hello'],['asante','thank you'],['kwa heri','goodbye'],['tafadhali','please'],['habari za asubuhi','good morning'],['habari za jioni','good evening'],['tutaonana baadaye','see you later'],['samahani','sorry'],['karibu','you are welcome'],['habari za mchana','good afternoon']],
      vocabulary: [['kitabu','book'],['nyumba','house'],['rafiki','friend'],['maji','water'],['paka','cat'],['shule','school'],['meza','table'],['dirisha','window'],['kalamu','pen'],['mbwa','dog']],
      numbers: [['moja','one'],['mbili','two'],['tatu','three'],['nne','four'],['tano','five'],['sita','six'],['saba','seven'],['nane','eight'],['tisa','nine'],['kumi','ten']],
      food: [['mkate','bread'],['tufaha','apple'],['kahawa','coffee'],['jibini','cheese'],['maziwa','milk'],['chai','tea'],['chungwa','orange'],['juisi','juice'],['samaki','fish'],['yai','egg']],
      travel: [['kituo cha treni','train station'],['tiketi','ticket'],['hoteli','hotel'],['barabara','street'],['uwanja wa ndege','airport'],['ramani','map'],['sanduku la safari','suitcase'],['pasipoti','passport'],['makumbusho','museum'],['daraja','bridge']],
      conversation: [['habari yako?','how are you?'],['nzuri','I am well'],['naitwa','my name is'],['nimefurahi','nice to meet you'],['iko wapi?','where is...?'],['jina lako nani?','what is your name?'],['nina njaa','I am hungry'],['unatoka wapi?','where are you from?'],['ningependa','I would like'],['ni saa ngapi?','what time is it?']]
    }
  };

  function getQuestions(lessonId, language) {
    if (language === 'French') return french[lessonId] || french.greetings;
    const pairs = (dictionary[language] || dictionary.French)[lessonId] || dictionary.French.greetings;
    return pairs.map(([word, meaning], index) => ({
      word,
      meaning,
      sentence: meaning.replace(/[?!…]/g, '').replace(/^./, (letter) => letter.toLowerCase()),
      options: [meaning, ...pairs.filter((_, optionIndex) => optionIndex !== index).slice(0, 3).map((pair) => pair[1])]
    }));
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[random]] = [copy[random], copy[index]];
    }
    return copy;
  }

  const questionsPerGame = 5;
  const questionCycles = new Map();

  function nextQuestions(lessonId, language) {
    const key = `${language}:${lessonId}`;
    const available = getQuestions(lessonId, language);
    let cycle = questionCycles.get(key);

    if (!cycle || cycle.remaining.length < questionsPerGame) {
      const previousWords = new Set(cycle ? cycle.lastRound.map((question) => question.word) : []);
      let nextCycle = available.filter((question) => !previousWords.has(question.word));
      if (nextCycle.length < questionsPerGame) nextCycle = available;
      cycle = { remaining: shuffle(nextCycle), lastRound: [] };
    }

    const questions = cycle.remaining.splice(0, questionsPerGame);
    cycle.lastRound = questions;
    questionCycles.set(key, cycle);
    return questions;
  }

  function create(mode, lessonId, language) {
    const questions = nextQuestions(lessonId, language);
    return {
      mode,
      lessonId,
      questions,
      index: 0,
      correct: 0,
      answered: false,
      selectedPair: null,
      matched: [],
      wordsFound: []
    };
  }

  function check(state, answer) {
    if (state.answered) return { correct: false, locked: true };
    const question = state.questions[state.index];
    const isCorrect = answer.trim().toLocaleLowerCase() === question.meaning.trim().toLocaleLowerCase();
    state.answered = true;
    if (isCorrect) {
      state.correct += 1;
      state.wordsFound.push(question.word);
    }
    return { correct: isCorrect, answer: question.meaning };
  }

  window.LQGames = { create, check, shuffle, getQuestions };
})();
