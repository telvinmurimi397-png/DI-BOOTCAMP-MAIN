import random

class Gene:
    """Represents a single Gene with value 0 or 1."""
    def __init__(self, value=None):
        self.value = value if value is not None else random.choice([0, 1])

    def mutate(self):
        """Flips the gene value (0 -> 1 or 1 -> 0)."""
        self.value = 1 if self.value == 0 else 0

    def is_one(self):
        return self.value == 1


class Chromosome:
    """Represents a Chromosome consisting of 10 Genes."""
    def __init__(self):
        self.genes = [Gene() for _ in range(10)]

    def mutate(self):
        """Randomly flips a random number of genes (50% chance per gene)."""
        for gene in self.genes:
            if random.random() < 0.5:
                gene.mutate()

    def is_all_ones(self):
        return all(gene.is_one() for gene in self.genes)


class DNA:
    """Represents DNA consisting of 10 Chromosomes."""
    def __init__(self):
        self.chromosomes = [Chromosome() for _ in range(10)]

    def mutate(self):
        """Mutates chromosomes within the DNA structure."""
        for chromosome in self.chromosomes:
            if random.random() < 0.5:
                chromosome.mutate()

    def is_perfect(self):
        """Returns True if all 100 genes across all 10 chromosomes are 1."""
        return all(chromo.is_all_ones() for chromo in self.chromosomes)


class Organism:
    """Represents an organism with DNA and an environment mutation probability."""
    def __init__(self, dna, environment):
        self.dna = dna
        self.environment = environment  # Float probability between 0.0 and 1.0

    def mutate(self):
        """Triggers DNA mutation based on environment probability."""
        if random.random() < self.environment:
            self.dna.mutate()

    def is_target_dna(self):
        return self.dna.is_perfect()


# ==================== SIMULATION RUNNER ====================

def run_evolution_simulation(num_organisms=5, environment_prob=0.8):
    population = [Organism(DNA(), environment_prob) for _ in range(num_organisms)]
    generations = 0
    winner_found = False

    print(f"Starting simulation with {num_organisms} organisms (Env mutation prob: {environment_prob})...\n")

    while not winner_found:
        generations += 1
        
        for idx, organism in enumerate(population):
            organism.mutate()
            
            if organism.is_target_dna():
                print(f"🎉 Success! Organism #{idx + 1} reached 100% '1's DNA on Generation {generations:,}!")
                winner_found = True
                break

        # Progress log every 50,000 generations
        if generations % 50000 == 0:
            best_score = max(sum(g.value for c in org.dna.chromosomes for g in c.genes) for org in population)
            print(f"Generation {generations:,} | Current highest '1's count: {best_score}/100")

    return generations


if __name__ == "__main__":
    # Run simulation
    total_generations = run_evolution_simulation(num_organisms=10, environment_prob=0.9)