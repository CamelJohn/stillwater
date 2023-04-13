# Real world app - Monolith

This is a monolith (literally on purpose) representing the backend of the real world app.
I chose to use a single file. to be as litteral as I could about the **Monolithic** essence of this repo.

# Routes

#### Prefix: /api/v1

| Endpoint | Path | Method |
| -------- | ---- | ------ |
| register | auth/register | Post |
| login | auth/login | Post |
| get current user | auth/me | Get |
| get profile | profile/:username | Get |
| follow profile | profile/:username | Post |
| unfollow profile | profile/:username | Delete |

<details>
    <summary>Register</summary>

### Sequence of a request
::: mermaid
flowchart TD
Request--->Validate{is request body valid}
Validate--No-->Unprocessable([Unprocessable Entity])
Validate--Yes-->User[(Get User)]
User-->Exists{Does User Exist}
Exists--No-->Create([User Created])
Exists--Yes-->Conflig([Conflict Error])
Create-->Response(( return mapped response))

:::

</details>
