class Phone:
    def __init__(self, phone_number):
        self.phone_number = phone_number
        self.call_history = []
        self.messages = []

    def call(self, other_phone):
        call_log = f"{self.phone_number} called {other_phone.phone_number}"
        print(call_log)
        self.call_history.append(call_log)

    def show_call_history(self):
        print(f"\n--- Call History for {self.phone_number} ---")
        for entry in self.call_history:
            print(entry)

    def send_message(self, other_phone, content):
        message_data = {
            "to": other_phone.phone_number,
            "from": self.phone_number,
            "content": content
        }
        # Add the message record to both sender's and receiver's message list
        self.messages.append(message_data)
        other_phone.messages.append(message_data)
        print(f"Message sent from {self.phone_number} to {other_phone.phone_number}.")

    def show_outgoing_messages(self):
        print(f"\n--- Outgoing Messages for {self.phone_number} ---")
        for msg in self.messages:
            if msg["from"] == self.phone_number:
                print(f"To {msg['to']}: {msg['content']}")

    def show_incoming_messages(self):
        print(f"\n--- Incoming Messages for {self.phone_number} ---")
        for msg in self.messages:
            if msg["to"] == self.phone_number:
                print(f"From {msg['from']}: {msg['content']}")

    def show_messages_from(self, other_phone):
        print(f"\n--- Messages from {other_phone.phone_number} to {self.phone_number} ---")
        for msg in self.messages:
            if msg["from"] == other_phone.phone_number and msg["to"] == self.phone_number:
                print(f"Content: {msg['content']}")


# ==================== TESTING THE CODE ====================

# Instantiate Phone objects
phone1 = Phone("123-456-7890")
phone2 = Phone("987-654-3210")
phone3 = Phone("555-000-1111")

# Test Calls
phone1.call(phone2)
phone1.call(phone3)
phone1.show_call_history()

# Test Messages
phone1.send_message(phone2, "Hey! How are you?")
phone2.send_message(phone1, "I'm good, thanks! How about you?")
phone3.send_message(phone1, "Hey, don't forget the meeting tomorrow.")

# Show Outgoing and Incoming Messages
phone1.show_outgoing_messages()
phone1.show_incoming_messages()

# Show Messages from a specific sender
phone1.show_messages_from(phone2)