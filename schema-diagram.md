# Prisma Schema - Mermaid ER Diagram

```mermaid
erDiagram
    User {
        string id PK
        datetime createdAt
        datetime updatedAt
        string name
        string lastName
        string phoneNumber
        string email UK
        string password
        string externalId UK
        string image
        string currency
        string language
    }

    Group {
        string id PK
        datetime createdAt
        datetime updatedAt
        string name
        string description
        string image
        string conversationId FK
        string createdById FK
    }

    GroupUser {
        string id PK
        datetime createdAt
        datetime updatedAt
        GroupRole role
        string userId FK
        string groupId FK
    }

    Expense {
        string id PK
        datetime createdAt
        datetime updatedAt
        float amount
        string description
        datetime date
        string categoryId FK
        string currency
        string location
        string notes
        boolean isSettlement
        string paidById FK
        string groupId FK
        string settlementId FK
    }

    ExpenseShare {
        string id PK
        datetime createdAt
        datetime updatedAt
        float amount
        ShareType type
        string expenseId FK
        string userId FK
    }

    Budget {
        string id PK
        datetime createdAt
        datetime updatedAt
        float amount
        int month
        int year
        string currency
        string userId FK
        string categoryId FK
    }

    CustomCategory {
        string id PK
        datetime createdAt
        datetime updatedAt
        string name
        string icon
        string color
        string userId FK
    }

    Conversation {
        string id PK
        datetime createdAt
        datetime updatedAt
        boolean isGroupChat
        string name
        string groupId FK
    }

    ConversationParticipant {
        string id PK
        datetime createdAt
        datetime updatedAt
        string conversationId FK
        string userId FK
    }

    Message {
        string id PK
        datetime createdAt
        datetime updatedAt
        string content
        boolean isAI
        string conversationId FK
        string senderId FK
    }

    MessageSeen {
        string id PK
        datetime createdAt
        string messageId FK
        string userId FK
    }

    AIAction {
        string id PK
        datetime createdAt
        AIActionType action
        string description
        string prompt
        string result
        string metadata
    }

    UserPreference {
        string id PK
        datetime createdAt
        datetime updatedAt
        ThemeMode theme
        string dateFormat
        string timeFormat
        boolean notifications
        string userId FK
    }

    GroupInvitation {
        string id PK
        datetime createdAt
        datetime updatedAt
        string token UK
        datetime expiresAt
        datetime usedAt
        int maxUses
        int useCount
        string groupId FK
        string creatorId FK
        string invitedUserId FK
    }

    Settlement {
        string id PK
        datetime createdAt
        datetime updatedAt
        float amount
        string currency
        string description
        datetime date
        SettlementStatus settlementStatus
        SettlementType settlementType
        string initiatedById FK
        string settledWithUserId FK
        string groupId FK
    }

    %% Relationships
    User ||--o{ GroupUser : "belongs to"
    Group ||--o{ GroupUser : "has members"
    User ||--o{ Expense : "paid by"
    Group ||--o{ Expense : "contains"
    Expense ||--o{ ExpenseShare : "has shares"
    User ||--o{ ExpenseShare : "owes"
    User ||--o{ Budget : "has"
    CustomCategory ||--o{ Budget : "categorized by"
    User ||--o{ CustomCategory : "owns"
    CustomCategory ||--o{ Expense : "categorized as"
    User ||--o{ Message : "sends"
    Conversation ||--o{ Message : "contains"
    Conversation ||--o{ ConversationParticipant : "has participants"
    User ||--o{ ConversationParticipant : "participates in"
    Message ||--o{ MessageSeen : "seen by"
    User ||--o{ MessageSeen : "has seen"
    User ||--o{ UserPreference : "has preferences"
    Group ||--o{ Conversation : "has conversation"
    Group ||--o{ GroupInvitation : "has invitations"
    User ||--o{ GroupInvitation : "creates invitations"
    User ||--o{ GroupInvitation : "invited through"
    User ||--o{ Settlement : "initiates"
    User ||--o{ Settlement : "receives"
    Group ||--o{ Settlement : "contains"
    Settlement ||--o{ Expense : "recorded as"
    User ||--o{ Group : "creates"
```

## Enums

### GroupRole
- ADMIN
- MEMBER  
- GUEST
- ASSISTANT

### ShareType
- EQUAL
- PERCENTAGE
- FIXED

### SettlementStatus
- PENDING
- PENDING_CONFIRMATION
- CONFIRMED
- COMPLETED
- CANCELLED

### SettlementType
- PAYMENT
- RECEIPT

### AIActionType
- EXPENSE_CREATE
- EXPENSE_UPDATE
- GROUP_CREATE
- PAYMENT_RECORD

### ThemeMode
- LIGHT
- DARK
- SYSTEM
