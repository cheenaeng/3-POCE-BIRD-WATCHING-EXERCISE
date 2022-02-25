DROP TABLE IF EXISTS notes; 

CREATE TABLE notes(
  id SERIAL PRIMARY KEY, 
  habitat TEXT, 
  date DATE,
  behaviour TEXT, 
  appearance TEXT, 
  flock_size INTEGER
)




