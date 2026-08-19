#Exercise 1 : Student Grade Summary


student_grades = {
     "Alice": [88, 92, 100],
     "Bob": [75, 78, 80],
     "Charlie": [92, 90, 85],
     "Dana": [83, 88, 92],
     "Eli": [78, 80, 72]
    }

# Calculate the average grade for each student

student_averages = {}
for name, grades in student_grades.items():
     average = sum(grades) / len(grades)
     student_averages[name] = average

# Assign each student a letter grade based on their average grade
student_letter_grades = {}
for name, avg in student_averages.items():
    if avg >= 90:
         grade = 'A'
    elif avg >= 80:
        grade = 'B'
    elif avg >= 70:
        grade = 'C'
    elif avg >= 60:
        grade = 'D'
    else:
        grade = 'F'
    student_letter_grades[name] = grade

# Calculate the class average
total_average = sum(student_averages.values())
class_size = len(student_averages)
class_average = total_average / class_size

print(student_averages)
print(student_letter_grades)
print(class_average)

max_name_length = max(len(name) for name in student_grades.keys())

for name in student_grades.keys():
    spaces = ' ' * (max_name_length - len(name))
    print(f"{name}:{spaces} Average Grade = {student_averages[name]:.2f}, Letter Grade = {student_letter_grades[name]}")

#Exercise 2 : Advanced Data Manipulation and Analysis

# Define sales data
sales_data = [
    {"product": "Laptop", "price": 1000, "quantity": 2, "customer_id": "C001"},
    {"product": "Mouse", "price": 25, "quantity": 5, "customer_id": "C002"},
    {"product": "Laptop", "price": 1000, "quantity": 1, "customer_id": "C003"},
    {"product": "Keyboard", "price": 75, "quantity": 3, "customer_id": "C001"},
    {"product": "Monitor", "price": 300, "quantity": 2, "customer_id": "C002"},
    {"product": "Mouse", "price": 25, "quantity": 10, "customer_id": "C004"},
    {"product": "Keyboard", "price": 75, "quantity": 1, "customer_id": "C005"},
]

# 1. Total Sales Calculation
total_sales = {}
for transaction in sales_data:
    product = transaction["product"]
    total_price = transaction["price"] * transaction["quantity"]
    if product in total_sales:
        total_sales[product] += total_price
    else:
        total_sales[product] = total_price

# 2. Customer Spending Profile
customer_spending = {}
for transaction in sales_data:
    customer_id = transaction["customer_id"]
    total_price = transaction["price"] * transaction["quantity"]
    if customer_id in customer_spending:
        customer_spending[customer_id] += total_price
    else:
        customer_spending[customer_id] = total_price

# 3. Sales Data Enhancement
for transaction in sales_data:
    transaction["total_price"] = transaction["price"] * transaction["quantity"]

# 4. High-Value Transactions
high_value_transactions = [transaction for transaction in sales_data if transaction["total_price"] > 500]
# Sorting without lambda
high_value_transactions.sort(key=lambda x: x["total_price"], reverse=True)

# 5. Customer Loyalty Identification
purchase_counts = {}
for transaction in sales_data:
    customer_id = transaction["customer_id"]
    if customer_id in purchase_counts:
        purchase_counts[customer_id] += 1
    else:
        purchase_counts[customer_id] = 1
loyal_customers = [customer_id for customer_id, count in purchase_counts.items() if count > 2]

print("Total Sales:", total_sales)
print("Customer Spending:", customer_spending)
print("First Two Sales Data Entries:", sales_data[:2])
print("Loyal Customers:", loyal_customers)

# Bonus: Insights and Analysis

# Calculating the average transaction value for each product category
average_transaction_value = {}
for product in total_sales.keys():
    total_quantity = sum(transaction["quantity"] for transaction in sales_data if transaction["product"] == product)
    average_transaction_value[product] = total_sales[product] / total_quantity

# Identifying the most popular product based on the quantity sold
product_quantities = {product: sum(transaction["quantity"] for transaction in sales_data if transaction["product"] == product) for product in set(transaction["product"] for transaction in sales_data)}
most_popular_product = max(product_quantities, key=product_quantities.get)

# Insights into how these analyses could inform the company's marketing strategies
"""
Insights:
1. Products with higher average transaction values might indicate premium pricing or higher-end products. Marketing strategies could focus on highlighting the quality and features of these products to attract customers willing to pay more.

2. The most popular product, based on quantity sold, indicates consumer preference and demand. Marketing strategies could include promoting this product more aggressively, bundling it with other products, or exploring ways to upsell customers to higher-value items related to the most popular product.

3. Understanding both the average transaction value and the most popular products can help in inventory management, targeting advertising campaigns, and developing promotions that drive sales in specific product categories.
"""

print("Average Transaction Value:", average_transaction_value)
print("Most Popular Product:", most_popular_product)
