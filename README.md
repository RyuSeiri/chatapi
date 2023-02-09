<h1 align="center">Welcome to chatapi 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://twitter.com/fuergaosi" target="_blank">
    <img alt="Twitter: fuergaosi" src="https://img.shields.io/twitter/follow/fuergaosi.svg?style=social" />
  </a>
</p>

> Chatgpt non-official API Server

<!-- ### 🏠 [Homepage](chatgpt.y1s1.host) -->

<!-- ### ✨ [Demo](chatgpt.y1s1.host) -->
> This project is still in its very early stages and there may be many problems. I will try to update it as soon as possible.

## Install

```sh
npm install
```

## Usage  

### Config  

1. Copy env.example to .env. （You shouldn't have to change anything

    ```sh
    cp env.example .env
    ```

2. Create account.json  

    ```sh
    [
        {    
            "email": "username",
            "password": "password"
        }
    ]
    ```

3. Start database

    ```sh
    docker-compose -f docker-compose.db.yml up -d
    ```

4. Seed Database

    ```sh
    npm run seed
    ```

5. Start server

    ```sh
    npm run start
    ```

6. Test API
   - Get bot status

    ```sh
        curl "http://localhost:3000/chatgpt/account"
    ```

   - Send message

    ```sh
        curl -X "POST" "http://localhost:3000/chatgpt/sendMessage" \
              -H 'Content-Type: application/json; charset=utf-8' \
              -d $'{
          "message": "Hey!"
        }'
    
    ```

   - Send Message with user id
    > You can use userId to send message with conversation  

    ```
      curl -X "POST" "http://localhost:3000/chatgpt/sendMessage" \
            -H 'userId: holegots' \
            -H 'Content-Type: application/json; charset=utf-8' \
            -d $'{
        "message": "Hey!"
      }'
    ```

## Run tests

```sh
npm run test
```

## Author

👤 **Holegots**

- Twitter: [@fuergaosi](https://twitter.com/fuergaosi)

## Show your support

Give a ⭐️ if this project helped you!
