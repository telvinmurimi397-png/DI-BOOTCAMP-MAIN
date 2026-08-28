#Exercise 1:
# Quiz 1. What is a class?
#A class is a blueprint or template used to create objects. It defines the attributes and methods that the objects will have.

#2. What is an instance?
#An instance is an actual object created from a class.

#3. What is encapsulation?
#Encapsulation is the practice of keeping data and the methods that work with that data together inside a class, while controlling how the data is accessed.

#4. What is abstraction?
#Abstraction means hiding complicated implementation details and showing only what is necessary to the user.

#5. What is inheritance?
#Inheritance is a mechanism where a new class (child class) can inherit attributes and methods from an existing class (parent class), allowing for code reuse and the creation of a hierarchy of classes.

#6. What is multiple inheritance?
#Multiple inheritance is when a class inherits from more than one parent class.

#7. What is polymorphism?
#Polymorphism means "many forms." It allows different classes to use the same method name but implement it differently.

#8. What is Method Resolution Order (MRO)?
#MRO is the order Python follows when looking for a method or attribute in a class and its parent classes.


#Exercise 2: Create a Deck of Cards Class
import random


class Card:
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value

    def __str__(self):
        return f"{self.value} of {self.suit}"


class Deck:
    def __init__(self):
        self.cards = []

        suits = ["Hearts", "Diamonds", "Clubs", "Spades"]
        values = ["A", "2", "3", "4", "5", "6", "7",
                  "8", "9", "10", "J", "Q", "K"]

        for suit in suits:
            for value in values:
                self.cards.append(Card(suit, value))

    def shuffle(self):
        # Make sure the deck has all 52 cards
        if len(self.cards) == 52:
            random.shuffle(self.cards)
        else:
            print("The deck does not contain 52 cards.")

    def deal(self):
        if len(self.cards) > 0:
            return self.cards.pop()
        else:
            return "The deck is empty."


# Create a deck
deck = Deck()

# Shuffle the deck
deck.shuffle()

# Deal a card
card = deck.deal()

print("Dealt card:", card)
print("Cards remaining:", len(deck.cards))