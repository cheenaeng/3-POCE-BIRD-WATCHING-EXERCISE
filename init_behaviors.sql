DROP TABLE IF EXISTS notes_behaviour;

CREATE TABLE notes_behaviour(
  id SERIAL PRIMARY KEY, 
  behaviour TEXT, 
  notes_id INTEGER,
  CONSTRAINT fk_notes
    FOREIGN KEY(notes_id)
     REFERENCES notes(id)
);
