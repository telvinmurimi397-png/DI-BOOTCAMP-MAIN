import math
import turtle

class Circle:
    def __init__(self, radius=None, diameter=None):
        if radius is not None:
            self._radius = radius
        elif diameter is not None:
            self._radius = diameter / 2
        else:
            raise ValueError("You must specify either a radius or a diameter.")

    @property
    def radius(self):
        return self._radius

    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Radius cannot be negative.")
        self._radius = value

    @property
    def diameter(self):
        return self._radius * 2

    @diameter.setter
    def diameter(self, value):
        if value < 0:
            raise ValueError("Diameter cannot be negative.")
        self._radius = value / 2

    @property
    def area(self):
        return math.pi * (self._radius ** 2)

    def __str__(self):
        return f"Circle(radius={self._radius:.2f}, diameter={self.diameter:.2f})"

    def __repr__(self):
        return f"Circle(radius={self._radius})"

    def __add__(self, other):
        if isinstance(other, Circle):
            return Circle(radius=self.radius + other.radius)
        raise TypeError("Can only add another Circle instance.")

    def __gt__(self, other):
        if isinstance(other, Circle):
            return self.radius > other.radius
        return NotImplemented

    def __lt__(self, other):
        if isinstance(other, Circle):
            return self.radius < other.radius
        return NotImplemented

    def __eq__(self, other):
        if isinstance(other, Circle):
            return self.radius == other.radius
        return NotImplemented


# ==========================================
# Testing Circle Capabilities
# ==========================================

c1 = Circle(radius=5)
c2 = Circle(diameter=16)

# Query properties
print(f"c1 Radius: {c1.radius}, Diameter: {c1.diameter}, Area: {c1.area:.2f}")
print(f"c2 Radius: {c2.radius}, Diameter: {c2.diameter}, Area: {c2.area:.2f}")

# Representation
print(c1)  # __str__

# Addition
c3 = c1 + c2
print(f"c1 + c2 = {c3}")

# Comparisons
print(f"Is c2 bigger than c1? {c2 > c1}")
print(f"Is c1 equal to c2? {c1 == c2}")

# Sorting a list of circles
circles = [Circle(radius=10), Circle(radius=2), Circle(diameter=8), Circle(radius=5)]
sorted_circles = sorted(circles)

print("\nSorted Circles:")
for c in sorted_circles:
    print(c)


# ==========================================
# Bonus Challenge: Visualizing with Turtle
# ==========================================

def draw_sorted_circles(circle_list):
    screen = turtle.Screen()
    screen.setup(width=800, height=400)
    screen.title("Sorted Circles Visualizer")

    t = turtle.Turtle()
    t.speed(3)
    t.penup()

    # Position at starting point
    start_x = -300
    t.goto(start_x, -50)

    for circle_obj in circle_list:
        # Scale radius for better visualization on screen
        draw_radius = circle_obj.radius * 10
        
        t.pendown()
        t.circle(draw_radius)
        t.penup()

        # Move forward past current circle's diameter with spacing
        t.forward(draw_radius * 2 + 20)

    screen.mainloop()

# Uncomment to run visualizer:
# draw_sorted_circles(sorted_circles)