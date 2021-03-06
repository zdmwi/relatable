import express from 'express'
import mysql from 'mysql'
import bodyParser from 'body-parser'

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '0000',
  port: '3306',
  database: process.env.MYSQL_DB || 'relatable',
  multipleStatements: true
})

connection.connect()

// Create express router
const router = express.Router()

// Transform req & res to have the same API as express
// So we can use res.status() & res.json()
const app = express()
// app.use(bodyParser.json())
router.use(bodyParser.json())
router.use((req, res, next) => {
  Object.setPrototypeOf(req, app.request)
  Object.setPrototypeOf(res, app.response)
  req.res = res
  res.req = req
  next()
})

// get all users
router.get('/users', (req, res) => {
  const { start, limit } = req.query

  console.log(start, limit)
  const startIndex = (start - 1) * limit
  const endIndex = start * limit

  const sql = 'select * from users'
  connection.query(sql, (error, results) => {
    if (error) throw error
    const paginated = results.slice(startIndex, endIndex)
    console.log(paginated)
    return res.json({
      code: 1,
      data: paginated
    })
  })
})

// get users by id
router.get('/users/:id', (req, res) => {
  const { id } = req.params

  const sql = 'select * from users where user_id=?'
  connection.query(sql, [id], (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// update profile pic
router.post('/users/:id/profile', (req, res) => {
  const { id } = req.params
  const { photo } = req.body

  const sql = 'call modifyProfilePhoto(?,?)'
  connection.query(sql, [id, photo], (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get a user's friends
router.get('/users/:id/friends', (req, res) => {
  const { id } = req.params

  // const sql = `select u.fname, u.lname, u.user_id, u.email, f.group_t as friend_group from users as u join friend_of as f on u.user_id = f.friend_id where f.user_id=${id} `
  const sql = `call friendinfo(${id})`

  connection.query(sql, (error, results) => {
    if (error) throw error
    console.log(results)
    return res.json({
      code: 1,
      data: results[0]
    })
  })
})

// user adds a friend
router.post('/users/:id/friends', (req, res) => {
  const { id } = req.params
  const { friendId, typeOfFriend } = req.body

  const sql = `call addFriend(${id}, ${friendId}, '${typeOfFriend}')`

  connection.query(sql, (error, results) => {
    if (error) throw error
    console.log(results)
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get suggested friends for a user
router.get('/users/:id/suggested_friends', (req, res) => {
  const { id } = req.params

  const sql = `call getSuggestedFriends(${id})`

  connection.query(sql, (error, results) => {
    if (error) throw error
    console.log(results)
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get a users posts
router.get('/users/:id/posts', (req, res) => {
  const { id } = req.params
  let finalResult = []
  let sql = `select p.url, p.caption, p.post_id, po.created_on from photos as p join posts as po on p.post_id = po.post_id where po.user_id=${id} `

  connection.query(sql, (error, results) => {
    if (error) throw error
    finalResult = finalResult.concat(results)
  })

  sql = `select t.body, t.post_id, po.created_on from texts as t join posts as po on t.post_id = po.post_id where po.user_id=${id} `

  connection.query(sql, (error, results) => {
    if (error) throw error

    finalResult = finalResult.concat(results)
    return res.json({
      code: 1,
      data: finalResult
    })
  })
})

// get a user's photo posts
router.get('/users/:id/photos', (req, res) => {
  const { id } = req.params

  const sql = `select p.url, p.caption, p.post_id, po.created_on from photos as p join posts as po on p.post_id = po.post_id where po.user_id=${id} `

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get a user's photo text posts
router.get('/users/:id/texts', (req, res) => {
  const { id } = req.params

  const sql = `select t.body, t.post_id, po.created_on from texts as t join posts as po on t.post_id = po.post_id where po.user_id=${id} `

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// make a text post
router.post('/users/:id/texts', (req, res) => {
  const { id } = req.params
  const { body } = req.body

  const sql = `call makeTextPost(${id}, '${body}')`

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})


// register a user
router.post('/register', (req, res) => {
  const { fname, lname, email, password } = req.body

  const sql = `call register(?,?,?,?)`

  connection.query(sql, [fname, lname, password, email], (error, results) => {
    if(error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})


// make a photo post
router.post('/users/:id/photos', (req, res) => {
  const { id } = req.params
  const { url, caption } = req.body

  const sql = `call makePhotoPost(${id}, '${url}', '${caption}')`

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get a user's comments
router.get('/users/:id/comments', (req, res) => {
  const { id } = req.params

  const sql = `select c.comment, c.c_date, c.post_id from comments_on as c where user_id=${id} `

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// User comments on a post
router.post('/users/:id/comments', (req, res) => {
  const { id } = req.params
  const { post_id, comment } = req.body

  const sql = `call leaveComment(${id}, ${post_id}, '${comment}')`

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get a post's comments
router.get('/posts/:id/comments', (req, res) => {
  const { id } = req.params

  const sql = `call viewComments(${id})`

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results[0]
    })
  })
})

// get a user's profile
router.get('/users/:id/profile', (req, res) => {
  const { id } = req.params

  const sql = `select * from profile where user_id=${id}`

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get the groups a user created
router.get('/users/:id/groups', (req, res) => {
  const { id } = req.params

  const sql = 'select * from `groups` where user_id=?'
  connection.query(sql, [id], (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get the members of a group
router.get('/groups/:id/members', (req, res) => {
  const { id } = req.params

  const sql = `select profile_photo, user_id from profile where user_id in (select user_id from joined_group where group_id=${id})`

  connection.query(sql, (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

// get a group's info
router.get('/groups/:id/', (req, res) => {
  const { id } = req.params

  const sql = 'select * from `groups` where group_id=?'

  connection.query(sql, [id], (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results[0]
    })
  })
})

// join a group
router.get('/groups/:gid/users/:uid', (req, res) => {
  const { gid, uid } = req.params

  const sql = `call joinGroup(${uid},${gid})`

  connection.query(sql, [uid, gid], (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results[0]
    })
  })
})

router.post('/users/:id/groups', (req, res) => {
  const { id } = req.params
  const { groupName } = req.body

  const sql = `call makeGroup(${id}, '${groupName}')`
  connection.query(sql, [id], (error, results) => {
    if (error) throw error
    return res.json({
      code: 1,
      data: results
    })
  })
})

router.get('/users/:id/available_groups', (req, res) => {
  const { id } = req.params

  const sql =
    'select *, count(*) as num_members from `groups` where user_id in (select friend_id from friend_of where user_id=?)'
  connection.query(sql, [id], (error, results) => {
    if (error) throw error
    console.log(results)
    return res.json({
      code: 1,
      data: results
    })
  })
})

// login
router.post('/login', (req, res) => {
  const { email, password } = req.body
  const sql = `select * from users where email='${email}'`
  connection.query(sql, (error, results) => {
    if (error) throw error

    if (results.length === 1) {
      if (results[0].password === password) {
        return res.json({
          code: 1,
          data: { ...results[0], user_type: 'reg' }
        })
      }
    }
    return res.json({ code: -1, data: {} })
  })
})

// feed
router.get('/users/:id/home', (req, res) => {
  const { id } = req.params
  let finalResult = []

  let sql = `select p.url, p.caption, p.post_id, po.created_on from photos as p join posts as po on p.post_id = po.post_id where po.user_id=${id} `

  connection.query(sql, (error, results) => {
    if (error) throw error
    finalResult = finalResult.concat(results)
  })

  sql = `select t.body, t.post_id, po.created_on from texts as t join posts as po on t.post_id = po.post_id where po.user_id=${id} `

  connection.query(sql, (error, results) => {
    if (error) throw error

    finalResult = finalResult.concat(results)
  })

  sql = `call getFriendPhotos(${id})`

  connection.query(sql, (error, results) => {
    if (error) throw error
    finalResult = finalResult.concat(results[0])
  })

  sql = `call getFriendTexts(${id})`
  connection.query(sql, (error, results) => {
    if (error) throw error
    finalResult = finalResult.concat(results[0])
    return res.json({
      code: 1,
      data: finalResult
    })
  })
})

export default {
  path: '/api',
  handler: router
}
