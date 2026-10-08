(function () {
  const french = {
    greetings: [
      { word: 'bonjour', meaning: 'hello / good morning', options: ['hello / good morning', 'good night', 'please', 'goodbye'], sentence: 'hello' },
      { word: 'merci', meaning: 'thank you', options: ['sorry', 'thank you', 'please', 'welcome'], sentence: 'thank you' },
      { word: 'au revoir', meaning: 'goodbye', options: ['good evening', 'goodbye', 'see you tomorrow', 'hello'], sentence: 'goodbye' },
      { word: 's’il vous plaît', meaning: 'please', options: ['please', 'thank you', 'excuse me', 'you are welcome'], sentence: 'please' },
      { word: 'salut', meaning: 'hi / bye', options: ['hi / bye', 'good morning', 'good night', 'good luck'], sentence: 'hi' }
    ],
    vocabulary: [
      { word: 'livre', meaning: 'book', options: ['book', 'table', 'window', 'pencil'], sentence: 'book' },
      { word: 'maison', meaning: 'house', options: ['garden', 'house', 'school', 'street'], sentence: 'house' },
      { word: 'ami', meaning: 'friend', options: ['family', 'friend', 'teacher', 'child'], sentence: 'friend' },
      { word: 'eau', meaning: 'water', options: ['milk', 'coffee', 'water', 'bread'], sentence: 'water' },
      { word: 'chat', meaning: 'cat', options: ['dog', 'bird', 'cat', 'horse'], sentence: 'cat' }
    ],
    numbers: [
      { word: 'un', meaning: 'one', options: ['one', 'two', 'three', 'four'], sentence: 'one' },
      { word: 'deux', meaning: 'two', options: ['six', 'two', 'ten', 'three'], sentence: 'two' },
      { word: 'trois', meaning: 'three', options: ['four', 'one', 'three', 'five'], sentence: 'three' },
      { word: 'quatre', meaning: 'four', options: ['four', 'seven', 'five', 'two'], sentence: 'four' },
      { word: 'cinq', meaning: 'five', options: ['nine', 'five', 'six', 'one'], sentence: 'five' }
    ],
    food: [
      { word: 'pain', meaning: 'bread', options: ['cheese', 'bread', 'apple', 'fish'], sentence: 'bread' },
      { word: 'pomme', meaning: 'apple', options: ['pear', 'apple', 'orange', 'grape'], sentence: 'apple' },
      { word: 'café', meaning: 'coffee', options: ['tea', 'water', 'coffee', 'juice'], sentence: 'coffee' },
      { word: 'fromage', meaning: 'cheese', options: ['cheese', 'bread', 'soup', 'meat'], sentence: 'cheese' },
      { word: 'lait', meaning: 'milk', options: ['milk', 'juice', 'coffee', 'water'], sentence: 'milk' }
    ],
    travel: [
      { word: 'gare', meaning: 'train station', options: ['airport', 'hotel', 'train station', 'museum'], sentence: 'train station' },
      { word: 'billet', meaning: 'ticket', options: ['ticket', 'map', 'suitcase', 'passport'], sentence: 'ticket' },
      { word: 'hôtel', meaning: 'hotel', options: ['restaurant', 'hotel', 'station', 'shop'], sentence: 'hotel' },
      { word: 'rue', meaning: 'street', options: ['street', 'bridge', 'square', 'city'], sentence: 'street' },
      { word: 'aéroport', meaning: 'airport', options: ['port', 'airport', 'station', 'hotel'], sentence: 'airport' }
    ],
    conversation: [
      { word: 'comment allez-vous ?', meaning: 'how are you?', options: ['how are you?', 'where are you?', 'what is this?', 'who are you?'], sentence: 'how are you' },
      { word: 'je vais bien', meaning: 'I am well', options: ['I am well', 'I am hungry', 'I am here', 'I am ready'], sentence: 'I am well' },
      { word: 'je m’appelle', meaning: 'my name is', options: ['my name is', 'I would like', 'I live here', 'I am called'], sentence: 'my name is' },
      { word: 'enchanté', meaning: 'nice to meet you', options: ['see you soon', 'nice to meet you', 'good evening', 'well done'], sentence: 'nice to meet you' },
      { word: 'où est… ?', meaning: 'where is…?', options: ['where is…?', 'what time…?', 'how much…?', 'who has…?'], sentence: 'where is' }
    ]
  };

  const dictionary = {
    French: french,
    Spanish: {
      greetings: [['hola','hello'],['gracias','thank you'],['adiós','goodbye'],['por favor','please'],['buenos días','good morning']],
      vocabulary: [['libro','book'],['casa','house'],['amigo','friend'],['agua','water'],['gato','cat']],
      numbers: [['uno','one'],['dos','two'],['tres','three'],['cuatro','four'],['cinco','five']],
      food: [['pan','bread'],['manzana','apple'],['café','coffee'],['queso','cheese'],['leche','milk']],
      travel: [['estación','train station'],['billete','ticket'],['hotel','hotel'],['calle','street'],['aeropuerto','airport']],
      conversation: [['¿cómo estás?','how are you?'],['estoy bien','I am well'],['me llamo','my name is'],['encantado','nice to meet you'],['¿dónde está?','where is...?']]
    },
    Italian: {
      greetings: [['ciao','hello'],['grazie','thank you'],['arrivederci','goodbye'],['per favore','please'],['buongiorno','good morning']],
      vocabulary: [['libro','book'],['casa','house'],['amico','friend'],['acqua','water'],['gatto','cat']],
      numbers: [['uno','one'],['due','two'],['tre','three'],['quattro','four'],['cinque','five']],
      food: [['pane','bread'],['mela','apple'],['caffè','coffee'],['formaggio','cheese'],['latte','milk']],
      travel: [['stazione','train station'],['biglietto','ticket'],['albergo','hotel'],['strada','street'],['aeroporto','airport']],
      conversation: [['come stai?','how are you?'],['sto bene','I am well'],['mi chiamo','my name is'],['piacere','nice to meet you'],['dov’è...?','where is...?']]
    },
    German: {
      greetings: [['hallo','hello'],['danke','thank you'],['auf Wiedersehen','goodbye'],['bitte','please'],['guten Morgen','good morning']],
      vocabulary: [['Buch','book'],['Haus','house'],['Freund','friend'],['Wasser','water'],['Katze','cat']],
      numbers: [['eins','one'],['zwei','two'],['drei','three'],['vier','four'],['fünf','five']],
      food: [['Brot','bread'],['Apfel','apple'],['Kaffee','coffee'],['Käse','cheese'],['Milch','milk']],
      travel: [['Bahnhof','train station'],['Fahrkarte','ticket'],['Hotel','hotel'],['Straße','street'],['Flughafen','airport']],
      conversation: [['wie geht es dir?','how are you?'],['mir geht es gut','I am well'],['ich heiße','my name is'],['freut mich','nice to meet you'],['wo ist...?','where is...?']]
    },
    Japanese: {
      greetings: [['こんにちは','hello'],['ありがとう','thank you'],['さようなら','goodbye'],['お願いします','please'],['おはよう','good morning']],
      vocabulary: [['本','book'],['家','house'],['友達','friend'],['水','water'],['猫','cat']],
      numbers: [['一','one'],['二','two'],['三','three'],['四','four'],['五','five']],
      food: [['パン','bread'],['りんご','apple'],['コーヒー','coffee'],['チーズ','cheese'],['牛乳','milk']],
      travel: [['駅','train station'],['切符','ticket'],['ホテル','hotel'],['道','street'],['空港','airport']],
      conversation: [['お元気ですか','how are you?'],['元気です','I am well'],['私の名前は','my name is'],['はじめまして','nice to meet you'],['どこですか','where is...?']]
    },
    Swahili: {
      greetings: [['habari','hello'],['asante','thank you'],['kwa heri','goodbye'],['tafadhali','please'],['habari za asubuhi','good morning']],
      vocabulary: [['kitabu','book'],['nyumba','house'],['rafiki','friend'],['maji','water'],['paka','cat']],
      numbers: [['moja','one'],['mbili','two'],['tatu','three'],['nne','four'],['tano','five']],
      food: [['mkate','bread'],['tufaha','apple'],['kahawa','coffee'],['jibini','cheese'],['maziwa','milk']],
      travel: [['kituo cha treni','train station'],['tiketi','ticket'],['hoteli','hotel'],['barabara','street'],['uwanja wa ndege','airport']],
      conversation: [['habari yako?','how are you?'],['nzuri','I am well'],['naitwa','my name is'],['nimefurahi','nice to meet you'],['iko wapi?','where is...?']]
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

  function create(mode, lessonId, language) {
    const questions = shuffle(getQuestions(lessonId, language)).slice(0, 5);
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
