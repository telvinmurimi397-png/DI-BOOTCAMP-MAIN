def caesar_cipher(text, shift, mode):
    result = ""

    # Adjust shift direction for decryption
    if mode == "decrypt":
        shift = -shift

    for char in text:
        if char.isalpha():
            # Determine ASCII starting point based on case
            start = ord("A") if char.isupper() else ord("a")

            # Apply shift with wrap-around using modulo 26
            new_char = chr((ord(char) - start + shift) % 26 + start)
            result += new_char
        else:
            # Leave non-alphabet characters (spaces, punctuation) unchanged
            result += char

    return result


def main():
    print("--- Caesar Cipher Program ---")
    action = (
        input("Do you want to (E)ncrypt or (D)ecrypt? ").strip().lower()
    )

    if action in ["e", "encrypt"]:
        mode = "encrypt"
    elif action in ["d", "decrypt"]:
        mode = "decrypt"
    else:
        print("Invalid option selected.")
        return

    message = input("Enter your message: ")

    try:
        shift = int(input("Enter shift number (e.g., 3): "))
    except ValueError:
        print("Invalid shift value. Please enter an integer.")
        return

    output = caesar_cipher(message, shift, mode)
    print(f"\nResult ({mode}ed): {output}")


if __name__ == "__main__":
    main()