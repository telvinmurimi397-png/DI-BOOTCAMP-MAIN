(function () {
  const lessons = [
    { id: 'greetings', icon: '01', title: 'Greetings', description: 'Say hello, introduce yourself, and be polite.', words: ['bonjour', 'salut', 'merci', 'au revoir'], minutes: 5, category: 'Basics' },
    { id: 'vocabulary', icon: '02', title: 'Everyday Vocabulary', description: 'Learn useful words for everyday life.', words: ['livre', 'maison', 'ami', 'eau'], minutes: 7, category: 'Basics' },
    { id: 'numbers', icon: '03', title: 'Numbers', description: 'Count from one to ten with confidence.', words: ['un', 'deux', 'trois', 'quatre'], minutes: 5, category: 'Basics' },
    { id: 'food', icon: '04', title: 'Food & Café', description: 'Order a snack and talk about what you love.', words: ['pain', 'pomme', 'café', 'fromage'], minutes: 6, category: 'Everyday' },
    { id: 'travel', icon: '05', title: 'Travel', description: 'Find your way around and ask for help.', words: ['gare', 'billet', 'hôtel', 'rue'], minutes: 8, category: 'Everyday' },
    { id: 'conversation', icon: '06', title: 'Everyday Conversation', description: 'Put your new words into natural sentences.', words: ['comment', 'allez', 'vous', 'bien'], minutes: 8, category: 'Everyday' }
  ];
  window.LQLessons = { all: lessons, get: (id) => lessons.find((lesson) => lesson.id === id) };
})();
