​

# �� Why Schema Is Important in the Software Development Life Cycle (SDLC)

​

## �� What Is a Schema?

​
A schema defines the **structure and organization of data** in your application — think of it as the blueprint of your backend database.
​

---

​

## ✅ Why Schema Matters

​
| Benefit | Explanation |
|--------|-------------|
| 🧠 **Clarity** | Acts as a blueprint for developers, designers, and stakeholders. |
| 🔒 **Data Integrity** | Prevents invalid or inconsistent data through rules and constraints. |
| 🚀 **Performance** | Properly indexed schemas support fast queries and scaling. |
| ⚙️ **Backend Stability** | Aids in writing predictable, robust APIs and logic. |
| 🤝 **Team Collaboration** | Ensures frontend and backend teams align on data expectations. |
​

---

​

# ��️ How to Construct an Effective Schema

​

## �� Step 1: Understand the Domain

​

- Identify the **problem you're solving**.
- What are the **core entities**?
- What are the **relationships** between them?
  ​

---

​

## ��️ Step 2: Identify Entities and Attributes

​
Example — `User` table:
​

```
User
- id: UUID (PK)
- name: string
- email: string (unique)
- created_at: datetime
```

## ​

​

## �� Step 3: Define Relationships

​
| Relationship | Example |
|--------------|---------|
| One-to-Many | One user → many expenses |
| Many-to-Many | Users sharing an expense |
| One-to-One | User ↔ Profile |
​
Use **foreign keys** to enforce links between tables.
​

---

​

## ��️ Step 4: Apply Constraints & Indexes

​

- Add `NOT NULL`, `UNIQUE`, `DEFAULT`, and `CHECK` constraints.
- Use indexes on fields like `email`, `created_at`, `user_id`.
  ​

---

​

## �� Step 5: Validate with Use Cases

​
Run CRUD + real-world scenarios:

- Can a user create/edit/delete expenses?
- Can users search past expenses by category/date?
- What happens if a user is deleted?
  ​

---

​

## ⚙️ Step 6: Use a Schema Management Tool

​
Use tools like:

- PostgreSQL + Prisma / TypeORM / SQLAlchemy
- MongoDB + Mongoose
- Firebase (with NoSQL-specific patterns)
  ​
  Use **migrations** to safely evolve schema over time.
  ​

---

​

# �� Sample Schema Design: Expense Splitting App

​
Let’s model a **basic Expense Sharing App** (like Splitwise):
​

---

​

## �� Core Features

​

- Users can create shared groups.
- Users can add expenses with shared participants.
- App calculates how much each person owes or is owed.
  ​

---

​

## �� ERD Overview (Entities & Relationships)

​

```
User ─────┐
          │
          ▼
      [Group]◄────┐
          │       │
          ▼       ▼
     [Expense]  [GroupMember]
          │
          ▼
  [ExpenseParticipant]
```

## ​

​

## �� Database Tables

​

### **1. users**

​
| Field | Type | Constraints |
|---------------|-----------|----------------------|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| email | VARCHAR | UNIQUE, NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |
​

---

​

### **2. groups**

​
| Field | Type | Constraints |
|---------------|-----------|---------------------|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| created_by | UUID | FK → users(id) |
| created_at | TIMESTAMP | DEFAULT now() |
​

---

​

### **3. group_members**

​
| Field | Type | Constraints |
|-----------|------|---------------------------|
| id | UUID | PK |
| group_id | UUID | FK → groups(id) |
| user_id | UUID | FK → users(id) |
| joined_at | TIMESTAMP | DEFAULT now() |
​

---

​

### **4. expenses**

​
| Field | Type | Constraints |
|---------------|---------|--------------------------------|
| id | UUID | PK |
| group_id | UUID | FK → groups(id) |
| paid_by | UUID | FK → users(id) |
| description | TEXT | NOT NULL |
| amount | DECIMAL | NOT NULL |
| created_at | TIMESTAMP | DEFAULT now() |
​

---

​

### **5. expense_participants**

​
| Field | Type | Constraints |
|--------------|---------|--------------------------------|
| id | UUID | PK |
| expense_id | UUID | FK → expenses(id) |
| user_id | UUID | FK → users(id) |
| share_amount | DECIMAL | NOT NULL |
​

---

​

## �� Example Use Case Flow

​

- Alice creates a **Group** with Bob and Charlie.
- Alice adds an **Expense** of $90 (Pizza) and selects Bob & Charlie as **participants**.
- Each person owes $30. App stores this in `expense_participants`.
  ​

---

​

# �� Pro Tips for Schema Design

​

- Use **UUIDs** for IDs to avoid predictability.
- Always **version-control migrations**.
- Avoid over-normalization early on — optimize later.
- Test your schema with **real user flows**, not just ideal scenarios.
  ​
  ​
  ​

# �� Deep Dive: `expense_participants` Table

​
This is one of the most critical tables for expense splitting logic. It tracks **who is involved** in an expense and how much each person **owes**.
​

---

​

## �� Example Scenario

​
**Users**: Alice, Bob, Charlie  
**Group**: "Vacation Trip"  
**Expense**: Alice paid **$90** for dinner for all 3.
​
| Person | Paid | Should Pay | Owes |
|----------|------|------------|------|
| Alice | $90 | $30 | $0 |
| Bob | $0 | $30 | $30 |
| Charlie | $0 | $30 | $30 |
​
So, **Bob and Charlie each owe Alice $30**.
​

---

​

## ✅ How It’s Represented in the Database

​

### `expenses` Table Entry

| id  | group_id | paid_by    | amount | description     |
| --- | -------- | ---------- | ------ | --------------- |
| 1   | grp123   | user_alice | 90.00  | Dinner on Day 1 |

​

### `expense_participants` Table Entries

| id  | expense_id | user_id      | share_amount |
| --- | ---------- | ------------ | ------------ |
| 1   | 1          | user_alice   | 30.00        |
| 2   | 1          | user_bob     | 30.00        |
| 3   | 1          | user_charlie | 30.00        |

​

- All 3 shared the expense
- Each owes $30
- Only Alice paid, so she is owed $60 total
  ​

---

​

## �� Calculating Balances Across Expenses

​
For each user in a group:
​

```sql
total_paid_by_user = SUM(expenses.amount WHERE paid_by = user_id)
total_owed_by_user = SUM(expense_participants.share_amount WHERE user_id = user_id)
​
net_balance = total_paid_by_user - total_owed_by_user
```

​

### Example Result

| User    | Paid | Owes | Net Balance |
| ------- | ---- | ---- | ----------- |
| Alice   | $90  | $30  | +$60        |
| Bob     | $0   | $30  | -$30        |
| Charlie | $0   | $30  | -$30        |

## ​

​

## �� Who Owes Whom?

​
From the balances:

- Bob owes Alice $30
- Charlie owes Alice $30
  ​

### `settlements` (optional table for clarity)

​
| from_user_id | to_user_id
