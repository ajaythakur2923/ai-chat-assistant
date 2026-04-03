# AI Chat Assistant - Secure Version

This version hides your Groq API key completely.
Even if someone reads all your code on GitHub, they cannot find the key.
The key lives only on Vercel's servers as a private environment variable.

---

## How it works

Before:  Browser --> Groq API (key visible in code)
Now:     Browser --> Your Vercel Server --> Groq API (key hidden on server)

The frontend has zero secrets in it. Anyone can read script.js and find nothing useful.

---

## Files in this project

index.html          the app layout
style.css           all the styling
script.js           frontend logic, talks to your Vercel server
api/chat.js         runs on Vercel, holds the secret key, calls Groq
vercel.json         tells Vercel how to set up the project
README.md           this file

---

## How to deploy everything

You need two things: a GitHub account and a Vercel account (both free).

---

STEP 1 - Put files on GitHub

Go to github.com and create a new repository.
Name it something like "ai-chat-assistant".
Make it public (that is fine, the key is not in the code).

Upload all these files keeping the same folder structure:

  index.html
  style.css
  script.js
  vercel.json
  api/chat.js
  README.md

Important: the api folder must exist with chat.js inside it.
Do not move chat.js out of the api folder.

---

STEP 2 - Connect to Vercel

Go to vercel.com and sign up using your GitHub account.
Click "Add New Project".
Find your GitHub repo and click Import.
Vercel will detect the project automatically.
Do not click Deploy yet. First go to the next step.

---

STEP 3 - Add your Groq API key to Vercel

On the import screen you will see a section called "Environment Variables".
Click it to expand.

Add one variable:
  Name:  GROQ_API_KEY
  Value: paste your Groq key here (starts with gsk_)

Click Add and then click Deploy.

Vercel will build and deploy your app in about a minute.
You will get a live URL like: https://your-project-name.vercel.app

That URL is your live app. Share it with anyone. The key is safe.

---

STEP 4 - Also deploy your frontend to GitHub Pages (optional)

If you want the frontend on GitHub Pages instead of Vercel, that works too.
But you need to update one line in script.js first.

Find this line:
  var PROXY_URL = '/api/chat';

Change it to your full Vercel URL:
  var PROXY_URL = 'https://your-project-name.vercel.app/api/chat';

Then go to your GitHub repo settings, click Pages, set source to main branch, save.
Your frontend will be on GitHub Pages but the API calls still go to Vercel securely.

---

## How to get a Groq API key

Go to console.groq.com and sign up for free.
Click API Keys in the left menu.
Click Create Key and copy it.
It starts with gsk_ and it is completely free to use.

---

## Testing locally before deploying

Install Node.js from nodejs.org if you do not have it.

Open a terminal in your project folder and run:

  npm install -g vercel
  vercel dev

This starts a local server that works exactly like the real Vercel.
Open http://localhost:3000 in your browser.

You will need to set up a local env file for the key.
Create a file called .env.local in your project folder and add:

  GROQ_API_KEY=gsk_your_key_here

Do not upload .env.local to GitHub. Add it to .gitignore like this:
Create a file called .gitignore and add this line:

  .env.local

---

## Updating your app later

Whenever you push new code to GitHub, Vercel automatically rebuilds and deploys it.
You never need to manually redeploy.

---

## Groq free limits

Requests per day: 14,400
Requests per minute: 30
Cost: free

More than enough for personal use and portfolio demos.
