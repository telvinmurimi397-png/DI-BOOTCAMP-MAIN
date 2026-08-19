REverseinp = input()

# Split sentence into words, reverse the list, and join back into a string
reversed = " ".join(REverseinp.split()[::-1])

print(reversed)