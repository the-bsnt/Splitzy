## �� Feature Overview

​
| Feature Name | Description |
| --------------- | -------------------------------------------------- |
| User Management | Register/login, profile management, password reset |
| Groups | Create/manage groups with members and categories |
| Expenses | Add, split, view, and manage group expenses |
| Balances | Calculate who owes whom and how much |
| Settlements | Mark debts as settled, update balances |
| Activity Feed | Chronological group activity tracking |
​

## 1. �� User Management

​

### 1.1 Auth

​

- Email/password-based auth
- JWT-based token/session system
- logout
  ​

### 1.2 Profile

​

- View/edit userdetail
- Change password
  ​

## 2. �� Groups

​

### 2.1 Create Group

​

- Name, avatar, etc
- Add existing users or invite via email
- Accept invitation
  ​

### 2.2 Manage Group

​

- Edit group details
- Add/remove/view members (member cannot be removed unless he/she is settled up)
- Leave/delete group (member cannot leave unless settled up, group cannot be deleted unless settled up)
  ​

## 3. �� Expenses

​

### 3.1 Add Expense

​

- Fields: Title, amount, date, payer(s), participants
- Split types: - Equally - Unequally (manual amounts) - Percentage
  ​

### 3.2 Manage Expense

​

- Edit/delete expense
- Notes/description field
  ​

## 4. �� Balances

​

### 4.1 Group Summary

​

- Show simplified debts (minimized payment paths)
- Show all member status : owed, owes, or is settled up with exact amount.
  ​

## Settlements

​

### 5.1 Settle Up

​

- Settle up all the expenses
  ​

### 5.2 Settlement History

​

- Track who settled what and when
- Show in group history
  ​

## 6. �� Activity Feed

​

### 6.1 Per Group

​

- Show expense adds, edits, deletions
- Settlement logs
- Joined/left users
  ​
  ​

## 7 Totals

​

### 7.1 Per Group

- Show all time cost and monthly cost in bar graph
  ​
  ​

# Non Functional Requirements

​

1.  Responsive design
2.  UI/UX Friendly
3.  Deployment-Readiness
    ​
    ​

# Bonus Tasks

​

- Notifications using Firebase or pusher or others
  ​
