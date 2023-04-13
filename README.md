# Real world app - Monolith

This is a monolith (literally on purpose) representing the backend of the real world app.
I chose to use a single file. to be as litteral as I could about the **Monolithic** essence of this repo.

# ERD (entity relation diagram)

```mermaid
erDiagram
    USER {
        uuidv4 id PK
        string email
        string token
        string username
        string password
    }

    PROFILE {
        uuidv4 id PK
        uuidv4 userId FK
        bio string
        image string
        following boolean
    }

    ARTICLE {
        uuidv4 id PK
        string slug
        string title
        string description
        string body
        boolean favorited
        int favoriteCount
        uuidv4 userId FK
    }

    USER ||--|{ PROFILE : owns
    USER ||--o{ ARTICLE : owns
```
