import random
from pymongo import MongoClient
from faker import Faker
from datetime import datetime

# --- CONFIGURATION ---
MONGO_URI = "mongodb://localhost:27017/" 
DB_NAME = "sample_analytics"
TARGET_LOOPS = 9220 

fake = Faker()
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

col_customers = db["customers"]
col_accounts = db["accounts"]
col_transactions = db["transactions"]

print(f"Connected to {DB_NAME}. Starting process...")

# ==========================================
# STEP 1: NORMALIZE EXISTING DATA
# ==========================================
print("Step 1: Updating original 500 users with vulnerable fields...")
col_customers.update_many(
    {"password": {"$exists": False}}, 
    {
        "$set": {
            "password": "password123", 
            "role": "user" 
        }
    }
)
print("Original data is now compatible.")

# ==========================================
# STEP 2: WATERFALL SCALING (Generate New Data)
# ==========================================
print(f"Step 2: Starting Waterfall Scaling ({TARGET_LOOPS} loops)...")

batch_customers = []
batch_accounts = []
batch_transactions = []
batch_size = 1000

# Helper function to convert 'date' to 'datetime'
def to_datetime(date_obj):
    return datetime(date_obj.year, date_obj.month, date_obj.day)

for i in range(TARGET_LOOPS):
    
    # --- A. Create CUSTOMER ---
    # Generate ID manually
    from bson.objectid import ObjectId
    customer_id = ObjectId() 

    dob_date = fake.date_of_birth(minimum_age=18, maximum_age=90)
    dob_datetime = to_datetime(dob_date)

    # Decide role: 2% chance to be Admin, 98% chance to be User
    assigned_role = random.choices(["user", "admin"], weights=[98, 2], k=1)[0]
    
    customer_doc = {
        "_id": customer_id,
        "username": fake.user_name(),
        "name": fake.name(),
        "address": fake.address(),
        "birthdate": dob_datetime, # <--- FIXED
        "email": fake.email(),
        "password": fake.password(), 
        "role": assigned_role, 
        "tier_and_details": {}
    }
    batch_customers.append(customer_doc)

    # --- B. Create ACCOUNT ---
    account_id = random.randint(1000000, 9999999) 
    
    account_doc = {
        "account_id": account_id,
        "limit": random.randint(5000, 50000),
        "products": ["CurrencyService", "InvestmentStock"],
        "customer_id": customer_id, 
    }
    batch_accounts.append(account_doc)

    # --- C. Create TRANSACTIONS ---
    for _ in range(3):
        start_date = to_datetime(fake.date_this_year())
        end_date = to_datetime(fake.date_this_year())
        txn_date = to_datetime(fake.date_this_year())

        txn_doc = {
            "account_id": account_id, 
            "transaction_count": random.randint(1, 5),
            "bucket_start_date": start_date, # <--- FIXED
            "bucket_end_date": end_date,     # <--- FIXED
            "transactions": [
                {
                    "date": txn_date,        # <--- FIXED
                    "amount": random.randint(10, 5000),
                    "transaction_code": fake.bban(),
                    "symbol": random.choice(["usd", "eur", "myr"]),
                    "price": "1.00",
                    "total": "100.00"
                }
            ]
        }
        batch_transactions.append(txn_doc)

    # --- D. INSERT BATCHES ---
    if len(batch_customers) >= batch_size:
        col_customers.insert_many(batch_customers)
        col_accounts.insert_many(batch_accounts)
        col_transactions.insert_many(batch_transactions)
        
        batch_customers = []
        batch_accounts = []
        batch_transactions = []
        print(f" -> Inserted batch... Loop {i+1}/{TARGET_LOOPS}")

# Insert remaining
if batch_customers:
    col_customers.insert_many(batch_customers)
    col_accounts.insert_many(batch_accounts)
    col_transactions.insert_many(batch_transactions)

print("Waterfall Scaling Complete! Database is ready for attack simulation.")