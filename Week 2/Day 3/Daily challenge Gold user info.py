def main():
    people = []
    
    for i in range(5):
        name = input("Enter name: ")
        age = input("Enter age: ")
        score = input("Enter score: ")
        people.append((name, age, score))
    
    # Sort by Name > Age > Score using a lambda function
    people.sort(key=lambda person: (person[0], person[1], person[2]))
    
    print(people)

if __name__ == "__main__":
    main()