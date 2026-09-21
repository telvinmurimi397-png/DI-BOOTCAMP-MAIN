import os


class SmsGateway:
    def __init__(self):
        self.enabled = os.getenv("SMS_API_KEY") is not None and os.getenv("SMS_API_KEY") != ""

    def send(self, phone: str, message: str):
        if not self.enabled:
            return {"status": "mocked", "phone": phone, "message": message}
        return {"status": "sent", "phone": phone, "message": message}


def get_sms_gateway():
    return SmsGateway()
