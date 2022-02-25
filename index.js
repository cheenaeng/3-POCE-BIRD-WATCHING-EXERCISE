import express, { response } from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';



// Override POST requests with query param ?_method=PUT to be PUT requests


// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'cheenaeng',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.listen(3004);
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(cookieParser());

/* -------------------------------------------------------------------------- */
/*                           BIRD FORM AND SIGHTINGS                          */
/* -------------------------------------------------------------------------- */

/* ---------------------------- RENDER MAIN PAGE ---------------------------- */
app.get('/', (request, response) => {
  console.log('request came in');

  const whenDoneWithQuery = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      
      return;
    }
    response.render('main');
  };

  // Query using pg.Pool instead of pg.Client
  pool.query('SELECT * from notes', whenDoneWithQuery);
});


/* ---------------------- RENDER AND PROCESS FORM PAGE ---------------------- */

app.get('/note', (request, response) => {
  console.log('request came in');
  const getAllSpeciesQuery = `SELECT * FROM species`
  pool.query(getAllSpeciesQuery, (error,result)=>{
    if (error){
      console.log(query)
    }
    const allSpecies = result.rows

    const data = {
      speciesName : allSpecies
    }
  response.render('form',data);
  })

});

app.post('/note',(request,response)=>{

  const {habitat,date,appearance,flocksize,speciesChosen} = request.body 
  const userID = request.cookies.userId
  const inputData = [habitat,date,appearance,flocksize,userID,speciesChosen]
  console.log(inputData)
  //available as an array e.g. ["pecking", "hunting"]
  const behaviourData =request.body.behavior_ids

  const sqlQuery = 'INSERT INTO notes (habitat, date, appearance,flock_size,userid,species) VALUES($1,$2,$3,$4,$5,$6) RETURNING *'

  const whenDoneWithQuery= (error,result) =>{
    if(error){
       console.log('Error executing query', error.stack);
      response.status(503)
    }

    const noteId = result.rows[0].id

    behaviourData.forEach( behaviour => {
      const insertedData = [behaviour,noteId ]
      const behaviorQuery = `INSERT INTO notes_behaviour(behaviour,notes_id) VALUES($1,$2)`


      const whenBehaviorQueryDone=(error,result)=>{
        if (error){
          console.log(error,"error")
        }
        console.log("updated behavior table")
        console.log(result.rows)

      }
      pool.query(behaviorQuery,insertedData,whenBehaviorQueryDone)

    })
    
    response.redirect(`/note/${noteId}`)
  }
  pool.query(sqlQuery,inputData, whenDoneWithQuery)
})


/* ---------------------------- RENDER NOTES PAGE --------------------------- */

app.get('/note/:id',(request,response)=>{
  const {id} = request.params

    const sqlQuery = `SELECT habitat,date, appearance,flock_size, notes_behaviour.behaviour,notes_id FROM notes INNER JOIN notes_behaviour ON notes.id = notes_behaviour.notes_id WHERE notes.id= ${id}`

    const whenDoneWithQuery = (error,result) =>{
      if(error){
        console.log('Error executing query', error.stack);
        response.status(503)
      }

      console.log(result.rows)
      const data = {
        report: result.rows,
       noteId: id
      }
      response.render('bird-report',data)
    }

    pool.query(sqlQuery,whenDoneWithQuery)
  
})

app.post('/note/:id', (request,response)=>{
  const notesID = request.params.id
  const commentUserId = request.cookies.userId
  console.log(commentUserId)
  const commentText = request.body.comments
  const inputData = [parseInt(notesID,10),parseInt(commentUserId,10),commentText]
  console.log(inputData)
  const addCommentQuery = `INSERT INTO comments_users(notes_id, users_id,comments) VALUES($1,$2,$3) RETURNING *`

  pool.query(addCommentQuery,inputData)
  .then((result)=>{
    console.log(result.rows)
    response.send("success!!")
  })
  .catch((error)=>{
    console.log(error.stack)
  })
}
)


app.get("/note/:id/edit", (req,res)=>{
  const {id} = req.params
  const sqlQuery = `SELECT * FROM notes WHERE id= ${id}`
   const whenDoneWithQuery = (error,result) =>{
    if(error){
       console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
    }

    const data = {
      requestedId:id,
      report: result.rows
    }
    console.log(data)
    res.render("edit-form",data)
  }
  pool.query(sqlQuery,whenDoneWithQuery)

})

app.put("/note/:id/edit",(req,res)=>{
  const {id} = req.params
  const updatedInformation = req.body
  const {habitat,date,appearance,behaviour,flocksize} = updatedInformation
  const inputData = [habitat,date,behaviour,appearance,flocksize]
  
  console.log(inputData)

  const sqlQuery = `UPDATE notes SET habitat =$1, date=$2, behaviour=$3, appearance=$4,flock_size=$5 WHERE id = ${id} `
  //set query to replace the row with new information 
  const whenDoneWithQuery = (error,result) =>{
    if(error){
       console.log('Error executing query', error.stack);
    }
    res.send("updated results")
  }
  pool.query(sqlQuery,inputData, whenDoneWithQuery)

})

/* -------------------------------------------------------------------------- */
/*                                  USERFORM                                  */
/* -------------------------------------------------------------------------- */

/* --------------------------------- SIGNUP --------------------------------- */

app.get('/signup', (req,res)=>{
  res.render('signup-form')
})

app.post('/signup',(request,response)=>{

  const {username, email, password} = request.body 
  const inputData = [username,email,password]
  console.log(inputData)

  const sqlQuery = 'INSERT INTO users (username, email, password) VALUES($1,$2,$3)'
  const whenDoneWithQuery= (error,result) =>{
    if(error){
       console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
    }
  response.send(`sign up successful`)

  }
  pool.query(sqlQuery,inputData, whenDoneWithQuery)
})

/* ---------------------------------- LOGIN --------------------------------- */
app.get('/login', (req,res) =>{
  res.render('login')
})


app.post('/login', (request, response) => {
  console.log('request came in');

  const values = [request.body.email];

  pool.query('SELECT * from users WHERE email=$1', values, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      response.status(503).send(result.rows);
      return;
    }

    if (result.rows.length === 0) {
      // we didnt find a user with that email.
      // the error for password and user are the same. don't tell the user which error they got for security reasons, otherwise people can guess if a person is a user of a given service.
      response.status(403).send('sorry!');
      return;
    }

    const user = result.rows[0];

    if (user.password === request.body.password) {
      response.cookie('loggedIn', true);
      response.cookie('userId', user.id);
      response.redirect('/note');
    } else {
      // password didn't match
      // the error for password and user are the same. don't tell the user which error they got for security reasons, otherwise people can guess if a person is a user of a given service.
      response.status(403).send("sorry!");
    }
  });
});




/* --------------------------------- LOGOUT --------------------------------- */

app.delete('/logout', (request, response) => {
  response.clearCookie('loggedIn');
  response.clearCookie('userId');

  response.send("sucessfully logged off")
});

/* -------------------------------------------------------------------------- */
/*                                SPECIES DATA                                */
/* -------------------------------------------------------------------------- */









