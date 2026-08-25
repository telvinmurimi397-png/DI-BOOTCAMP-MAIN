from abc import ABC, abstractmethod


class Temperature(ABC):

    def __init__(self, value_in_kelvin):
        self.kelvin = value_in_kelvin

    def to_celsius(self):
        return self.kelvin - 273.15

    def to_fahrenheit(self):
        return (self.kelvin - 273.15) * 9 / 5 + 32

    def to_kelvin(self):
        return self.kelvin


class Celsius(Temperature):

    def __init__(self, value):
        super().__init__(value + 273.15)


class Kelvin(Temperature):

    def __init__(self, value):
        super().__init__(value)


class Fahrenheit(Temperature):

    def __init__(self, value):
        super().__init__((value - 32) * 5 / 9 + 273.15)


# Example Usage:
c = Celsius(25)
print(f"Celsius to Fahrenheit: {c.to_fahrenheit():.2f}°F")
print(f"Celsius to Kelvin: {c.to_kelvin():.2f}K")

f = Fahrenheit(98.6)
print(f"Fahrenheit to Celsius: {f.to_celsius():.2f}°C")


#Exercise 2: In the Quantum Realm


import random


class QuantumParticle:

    def __init__(self, x=None, y=None, p=None):
        # Initial position (x), momentum (y), and spin (p)
        self.x = (
            x
            if x is not None
            else random.randint(1, 10000)
        )
        self.y = (
            y
            if y is not None
            else random.random()
        )
        self.p = (
            p
            if p is not None
            else random.choice([0.5, -0.5])
        )

        self.entangled_particle = None

    def _disturbance(self):
        self.x = random.randint(1, 10000)
        self.y = random.random()
        print("Quantum Interferences!!")

    def position(self):
        self._disturbance()
        return self.x

    def momentum(self):
        self._disturbance()
        return self.y

    def spin(self):
        self._disturbance()

        # If entangled, measuring spin sets the partner's spin to the opposite value
        if self.entangled_particle:
            self.entangled_particle.p = -self.p

        return self.p

    def entangle(self, other):
        if not isinstance(other, QuantumParticle):
            raise TypeError(
                "A quantum particle can only be entangled with another QuantumParticle!"
            )

        self.entangled_particle = other
        other.entangled_particle = self

        print("Spooky Action at a Distance !!")

    def __repr__(self):
        return f"QuantumParticle(position={self.x}, momentum={self.y:.4f}, spin={self.p})"


# Example Usage:
p1 = QuantumParticle(x=1, y=0.5, p=0.5)
p2 = QuantumParticle(x=2, y=0.5, p=-0.5)

p1.entangle(p2)

print("P1 spin before measurement:", p1.p)
print("P2 spin before measurement:", p2.p)

# Measurement triggers disturbance and updates entangled partner's spin
measured_spin = p1.spin()

print("P1 measured spin:", measured_spin)
print("P2 spin after P1 measurement:", p2.p)
print(repr(p1))