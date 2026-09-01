// Array of objects containing planet names, background colors, and moon counts
const planets = [
    { name: "Mercury", color: "gray", moons: 0 },
    { name: "Venus", color: "orange", moons: 0 },
    { name: "Earth", color: "blue", moons: 1 },
    { name: "Mars", color: "red", moons: 2 },
    { name: "Jupiter", color: "brown", moons: 79 },
    { name: "Saturn", color: "goldenrod", moons: 82 },
    { name: "Uranus", color: "lightskyblue", moons: 27 },
    { name: "Neptune", color: "darkblue", moons: 14 }
];

if (typeof document !== "undefined") {
    const listSection = document.querySelector(".listPlanets");

    // Loop through each planet
    planets.forEach((planet) => {
        // 1. Create planet container
        const planetDiv = document.createElement("div");
        planetDiv.classList.add("planet");
        planetDiv.style.backgroundColor = planet.color;
        planetDiv.textContent = planet.name;

        // 2. Bonus: Create moons dynamically around the planet
        // Positioning moons around the planet border using polar offset
        for (let i = 0; i < planet.moons; i++) {
            const moonDiv = document.createElement("div");
            moonDiv.classList.add("moon");

            // Spread moons around the planet's circumference visually
            const angle = (i / planet.moons) * (2 * Math.PI);
            const radius = 65; // Distance from center of the planet
            const x = Math.cos(angle) * radius + 35;
            const y = Math.sin(angle) * radius + 35;

            moonDiv.style.left = `${x}px`;
            moonDiv.style.top = `${y}px`;

            planetDiv.appendChild(moonDiv);
        }

        // 3. Append planet to the main section
        listSection.appendChild(planetDiv);
    });
} else {
    console.log(planets.map(planet => `${planet.name}: ${planet.color}, moons=${planet.moons}`).join("\n"));
}