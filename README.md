# KAZASWAP - Monorepo

## Local Development 👩‍💻

### Prerequisites

Start the database (MariaDB), CMS (Directus), cache (Redis) and local NPM repo with docker:
```
docker-compose up -d
```

The first time you will start the above, the database will be set up and migrations executed. The API communicates with the database using the headless CMS REST interface, therefore you now need to configure the headless CMS to allow requests with an API key. To do so, open `http://localhost:8065/` and log in with `bengous@yopmail.com` / `abcDEF123!`, go to `Users > Admin User`, then generate a token and save it. Finally on your `api` folder, create a `.env` file and add the following line:

```env
DIRECTUS_AUTH_BEARER=<the token>
```

### Shared code (common)

You first need to publish the shared code for the App to get the latest data (this is mandatory because react-native/web does not allow source code outside of the `src` folder)

```bash
#1. First, make sur you log into your local NPM package server
npm login --registry http://localhost:4873 --auth-type=legacy

#2. Then publish the package
npm publish
```

For any change made in the `common` folder, you will need to republish:
```bash
#1. First, remove the existing package if any
npm run unpublish # or npm unpublish @kazaswap/common@1.0.0 --force 

#2. Then publish the package
npm publish
```

### API

```bash
npm install
cd api && npm run watch
```

Note: Make sure you have [BUN](https://bun.sh/) installed, it's great ! 

### App (web)

```bash
npm install
cd Kazaswap && npm run web
```

This command will start the browser on `localhost:3000`, however if you want to make API calls to your local API, you will need to go through the proxy on `http://localhost:7777/`

*Note 1*: You must fisrt publish the shared code to your local package repo, see "Shared Code" above

*Note 2*: If the share code has changed, make sure you upgrade the package with:

```bash
npm upgrade @kazaswap/common
```