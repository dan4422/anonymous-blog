const http = require('http')
const express = require('express')
const es6Renderer = require('express-es6-template-engine')
const pgPromise = require('pg-promise')();
const bodyParser = require('body-parser')

const hostname = 'localhost'
const port = 3000
const config = {
  host: 'localhost',
  port: 5432,
  database: 'bloganon',
  user: 'postgres'
}

const app = express()
const server = http.createServer(app)
const db = pgPromise(config)

app.engine('html', es6Renderer)
app.set('views', 'templates')
app.set('view engine', 'html')

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// routes
app.get('/', (req,res) => {
  res.render('layout', {
    locals: {
      title: 'Home Page!',
    },
    partials: {
      body: 'partials/home'
    }
  })
})

app.get('/blogs', (req,res) => {
  db.query('SELECT * FROM posts')
    .then(posts => {
      res.render('layout', {
        locals: {
          title: 'Anonymous Blog',
          posts
        },
        partials: {
          body: 'partials/blogs'
        }
      })
    })
})

app.get('/blogs/new', (req,res) => {
  res.render('layout', {
    locals: {
      title: 'New Post'
    },
    partials: {
      body: 'partials/add-post'
    }
  })
})

app.post('/blogs/new', (req,res) => {
  const body = req.body
  db.query('INSERT INTO posts (title,post,time_posted) VALUES ($1,$2,$3)', [body.title, body.post, new Date()])
    .then(data => {
      res.render('layout', {
        locals: {
          title: 'Created new post'
        },
        partials: {
          body: 'partials/after-post'
        }
      })
    })
})

app.get('/blogs/:id', (req,res) => {
  const id = req.params.id
  db.oneOrNone('SELECT * FROM posts WHERE id = $1', [id])
    .then(post => {
      res.render('layout', {
        locals: {
          title: post.title,
          post
        },
        partials: {
          body: 'partials/blog-details'
        }
      })
    })
  .catch((e) => {
    console.log(e)
    res.send('Error!')
  })
})

app.get('/blogs/:id/delete', (req,res) => {
  const id = req.params.id
  db.oneOrNone('DELETE FROM posts WHERE id = $1', [id])
    .then(post => {
      res.redirect('/blogs')
    })
    .catch((e) => {
      console.log(e)
      res.send('Error!')
    })
})


app.get('*', (req,res) => {
  res.status(404).send('404 ERROR!')
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})

