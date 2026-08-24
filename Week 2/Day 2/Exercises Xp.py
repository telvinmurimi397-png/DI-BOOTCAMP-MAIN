#Exercise 1: Pets
# Python
class Pets:
    def __init__(self, animals):
        self.animals = animals

    def walk(self):
        for animal in self.animals:
            print(animal.walk())

class Cat:
    is_lazy = True

    def __init__(self, name, age):
        self.name = name
        self.age = age

    def walk(self):
        return f'{self.name} is just walking around'

class Bengal(Cat):
    def sing(self, sounds):
        return f'{sounds}'

class Chartreux(Cat):
    def sing(self, sounds):
        return f'{sounds}'

# Step 1: Create the Siamese Class
class Siamese(Cat):
    pass

# Step 2: Create a List of Cat Instances
bengal_obj = Bengal("Tiger", 3)
chartreux_obj = Chartreux("Smokey", 5)
siamese_obj = Siamese("Sassy", 2)

all_cats = [bengal_obj, chartreux_obj, siamese_obj]

# Step 3: Create a Pets Instance
sara_pets = Pets(all_cats)

# Step 4: Take Cats for a Walk
sara_pets.walk()
# Exercise 2: Dogs
# Python
class Dog:
    def __init__(self, name, age, weight):
        self.name = name
        self.age = age
        self.weight = weight

    def bark(self):
        return f"{self.name} is barking"

    def run_speed(self):
        return (self.weight / self.age) * 10

    def fight(self, other_dog):
        my_power = self.run_speed() * self.weight
        other_power = other_dog.run_speed() * other_dog.weight

        if my_power > other_power:
            return f"{self.name} won the fight against {other_dog.name}!"
        elif other_power > my_power:
            return f"{other_dog.name} won the fight against {self.name}!"
        else:
            return f"The fight between {self.name} and {other_dog.name} was a tie!"

# Step 2: Create Dog Instances
dog1 = Dog("Rex", 4, 25)
dog2 = Dog("Max", 2, 30)
dog3 = Dog("Buddy", 5, 15)

# Step 3: Test Dog Methods
print(dog1.bark())
print(f"{dog2.name}'s run speed: {dog2.run_speed()}")
print(dog1.fight(dog2))
# Exercise 3: Dogs Domesticated
# Python
import random

# Step 1 & 2: PetDog Class inheriting from Dog
class PetDog(Dog):
    def __init__(self, name, age, weight):
        super().__init__(name, age, weight)
        self.trained = False

    def train(self):
        print(self.bark())
        self.trained = True

    def play(self, *args):
        # args contains other dog instances or dog names
        names = [self.name]
        for dog in args:
            if isinstance(dog, Dog):
                names.append(dog.name)
            else:
                names.append(str(dog))
        
        print(f"{', '.join(names)} all play together")

    def do_a_trick(self):
        if self.trained:
            tricks = [
                "does a barrel roll",
                "stands on his back legs",
                "shakes your hand",
                "plays dead"
            ]
            print(f"{self.name} {random.choice(tricks)}")
        else:
            print(f"{self.name} is not trained yet!")

# Step 3: Test PetDog Methods
pet1 = PetDog("Fido", 3, 12)
pet2 = PetDog("Rover", 2, 10)

pet1.train()
pet1.play(pet2, "Buster")
pet1.do_a_trick()
# Exercise 4: Family and Person Classes
# Python
# Step 1: Create the Person Class
class Person:
    def __init__(self, first_name, age):
        self.first_name = first_name
        self.age = age
        self.last_name = ""

    def is_18(self):
        return self.age >= 18


# Step 2: Create the Family Class
class Family:
    def __init__(self, last_name):
        self.last_name = last_name
        self.members = []

    def born(self, first_name, age):
        new_person = Person(first_name, age)
        new_person.last_name = self.last_name
        self.members.append(new_person)
        print(f"Congratulations to the {self.last_name} family on the birth of {first_name}!")

    def check_majority(self, first_name):
        for person in self.members:
            if person.first_name.lower() == first_name.lower():
                if person.is_18():
                    print("You are over 18, your parents Jane and John accept that you will go out with your friends")
                else:
                    print("Sorry, you are not allowed to go out with your friends.")
                return
        print(f"No family member named '{first_name}' was found.")

    def family_presentation(self):
        print(f"\n--- The {self.last_name} Family ---")
        for member in self.members:
            print(f"Name: {member.first_name} {member.last_name}, Age: {member.age}")


# Test Family Functionality
my_family = Family("Smith")

# Add members
my_family.born("John", 45)
my_family.born("Jane", 42)
my_family.born("Michael", 20)
my_family.born("Timmy", 14)

# Present family
my_family.family_presentation()

# Check majority
print("\n--- Checking Majority ---")
my_family.check_majority("Michael")
my_family.check_majority("Timmy")